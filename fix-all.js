#!/usr/bin/env node

/**
 * Comprehensive Fix Script for PraxiomHealth
 * Fixes:
 * 1. Android: hermesEnabled deprecation
 * 2. Android: Kotlin version mismatch
 * 3. iOS: Asset and initialization issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 PraxiomHealth Comprehensive Fix Script');
console.log('==========================================');
console.log('');

let fixCount = 0;
let errorCount = 0;

// Helper functions
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function readFile(filePath) {
    if (!fileExists(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
    try {
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
        return true;
    } catch (error) {
        console.error(`❌ Failed to write ${filePath}:`, error.message);
        return false;
    }
}

function backupFile(filePath) {
    if (fileExists(filePath)) {
        const backupPath = filePath + '.backup';
        if (!fileExists(backupPath)) {
            fs.copyFileSync(filePath, backupPath);
            console.log(`📋 Backed up ${path.basename(filePath)}`);
        }
    }
}

// Fix 1: Android hermesEnabled deprecation
function fixAndroidHermes() {
    console.log('📱 Fixing Android hermesEnabled deprecation...');
    
    const gradleFiles = [
        'android/app/build.gradle',
        'node_modules/react-native/react.gradle'
    ];
    
    gradleFiles.forEach(gradlePath => {
        if (!fileExists(gradlePath)) {
            console.log(`  ⚠️ ${gradlePath} not found, skipping...`);
            return;
        }
        
        backupFile(gradlePath);
        let content = readFile(gradlePath);
        let modified = false;
        
        // Remove hermesEnabled references
        if (content.includes('hermesEnabled')) {
            // Replace hermesEnabled with hermesCommand check
            content = content.replace(
                /def hermesEnabled = project\.ext\.react\.get\("hermesEnabled", false\)/g,
                '// hermesEnabled is deprecated, using hermesCommand instead'
            );
            
            content = content.replace(
                /if \(hermesEnabled\)/g,
                'if (hermesCommand.exists())'
            );
            
            content = content.replace(
                /hermesEnabled/g,
                'hermesCommand.exists()'
            );
            
            modified = true;
        }
        
        if (modified) {
            writeFile(gradlePath, content);
            console.log(`  ✅ Fixed ${path.basename(gradlePath)}`);
            fixCount++;
        } else {
            console.log(`  ℹ️ ${path.basename(gradlePath)} - no changes needed`);
        }
    });
}

// Fix 2: Create Android gradle.properties with correct settings
function fixAndroidGradleProperties() {
    console.log('⚙️ Setting up Android gradle.properties...');
    
    const gradlePropertiesPath = 'android/gradle.properties';
    
    const gradleProperties = `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true

# Android settings
android.useAndroidX=true
android.enableJetifier=true

# Kotlin version (force 1.7.20 for compatibility)
kotlinVersion=1.7.20
kotlin.version=1.7.20

# Compose Compiler
composeCompilerVersion=1.3.2

# React Native
hermesEnabled=true
newArchEnabled=false

# Expo
expo.jsEngine=hermes

# Disable Kotlin version compatibility check if needed
# kotlin.suppressVersionCompatibilityCheck=true
`;

    if (!fs.existsSync('android')) {
        fs.mkdirSync('android', { recursive: true });
    }
    
    writeFile(gradlePropertiesPath, gradleProperties);
    console.log('  ✅ gradle.properties created/updated');
    fixCount++;
}

// Fix 3: Fix Kotlin version in expo-modules-core
function fixKotlinVersion() {
    console.log('🔧 Fixing Kotlin version mismatch...');
    
    const KOTLIN_VERSION = '1.7.20';
    const modulesToFix = [
        'expo-modules-core',
        'expo-*',
        'react-native-screens',
        'react-native-reanimated',
        'react-native-gesture-handler',
        'react-native-safe-area-context'
    ];
    
    const nodeModulesPath = 'node_modules';
    
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('  ❌ node_modules not found. Run npm install first.');
        errorCount++;
        return;
    }
    
    // Fix expo-modules-core specifically
    const expoCoreGradle = path.join(nodeModulesPath, 'expo-modules-core', 'android', 'build.gradle');
    if (fileExists(expoCoreGradle)) {
        backupFile(expoCoreGradle);
        let content = readFile(expoCoreGradle);
        
        // Prepend kotlin version
        if (!content.startsWith(`ext.kotlin_version = '${KOTLIN_VERSION}'`)) {
            content = `ext.kotlin_version = '${KOTLIN_VERSION}'\n\n` + content;
        }
        
        // Replace any existing kotlin version
        content = content.replace(/ext\.kotlin_version\s*=\s*['"][\d.]+['"]/g, `ext.kotlin_version = '${KOTLIN_VERSION}'`);
        
        writeFile(expoCoreGradle, content);
        console.log('  ✅ Fixed expo-modules-core');
        fixCount++;
    }
    
    // Fix other modules
    const modules = fs.readdirSync(nodeModulesPath);
    modules.forEach(moduleName => {
        if (moduleName.startsWith('expo-') || 
            moduleName.startsWith('react-native-')) {
            const gradlePath = path.join(nodeModulesPath, moduleName, 'android', 'build.gradle');
            if (fileExists(gradlePath)) {
                let content = readFile(gradlePath);
                if (content && content.includes('kotlin')) {
                    content = content.replace(/ext\.kotlin_version\s*=\s*['"][\d.]+['"]/g, `ext.kotlin_version = '${KOTLIN_VERSION}'`);
                    writeFile(gradlePath, content);
                    console.log(`  ✅ Fixed ${moduleName}`);
                    fixCount++;
                }
            }
        }
    });
}

// Fix 4: Ensure iOS assets exist
function fixIOSAssets() {
    console.log('🖼️ Checking iOS required assets...');
    
    const requiredAssets = [
        { path: 'assets/icon.png', fallback: 'assets/adaptive-icon.png' },
        { path: 'assets/splash.png', fallback: 'assets/icon.png' },
        { path: 'assets/praxiom-logo.png', fallback: 'assets/icon.png' },
        { path: 'assets/logo.png', fallback: 'assets/icon.png' }
    ];
    
    // Create assets directory if it doesn't exist
    if (!fs.existsSync('assets')) {
        fs.mkdirSync('assets', { recursive: true });
        console.log('  📁 Created assets directory');
    }
    
    requiredAssets.forEach(asset => {
        if (!fileExists(asset.path)) {
            // Try to copy from fallback
            if (asset.fallback && fileExists(asset.fallback)) {
                try {
                    fs.copyFileSync(asset.fallback, asset.path);
                    console.log(`  ✅ Created ${asset.path} from ${asset.fallback}`);
                    fixCount++;
                } catch (error) {
                    console.error(`  ❌ Failed to create ${asset.path}:`, error.message);
                    errorCount++;
                }
            } else {
                console.log(`  ⚠️ ${asset.path} missing and no fallback available`);
                
                // Create a placeholder image (1x1 transparent PNG)
                const placeholderPNG = Buffer.from(
                    '89504e470d0a1a0a0000000d494844520000000100000001010300000025db56ca00000003504c5445000000a77a3dda0000000174524e530040e6d8660000000a4944415408d76260000000020001e221bc330000000049454e44ae426082',
                    'hex'
                );
                
                try {
                    fs.writeFileSync(asset.path, placeholderPNG);
                    console.log(`  ✅ Created placeholder ${asset.path}`);
                    fixCount++;
                } catch (error) {
                    console.error(`  ❌ Failed to create placeholder:`, error.message);
                    errorCount++;
                }
            }
        } else {
            console.log(`  ✅ ${asset.path} exists`);
        }
    });
}

// Fix 5: Update package.json scripts
function updatePackageJson() {
    console.log('📦 Updating package.json scripts...');
    
    const packagePath = 'package.json';
    if (!fileExists(packagePath)) {
        console.log('  ❌ package.json not found');
        errorCount++;
        return;
    }
    
    backupFile(packagePath);
    
    try {
        const pkg = JSON.parse(readFile(packagePath));
        
        // Update scripts
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.postinstall = 'node fix-all.js || true';
        pkg.scripts['fix-android'] = 'node fix-all.js';
        pkg.scripts['fix-ios'] = 'node fix-all.js';
        pkg.scripts['prebuild:clean'] = 'node fix-all.js && expo prebuild --clean';
        pkg.scripts['build:android'] = 'node fix-all.js && eas build --platform android --profile production';
        pkg.scripts['build:ios'] = 'eas build --platform ios --profile production --local';
        pkg.scripts['start:reset'] = 'expo start -c';
        
        writeFile(packagePath, JSON.stringify(pkg, null, 2));
        console.log('  ✅ package.json updated');
        fixCount++;
    } catch (error) {
        console.error('  ❌ Failed to update package.json:', error.message);
        errorCount++;
    }
}

// Fix 6: Create metro.config.js with proper settings
function fixMetroConfig() {
    console.log('📱 Setting up Metro configuration...');
    
    const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for asset resolution
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'mp3', 'ttf', 'obj', 'txt', 'jpg', 'png'];

module.exports = config;
`;

    writeFile('metro.config.js', metroConfig);
    console.log('  ✅ metro.config.js updated');
    fixCount++;
}

// Main execution
async function main() {
    console.log('🚀 Starting comprehensive fixes...\n');
    
    // Run all fixes
    fixAndroidHermes();
    console.log('');
    
    fixAndroidGradleProperties();
    console.log('');
    
    fixKotlinVersion();
    console.log('');
    
    fixIOSAssets();
    console.log('');
    
    updatePackageJson();
    console.log('');
    
    fixMetroConfig();
    console.log('');
    
    // Summary
    console.log('==========================================');
    console.log('📊 Fix Summary:');
    console.log('==========================================');
    console.log(`✅ Applied ${fixCount} fixes`);
    if (errorCount > 0) {
        console.log(`❌ Encountered ${errorCount} errors`);
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Run: npm install --legacy-peer-deps');
    console.log('2. Clean: npx expo prebuild --clean');
    console.log('3. For Android: eas build --platform android --profile production');
    console.log('4. For iOS: eas build --platform ios --profile production --local');
    
    if (errorCount > 0) {
        console.log('\n⚠️ Some fixes failed. Review the errors above.');
        process.exit(1);
    }
}

// Save this script as fix-all.js
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
