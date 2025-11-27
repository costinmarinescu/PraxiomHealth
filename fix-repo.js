#!/usr/bin/env node

/**
 * Complete Fix Script for PraxiomHealth Local Repository
 * This fixes all known issues for both iOS and Android
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 PraxiomHealth Complete Repository Fix');
console.log('=========================================\n');

let fixCount = 0;
let warnings = [];

// Helper to check if file exists
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Helper to create backup
function backupFile(filePath) {
    if (fileExists(filePath)) {
        const backupPath = filePath + '.backup';
        if (!fileExists(backupPath)) {
            fs.copyFileSync(filePath, backupPath);
            console.log(`  📋 Backed up ${path.basename(filePath)}`);
        }
    }
}

// 1. Fix package.json with all necessary scripts
function fixPackageJson() {
    console.log('📦 Fixing package.json...');
    
    const packagePath = 'package.json';
    if (!fileExists(packagePath)) {
        warnings.push('package.json not found');
        return;
    }
    
    backupFile(packagePath);
    
    try {
        let pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Ensure all necessary scripts
        pkg.scripts = {
            ...pkg.scripts,
            "start": "expo start",
            "android": "expo start --android",
            "ios": "expo start --ios",
            "web": "expo start --web",
            "prebuild": "expo prebuild",
            "prebuild:clean": "expo prebuild --clean",
            "build:android:local": "eas build --platform android --profile production --local",
            "build:ios:local": "eas build --platform ios --profile production --local",
            "build:android": "eas build --platform android --profile production",
            "build:ios": "eas build --platform ios --profile production",
            "test": "node test-calculations.js && node test-functionality.js",
            "fix": "node fix-repo.js",
            "postinstall": "node fix-repo.js || true"
        };
        
        // Ensure dependencies are correct
        if (!pkg.dependencies['expo']) {
            pkg.dependencies['expo'] = "~52.0.0";
        }
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
        console.log('  ✅ package.json updated');
        fixCount++;
    } catch (error) {
        warnings.push(`Failed to fix package.json: ${error.message}`);
    }
}

// 2. Fix Android gradle.properties
function fixAndroidGradle() {
    console.log('\n⚙️  Fixing Android configuration...');
    
    const androidDir = 'android';
    if (!fs.existsSync(androidDir)) {
        fs.mkdirSync(androidDir, { recursive: true });
    }
    
    const gradlePropertiesContent = `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true

# Android settings
android.useAndroidX=true
android.enableJetifier=true

# Kotlin version (fixed for compatibility)
kotlinVersion=1.7.20
kotlin.version=1.7.20

# React Native / Expo
hermesEnabled=true
expo.jsEngine=hermes
newArchEnabled=false

# Compose
composeCompilerVersion=1.3.2
`;

    fs.writeFileSync(path.join(androidDir, 'gradle.properties'), gradlePropertiesContent);
    console.log('  ✅ android/gradle.properties created');
    fixCount++;
}

// 3. Fix Kotlin version in node_modules
function fixKotlinVersions() {
    console.log('\n🔧 Fixing Kotlin versions...');
    
    const KOTLIN_VERSION = '1.7.20';
    
    if (!fs.existsSync('node_modules')) {
        warnings.push('node_modules not found - run npm install first');
        return;
    }
    
    // Fix expo-modules-core
    const expoCoreGradle = 'node_modules/expo-modules-core/android/build.gradle';
    if (fileExists(expoCoreGradle)) {
        let content = fs.readFileSync(expoCoreGradle, 'utf8');
        
        // Prepend kotlin version if not already there
        if (!content.startsWith(`ext.kotlin_version = '${KOTLIN_VERSION}'`)) {
            content = `ext.kotlin_version = '${KOTLIN_VERSION}'\n\n` + content;
        }
        
        // Replace any other kotlin version
        content = content.replace(/ext\.kotlin_version\s*=\s*['"][\d.]+['"]/g, 
                                 `ext.kotlin_version = '${KOTLIN_VERSION}'`);
        
        fs.writeFileSync(expoCoreGradle, content);
        console.log('  ✅ Fixed expo-modules-core');
        fixCount++;
    }
}

// 4. Create metro.config.js with proper settings
function fixMetroConfig() {
    console.log('\n📱 Fixing Metro configuration...');
    
    const metroContent = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for asset resolution
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'mp3', 'ttf', 'obj', 'txt', 'jpg', 'png'];

// Add any problematic modules to blacklist if needed
config.resolver.blacklistRE = /.*\.test\.js$/;

module.exports = config;
`;

    fs.writeFileSync('metro.config.js', metroContent);
    console.log('  ✅ metro.config.js updated');
    fixCount++;
}

// 5. Verify all required files exist
function verifyRequiredFiles() {
    console.log('\n🔍 Verifying required files...');
    
    const requiredFiles = [
        'App.js',
        'AppContext.js',
        'app.json',
        'babel.config.js',
        'eas.json',
        'assets/icon.png',
        'assets/splash.png',
        'assets/praxiom-logo.png',
        'screens/AuthScreen.js',
        'screens/DashboardScreen.js',
        'services/EncryptionService.js',
        'services/SecureStorageService.js',
    ];
    
    let allPresent = true;
    requiredFiles.forEach(file => {
        if (fileExists(file)) {
            console.log(`  ✅ ${file}`);
        } else {
            console.log(`  ❌ ${file} MISSING`);
            warnings.push(`Missing required file: ${file}`);
            allPresent = false;
        }
    });
    
    if (allPresent) {
        console.log('  ✅ All required files present');
        fixCount++;
    }
}

// 6. Create a build helper script
function createBuildHelper() {
    console.log('\n📝 Creating build helper script...');
    
    const buildHelperContent = `#!/bin/bash

# PraxiomHealth Build Helper Script

echo "🚀 PraxiomHealth Build Helper"
echo "=============================="
echo ""
echo "Select build option:"
echo "1) Build Android (local)"
echo "2) Build iOS (local)"
echo "3) Build Android (EAS cloud)"
echo "4) Build iOS (EAS cloud)"
echo "5) Clean and prebuild"
echo "6) Fix all issues"
echo "7) Start development server"
echo ""
read -p "Enter option (1-7): " option

case $option in
  1)
    echo "Building Android locally..."
    npx eas build --platform android --profile production --local
    ;;
  2)
    echo "Building iOS locally..."
    npx eas build --platform ios --profile production --local
    ;;
  3)
    echo "Building Android on EAS..."
    npx eas build --platform android --profile production
    ;;
  4)
    echo "Building iOS on EAS..."
    npx eas build --platform ios --profile production
    ;;
  5)
    echo "Cleaning and prebuilding..."
    rm -rf android ios
    npx expo prebuild --clean
    ;;
  6)
    echo "Running fix script..."
    node fix-repo.js
    ;;
  7)
    echo "Starting development server..."
    npx expo start -c
    ;;
  *)
    echo "Invalid option"
    ;;
esac
`;

    fs.writeFileSync('build-helper.sh', buildHelperContent);
    fs.chmodSync('build-helper.sh', '755');
    console.log('  ✅ build-helper.sh created');
    fixCount++;
}

// 7. Update app.json with latest configuration
function fixAppJson() {
    console.log('\n📱 Checking app.json...');
    
    const appJsonPath = 'app.json';
    if (!fileExists(appJsonPath)) {
        warnings.push('app.json not found');
        return;
    }
    
    try {
        let appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        
        // Ensure critical settings
        if (!appJson.expo.plugins) {
            appJson.expo.plugins = [];
        }
        
        // Check for expo-build-properties plugin
        const hasBuildProps = appJson.expo.plugins.some(plugin => 
            Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        );
        
        if (!hasBuildProps) {
            warnings.push('expo-build-properties plugin not configured in app.json');
        }
        
        console.log('  ✅ app.json verified');
        fixCount++;
    } catch (error) {
        warnings.push(`Failed to check app.json: ${error.message}`);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting comprehensive fix...\n');
    
    // Run all fixes
    fixPackageJson();
    fixAndroidGradle();
    fixKotlinVersions();
    fixMetroConfig();
    verifyRequiredFiles();
    createBuildHelper();
    fixAppJson();
    
    // Summary
    console.log('\n=========================================');
    console.log('📊 Fix Summary:');
    console.log('=========================================');
    console.log(`✅ Applied ${fixCount} fixes`);
    
    if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(warning => {
            console.log(`  - ${warning}`);
        });
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. If node_modules missing: npm install --legacy-peer-deps');
    console.log('2. Clean prebuild: npx expo prebuild --clean');
    console.log('3. Build iOS locally: npm run build:ios:local');
    console.log('4. Build Android locally: npm run build:android:local');
    console.log('\n🎯 Or use the build helper: ./build-helper.sh');
    
    // Save this script itself
    const scriptPath = 'fix-repo.js';
    if (!fileExists(scriptPath)) {
        fs.writeFileSync(scriptPath, fs.readFileSync(__filename, 'utf8'));
        console.log(`\n📝 Saved this fix script as ${scriptPath} for future use`);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
