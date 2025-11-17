// Praxiom Bio-Age Algorithm - Complete Protocol Implementation
// Based on validated oral-systemic-fitness biomarker protocol (2025 Edition)
// Tier 1 Formula: Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β + (100 - FS) × γ]

class PraxiomAlgorithm {
  // Age-stratified coefficients as per Praxiom Protocol 2025
  static AGE_COEFFICIENTS = {
    '<50': { alpha: 0.08, beta: 0.15, gamma: 0.10 },
    '50-70': { alpha: 0.12, beta: 0.20, gamma: 0.12 },
    '>70': { alpha: 0.15, beta: 0.25, gamma: 0.15 },
  };

  // Age-adjusted HRV normalization (6-tier protocol specification)
  static HRV_AGE_NORMS = {
    '20-29': { optimal: 62, good: 50, fair: 35 },
    '30-39': { optimal: 56, good: 44, fair: 31 },
    '40-49': { optimal: 48, good: 38, fair: 26 },
    '50-59': { optimal: 40, good: 31, fair: 22 },
    '60-69': { optimal: 34, good: 26, fair: 18 },
    '70+': { optimal: 28, good: 22, fair: 15 },
  };

  // Get age group for coefficients
  static getAgeGroup(chronologicalAge) {
    if (chronologicalAge < 50) return '<50';
    if (chronologicalAge >= 50 && chronologicalAge <= 70) return '50-70';
    return '>70';
  }

  // Get HRV age group for normalization
  static getHRVAgeGroup(age) {
    if (age < 30) return '20-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    if (age < 70) return '60-69';
    return '70+';
  }

  // Calculate Oral Health Score (0-100)
  static calculateOralScore(salivaryPH, activeMMP8, salivaryFlow) {
    let score = 100;

    // Salivary pH scoring (optimal: 6.5-7.2)
    if (salivaryPH < 6.5) {
      score -= (6.5 - salivaryPH) * 15; // Acidic penalty
    } else if (salivaryPH > 7.2) {
      score -= (salivaryPH - 7.2) * 10; // Alkaline penalty
    }

    // Active MMP-8 scoring (optimal: <60 ng/mL)
    // Weight: 2.5x due to 89% CVD correlation
    if (activeMMP8 > 60) {
      const excess = Math.min(activeMMP8 - 60, 200); // Cap at 260
      score -= (excess / 200) * 30 * 2.5; // Up to -75 points (weighted)
    }

    // Salivary Flow Rate scoring (optimal: >1.5 mL/min)
    if (salivaryFlow < 1.5) {
      score -= (1.5 - salivaryFlow) * 20; // Reduced flow penalty
    }

    return Math.max(0, Math.min(100, score));
  }

  // Calculate Systemic Health Score (0-100)
  static calculateSystemicScore(hsCRP, omega3Index, hbA1c, gdf15, vitaminD) {
    let score = 100;

    // hs-CRP scoring (optimal: <1.0 mg/L)
    // Weight: 2.0x - CVD correlation
    if (hsCRP > 1.0) {
      const excess = Math.min(hsCRP - 1.0, 9.0); // Cap at 10
      score -= (excess / 9.0) * 20 * 2.0; // Up to -40 points (weighted)
    }

    // Omega-3 Index scoring (optimal: >8%)
    // Weight: 2.0x - cardiovascular health
    if (omega3Index < 8) {
      score -= ((8 - omega3Index) / 8) * 15 * 2.0; // Up to -30 points (weighted)
    }

    // HbA1c scoring (optimal: <5.7%)
    // Weight: 1.5x - ADA validated
    if (hbA1c > 5.7) {
      const excess = Math.min(hbA1c - 5.7, 8.3); // Cap at 14
      score -= (excess / 8.3) * 20 * 1.5; // Up to -30 points (weighted)
    }

    // GDF-15 scoring (optimal: <1200 pg/mL)
    // Weight: 2.0x - strongest aging predictor (AUC 0.92)
    if (gdf15 > 1200) {
      const excess = Math.min(gdf15 - 1200, 3800); // Cap at 5000
      score -= (excess / 3800) * 12 * 2.0; // Up to -24 points (weighted)
    }

    // Vitamin D scoring (optimal: >30 ng/mL)
    // Weight: 1.0x
    if (vitaminD < 30) {
      score -= ((30 - vitaminD) / 30) * 10; // Up to -10 points
    }

    return Math.max(0, Math.min(100, score));
  }

