#!/bin/bash

set -e  # Exit on any error

packages=(
  "bitriel-api-sdk"
  "extension-base"
  "extension-chain"
  "extension-inject"
  "extension-dapp"
  "extension-chains"
)

for pkg in "${packages[@]}"; do
  build_path="packages/$pkg/build"
  
  if [ -d "$build_path" ]; then
    echo "Publishing $build_path..."
    cd "$build_path"
    npm publish --access public
    cd - > /dev/null
  else
    echo "⚠️  Skipping $pkg - $build_path does not exist"
  fi
done

echo "✅ All existing packages published."