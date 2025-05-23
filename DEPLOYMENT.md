# BitrielWallet-Extension Deployment Guide

This guide explains how to deploy and publish all packages in the BitrielWallet-Extension project.

## Prerequisites

Before deploying, ensure you have:

1. **NPM Account**: You must be logged into npm with publishing rights
   ```bash
   npm login
   ```

2. **Git Configuration**: Properly configured git user (for release commits)
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

3. **Environment Variables** (optional, for GitHub releases):
   - `GH_RELEASE_GITHUB_API_TOKEN` or `GITHUB_TOKEN`

## Deployment Commands

### 1. Full Deployment (Recommended)

Deploy everything at once - builds, tests, publishes to NPM, deploys webapp, and creates GitHub release:

```bash
yarn deploy
# or
npm run deploy
# or directly
./scripts/koni-deploy-all.mjs
```

**What it does:**
- ✅ Checks prerequisites (npm login, git config, etc.)
- 🧹 Cleans previous builds
- 🔍 Runs linting
- 🧪 Runs tests (continues on failure)
- 🏗️ Builds all packages
- 📦 Publishes all packages to NPM
- 🌐 Deploys webapp to GitHub Pages
- 🚀 Deploys web runner to GitHub Pages
- 📋 Creates GitHub release (if configured)

### 2. Quick NPM-Only Deployment

If you just want to build and publish NPM packages (faster, no webapp deployment):

```bash
yarn deploy:quick
# or
npm run deploy:quick
# or directly
./scripts/koni-quick-deploy.mjs
```

**What it does:**
- ✅ Checks NPM login
- 🧹 Cleans previous builds
- 🏗️ Builds all packages
- 📦 Publishes all packages to NPM

### 3. Manual NPM Publishing Only

If packages are already built and you just want to publish them:

```bash
./publish-npm.sh
```

## Package Publishing Order

Packages are published in dependency order to ensure proper installation:

1. `bitriel-api-sdk`
2. `extension-mocks`
3. `extension-inject`
4. `extension-chains`
5. `extension-dapp`
6. `extension-compat-metamask`
7. `extension-base`
8. `extension-koni`
9. `extension-koni-ui`
10. `extension-web-ui`
11. `webapp`
12. `web-runner`

## Individual Build Commands

For development and testing purposes:

```bash
# Build everything
yarn build

# Build with extra steps (i18n, ui)
yarn build:extra

# Build specific components
yarn build:i18n
yarn build:ui
yarn web-runner:build-zip
yarn webapp:build

# Clean builds
yarn clean
```

## Troubleshooting

### NPM Publishing Issues

1. **Not logged in**: Run `npm login` first
2. **Package already exists**: Version might need to be bumped
3. **Permission denied**: Ensure you have publishing rights to @bitriel scope

### Build Issues

1. **Linting errors**: Run `yarn lint` to check issues
2. **Type errors**: Run `yarn build` to see TypeScript errors
3. **Missing dependencies**: Run `yarn install`

### Git Issues

1. **No git config**: Set up git user name and email
2. **No GitHub token**: Set `GITHUB_TOKEN` environment variable for releases

## Version Management

The deployment scripts automatically handle version bumping based on the current version and build type. Beta versions (with `-` in version) are published with the `beta` tag.

## Deployment Summary

After running the full deployment, you'll see a summary showing the status of each step:

```
🎯 DEPLOYMENT SUMMARY
==================================================
✅ PASSED Prerequisites
✅ PASSED Clean Build
✅ PASSED Linting
✅ PASSED Tests
✅ PASSED Build All
✅ PASSED NPM Publish
✅ PASSED Webapp Deploy
✅ PASSED Web Runner Deploy
✅ PASSED GitHub Release
==================================================
🎉 ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!

📦 Your packages have been published to NPM
🌐 Your webapp has been deployed to GitHub Pages
🚀 Web runner has been deployed
📋 GitHub release has been created (if configured)
```

## CI/CD Integration

These scripts can be easily integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Deploy all packages
  run: yarn deploy
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
``` 