  // Calculate Fitness Score from 4 domains (0-100)
  // Per Tier 1 Optional Fitness Module protocol
  static calculateFitnessScore(aerobicScore, flexibilityScore, balanceScore, mindBodyScore) {
    // Each domain weighted equally (25% each)
    // Input: Each score is 0-10
    const compositeScore = (aerobicScore + flexibilityScore + balanceScore + mindBodyScore) / 4;
    
    // Convert to 0-100 scale
    return Math.round(compositeScore * 10);
  }

  // Calculate Aerobic Fitness Score (0-10)
  // Based on 3-Minute Step Test or 6-Minute Walk Test
  static calculateAerobicScore(testType, testValue, age, gender) {
    if (testType === 'stepTest') {
      // Step Test: Lower recovery HR = better fitness
      // testValue = recovery heart rate (bpm)
      const ageGroup = this.getHRVAgeGroup(age);
      let optimalHR = 85;
      let goodHR = 95;
      let fairHR = 110;
      
      if (age >= 50) {
        optimalHR = 90;
        goodHR = 100;
        fairHR = 115;
      }
      
      if (testValue <= optimalHR) return 10;
      if (testValue <= goodHR) return 7;
      if (testValue <= fairHR) return 5;
      if (testValue <= 120) return 3;
      return 1;
    } else if (testType === '6mwt') {
      // 6-Minute Walk Test: Longer distance = better fitness
      // testValue = distance in meters
      const ageAdjusted = age < 50 ? 600 : age < 70 ? 550 : 500;
      const excellent = ageAdjusted * 1.15;
      const good = ageAdjusted;
      const fair = ageAdjusted * 0.85;
      
      if (testValue >= excellent) return 10;
      if (testValue >= good) return 7;
      if (testValue >= fair) return 5;
      if (testValue >= fair * 0.7) return 3;
      return 1;
    }
    return 5; // Default moderate score
  }

  // Calculate Flexibility & Posture Score (0-10)
  static calculateFlexibilityScore(sitReachCm, postureRating) {
    let flexScore = 5;
    let postureScore = 5;
    
    // Sit-and-reach scoring
    if (sitReachCm >= 5) flexScore = 10; // Beyond toes
    else if (sitReachCm >= 0) flexScore = 7; // Touch toes
    else if (sitReachCm >= -5) flexScore = 5; // Near toes
    else if (sitReachCm >= -10) flexScore = 3; // Mid-shin
    else flexScore = 1; // Poor flexibility
    
    // Posture scoring (input: 0-10 from trainer assessment)
    postureScore = postureRating;
    
    // Combined score (50/50 weight)
    return Math.round((flexScore + postureScore) / 2);
  }

  // Calculate Balance & Coordination Score (0-10)
  static calculateBalanceScore(oneLegStandSeconds, yBalanceScore = null) {
    let balanceScore = 5;
    
    // One-leg stance primary test
    if (oneLegStandSeconds >= 30) balanceScore = 10;
    else if (oneLegStandSeconds >= 15) balanceScore = 7;
    else if (oneLegStandSeconds >= 10) balanceScore = 5;
    else if (oneLegStandSeconds >= 5) balanceScore = 3;
    else balanceScore = 1;
    
    // Optional Y-Balance test adjustment
    if (yBalanceScore !== null && yBalanceScore !== undefined) {
      balanceScore = Math.round((balanceScore + yBalanceScore) / 2);
    }
    
    return balanceScore;
  }

  // Calculate Mind-Body Alignment Score (0-10)
  static calculateMindBodyScore(confidenceRating, bodyAwarenessRating) {
    // Input: Both ratings 0-10 from trainer assessment
    // Combined average
    return Math.round((confidenceRating + bodyAwarenessRating) / 2);
  }

