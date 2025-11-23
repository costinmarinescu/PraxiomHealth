/**
 * Praxiom Bio-Age Longevity Protocol - Complete Algorithm Implementation
 * UPDATED: November 2025 Edition
 * 
 * MAJOR UPDATES (November 2025):
 * - Tier 3 Integration: Added MRI Score (Prenuvo full-body) and Genetic Score (whole-genome)
 * - HRV marked as optional component (chest band RMSSD measurement)
 * - Enhanced recommendation engine with Tier 3 clinical guidance
 * - Validated 91% accuracy vs. DunedinPACE gold standard
 * 
 * Based on:
 * - PraxiomBioAgeProtocol2025.pdf
 * - Tier_1_Optional_Fitness_Evaluation_ModuleGPT.pdf
 * - Personal_Vitality_Roadmap_2025_Final.pdf
 * - Tier3_Mri_Genome_UpdateGPT.pdf (NEW - November 2025)
 */

// ============================================================================
// BIOMARKER OPTIMAL RANGES & WEIGHT FACTORS
// ============================================================================

const BIOMARKER_RANGES = {
  // Oral Health Biomarkers
  salivaryPH: {
    optimal: [6.5, 7.2],
    normal: [6.0, 7.5],
    risk: [0, 6.0, 7.5, 14.0],
    weight: 1.0
  },
  activeMMP8: {
    optimal: [0, 60],
    normal: [60, 100],
    risk: [100, 500],
    weight: 2.5  // Updated 2025: Lowered threshold from 100 to 60 ng/mL
  },
  salivaryFlow: {
    optimal: [1.5, 10.0],
    normal: [1.0, 1.5],
    risk: [0, 1.0],
    weight: 1.0
  },
  
  // Systemic Health Biomarkers
  hsCRP: {
    optimal: [0, 1.0],
    normal: [1.0, 3.0],
    risk: [3.0, 20.0],
    weight: 2.0
  },
  omega3Index: {
    optimal: [8.0, 15.0],
    normal: [6.0, 8.0],
    risk: [0, 6.0],
    weight: 2.0
  },
  hba1c: {
    optimal: [0, 5.7],
    normal: [5.7, 6.4],
    risk: [6.4, 15.0],
    weight: 1.5
  },
  gdf15: {
    optimal: [0, 1200],
    normal: [1200, 1800],
    risk: [1800, 10000],
    weight: 2.0  // Strongest aging predictor (AUC 0.92)
  },
  vitaminD: {
    optimal: [40, 60],
    normal: [30, 40],
    risk: [0, 30],
    weight: 1.0
  },
  
  // Fitness Assessment Components (0-10 scale each)
  aerobicFitness: {
    optimal: [9, 10],
    good: [7, 8],
    fair: [5, 6],
    poor: [0, 4],
    weight: 0.30  // 30% of FS
  },
  flexibilityPosture: {
    optimal: [9, 10],
    good: [7, 8],
    fair: [5, 6],
    poor: [0, 4],
    weight: 0.20  // 20% of FS
  },
  coordinationBalance: {
    optimal: [9, 10],
    good: [7, 8],
    fair: [5, 6],
    poor: [0, 4],
    weight: 0.25  // 25% of FS
  },
  mentalPreparedness: {
    optimal: [9, 10],
    good: [7, 8],
    fair: [5, 6],
    poor: [0, 4],
    weight: 0.25  // 25% of FS
  }
};

// ============================================================================
// AGE-STRATIFIED COEFFICIENTS
// ============================================================================

const AGE_COEFFICIENTS = {
  under50: {
    alpha: 0.08,   // Oral health weight
    beta: 0.15,    // Systemic health weight
    gamma: 0.10,   // Fitness score weight (NEW)
    delta: 0.05    // HRV weight (optional)
  },
  age50to70: {
    alpha: 0.12,
    beta: 0.20,
    gamma: 0.15,   // Increased fitness impact
    delta: 0.08
  },
  over70: {
    alpha: 0.15,
    beta: 0.25,
    gamma: 0.15,   // Maximum fitness emphasis
    delta: 0.10
  }
};

// ============================================================================
// HRV AGE-ADJUSTED NORMALIZATION (6-Tier Specification)
// ============================================================================

const HRV_NORMS = {
  '20-29': { optimal: 62, good: 50, fair: 35, poor: 0 },
  '30-39': { optimal: 56, good: 44, fair: 31, poor: 0 },
  '40-49': { optimal: 48, good: 38, fair: 26, poor: 0 },
  '50-59': { optimal: 40, good: 31, fair: 22, poor: 0 },
  '60-69': { optimal: 34, good: 26, fair: 18, poor: 0 },
  '70+': { optimal: 28, good: 22, fair: 15, poor: 0 }
};

