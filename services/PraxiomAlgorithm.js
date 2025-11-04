// Praxiom Bio-Age Algorithm - Tier 1
// Based on validated oral-systemic biomarker protocol

class PraxiomAlgorithm {
  // Age-stratified coefficients
  static AGE_COEFFICIENTS = {
    '18-35': { base: 0.85, oral: 0.30, systemic: 0.45, fitness: 0.25 },
    '36-50': { base: 0.90, oral: 0.35, systemic: 0.50, fitness: 0.15 },
    '51-65': { base: 0.95, oral: 0.40, systemic: 0.55, fitness: 0.05 },
    '66+': { base: 1.00, oral: 0.45, systemic: 0.50, fitness: 0.05 },
  };

  // Get age group
  static getAgeGroup(chronologicalAge) {
    if (chronologicalAge >= 18 && chronologicalAge <= 35) return '18-35';
    if (chronologicalAge >= 36 && chronologicalAge <= 50) return '36-50';
    if (chronologicalAge >= 51 && chronologicalAge <= 65) return '51-65';
    return '66+';
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
    if (activeMMP8 > 60) {
      const excess = Math.min(activeMMP8 - 60, 200); // Cap at 260
      score -= (excess / 200) * 30; // Up to -30 points
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
    // Weight: 1.5x - CVD correlation
    if (hsCRP > 1.0) {
      const excess = Math.min(hsCRP - 1.0, 9.0); // Cap at 10
      score -= (excess / 9.0) * 25 * 1.5; // Up to -37.5 points
    }

    // Omega-3 Index scoring (optimal: >8%)
    if (omega3Index < 8) {
      score -= ((8 - omega3Index) / 8) * 15; // Up to -15 points
    }

    // HbA1c scoring (optimal: <5.7%)
    // Weight: 1.5x - ADA validated
    if (hbA1c > 5.7) {
      const excess = Math.min(hbA1c - 5.7, 8.3); // Cap at 14
      score -= (excess / 8.3) * 20 * 1.5; // Up to -30 points
    }

    // GDF-15 scoring (optimal: <1200 pg/mL)
    if (gdf15 > 1200) {
      const excess = Math.min(gdf15 - 1200, 3800); // Cap at 5000
      score -= (excess / 3800) * 15; // Up to -15 points
    }

    // Vitamin D scoring (optimal: >30 ng/mL)
    if (vitaminD < 30) {
      score -= ((30 - vitaminD) / 30) * 12.5; // Up to -12.5 points
    }

    return Math.max(0, Math.min(100, score));
  }

  // Calculate Fitness Score from wearable data (0-100)
  static calculateFitnessScore(heartRate, steps, spO2, age) {
    let score = 100;

    // Resting Heart Rate scoring (age-adjusted)
    const optimalHR = age < 40 ? 60 : age < 60 ? 65 : 70;
    if (heartRate > optimalHR) {
      const excess = Math.min(heartRate - optimalHR, 40);
      score -= (excess / 40) * 30; // Up to -30 points
    }

    // Daily Steps scoring (optimal: >10,000)
    if (steps < 10000) {
      score -= ((10000 - steps) / 10000) * 40; // Up to -40 points
    }

    // SpO2 scoring (optimal: >95%)
    if (spO2 < 95) {
      score -= (95 - spO2) * 6; // Up to -30 points for severe hypoxia
    }

    return Math.max(0, Math.min(100, score));
  }

  // Calculate Praxiom Bio-Age
  static calculateBioAge(chronologicalAge, oralScore, systemicScore, fitnessScore) {
    const ageGroup = this.getAgeGroup(chronologicalAge);
    const coeffs = this.AGE_COEFFICIENTS[ageGroup];

    // Composite score (0-100)
    const compositeScore = (
      oralScore * coeffs.oral +
      systemicScore * coeffs.systemic +
      fitnessScore * coeffs.fitness
    ) / (coeffs.oral + coeffs.systemic + coeffs.fitness);

    // Convert score to age modifier
    // Score 100 = 0.80x age (20% younger)
    // Score 50 = 1.00x age (actual age)
    // Score 0 = 1.30x age (30% older)
    const modifier = 1.30 - (compositeScore / 100) * 0.50;

    // Calculate bio-age
    const bioAge = chronologicalAge * coeffs.base * modifier;

    return {
      bioAge: parseFloat(bioAge.toFixed(1)),
      compositeScore: Math.round(compositeScore),
      oralScore: Math.round(oralScore),
      systemicScore: Math.round(systemicScore),
      fitnessScore: Math.round(fitnessScore),
      ageGroup,
      modifier: parseFloat(modifier.toFixed(2)),
    };
  }

  // Full Tier 1 calculation from biomarker inputs
  static calculateFromBiomarkers(data) {
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

    const fitnessScore = this.calculateFitnessScore(
      data.heartRate,
      data.steps,
      data.spO2,
      data.age
    );

    return this.calculateBioAge(
      data.age,
      oralScore,
      systemicScore,
      fitnessScore
    );
  }

  // Get health status label
  static getHealthStatus(score) {
    if (score >= 80) return { label: 'Excellent', color: '#00d4ff' };
    if (score >= 65) return { label: 'Good', color: '#4ade80' };
    if (score >= 50) return { label: 'Fair', color: '#fbbf24' };
    if (score >= 35) return { label: 'Poor', color: '#fb923c' };
    return { label: 'Critical', color: '#ef4444' };
  }

  // Calculate age difference
  static getAgeDifference(chronologicalAge, bioAge) {
    const diff = bioAge - chronologicalAge;
    const percentage = ((diff / chronologicalAge) * 100).toFixed(1);
    
    if (diff < 0) {
      return {
        message: `${Math.abs(diff).toFixed(1)} years younger`,
        percentage: `${Math.abs(percentage)}% younger`,
        status: 'positive',
      };
    } else if (diff > 0) {
      return {
        message: `${diff.toFixed(1)} years older`,
        percentage: `${percentage}% older`,
        status: 'negative',
      };
    } else {
      return {
        message: 'Matches chronological age',
        percentage: '0%',
        status: 'neutral',
      };
    }
  }
}

export default PraxiomAlgorithm;
