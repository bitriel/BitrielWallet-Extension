#!/bin/bash

# Manual NPM publish script for @bitriel packages
# Based on the existing CI npm publishing logic

set -e

echo "Starting manual npm publish for @bitriel packages..."

# Function to publish a single package (based on npmPublish from CI)
publish_package() {
    local pkg_dir=$1
    echo "Publishing $pkg_dir..."
    
    cd "$pkg_dir"
    
    # Check if package should be skipped
    if [ -f ".skip-npm" ]; then
        echo "Skipping $pkg_dir (found .skip-npm file)"
        cd "../.."
        return
    fi
    
    # Check if build directory exists
    if [ ! -d "build" ]; then
        echo "Error: No build directory found in $pkg_dir"
        cd "../.."
        return 1
    fi
    
    # Copy necessary files to build directory (if not already there)
    for file in LICENSE package.json; do
        if [ -f "$file" ] && [ ! -f "build/$file" ]; then
            cp "$file" build/
        fi
    done
    
    # Change to build directory and publish
    cd build
    
    # Get version to determine tag
    local version=$(node -p "require('./package.json').version")
    local tag=""
    if [[ $version == *"-"* ]]; then
        tag="--tag beta"
    fi
    
    # Attempt to publish with retry logic
    local count=1
    local max_attempts=5
    
    while [ $count -le $max_attempts ]; do
        echo "Attempting to publish $pkg_dir (attempt $count/$max_attempts)..."
        
        if npm publish --access public $tag; then
            echo "✅ Successfully published $pkg_dir@$version"
            cd "../../.."
            return 0
        else
            if [ $count -lt $max_attempts ]; then
                echo "❌ Publish failed for $pkg_dir. Retrying in 15 seconds..."
                sleep 15
                count=$((count + 1))
            else
                echo "❌ Failed to publish $pkg_dir after $max_attempts attempts"
                cd "../../.."
                return 1
            fi
        fi
    done
}

# Check if we're in the right directory
if [ ! -d "packages" ]; then
    echo "Error: packages directory not found. Please run this script from the root of the project."
    exit 1
fi

# Check if logged into npm
if ! npm whoami > /dev/null 2>&1; then
    echo "Error: Not logged into npm. Please run 'npm login' first."
    exit 1
fi

echo "Logged in as: $(npm whoami)"

# Publishing order based on dependencies (from CI script)
packages=(
    "bitriel-api-sdk"
    "extension-mocks" 
    "extension-inject"
    "extension-chains"
    "extension-dapp"
    "extension-compat-metamask"
    "extension-base"
    "extension-koni"
    "extension-koni-ui"
    "extension-web-ui"
    "webapp"
    "web-runner"
)

cd packages

failed_packages=()

for pkg in "${packages[@]}"; do
    if [ -d "$pkg" ]; then
        if ! publish_package "$pkg"; then
            failed_packages+=("$pkg")
        fi
    else
        echo "Warning: Package directory $pkg not found"
    fi
done

cd ..

# Summary
echo ""
echo "📋 Publication Summary:"
echo "======================"

if [ ${#failed_packages[@]} -eq 0 ]; then
    echo "🎉 All packages published successfully!"
else
    echo "❌ The following packages failed to publish:"
    for pkg in "${failed_packages[@]}"; do
        echo "  - $pkg"
    done
    exit 1
fi 