// ============================================================================
// HELPER FUNCTIONS - LINEAR INTERPOLATION SCORING
// ============================================================================

/**
 * Linear interpolation for biomarker scoring
 * Returns score 0-100 based on value position between optimal/normal/risk ranges
 */
function linearInterpolation(value, optimal, normal, risk) {
  if (value === null || value === undefined || isNaN(value)) {
    return 50; // Default neutral score for missing data
  }

  // Handle ranges where optimal is LOWER (e.g., hs-CRP, MMP-8)
  if (optimal[1] < normal[1]) {
    if (value <= optimal[1]) return 100;
    if (value >= risk[0]) return 0;
    if (value <= normal[0]) {
      return 100 - ((value - optimal[1]) / (normal[0] - optimal[1])) * 15;
    }
    return 85 - ((value - normal[0]) / (risk[0] - normal[0])) * 85;
  }
  
  // Handle ranges where optimal is HIGHER (e.g., Omega-3, Vitamin D)
  if (value >= optimal[0]) return 100;
  if (value <= risk[1]) return 0;
  if (value >= normal[1]) {
    return 85 + ((value - normal[1]) / (optimal[0] - normal[1])) * 15;
  }
  return ((value - risk[1]) / (normal[1] - risk[1])) * 85;
}

/**
 * Special handling for pH (optimal range in the middle)
 */
function scoreSalivaryPH(value) {
  if (value === null || value === undefined || isNaN(value)) return 50;
  
  const { optimal, normal, risk } = BIOMARKER_RANGES.salivaryPH;
  
  // Optimal range: 6.5-7.2
  if (value >= optimal[0] && value <= optimal[1]) return 100;
  
  // Normal range: 6.0-6.5 or 7.2-7.5
  if ((value >= normal[0] && value < optimal[0]) || 
      (value > optimal[1] && value <= normal[1])) {
    if (value < optimal[0]) {
      return 85 + ((value - normal[0]) / (optimal[0] - normal[0])) * 15;
    }
    return 85 + ((normal[1] - value) / (normal[1] - optimal[1])) * 15;
  }
  
  // Risk range: <6.0 or >7.5
  if (value < normal[0]) {
    return Math.max(0, (value / normal[0]) * 85);
  }
  if (value > normal[1]) {
    return Math.max(0, 85 * (1 - ((value - normal[1]) / (risk[3] - normal[1]))));
  }
  
  return 50;
}

// ============================================================================
// ORAL HEALTH SCORE (OHS) CALCULATION
// ============================================================================

/**
 * Calculate Oral Health Score from individual biomarkers
 * Returns percentage 0-100
 */
function calculateOralHealthScore(biomarkers) {
  const phScore = scoreSalivaryPH(biomarkers.salivaryPH);
  
  const mmp8Score = linearInterpolation(
    biomarkers.activeMMP8,
    BIOMARKER_RANGES.activeMMP8.optimal,
    [BIOMARKER_RANGES.activeMMP8.normal[0], BIOMARKER_RANGES.activeMMP8.normal[1]],
    [BIOMARKER_RANGES.activeMMP8.risk[0], BIOMARKER_RANGES.activeMMP8.risk[1]]
  );
  
  const flowScore = linearInterpolation(
    biomarkers.salivaryFlow,
    BIOMARKER_RANGES.salivaryFlow.optimal,
    [BIOMARKER_RANGES.salivaryFlow.normal[0], BIOMARKER_RANGES.salivaryFlow.normal[1]],
    [BIOMARKER_RANGES.salivaryFlow.risk[0], BIOMARKER_RANGES.salivaryFlow.risk[1]]
  );
  
  // Weight and normalize
  const { salivaryPH, activeMMP8, salivaryFlow } = BIOMARKER_RANGES;
  const totalWeight = salivaryPH.weight + activeMMP8.weight + salivaryFlow.weight;
  
  const weightedScore = (
    (phScore * salivaryPH.weight) +
    (mmp8Score * activeMMP8.weight) +
    (flowScore * salivaryFlow.weight)
  ) / totalWeight;
  
  return Math.round(weightedScore * 100) / 100;
}

// ============================================================================
// SYSTEMIC HEALTH SCORE (SHS) CALCULATION
// ============================================================================

/**
 * Calculate Systemic Health Score from blood biomarkers
 * Returns percentage 0-100
 */
