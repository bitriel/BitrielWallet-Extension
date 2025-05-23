#!/usr/bin/env node
// Quick deployment script for BitrielWallet-Extension NPM packages
// Builds and publishes only the NPM packages (no webapp deployment)

import fs from 'fs';
import { execSync } from 'child_process';

const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

function log(message, color = COLORS.WHITE) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logStep(step, message) {
  log(`\n🚀 [${step}] ${message}`, COLORS.CYAN);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function execWithLog(command, description) {
  log(`Running: ${command}`, COLORS.YELLOW);
  try {
    execSync(command, { stdio: 'inherit' });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

function checkPrerequisites() {
  logStep('1', 'Checking prerequisites');
  
  if (!fs.existsSync('packages')) {
    logError('packages directory not found. Please run this script from the root of the project.');
    process.exit(1);
  }

  try {
    const npmUser = execSync('npm whoami', { encoding: 'utf8' }).trim();
    logSuccess(`Logged into NPM as: ${npmUser}`);
  } catch (error) {
    logError('Not logged into npm. Please run "npm login" first.');
    process.exit(1);
  }
}

async function main() {
  log('🚀 Quick NPM package deployment for BitrielWallet-Extension\n', COLORS.CYAN);
  
  try {
    checkPrerequisites();
    
    logStep('2', 'Cleaning previous builds');
    if (!execWithLog('yarn clean', 'Clean build')) {
      throw new Error('Clean failed');
    }

    logStep('3', 'Building all packages');
    if (!execWithLog('yarn build', 'Main build')) {
      throw new Error('Build failed');
    }

    logStep('4', 'Publishing packages to NPM');
    if (!execWithLog('bash publish-npm.sh', 'NPM package publishing')) {
      throw new Error('NPM publishing failed');
    }

    logSuccess('🎉 Quick deployment completed successfully!');
    log('📦 All packages have been published to NPM');

  } catch (error) {
    logError(`Quick deployment failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
}); 