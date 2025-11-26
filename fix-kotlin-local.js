#!/usr/bin/env node

/**
 * Kotlin Version Fix Script for PraxiomHealth
 * Run this after npm install to fix Kotlin version mismatches
 * 
 * Usage: node fix-kotlin-local.js
 */

const fs = require('fs');
const path = require('path');

const KOTLIN_VERSION = '1.7.20';
const COMPOSE_VERSION = '1.3.2';

console.log('🔧 PraxiomHealth Kotlin Version Fix');
console.log('====================================');
console.log(`Target Kotlin Version: ${KOTLIN_VERSION}`);
console.log(`Compose Compiler Version: ${COMPOSE_VERSION}`);
console.log('');

// Function to fix a gradle file
function fixGradleFile(filePath, moduleName) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${moduleName} build.gradle not found`);
        return false;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Check if file contains kotlin references
        if (!content.includes('kotlin')) {
            return false;
        }

        console.log(`📝 Processing ${moduleName}...`);

        // Fix ext.kotlin_version
        if (content.includes('ext.kotlin_version')) {
            content = content.replace(/ext\.kotlin_version\s*=\s*['"][\d.]+['"]/g, `ext.kotlin_version = '${KOTLIN_VERSION}'`);
            modified = true;
        } else if (content.includes('buildscript') || content.includes('plugins')) {
            // Add kotlin version at the beginning of the file
            content = `ext.kotlin_version = '${KOTLIN_VERSION}'\n\n` + content;
            modified = true;
        }

        // Fix kotlin plugin version in plugins block
        content = content.replace(
            /id\s+['"]org\.jetbrains\.kotlin\.android['"]\s+version\s+['"][\d.]+['"]/g,
            `id 'org.jetbrains.kotlin.android' version '${KOTLIN_VERSION}'`
        );

        // Fix kotlinVersion in android block
        content = content.replace(
            /kotlinVersion\s*=\s*['"][\d.]+['"]/g,
            `kotlinVersion = '${KOTLIN_VERSION}'`
        );

        // Fix compose compiler version
        if (content.includes('compose') && content.includes('kotlinCompilerExtensionVersion')) {
            content = content.replace(
                /kotlinCompilerExtensionVersion\s*=?\s*['"][\d.]+['"]/g,
                `kotlinCompilerExtensionVersion = '${COMPOSE_VERSION}'`
            );
            modified = true;
        }

        if (modified) {
            // Create backup
            const backupPath = filePath + '.backup';
            if (!fs.existsSync(backupPath)) {
                fs.copyFileSync(filePath, backupPath);
            }

            // Write fixed content
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${moduleName} fixed`);
            return true;
        } else {
            console.log(`ℹ️  ${moduleName} - no changes needed`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error fixing ${moduleName}:`, error.message);
        return false;
    }
}

// Main execution
async function main() {
    let fixCount = 0;

    // 1. Fix expo-modules-core (CRITICAL)
    console.log('\n📌 Critical Modules:');
    console.log('--------------------');
    const coreModulePath = path.join('node_modules', 'expo-modules-core', 'android', 'build.gradle');
    if (fixGradleFile(coreModulePath, 'expo-modules-core')) {
        fixCount++;
    }

    // 2. Fix all expo modules
    console.log('\n📦 Expo Modules:');
    console.log('----------------');
    const nodeModulesPath = 'node_modules';
    if (fs.existsSync(nodeModulesPath)) {
        const modules = fs.readdirSync(nodeModulesPath)
            .filter(dir => dir.startsWith('expo-') && dir !== 'expo-modules-core');

        for (const module of modules) {
            const gradlePath = path.join(nodeModulesPath, module, 'android', 'build.gradle');
            if (fixGradleFile(gradlePath, module)) {
                fixCount++;
            }
        }
    }

    // 3. Fix React Native modules that might use Kotlin
    console.log('\n📦 React Native Modules:');
    console.log('------------------------');
    const rnModules = [
        'react-native-screens',
        'react-native-reanimated',
        'react-native-gesture-handler',
        'react-native-safe-area-context',
        'react-native-ble-plx'
    ];

    for (const module of rnModules) {
        const gradlePath = path.join(nodeModulesPath, module, 'android', 'build.gradle');
        if (fixGradleFile(gradlePath, module)) {
            fixCount++;
        }
    }

    // 4. Create/Update android/gradle.properties
    console.log('\n⚙️  Gradle Properties:');
    console.log('---------------------');
    const androidDir = 'android';
    if (!fs.existsSync(androidDir)) {
        fs.mkdirSync(androidDir, { recursive: true });
    }

    const gradlePropertiesPath = path.join(androidDir, 'gradle.properties');
    const gradleProperties = `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true

# Android settings
android.useAndroidX=true
android.enableJetifier=true

# Kotlin and Compose versions
kotlinVersion=${KOTLIN_VERSION}
kotlin.version=${KOTLIN_VERSION}
composeCompilerVersion=${COMPOSE_VERSION}

# Expo settings
expo.jsEngine=hermes
newArchEnabled=false

# Suppress Kotlin version compatibility check (use with caution)
# kotlin.suppressVersionCompatibilityCheck=true
`;

    fs.writeFileSync(gradlePropertiesPath, gradleProperties);
    console.log('✅ gradle.properties created/updated');

    // 5. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Fixed ${fixCount} modules`);
    console.log(`📝 Kotlin version set to: ${KOTLIN_VERSION}`);
    console.log(`📝 Compose compiler version: ${COMPOSE_VERSION}`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Run: npx expo prebuild --clean');
    console.log('2. Build locally: npx expo run:android');
    console.log('3. Or build with EAS: eas build --platform android');
    
    console.log('\n⚠️  Important Notes:');
    console.log('- This fix needs to be run after every npm install');
    console.log('- Consider adding this script to package.json postinstall');
    console.log('- If build still fails, try deleting node_modules and reinstalling');
}

// Run the script
main().catch(console.error);