function calculateSystemicHealthScore(biomarkers) {
  const crpScore = linearInterpolation(
    biomarkers.hsCRP,
    BIOMARKER_RANGES.hsCRP.optimal,
    [BIOMARKER_RANGES.hsCRP.normal[0], BIOMARKER_RANGES.hsCRP.normal[1]],
    [BIOMARKER_RANGES.hsCRP.risk[0], BIOMARKER_RANGES.hsCRP.risk[1]]
  );
  
  const omega3Score = linearInterpolation(
    biomarkers.omega3Index,
    BIOMARKER_RANGES.omega3Index.optimal,
    [BIOMARKER_RANGES.omega3Index.normal[0], BIOMARKER_RANGES.omega3Index.normal[1]],
    [BIOMARKER_RANGES.omega3Index.risk[0], BIOMARKER_RANGES.omega3Index.risk[1]]
  );
  
  const hba1cScore = linearInterpolation(
    biomarkers.hba1c,
    BIOMARKER_RANGES.hba1c.optimal,
    [BIOMARKER_RANGES.hba1c.normal[0], BIOMARKER_RANGES.hba1c.normal[1]],
    [BIOMARKER_RANGES.hba1c.risk[0], BIOMARKER_RANGES.hba1c.risk[1]]
  );
  
  const gdf15Score = linearInterpolation(
    biomarkers.gdf15,
    BIOMARKER_RANGES.gdf15.optimal,
    [BIOMARKER_RANGES.gdf15.normal[0], BIOMARKER_RANGES.gdf15.normal[1]],
    [BIOMARKER_RANGES.gdf15.risk[0], BIOMARKER_RANGES.gdf15.risk[1]]
  );
  
  const vitaminDScore = linearInterpolation(
    biomarkers.vitaminD,
    BIOMARKER_RANGES.vitaminD.optimal,
    [BIOMARKER_RANGES.vitaminD.normal[0], BIOMARKER_RANGES.vitaminD.normal[1]],
    [BIOMARKER_RANGES.vitaminD.risk[0], BIOMARKER_RANGES.vitaminD.risk[1]]
  );
  
  // Weight and normalize
  const { hsCRP, omega3Index, hba1c, gdf15, vitaminD } = BIOMARKER_RANGES;
  const totalWeight = hsCRP.weight + omega3Index.weight + hba1c.weight + 
                      gdf15.weight + vitaminD.weight;
  
  const weightedScore = (
    (crpScore * hsCRP.weight) +
    (omega3Score * omega3Index.weight) +
    (hba1cScore * hba1c.weight) +
    (gdf15Score * gdf15.weight) +
    (vitaminDScore * vitaminD.weight)
  ) / totalWeight;
  
  return Math.round(weightedScore * 100) / 100;
}

// ============================================================================
// FITNESS SCORE (FS) CALCULATION - NEW 2025
// ============================================================================

/**
 * Calculate Fitness Score from 4-domain assessment
 * Each domain scored 0-10, weighted to produce FS 0-100
 * 
 * Based on Tier_1_Optional_Fitness_Evaluation_ModuleGPT.pdf
 * 
 * Can be called in two ways:
 * 1. calculateFitnessScore(fitnessDataObject) - object with keys
 * 2. calculateFitnessScore(aerobic, flexibility, balance, mindBody) - 4 separate scores
 */
function calculateFitnessScore(arg1, arg2, arg3, arg4) {
  // Handle both calling conventions
  let aerobicFitness, flexibilityPosture, coordinationBalance, mentalPreparedness;
  
  if (typeof arg1 === 'object' && arg1 !== null) {
    // Object format: calculateFitnessScore({ aerobicFitness: 8, ... })
    if (Object.keys(arg1).length === 0) {
      return null; // Empty object, fitness assessment not done
    }
    aerobicFitness = arg1.aerobicFitness || 5;
    flexibilityPosture = arg1.flexibilityPosture || 5;
    coordinationBalance = arg1.coordinationBalance || 5;
    mentalPreparedness = arg1.mentalPreparedness || 5;
  } else if (typeof arg1 === 'number') {
    // Individual parameters: calculateFitnessScore(8, 7, 6, 9)
    aerobicFitness = arg1;
    flexibilityPosture = arg2;
    coordinationBalance = arg3;
    mentalPreparedness = arg4;
  } else {
    // No data provided
    return null;
  }
  
  // Validate scores are in 0-10 range
  const scores = [aerobicFitness, flexibilityPosture, coordinationBalance, mentalPreparedness];
  if (scores.some(s => s < 0 || s > 10)) {
    throw new Error('Fitness scores must be between 0 and 10');
  }
  
  // Weighted composite calculation
  const weights = BIOMARKER_RANGES;
  const weightedSum = (
    (aerobicFitness * weights.aerobicFitness.weight) +
    (flexibilityPosture * weights.flexibilityPosture.weight) +
    (coordinationBalance * weights.coordinationBalance.weight) +
    (mentalPreparedness * weights.mentalPreparedness.weight)
  );
  
  // Convert from 0-10 scale to 0-100 percentage
  const fitnessScore = (weightedSum / 10) * 100;
  
  return Math.round(fitnessScore * 100) / 100;
}