  // Calculate wearable-based fitness component (optional enhancement)
  // This supplements but does NOT replace the 4-domain fitness assessment
  static calculateWearableFitnessComponent(heartRate, steps, spO2, hrv, age) {
    let score = 100;
    let totalPenalty = 0;

    // HRV scoring with 6-tier age-adjustment
    if (hrv !== null && hrv !== undefined && hrv > 0) {
      const hrvGroup = this.getHRVAgeGroup(age);
      const norms = this.HRV_AGE_NORMS[hrvGroup];
      
      if (hrv >= norms.optimal) {
        totalPenalty += 0; // Excellent
      } else if (hrv >= norms.good) {
        totalPenalty += 5; // Good
      } else if (hrv >= norms.fair) {
        totalPenalty += 15; // Fair
      } else {
        totalPenalty += 25; // Poor
      }
    }

    // Resting Heart Rate scoring (age-adjusted)
    const optimalHR = age < 40 ? 60 : age < 60 ? 65 : 70;
    if (heartRate > optimalHR) {
      const excess = Math.min(heartRate - optimalHR, 40);
      totalPenalty += (excess / 40) * 20;
    }

    // Daily Steps scoring
    if (steps < 10000) {
      totalPenalty += ((10000 - steps) / 10000) * 25;
    }

    // SpO2 scoring
    if (spO2 < 95) {
      totalPenalty += (95 - spO2) * 5;
    }

    score -= totalPenalty;
    return Math.max(0, Math.min(100, score));
  }

  // Calculate Praxiom Bio-Age using official Tier 1 formula
  // Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β + (100 - FS) × γ]
  static calculateBioAge(chronologicalAge, oralScore, systemicScore, fitnessScore = null, wearableScore = null) {
    const ageGroup = this.getAgeGroup(chronologicalAge);
    const coeffs = this.AGE_COEFFICIENTS[ageGroup];

    // Main formula components
    const oralDeviation = (100 - oralScore) * coeffs.alpha;
    const systemicDeviation = (100 - systemicScore) * coeffs.beta;

    // Calculate base bio-age
    let bioAge = chronologicalAge + oralDeviation + systemicDeviation;

    // Add Fitness Score deviation if available (official protocol)
    if (fitnessScore !== null && fitnessScore !== undefined) {
      const fitnessDeviation = (100 - fitnessScore) * coeffs.gamma;
      bioAge += fitnessDeviation;
    }

    // Optional: Add small wearable adjustment (not part of main formula)
    // This is a bonus modifier, not a replacement for fitness assessment
    if (wearableScore !== null && wearableScore !== undefined && fitnessScore === null) {
      // Only use wearable as fallback if no fitness assessment
      const wearableAdjustment = ((100 - wearableScore) / 100) * 2 - 1;
      bioAge += wearableAdjustment;
    }

    return {
      bioAge: parseFloat(bioAge.toFixed(1)),
      oralScore: Math.round(oralScore),
      systemicScore: Math.round(systemicScore),
      fitnessScore: fitnessScore !== null ? Math.round(fitnessScore) : null,
      wearableScore: wearableScore !== null ? Math.round(wearableScore) : null,
      ageGroup,
      coefficients: coeffs,
      deviation: parseFloat((bioAge - chronologicalAge).toFixed(1)),
    };
  }

  // Full Tier 1 calculation from biomarker inputs
  static calculateFromBiomarkers(data) {
    // Validate required fields
    if (!data.age || !data.salivaryPH || !data.activeMMP8 || !data.salivaryFlowRate ||
        !data.hsCRP || !data.omega3Index || !data.hbA1c || !data.gdf15 || !data.vitaminD) {
      throw new Error('Missing required biomarker data');
    }

    const oralScore = this.calculateOralScore(
      data.salivaryPH,
      data.activeMMP8,
      data.salivaryFlowRate
    );

    const systemicScore = this.calculateSystemicScore(
      data.hsCRP,
      data.omega3Index,
      data.hbA1c,
      data.gdf15,
      data.vitaminD
    );

    // Fitness score from 4-domain assessment (optional)
    let fitnessScore = null;
    if (data.aerobicScore !== undefined && data.flexibilityScore !== undefined && 
        data.balanceScore !== undefined && data.mindBodyScore !== undefined) {
      fitnessScore = this.calculateFitnessScore(
        data.aerobicScore,
        data.flexibilityScore,
        data.balanceScore,
        data.mindBodyScore
      );
    }

    // Wearable fitness component (optional, separate from 4-domain)
    let wearableScore = null;
    if (data.heartRate && data.steps && data.spO2) {
      wearableScore = this.calculateWearableFitnessComponent(
        data.heartRate,
        data.steps,
        data.spO2,
        data.hrv || null,
        data.age
      );
    }

    return this.calculateBioAge(
      data.age,
      oralScore,
      systemicScore,
      fitnessScore,
      wearableScore
    );
  }

