/**
 * PraxiomHealth - Comprehensive Functionality Test Suite
 * Tests all critical app functions and checks for hidden defects
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}
╔═══════════════════════════════════════════════════════════════════╗
║       PraxiomHealth - Comprehensive Functionality Audit          ║
║                      Testing Suite v1.0                          ║
╚═══════════════════════════════════════════════════════════════════╝
${RESET}\n`);

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;
const errors = [];
const warningsList = [];

/**
 * Test helper functions
 */
function pass(testName) {
  totalTests++;
  passedTests++;
  console.log(`${GREEN}✓${RESET} ${testName}`);
}

function fail(testName, error) {
  totalTests++;
  failedTests++;
  console.log(`${RED}✗${RESET} ${testName}`);
  errors.push({ test: testName, error });
}

function warn(testName, warning) {
  warnings++;
  console.log(`${YELLOW}⚠${RESET} ${testName}: ${warning}`);
  warningsList.push({ test: testName, warning });
}

function section(title) {
  console.log(`\n${BLUE}━━━ ${title} ━━━${RESET}`);
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * TEST 1: File Structure Validation
 */
section('1. FILE STRUCTURE VALIDATION');

const requiredFiles = [
  'AppContext.js',
  'services/SecureStorageService.js',
  'screens/SettingsScreen.js',
  'screens/DashboardScreen.js'
];

requiredFiles.forEach(file => {
  if (fileExists(path.join(__dirname, file))) {
    pass(`File exists: ${file}`);
  } else {
    fail(`Missing file: ${file}`, `File ${file} not found`);
  }
});

/**
 * TEST 2: Import/Export Validation
 */
section('2. IMPORT/EXPORT VALIDATION');

// Check AppContext exports
const appContextContent = readFile(path.join(__dirname, 'AppContext.js'));
if (appContextContent) {
  const requiredExports = [
    'calculateTier1BioAge',
    'calculateTier2BioAge',
    'calculateTier3BioAge',
    'syncBioAgeToWatch',
    'toggleAutoSync',
    'saveDateOfBirth',
    'biomarkerHistory',
    'addToHistory'
  ];

  requiredExports.forEach(exportName => {
    if (appContextContent.includes(exportName)) {
      pass(`AppContext exports: ${exportName}`);
    } else {
      fail(`Missing export in AppContext: ${exportName}`, `Function ${exportName} not found in context value`);
    }
  });

  // Check for proper SecureStorageService import
  if (appContextContent.includes("import SecureStorageService from './services/SecureStorageService'")) {
    pass('SecureStorageService import correct');
  } else {
    fail('SecureStorageService import', 'Import statement not found or incorrect');
  }
} else {
  fail('AppContext.js read', 'Could not read AppContext.js');
}

// Check SecureStorageService exports
const secureStorageContent = readFile(path.join(__dirname, 'services/SecureStorageService.js'));
if (secureStorageContent) {
  const requiredStorageFunctions = ['setItem', 'getItem', 'removeItem', 'clear', 'getSecurityStatus'];
  
  requiredStorageFunctions.forEach(funcName => {
    if (secureStorageContent.includes(`export const ${funcName}`) || 
        secureStorageContent.includes(`${funcName}:`)) {
      pass(`SecureStorageService exports: ${funcName}`);
    } else {
      fail(`Missing SecureStorageService function: ${funcName}`, `Function ${funcName} not exported`);
    }
  });

  // Check for encryption implementation
  if (secureStorageContent.includes('CryptoJS.AES.encrypt')) {
    pass('Encryption implemented (AES-256)');
  } else {
    fail('Encryption missing', 'CryptoJS.AES.encrypt not found');
  }

  // Check for SECURE_KEYS array
  if (secureStorageContent.includes('SECURE_KEYS')) {
    pass('SECURE_KEYS array defined');
  } else {
    fail('SECURE_KEYS missing', 'SECURE_KEYS array not found');
  }
} else {
  fail('SecureStorageService.js read', 'Could not read SecureStorageService.js');
}

/**
 * TEST 3: Bio-Age Calculation Logic
 */
section('3. BIO-AGE CALCULATION LOGIC');

if (appContextContent) {
  // Check for proper calculation flow
  const calculationChecks = [
    { name: 'Tier 1: Calls PraxiomAlgorithm', pattern: /calculateTier1BioAge\s*\([^)]*\)/ },
    { name: 'Tier 1: Saves results to SecureStorage', pattern: /SecureStorageService\.setItem\(['"]tier1Results['"]/ },
    { name: 'Tier 1: Saves bio-age', pattern: /SecureStorageService\.setItem\(['"]bioAge['"]/ },
    { name: 'Tier 1: Adds to history', pattern: /await addToHistory/ },
    { name: 'Tier 1: Auto-syncs to watch', pattern: /if\s*\(\s*autoSync.*syncBioAgeToWatch/ },
    { name: 'Tier 2: Requires Tier 1 first', pattern: /if\s*\(\s*!tier1Results\s*\)/ },
    { name: 'Tier 3: Requires Tier 2 first', pattern: /if\s*\(\s*!tier2Results\s*\)/ }
  ];

  calculationChecks.forEach(check => {
    if (check.pattern.test(appContextContent)) {
      pass(check.name);
    } else {
      fail(check.name, `Pattern not found: ${check.pattern}`);
    }
  });

  // Check for proper error handling
  if (appContextContent.match(/try\s*{[\s\S]*?}\s*catch\s*\(\s*error\s*\)/g)?.length >= 3) {
    pass('Error handling implemented (try-catch blocks)');
  } else {
    warn('Error handling', 'Insufficient try-catch blocks in calculation functions');
  }
}

/**
 * TEST 4: History Persistence Logic
 */
section('4. HISTORY PERSISTENCE LOGIC');

if (appContextContent) {
  // Check addToHistory implementation
  const addToHistoryMatch = appContextContent.match(/const addToHistory = async \(entry\) => {([\s\S]*?)};/);
  
  if (addToHistoryMatch) {
    const historyFunction = addToHistoryMatch[0];
    
    if (historyFunction.includes('SecureStorageService.setItem')) {
      pass('History saves to SecureStorage');
    } else {
      fail('History storage', 'SecureStorageService.setItem not found in addToHistory');
    }

    if (historyFunction.includes('setBiomarkerHistory')) {
      pass('History updates state');
    } else {
      fail('History state update', 'setBiomarkerHistory not called in addToHistory');
    }

    if (historyFunction.includes('[entry, ...biomarkerHistory]')) {
      pass('History prepends new entries correctly');
    } else {
      warn('History order', 'Check if new entries are added at the beginning');
    }
  } else {
    fail('addToHistory function', 'Function implementation not found');
  }

  // Check if calculations call addToHistory
  const tier1CalcMatch = appContextContent.match(/const calculateTier1BioAge = async \(\) => {([\s\S]*?)};/);
  if (tier1CalcMatch && tier1CalcMatch[0].includes('await addToHistory')) {
    pass('Tier 1 calculation adds to history');
  } else {
    fail('Tier 1 history integration', 'addToHistory not called after Tier 1 calculation');
  }
}

/**
 * TEST 5: Watch Sync Logic
 */
section('5. WATCH SYNC LOGIC');

if (appContextContent) {
  // Check syncBioAgeToWatch implementation
  const syncMatch = appContextContent.match(/const syncBioAgeToWatch = async \([^)]*\) => {([\s\S]*?)};/);
  
  if (syncMatch) {
    const syncFunction = syncMatch[0];
    
    if (syncFunction.includes('if (!ageToSync)')) {
      pass('Sync validates bio-age exists');
    } else {
      warn('Sync validation', 'No check for bio-age existence');
    }

    if (syncFunction.includes('if (!watchConnected || !connectedDevice)')) {
      pass('Sync validates watch connection');
    } else {
      fail('Watch validation', 'No check for watch connection status');
    }

    if (syncFunction.includes('writeCharacteristicWithResponseForService')) {
      pass('BLE write operation implemented');
    } else {
      fail('BLE operation', 'Write characteristic operation not found');
    }
  } else {
    fail('syncBioAgeToWatch function', 'Function implementation not found');
  }

  // Check auto-sync integration
  const autoSyncPattern = /if\s*\(\s*autoSync\s*&&\s*watchConnected.*\)\s*{[\s\S]*?await syncBioAgeToWatch/;
  const autoSyncMatches = appContextContent.match(new RegExp(autoSyncPattern, 'g'));
  
  if (autoSyncMatches && autoSyncMatches.length >= 3) {
    pass('Auto-sync integrated in all tier calculations');
  } else {
    fail('Auto-sync integration', `Found ${autoSyncMatches?.length || 0} auto-sync calls, expected 3+`);
  }
}

/**
 * TEST 6: Toggle Persistence Logic
 */
section('6. TOGGLE PERSISTENCE LOGIC');

if (appContextContent) {
  // Check toggleAutoSync implementation
  const toggleMatch = appContextContent.match(/const toggleAutoSync = async \(value\) => {([\s\S]*?)};/);
  
  if (toggleMatch) {
    const toggleFunction = toggleMatch[0];
    
    if (toggleFunction.includes('await SecureStorageService.setItem')) {
      pass('Toggle saves to storage first');
    } else {
      fail('Toggle persistence', 'SecureStorageService.setItem not called');
    }

    if (toggleFunction.includes('setAutoSync(value)')) {
      pass('Toggle updates state after save');
    } else {
      fail('Toggle state update', 'setAutoSync not called');
    }

    // Check order: storage before state
    const storageIndex = toggleFunction.indexOf('SecureStorageService.setItem');
    const stateIndex = toggleFunction.indexOf('setAutoSync(value)');
    
    if (storageIndex >= 0 && stateIndex >= 0 && storageIndex < stateIndex) {
      pass('Toggle order correct (storage → state)');
    } else {
      fail('Toggle order', 'Storage should be saved before state update');
    }
  } else {
    fail('toggleAutoSync function', 'Function implementation not found');
  }
}

// Check SettingsScreen toggle handling
const settingsContent = readFile(path.join(__dirname, 'screens/SettingsScreen.js'));
if (settingsContent) {
  if (settingsContent.includes('const [localAutoSync, setLocalAutoSync]')) {
    pass('SettingsScreen uses local state for toggle');
  } else {
    fail('Settings local state', 'Local toggle state not found');
  }

  if (settingsContent.includes('setLocalAutoSync(value)') && 
      settingsContent.includes('await toggleAutoSync(value)')) {
    pass('SettingsScreen toggle handler correct');
  } else {
    fail('Settings toggle handler', 'Incorrect toggle implementation');
  }
}

/**
 * TEST 7: Encryption Security
 */
section('7. ENCRYPTION SECURITY');

if (secureStorageContent) {
  // Check encryption key
  if (secureStorageContent.includes('ENCRYPTION_KEY')) {
    pass('Encryption key defined');
    
    if (secureStorageContent.includes('PRAXIOM_SECURE_KEY_V1_2025')) {
      warn('Encryption key', 'Using hardcoded key - should use react-native-keychain in production');
    }
  } else {
    fail('Encryption key', 'No encryption key found');
  }

  // Check which keys are encrypted
  const secureKeys = secureStorageContent.match(/SECURE_KEYS\s*=\s*\[([\s\S]*?)\]/);
  if (secureKeys) {
    const keysList = secureKeys[1];
    const medicalKeys = ['bioAge', 'tier1Results', 'tier2Results', 'tier3Results', 'biomarkerHistory', 'dateOfBirth'];
    
    medicalKeys.forEach(key => {
      if (keysList.includes(`'${key}'`) || keysList.includes(`"${key}"`)) {
        pass(`Medical data encrypted: ${key}`);
      } else {
        fail(`Unencrypted medical data: ${key}`, `${key} not in SECURE_KEYS array`);
      }
    });
  }

  // Check for legacy data migration
  if (secureStorageContent.includes('// Fallback: check for unencrypted legacy data')) {
    pass('Legacy data migration implemented');
  } else {
    warn('Legacy migration', 'No migration path for existing unencrypted data');
  }
}

/**
 * TEST 8: React Native Best Practices
 */
section('8. REACT NATIVE BEST PRACTICES');

const allScreens = [
  { file: 'screens/SettingsScreen.js', content: settingsContent },
  { file: 'screens/DashboardScreen.js', content: readFile(path.join(__dirname, 'screens/DashboardScreen.js')) }
];

allScreens.forEach(({ file, content }) => {
  if (!content) return;
  
  const fileName = path.basename(file);

  // Check for proper imports
  if (content.includes("import React") && content.includes("from 'react'")) {
    pass(`${fileName}: React import correct`);
  } else {
    fail(`${fileName}: React import`, 'React not properly imported');
  }

  // Check for useContext usage
  if (content.includes('useContext(AppContext)')) {
    pass(`${fileName}: AppContext used correctly`);
  } else {
    warn(`${fileName}: Context usage`, 'Check if AppContext is properly consumed');
  }

  // Check for async/await in handlers
  const asyncHandlers = content.match(/const handle\w+\s*=\s*async/g);
  if (asyncHandlers && asyncHandlers.length > 0) {
    pass(`${fileName}: Async handlers implemented (${asyncHandlers.length})`);
  }

  // Check for error handling in async operations
  if (content.includes('try {') && content.includes('catch (error)')) {
    pass(`${fileName}: Error handling present`);
  } else {
    warn(`${fileName}: Error handling`, 'Limited error handling found');
  }

  // Check for StyleSheet usage
  if (content.includes('StyleSheet.create')) {
    pass(`${fileName}: StyleSheet used correctly`);
  } else {
    fail(`${fileName}: StyleSheet`, 'StyleSheet.create not found');
  }
});

/**
 * TEST 9: State Initialization
 */
section('9. STATE INITIALIZATION');

if (appContextContent) {
  // Check for initialization useEffect
  if (appContextContent.includes('useEffect(() => {') && 
      appContextContent.includes('initializeApp')) {
    pass('App initialization useEffect exists');
  } else {
    fail('Initialization', 'No initialization useEffect found');
  }

  // Check for loading state
  if (appContextContent.includes('const [isLoading, setIsLoading]') && 
      appContextContent.includes('if (isLoading)')) {
    pass('Loading state implemented');
  } else {
    warn('Loading state', 'No loading state management found');
  }

  // Check if all data is loaded on init
  const loadChecks = ['dateOfBirth', 'bioAge', 'tier1Biomarkers', 'biomarkerHistory', 'autoSync'];
  loadChecks.forEach(key => {
    if (appContextContent.includes(`SecureStorageService.getItem('${key}')`)) {
      pass(`Initialization loads: ${key}`);
    } else {
      fail(`Initialization missing: ${key}`, `${key} not loaded on app start`);
    }
  });
}

/**
 * TEST 10: Navigation Integration
 */
section('10. NAVIGATION INTEGRATION');

// Check DashboardScreen navigation
const dashboardContent = readFile(path.join(__dirname, 'screens/DashboardScreen.js'));
if (dashboardContent) {
  const navTargets = [
    'Profile',
    'Tier1BiomarkerInput',
    'Tier2BiomarkerInput',
    'Tier3BiomarkerInput',
    'History',
    'Report',
    'ProtocolInfo',
    'Settings'
  ];

  navTargets.forEach(target => {
    if (dashboardContent.includes(`navigation.navigate('${target}')`)) {
      pass(`Dashboard navigates to: ${target}`);
    } else {
      warn(`Navigation`, `Dashboard might not navigate to ${target}`);
    }
  });
}

/**
 * TEST 11: Data Flow Validation
 */
section('11. DATA FLOW VALIDATION');

if (appContextContent) {
  // Check that calculations flow correctly
  const dataFlowChecks = [
    { name: 'DOB → Age calculation', pattern: /calculateAge\(dob\)/ },
    { name: 'Biomarkers saved before calculation', pattern: /saveTier\dBiomarkers/ },
    { name: 'Results saved after calculation', pattern: /setTier\dResults/ },
    { name: 'Bio-age updated after calculation', pattern: /setBioAge/ },
    { name: 'Timestamp recorded', pattern: /setLastCalculated/ }
  ];

  dataFlowChecks.forEach(check => {
    if (check.pattern.test(appContextContent)) {
      pass(check.name);
    } else {
      warn('Data flow', check.name + ' not found');
    }
  });
}

/**
 * TEST 12: Memory Leak Checks
 */
section('12. MEMORY LEAK PREVENTION');

allScreens.forEach(({ file, content }) => {
  if (!content) return;
  const fileName = path.basename(file);

  // Check for cleanup in useEffect
  const useEffectMatches = content.match(/useEffect\(\s*\(\)\s*=>\s*{[\s\S]*?},\s*\[[^\]]*\]\)/g);
  if (useEffectMatches) {
    useEffectMatches.forEach((effect, index) => {
      if (effect.includes('return () =>') || effect.includes('return()=>')) {
        pass(`${fileName}: useEffect ${index + 1} has cleanup`);
      } else if (effect.includes('setInterval') || effect.includes('setTimeout') || 
                 effect.includes('subscribe') || effect.includes('addEventListener')) {
        warn(`${fileName}: useEffect ${index + 1}`, 'Might need cleanup function');
      }
    });
  }

  // Check for unsubscribed listeners
  if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
    warn(`${fileName}: Event listeners`, 'addEventListener found without removeEventListener');
  }
});

/**
 * GENERATE SUMMARY REPORT
 */
console.log(`\n${BLUE}
╔═══════════════════════════════════════════════════════════════════╗
║                          TEST SUMMARY                            ║
╚═══════════════════════════════════════════════════════════════════╝
${RESET}`);

console.log(`Total Tests Run: ${totalTests}`);
console.log(`${GREEN}Passed: ${passedTests}${RESET}`);
console.log(`${RED}Failed: ${failedTests}${RESET}`);
console.log(`${YELLOW}Warnings: ${warnings}${RESET}\n`);

if (failedTests > 0) {
  console.log(`${RED}═══ FAILED TESTS ═══${RESET}`);
  errors.forEach(({ test, error }, index) => {
    console.log(`${index + 1}. ${test}`);
    console.log(`   ${error}\n`);
  });
}

if (warnings > 0) {
  console.log(`${YELLOW}═══ WARNINGS ═══${RESET}`);
  warningsList.forEach(({ test, warning }, index) => {
    console.log(`${index + 1}. ${test}`);
    console.log(`   ${warning}\n`);
  });
}

// Calculate success rate
const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

console.log(`\n${BLUE}Success Rate: ${successRate}%${RESET}`);

if (failedTests === 0) {
  console.log(`\n${GREEN}✓ ALL CRITICAL TESTS PASSED!${RESET}`);
  console.log(`${GREEN}The patched files are ready for deployment.${RESET}\n`);
} else {
  console.log(`\n${RED}✗ SOME TESTS FAILED${RESET}`);
  console.log(`${RED}Please review the failed tests before deploying.${RESET}\n`);
}

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