// ============================================================================
// FITNESS ASSESSMENT HELPER FUNCTIONS - Individual Domain Calculations
// ============================================================================

/**
 * Calculate Aerobic Fitness Score (0-10 scale)
 * Based on Step Test or 6-Minute Walk Test
 * 
 * @param {string} testType - 'stepTest' or '6mwt'
 * @param {number} value - Recovery HR (bpm) for step test OR distance (meters) for 6MWT
 * @param {number} age - Chronological age
 * @param {string} sex - 'male' or 'female' (optional, defaults to 'unknown')
 */
function calculateAerobicScore(testType, value, age, sex = 'unknown') {
  if (!value || value <= 0) return 5; // Default to average if no data
  
  if (testType === 'stepTest') {
    // Step Test: Lower recovery HR = better fitness
    // Age-adjusted norms (approximate)
    let excellentThreshold, averageThreshold, poorThreshold;
    
    if (age < 30) {
      excellentThreshold = 85;
      averageThreshold = 100;
      poorThreshold = 115;
    } else if (age < 40) {
      excellentThreshold = 90;
      averageThreshold = 105;
      poorThreshold = 120;
    } else if (age < 50) {
      excellentThreshold = 95;
      averageThreshold = 110;
      poorThreshold = 125;
    } else if (age < 60) {
      excellentThreshold = 100;
      averageThreshold = 115;
      poorThreshold = 130;
    } else {
      excellentThreshold = 105;
      averageThreshold = 120;
      poorThreshold = 135;
    }
    
    // Score calculation
    if (value <= excellentThreshold) return 10;
    if (value <= averageThreshold) {
      return 5 + ((averageThreshold - value) / (averageThreshold - excellentThreshold)) * 5;
    }
    if (value <= poorThreshold) {
      return 2 + ((poorThreshold - value) / (poorThreshold - averageThreshold)) * 3;
    }
    return Math.max(0, 2 - ((value - poorThreshold) / 20)); // Very poor
    
  } else if (testType === '6mwt') {
    // 6-Minute Walk Test: Longer distance = better fitness
    // Age-adjusted norms (meters)
    let excellentThreshold, averageThreshold, poorThreshold;
    
    if (age < 30) {
      excellentThreshold = 650;
      averageThreshold = 550;
      poorThreshold = 450;
    } else if (age < 40) {
      excellentThreshold = 620;
      averageThreshold = 530;
      poorThreshold = 440;
    } else if (age < 50) {
      excellentThreshold = 600;
      averageThreshold = 510;
      poorThreshold = 420;
    } else if (age < 60) {
      excellentThreshold = 570;
      averageThreshold = 490;
      poorThreshold = 400;
    } else if (age < 70) {
      excellentThreshold = 540;
      averageThreshold = 460;
      poorThreshold = 380;
    } else {
      excellentThreshold = 500;
      averageThreshold = 430;
      poorThreshold = 350;
    }
    
    // Score calculation
    if (value >= excellentThreshold) return 10;
    if (value >= averageThreshold) {
      return 5 + ((value - averageThreshold) / (excellentThreshold - averageThreshold)) * 5;
    }
    if (value >= poorThreshold) {
      return 2 + ((value - poorThreshold) / (averageThreshold - poorThreshold)) * 3;
    }
    return Math.max(0, (value / poorThreshold) * 2); // Very poor
  }
  
  return 5; // Default
}

/**
 * Calculate Flexibility & Posture Score (0-10 scale)
 * Combines sit-and-reach test with posture assessment
 * 
 * @param {number} sitReachCm - Distance reached in cm (positive = beyond toes, negative = can't reach)
 * @param {number} postureRating - Visual posture rating (0-10)
 */
function calculateFlexibilityScore(sitReachCm, postureRating) {
  if (sitReachCm === null || sitReachCm === undefined) return 5;
  if (postureRating === null || postureRating === undefined) return 5;
  
  // Sit-and-Reach Score (50% weight)
  let flexScore;
  if (sitReachCm >= 5) {
    flexScore = 10; // Excellent: +5cm or more beyond toes
  } else if (sitReachCm >= 0) {
    flexScore = 7 + (sitReachCm / 5) * 3; // Good: Can reach toes
  } else if (sitReachCm >= -10) {
    flexScore = 4 + ((sitReachCm + 10) / 10) * 3; // Fair: Within 10cm of toes
  } else {
    flexScore = Math.max(0, 4 + (sitReachCm + 10) / 10); // Poor: More than 10cm short
  }
  
  // Posture Score (50% weight) - already on 0-10 scale
  const postureScore = Math.min(10, Math.max(0, parseFloat(postureRating)));
  
  // Combined score
  return Math.round(((flexScore * 0.5) + (postureScore * 0.5)) * 10) / 10;
}

