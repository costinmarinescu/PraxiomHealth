// fix-kotlin.js
// This script fixes the Kotlin version mismatch in expo-modules-core
// Place this file in your repository root

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join('node_modules', 'expo-modules-core', 'android', 'build.gradle');

if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Check if already patched
  if (content.includes('ext.kotlin_version = \'1.7.20\'')) {
    console.log('✅ Kotlin version already patched');
    process.exit(0);
  }
  
  // Add Kotlin version override at the beginning
  const kotlinOverride = `// Force Kotlin 1.7.20 for compatibility
ext.kotlin_version = '1.7.20'

`;
  
  // Write the modified content
  fs.writeFileSync(buildGradlePath, kotlinOverride + content);
  console.log('✅ Fixed Kotlin version in expo-modules-core');
} else {
  console.log('⚠️ Could not find expo-modules-core build.gradle (this is normal if dependencies are not installed yet)');
  process.exit(0);
}