  // Get health status label
  static getHealthStatus(score) {
    if (score >= 85) return { label: 'Excellent', color: '#47C83E' };
    if (score >= 75) return { label: 'Good', color: '#4ade80' };
    if (score >= 60) return { label: 'Fair', color: '#fbbf24' };
    if (score >= 50) return { label: 'Poor', color: '#fb923c' };
    return { label: 'Critical', color: '#ef4444' };
  }

  // Calculate age difference with status
  static getAgeDifference(chronologicalAge, bioAge) {
    const diff = bioAge - chronologicalAge;
    const percentage = ((Math.abs(diff) / chronologicalAge) * 100).toFixed(1);
    
    if (diff < -0.5) {
      return {
        message: `${Math.abs(diff).toFixed(1)} years younger`,
        percentage: `${percentage}% younger`,
        status: 'positive',
        color: '#47C83E',
      };
    } else if (diff > 0.5) {
      return {
        message: `${diff.toFixed(1)} years older`,
        percentage: `${percentage}% older`,
        status: 'negative',
        color: '#ef4444',
      };
    } else {
      return {
        message: 'Matches chronological age',
        percentage: '0%',
        status: 'neutral',
        color: '#4ade80',
      };
    }
  }

  // Get tier upgrade recommendations (protocol triggers)
  static getTierUpgradeRecommendation(oralScore, systemicScore, fitnessScore, gdf15, activeMMP8, hsCRP) {
    const triggers = [];
    
    // Primary triggers per protocol
    if (oralScore < 75 || systemicScore < 75) {
      triggers.push({
        level: 'tier2',
        reason: 'OHS or SHS < 75%',
        action: 'Upgrade to Tier 2 (Personalized Profiling) for comprehensive risk review',
      });
    }
    
    if (gdf15 > 1800 || (activeMMP8 > 100 && hsCRP > 3)) {
      triggers.push({
        level: 'tier2intervention',
        reason: 'GDF-15 > 1800 or MMP-8 >100 + CRP >3',
        action: 'Tier 2 + Immediate Intervention - High-risk markers detected',
      });
    }
    
    if (fitnessScore !== null && fitnessScore < 60) {
      triggers.push({
        level: 'attention',
        reason: 'Fitness Score < 60',
        action: 'Emphasize exercise intervention - Consider specialist assessment if no improvement',
      });
    }
    
    return triggers.length > 0 ? triggers : null;
  }

  // Get recommendation based on scores
  static getRecommendation(oralScore, systemicScore, fitnessScore = null) {
    const recommendations = [];
    
    if (oralScore < 75) {
      recommendations.push({
        category: 'Oral Health',
        level: 'attention',
        message: 'Oral Health score below target. Begin oral health optimization: pH rinse 2x/day, probiotic lozenges (L. reuteri), targeted dental hygiene.',
      });
    }
    
    if (systemicScore < 75) {
      recommendations.push({
        category: 'Systemic Health',
        level: 'attention',
        message: 'Systemic Health score below target. Start inflammation reset: Omega-3 (2-3g/day), Mediterranean diet, anti-inflammatory supplements.',
      });
    }
    
    if (fitnessScore !== null && fitnessScore < 75) {
      recommendations.push({
        category: 'Fitness',
        level: 'attention',
        message: 'Fitness score below target. Implement 12-week guided exercise program: aerobic + balance training, increase daily steps to 8000+, flexibility routines 2x/week.',
      });
    }
    
    if (recommendations.length === 0) {
      return {
        level: 'maintain',
        message: 'All scores in optimal range (>85%). Continue current health practices and monitor regularly. Consider Tier 2 for optimization.',
      };
    } else if (recommendations.length >= 2) {
      return {
        level: 'urgent',
        message: 'Multiple health scores below target. Strongly recommend Tier 2 assessment for detailed analysis and targeted interventions.',
        details: recommendations,
      };
    } else {
      return recommendations[0];
    }
  }
}

export default PraxiomAlgorithm;