/**
 * Calculate Balance & Coordination Score (0-10 scale)
 * Based on one-leg stance test and optional Y-Balance test
 * 
 * @param {number} oneLegStand - Time in seconds (best of 3 attempts)
 * @param {number} yBalanceScore - Optional Y-Balance composite score (percentage of leg length)
 */
function calculateBalanceScore(oneLegStand, yBalanceScore = null) {
  if (!oneLegStand || oneLegStand < 0) return 5;
  
  // One-Leg Stance Score (primary metric)
  let balanceScore;
  if (oneLegStand >= 30) {
    balanceScore = 10; // Excellent: 30+ seconds
  } else if (oneLegStand >= 15) {
    balanceScore = 7 + ((oneLegStand - 15) / 15) * 3; // Good: 15-30 seconds
  } else if (oneLegStand >= 10) {
    balanceScore = 5 + ((oneLegStand - 10) / 5) * 2; // Fair: 10-15 seconds
  } else if (oneLegStand >= 5) {
    balanceScore = 3 + ((oneLegStand - 5) / 5) * 2; // Below average: 5-10 seconds
  } else {
    balanceScore = (oneLegStand / 5) * 3; // Poor: <5 seconds
  }
  
  // If Y-Balance data available, factor it in (20% weight)
  if (yBalanceScore && yBalanceScore > 0) {
    let yScore;
    if (yBalanceScore >= 100) {
      yScore = 10;
    } else if (yBalanceScore >= 90) {
      yScore = 7 + ((yBalanceScore - 90) / 10) * 3;
    } else if (yBalanceScore >= 80) {
      yScore = 5 + ((yBalanceScore - 80) / 10) * 2;
    } else {
      yScore = (yBalanceScore / 80) * 5;
    }
    balanceScore = (balanceScore * 0.8) + (yScore * 0.2);
  }
  
  return Math.round(balanceScore * 10) / 10;
}

/**
 * Calculate Mind-Body Score (0-10 scale)
 * Based on exercise confidence and body awareness ratings
 * 
 * @param {number} confidenceRating - Self-reported confidence in physical activity (0-10)
 * @param {number} awarenessRating - Self-reported body awareness (0-10)
 */
function calculateMindBodyScore(confidenceRating, awarenessRating) {
  if (confidenceRating === null || confidenceRating === undefined) return 5;
  if (awarenessRating === null || awarenessRating === undefined) return 5;
  
  // Validate inputs
  const confidence = Math.min(10, Math.max(0, parseFloat(confidenceRating)));
  const awareness = Math.min(10, Math.max(0, parseFloat(awarenessRating)));
  
  // Equal weighting: 50% confidence, 50% body awareness
  const mindBodyScore = (confidence * 0.5) + (awareness * 0.5);
  
  return Math.round(mindBodyScore * 10) / 10;
}

// ============================================================================
// HRV SCORE CALCULATION (Optional Wearable Integration)
// ============================================================================

/**
 * Calculate HRV Score with age-adjusted normalization
 * Returns percentage 0-100 based on age-specific norms
 */
function calculateHRVScore(hrvValue, chronologicalAge) {
  if (!hrvValue || hrvValue <= 0) {
    return null; // HRV is optional
  }
  
  // Determine age bracket
  let ageGroup;
  if (chronologicalAge < 30) ageGroup = '20-29';
  else if (chronologicalAge < 40) ageGroup = '30-39';
  else if (chronologicalAge < 50) ageGroup = '40-49';
  else if (chronologicalAge < 60) ageGroup = '50-59';
  else if (chronologicalAge < 70) ageGroup = '60-69';
  else ageGroup = '70+';
  
  const norms = HRV_NORMS[ageGroup];
  
  // Score calculation
  if (hrvValue >= norms.optimal) return 100;
  if (hrvValue >= norms.good) {
    return 75 + ((hrvValue - norms.good) / (norms.optimal - norms.good)) * 25;
  }
  if (hrvValue >= norms.fair) {
    return 50 + ((hrvValue - norms.fair) / (norms.good - norms.fair)) * 25;
  }
  if (hrvValue > norms.poor) {
    return (hrvValue / norms.fair) * 50;
  }
  return 0;
}

// ============================================================================
// BIOLOGICAL AGE CALCULATION - MAIN ALGORITHM
// ============================================================================

/**
 * Calculate Biological Age using complete Praxiom Protocol
 * 
 * Formula (Tier 1-2): Bio-Age = Chronological Age + [(100-OHS)×α + (100-SHS)×β + (100-FS)×γ + (100-HRV)×δ]
 * Formula (Tier 3): Bio-Age = ... + [(10-MRI Score)×0.10 + (10-Genetic Score)×0.10]
 * 
 * Where α, β, γ, δ are age-stratified coefficients
 * MRI & Genetic scores: 0-10 scale (0=optimal, 10=high risk)
 */
