// Praxiom Bio-Age Algorithm - Tier 1
// Based on validated oral-systemic biomarker protocol
// Formula: Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β]

class PraxiomAlgorithm {
  // Age-stratified coefficients as per Praxiom documentation
  static AGE_COEFFICIENTS = {
    '<50': { alpha: 0.08, beta: 0.15 },
    '50-70': { alpha: 0.12, beta: 0.20 },
    '>70': { alpha: 0.15, beta: 0.25 },
  };

  // Get age group
  static getAgeGroup(chronologicalAge) {
    if (chronologicalAge < 50) return '<50';
    if (chronologicalAge >= 50 && chronologicalAge <= 70) return '50-70';
    return '>70';
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
    // Weight: 2.5x due to CVD correlation
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
    // Weight: 2.0x - strongest aging predictor
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

  // Calculate Fitness Score from wearable data (0-100)
  // ✅ HRV is OPTIONAL but weighted heavily when available
  static calculateFitnessScore(heartRate, steps, spO2, hrv, age) {
    let score = 100;
    let totalPenalty = 0;

    // HRV scoring (OPTIONAL - optimal: ≥70 ms for adults)
    // Weight: 2.5x when available - strongest autonomic function predictor
    if (hrv !== null && hrv !== undefined && hrv > 0) {
      const optimalHRV = age < 40 ? 70 : age < 60 ? 55 : 40; // Age-adjusted
      
      if (hrv >= optimalHRV) {
        // Excellent HRV - no penalty
      } else if (hrv >= optimalHRV * 0.7) {
        totalPenalty += 10; // Good
      } else if (hrv >= optimalHRV * 0.4) {
        totalPenalty += 20; // Fair
      } else {
        totalPenalty += 30; // Poor
      }
    }

    // Resting Heart Rate scoring (age-adjusted)
    const optimalHR = age < 40 ? 60 : age < 60 ? 65 : 70;
    if (heartRate > optimalHR) {
      const excess = Math.min(heartRate - optimalHR, 40);
      totalPenalty += (excess / 40) * 25; // Up to 25 points
    }

    // Daily Steps scoring (optimal: >10,000)
    if (steps < 10000) {
      totalPenalty += ((10000 - steps) / 10000) * 30; // Up to 30 points
    }

    // SpO2 scoring (optimal: >95%)
    if (spO2 < 95) {
      totalPenalty += (95 - spO2) * 6; // Up to 30 points for severe hypoxia
    }

    score -= totalPenalty;
    return Math.max(0, Math.min(100, score));
  }

  // Calculate Praxiom Bio-Age using official formula
  // Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β]
  static calculateBioAge(chronologicalAge, oralScore, systemicScore, fitnessScore = null) {
    const ageGroup = this.getAgeGroup(chronologicalAge);
    const coeffs = this.AGE_COEFFICIENTS[ageGroup];

    // Main formula components
    const oralDeviation = (100 - oralScore) * coeffs.alpha;
    const systemicDeviation = (100 - systemicScore) * coeffs.beta;

    // Calculate base bio-age
    let bioAge = chronologicalAge + oralDeviation + systemicDeviation;

    // Optional: Add fitness modifier (moderate adjustment)
    if (fitnessScore !== null && fitnessScore !== undefined) {
      // Fitness has moderate impact: -2 to +2 years based on score
      const fitnessAdjustment = ((100 - fitnessScore) / 100) * 4 - 2;
      bioAge += fitnessAdjustment;
    }

    return {
      bioAge: parseFloat(bioAge.toFixed(1)),
      oralScore: Math.round(oralScore),
      systemicScore: Math.round(systemicScore),
      fitnessScore: fitnessScore !== null ? Math.round(fitnessScore) : null,
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

    // Fitness score calculation - HRV is OPTIONAL
    let fitnessScore = null;
    if (data.heartRate && data.steps && data.spO2) {
      fitnessScore = this.calculateFitnessScore(
        data.heartRate,
        data.steps,
        data.spO2,
        data.hrv || null, // HRV is optional
        data.age
      );
    }

    return this.calculateBioAge(
      data.age,
      oralScore,
      systemicScore,
      fitnessScore
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

  // Get recommendation based on scores
  static getRecommendation(oralScore, systemicScore, fitnessScore = null) {
    const recommendations = [];
    
    if (oralScore < 75) {
      recommendations.push({
        category: 'Oral Health',
        level: 'attention',
        message: 'Oral Health score is below target. Focus on improving oral hygiene and consider professional dental assessment.',
      });
    }
    
    if (systemicScore < 75) {
      recommendations.push({
        category: 'Systemic Health',
        level: 'attention',
        message: 'Systemic Health score is below target. Consult with healthcare provider for targeted interventions.',
      });
    }
    
    if (fitnessScore !== null && fitnessScore < 70) {
      recommendations.push({
        category: 'Fitness',
        level: 'attention',
        message: 'Fitness score is below target. Consider increasing daily activity and monitoring HRV for stress management.',
      });
    }
    
    if (recommendations.length === 0) {
      return {
        level: 'maintain',
        message: 'All scores are in good range. Continue current health practices and monitor regularly.',
      };
    } else if (recommendations.length >= 2) {
      return {
        level: 'urgent',
        message: 'Multiple health scores are below target. Consider Tier 2 assessment for detailed analysis.',
        details: recommendations,
      };
    } else {
      return recommendations[0];
    }
  }
}

export default PraxiomAlgorithm;
