/**
 * ADD THIS TO AppContext.js
 * 
 * Auto-Recalculation of Bio-Age based on Wearable Data
 * Place this useEffect after the wearable data polling section (around line 318)
 */

// ============================================================================
// AUTO-RECALCULATION: Bio-Age updates every 10 minutes with new wearable data
// ============================================================================
useEffect(() => {
  // Don't auto-recalculate if we don't have baseline biomarkers
  if (!state.salivaryPH && !state.hsCRP) {
    console.log('⏭️ No biomarkers entered yet, skipping auto-recalculation');
    return;
  }

  // Auto-recalculate Bio-Age every 10 minutes
  const recalculationInterval = setInterval(async () => {
    try {
      // Only recalculate if we have HRV data or fitness data
      if (state.hrv || state.ouraHRV || state.fitnessScore) {
        console.log('🔄 [AUTO] Recalculating Bio-Age with updated wearable data...');
        
        // Silently recalculate in background
        await calculateBiologicalAge();
        
        console.log('✅ [AUTO] Bio-Age recalculated:', state.biologicalAge);
      }
    } catch (error) {
      console.error('⚠️ [AUTO] Auto-recalculation failed:', error.message);
      // Don't show error to user - it's a background operation
    }
  }, 600000); // 600000ms = 10 minutes

  // Initial recalculation on mount if we have wearable data
  if (state.hrv || state.ouraHRV) {
    console.log('🔄 [AUTO] Initial Bio-Age calculation with wearable data');
    calculateBiologicalAge().catch(err => 
      console.error('⚠️ Initial auto-calc failed:', err.message)
    );
  }

  return () => {
    clearInterval(recalculationInterval);
    console.log('🛑 Stopped auto-recalculation interval');
  };
}, [state.hrv, state.ouraHRV, state.fitnessScore, state.salivaryPH, state.hsCRP]);

// ============================================================================
// SIGNIFICANT HRV CHANGE DETECTION: Recalculate immediately if HRV changes >10%
// ============================================================================
useEffect(() => {
  const lastHRV = state.hrv || state.ouraHRV;
  
  if (!lastHRV || !state.biologicalAge) {
    return; // No baseline to compare
  }

  // Store previous HRV value
  const checkHRVChange = async () => {
    const storedHRV = await AsyncStorage.getItem('lastHRVValue');
    const previousHRV = storedHRV ? parseFloat(storedHRV) : null;

    if (previousHRV) {
      const changePercent = Math.abs((lastHRV - previousHRV) / previousHRV) * 100;
      
      // If HRV changed by more than 10%, recalculate immediately
      if (changePercent > 10) {
        console.log(`⚡ [AUTO] Significant HRV change detected (${changePercent.toFixed(1)}%) - recalculating...`);
        
        try {
          await calculateBiologicalAge();
          console.log('✅ [AUTO] Bio-Age recalculated due to HRV change');
        } catch (error) {
          console.error('⚠️ HRV-triggered recalc failed:', error.message);
        }
      }
    }

    // Store current HRV for next comparison
    await AsyncStorage.setItem('lastHRVValue', lastHRV.toString());
  };

  checkHRVChange();
}, [state.hrv, state.ouraHRV]);