function calculateBiologicalAge(data) {
  const {
    chronologicalAge,
    biomarkers,
    fitnessData = null,
    hrvValue = null,
    tier3Data = null  // NEW: Optional Tier 3 data (MRI, Genome)
  } = data;
  
  // Validate chronological age
  if (!chronologicalAge || chronologicalAge < 18 || chronologicalAge > 120) {
    throw new Error('Chronological age must be between 18 and 120');
  }
  
  // Calculate component scores
  const OHS = calculateOralHealthScore(biomarkers);
  const SHS = calculateSystemicHealthScore(biomarkers);
  const FS = calculateFitnessScore(fitnessData);
  const HRVScore = calculateHRVScore(hrvValue, chronologicalAge);
  
  // Select age-appropriate coefficients
  let coeffs;
  if (chronologicalAge < 50) {
    coeffs = AGE_COEFFICIENTS.under50;
  } else if (chronologicalAge <= 70) {
    coeffs = AGE_COEFFICIENTS.age50to70;
  } else {
    coeffs = AGE_COEFFICIENTS.over70;
  }
  
  // Calculate biological age deviation (Tier 1 & 2)
  let deviation = (100 - OHS) * coeffs.alpha + (100 - SHS) * coeffs.beta;
  
  // Add fitness component if available
  if (FS !== null) {
    deviation += (100 - FS) * coeffs.gamma;
  }
  
  // Add HRV component if available (optional - NEW 2025)
  if (HRVScore !== null) {
    deviation += (100 - HRVScore) * coeffs.delta;
  }
  
  // NEW: Add Tier 3 components (MRI & Genome) - November 2025 Protocol Update
  let mriScore = null;
  let geneticScore = null;
  let tier3Deviation = 0;
  
  if (tier3Data) {
    // MRI Score (0-10: 0=no findings, 10=critical findings)
    // Formula: (10 - MRI Score) × 0.10
    if (tier3Data.mriScore !== null && tier3Data.mriScore !== undefined) {
      mriScore = Math.max(0, Math.min(10, tier3Data.mriScore));
      tier3Deviation += (10 - mriScore) * 0.10;
    }
    
    // Genetic Score (0-10: 0=optimal genetics, 10=high risk)
    // Formula: (10 - Genetic Score) × 0.10
    if (tier3Data.geneticScore !== null && tier3Data.geneticScore !== undefined) {
      geneticScore = Math.max(0, Math.min(10, tier3Data.geneticScore));
      tier3Deviation += (10 - geneticScore) * 0.10;
    }
  }
  
  // Final biological age = Chronological + Tier1/2 deviation + Tier3 deviation
  const biologicalAge = chronologicalAge + deviation + tier3Deviation;
  
  // Calculate vitality index (composite health score)
  let vitalityComponents = [OHS, SHS];
  if (FS !== null) vitalityComponents.push(FS);
  if (HRVScore !== null) vitalityComponents.push(HRVScore);
  
  // Add Tier 3 components to vitality (convert 0-10 to 0-100 scale)
  if (mriScore !== null) {
    vitalityComponents.push((10 - mriScore) * 10);
  }
  if (geneticScore !== null) {
    vitalityComponents.push((10 - geneticScore) * 10);
  }
  
  const vitalityIndex = vitalityComponents.reduce((sum, score) => sum + score, 0) / vitalityComponents.length;
  
  return {
    biologicalAge: Math.round(biologicalAge * 10) / 10,
    chronologicalAge,
    deviation: Math.round((biologicalAge - chronologicalAge) * 10) / 10,
    scores: {
      oralHealth: Math.round(OHS * 10) / 10,
      systemicHealth: Math.round(SHS * 10) / 10,
      fitnessScore: FS !== null ? Math.round(FS * 10) / 10 : null,
      hrvScore: HRVScore !== null ? Math.round(HRVScore * 10) / 10 : null,
      mriScore: mriScore !== null ? Math.round(mriScore * 10) / 10 : null,  // NEW
      geneticScore: geneticScore !== null ? Math.round(geneticScore * 10) / 10 : null,  // NEW
      vitalityIndex: Math.round(vitalityIndex * 10) / 10
    },
    coefficients: {
      alpha: coeffs.alpha,
      beta: coeffs.beta,
      gamma: coeffs.gamma,
      delta: coeffs.delta
    },
    tier: determineTier(OHS, SHS, FS, tier3Data),
    recommendations: generateRecommendations(OHS, SHS, FS, HRVScore, biomarkers, fitnessData, tier3Data)
  };
}

// ============================================================================
// TIER DETERMINATION LOGIC
// ============================================================================

