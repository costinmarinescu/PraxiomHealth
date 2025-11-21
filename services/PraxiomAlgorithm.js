/**
 * Praxiom Bio-Age Longevity Protocol - Complete Algorithm Implementation
 * 2025 Edition with Fitness Score Integration
 * 
 * Based on:
 * - PraxiomBioAgeProtocol2025.pdf
 * - Tier_1_Optional_Fitness_Evaluation_ModuleGPT.pdf
 * - Personal_Vitality_Roadmap_2025_Final.pdf
 * - Tier3_Mri_Genome_UpdateGPT.pdf
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
 */
function calculateFitnessScore(fitnessData) {
  if (!fitnessData || Object.keys(fitnessData).length === 0) {
    return null; // Fitness assessment is optional
  }
  
  const {
    aerobicFitness = 5,      // Default to average if not provided
    flexibilityPosture = 5,
    coordinationBalance = 5,
    mentalPreparedness = 5
  } = fitnessData;
  
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
 * Formula: Bio-Age = Chronological Age + [(100-OHS)×α + (100-SHS)×β + (100-FS)×γ + (100-HRV)×δ]
 * 
 * Where α, β, γ, δ are age-stratified coefficients
 */
function calculateBiologicalAge(data) {
  const {
    chronologicalAge,
    biomarkers,
    fitnessData = null,
    hrvValue = null
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
  
  // Calculate biological age deviation
  let deviation = (100 - OHS) * coeffs.alpha + (100 - SHS) * coeffs.beta;
  
  // Add fitness component if available
  if (FS !== null) {
    deviation += (100 - FS) * coeffs.gamma;
  }
  
  // Add HRV component if available
  if (HRVScore !== null) {
    deviation += (100 - HRVScore) * coeffs.delta;
  }
  
  const biologicalAge = chronologicalAge + deviation;
  
  // Calculate vitality index (composite health score)
  let vitalityComponents = [OHS, SHS];
  if (FS !== null) vitalityComponents.push(FS);
  if (HRVScore !== null) vitalityComponents.push(HRVScore);
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
      vitalityIndex: Math.round(vitalityIndex * 10) / 10
    },
    coefficients: {
      alpha: coeffs.alpha,
      beta: coeffs.beta,
      gamma: coeffs.gamma,
      delta: coeffs.delta
    },
    tier: determineTier(OHS, SHS, FS),
    recommendations: generateRecommendations(OHS, SHS, FS, HRVScore, biomarkers, fitnessData)
  };
}

// ============================================================================
// TIER DETERMINATION LOGIC
// ============================================================================

/**
 * Determine which protocol tier patient should be in
 * Based on score thresholds and risk markers
 */
function determineTier(OHS, SHS, FS) {
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
 */
function generateRecommendations(OHS, SHS, FS, HRVScore, biomarkers, fitnessData) {
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
  BIOMARKER_RANGES,
  AGE_COEFFICIENTS,
  HRV_NORMS
};