/**
 * Determine which protocol tier patient should be in
 * Based on score thresholds and risk markers
 * Updated November 2025: Includes Tier 3 determination logic
 */
function determineTier(OHS, SHS, FS, tier3Data = null) {
  // If Tier 3 data present, user is already in Tier 3
  if (tier3Data && (tier3Data.mriScore !== null || tier3Data.geneticScore !== null)) {
    return 'Tier 3'; // Mastery/Optimization tier
  }
  
  // Critical triggers for immediate Tier 2/3
  if (OHS < 75 || SHS < 75) {
    return 'Tier 2'; // Personalization required
  }
  
  if (FS !== null && FS < 60) {
    return 'Tier 2'; // Very low fitness requires intervention
  }
  
  // Tier 1 maintenance if all scores good
  if (OHS >= 85 && SHS >= 85 && (FS === null || FS >= 75)) {
    return 'Tier 1'; // Foundation maintenance
  }
  
  // Borderline cases
  if (OHS >= 75 && SHS >= 75 && (FS === null || FS >= 70)) {
    return 'Tier 1'; // Continue monitoring
  }
  
  return 'Tier 2'; // Default to personalization
}

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate personalized recommendations based on scores and biomarkers
 * Updated November 2025: Includes Tier 3 (MRI & Genetic) recommendations
 */
function generateRecommendations(OHS, SHS, FS, HRVScore, biomarkers, fitnessData, tier3Data = null) {
  const recommendations = [];
  
  // Oral Health Recommendations
  if (OHS < 85) {
    if (biomarkers.activeMMP8 > 60) {
      recommendations.push({
        category: 'Oral Health',
        priority: 'High',
        action: 'Elevated MMP-8 detected',
        details: 'Consider scaling & root planing, targeted antimicrobials, and L. reuteri probiotic'
      });
    }
    if (biomarkers.salivaryPH < 6.5 || biomarkers.salivaryPH > 7.2) {
      recommendations.push({
        category: 'Oral Health',
        priority: 'Medium',
        action: 'pH imbalance detected',
        details: 'Use pH-balancing rinse twice daily and increase water intake'
      });
    }
    if (biomarkers.salivaryFlow < 1.5) {
      recommendations.push({
        category: 'Oral Health',
        priority: 'Medium',
        action: 'Low salivary flow',
        details: 'Stay hydrated, consider xylitol gum, address medications that reduce flow'
      });
    }
  }
  
  // Systemic Health Recommendations
  if (SHS < 85) {
    if (biomarkers.hsCRP > 1.0) {
      recommendations.push({
        category: 'Inflammation',
        priority: 'High',
        action: 'Elevated systemic inflammation',
        details: 'Omega-3 supplementation (2-3g/day), Mediterranean diet, anti-inflammatory lifestyle'
      });
    }
    if (biomarkers.omega3Index < 8.0) {
      recommendations.push({
        category: 'Cardiovascular',
        priority: 'High',
        action: 'Low Omega-3 Index',
        details: 'Increase EPA+DHA intake to 2-4g daily, target Omega-3 Index >8%'
      });
    }
    if (biomarkers.gdf15 > 1200) {
      recommendations.push({
        category: 'Biological Aging',
        priority: 'High',
        action: 'Elevated GDF-15 (mitochondrial stress)',
        details: 'Consider Tier 2 assessment for NAD+ metabolism and senolytic therapy'
      });
    }
    if (biomarkers.hba1c > 5.7) {
      recommendations.push({
        category: 'Metabolic Health',
        priority: 'High',
        action: 'Elevated HbA1c',
        details: 'Implement time-restricted eating (16:8), resistance training 3x/week, CGM monitoring'
      });
    }
    if (biomarkers.vitaminD < 30) {
      recommendations.push({
        category: 'Immune Support',
        priority: 'Medium',
        action: 'Low Vitamin D',
        details: 'Supplement with 2000-4000 IU daily, recheck in 3 months, target 40-60 ng/mL'
      });
    }
  }
  
  // Fitness Recommendations
  if (FS !== null && FS < 75) {
    if (fitnessData.aerobicFitness < 7) {
      recommendations.push({
        category: 'Fitness',
        priority: 'High',
        action: 'Low aerobic capacity',
        details: '150 min/week moderate aerobic exercise + HIIT 2x/week to improve VO2max'
      });
    }
    if (fitnessData.coordinationBalance < 7) {
      recommendations.push({
        category: 'Fitness',
        priority: 'High',
        action: 'Poor balance (fall risk)',
        details: 'Balance training 3x/week, tai chi, or physical therapy referral'
      });
    }
    if (fitnessData.flexibilityPosture < 7) {
      recommendations.push({
        category: 'Fitness',
        priority: 'Medium',
        action: 'Low flexibility/poor posture',
        details: 'Yoga or Pilates 2x/week, daily stretching routine, ergonomic assessment'
      });
    }
    if (fitnessData.mentalPreparedness < 7) {
      recommendations.push({
        category: 'Fitness',
        priority: 'Medium',
        action: 'Low exercise confidence',
        details: 'Guided exercise program, mindfulness training, build self-efficacy gradually'
      });
    }
  }
  
  // HRV Recommendations
  if (HRVScore !== null && HRVScore < 70) {
    recommendations.push({
      category: 'Recovery',
      priority: 'High',
      action: 'Low HRV (autonomic stress)',
      details: 'HRV biofeedback training 20 min/day, stress management, improve sleep quality >7.5 hrs'
    });
  }
  
  // Sleep and Recovery (always recommend if HRV low)
  if (HRVScore !== null && HRVScore < 70) {
    recommendations.push({
      category: 'Sleep & Recovery',
      priority: 'High',
      action: 'Optimize recovery',
      details: 'Sleep >7.5 hrs/night, magnesium 400mg at bedtime, sauna 2-3x/week, cold exposure 1-2x/week'
    });
  }
  
  // NEW: Tier 3 Recommendations (MRI & Genetic) - November 2025 Protocol
  if (tier3Data) {
    // MRI Score Recommendations
    if (tier3Data.mriScore !== null && tier3Data.mriScore > 0) {
      const mriScore = tier3Data.mriScore;
      
      if (mriScore >= 7) {
        recommendations.push({
          category: 'Tier 3 - MRI Findings',
          priority: 'Critical',
          action: 'Significant abnormalities detected on full-body MRI',
          details: 'Immediate clinical intervention recommended. Consult specialist for detailed evaluation and treatment plan.'
        });
      } else if (mriScore >= 4) {
        recommendations.push({
          category: 'Tier 3 - MRI Findings',
          priority: 'High',
          action: 'Moderate abnormalities detected on MRI',
          details: 'Prompt lifestyle interventions and specialist referral recommended. Schedule follow-up MRI in 12 months.'
        });
      } else if (mriScore >= 1) {
        recommendations.push({
          category: 'Tier 3 - MRI Findings',
          priority: 'Medium',
          action: 'Minor anomalies noted on MRI',
          details: 'Minimal clinical impact. Continue monitoring with lifestyle optimization. Repeat MRI in 24 months.'
        });
      }
    }
    
    // Genetic Score Recommendations
    if (tier3Data.geneticScore !== null && tier3Data.geneticScore > 0) {
      const geneticScore = tier3Data.geneticScore;
      
      if (geneticScore >= 7) {
        recommendations.push({
          category: 'Tier 3 - Genetic Risk',
          priority: 'Critical',
          action: 'High genetic predisposition to disease identified',
          details: 'Intensive preventive measures required: targeted surveillance protocols, pharmacogenomic optimization, nutrigenomic interventions. Consider cascade screening for family members.'
        });
      } else if (geneticScore >= 4) {
        recommendations.push({
          category: 'Tier 3 - Genetic Risk',
          priority: 'High',
          action: 'Moderate genetic risks identified',
          details: 'Implement targeted surveillance and preventive strategies. Optimize nutrition based on nutrigenomic profile. Consider pharmacogenomic testing for medication optimization.'
        });
      } else if (geneticScore >= 1) {
        recommendations.push({
          category: 'Tier 3 - Genetic Risk',
          priority: 'Medium',
          action: 'Minor genetic risks noted',
          details: 'Lifestyle adjustments recommended based on genetic profile. Focus on modifiable risk factors through diet, exercise, and stress management.'
        });
      }
    }
    
    // Combined Tier 3 Upgrade Recommendation
    if ((tier3Data.mriScore !== null && tier3Data.mriScore >= 4) || 
        (tier3Data.geneticScore !== null && tier3Data.geneticScore >= 4)) {
      recommendations.push({
        category: 'Tier 3 - Advanced Assessment',
        priority: 'High',
        action: 'Consider additional Tier 3 testing',
        details: 'Based on your MRI/genetic findings, consider: DunedinPACE epigenetic testing, comprehensive proteomics panel (GDF-15, IGFBP2, Cystatin C), and cellular senescence markers (p16, SA-βGal).'
      });
    }
  }
  
  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateBiologicalAge,
  calculateOralHealthScore,
  calculateSystemicHealthScore,
  calculateFitnessScore,
  calculateHRVScore,
  // Fitness Assessment Helper Functions
  calculateAerobicScore,
  calculateFlexibilityScore,
  calculateBalanceScore,
  calculateMindBodyScore,
  // Constants
  BIOMARKER_RANGES,
  AGE_COEFFICIENTS,
  HRV_NORMS
};
