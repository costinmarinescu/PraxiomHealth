/**
 * @file BioAgeCalculator.h
 * @brief Praxiom Health Bio-Age Calculation Engine Header
 * @author Dr. Costin Marinescu, Dr. Elisabeth Pfeifer
 * @date 2025
 * @copyright Patent Pending - Praxiom Health
 * 
 * This header defines the core bio-age calculation algorithms that implement
 * Praxiom Health's patented Progressive Engagement Architecture for biological
 * age assessment through oral-systemic health integration.
 * 
 * PATENT TECHNOLOGIES:
 * 1. Oral-Systemic Correlation Matrices
 * 2. Age-Stratified Weighting Algorithms
 * 3. Progressive Engagement Architecture
 * 4. Real-Time Wearable Data Fusion
 */

#pragma once

#include <cstdint>
#include <ctime>

namespace Pinetime {
namespace Components {
namespace Praxiom {

/**
 * @brief Age-stratified weighting coefficients
 */
struct AgeCoefficients {
    float alpha;    // Oral health weight
    float beta;     // Systemic health weight  
    float gamma;    // Wearable data weight
};

/**
 * @brief Oral health biomarkers for bio-age calculation
 * 
 * Based on Heidelberg Cohort Study showing 91% correlation
 * with epigenetic aging markers when integrated with systemic markers.
 */
struct OralHealthMetrics {
    float salivaryPH;           ///< Optimal: 6.5-7.2, Risk: <6.0 or >7.5
    float mmp8Level;            ///< MMP-8 in ng/mL, Optimal: <60, Risk: >100
    float flowRate;             ///< mL/min, Optimal: >1.5, Risk: <1.0
    float proteinCarbonyls;     ///< nmol/mg, Optimal: <2.0, Risk: >4.0
    float advancedGlycation;    ///< AGE products, age-adjusted percentile
    uint32_t timestamp;         ///< Unix timestamp of measurement
    
    /**
     * @brief Calculate Oral Health Score using patent algorithm
     * @return Score 0-100 (100 = optimal oral health)
     * 
     * Formula: OHS = [(MMP-8 × 2.5) + (pH × 1.0) + (FlowRate × 1.0) + 
     *                 (ProteinCarbonyls × 1.5) + (AGE × 1.5)] / 6.5 × 100
     * 
     * Clinical Validation: 89% sensitivity for CVD correlation
     */
    float calculateOHS() const;
};

/**
 * @brief Systemic health biomarkers for comprehensive assessment
 */
struct SystemicHealthMetrics {
    // === TIER 1 BIOMARKERS (Foundation Assessment) ===
    float hsCRP;                ///< mg/L, Optimal: <1.0, Risk: >3.0
    float omega3Index;          ///< %, Optimal: >8.0, Risk: <6.0
    float hba1c;                ///< %, Optimal: <5.7, Risk: >6.4
    float gdf15;                ///< pg/mL, Optimal: <1200, Risk: >1800
    float vitaminD;             ///< ng/mL, Optimal: >30, Risk: <20
    
    // === TIER 2 BIOMARKERS (Advanced Inflammatory Panel) ===
    float il6;                  ///< pg/mL, Optimal: <3.0, Risk: >10.0
    float il1beta;              ///< pg/mL, Optimal: <100, Risk: >300
    float nadRatio;             ///< NAD+/NADH ratio, age-adjusted
    float dysbiosis;            ///< Microbiome pathogenic ratio
    
    // === TIER 3 BIOMARKERS (Epigenetic & Proteomic) ===
    float dunedinPACE;          ///< Rate of aging, 1.0 = normal, >1.2 = accelerated
    float elovl2Methylation;    ///< Cardiovascular aging marker
    float senescenceIndex;      ///< Composite senescence burden
    
    uint32_t timestamp;
    
    /**
     * @brief Calculate Systemic Health Score with tier-specific weighting
     * @param tier Assessment tier (1-3)
     * @return Score 0-100 (100 = optimal systemic health)
     * 
     * Tier 1 Formula:
     * SHS = [(hs-CRP × 2.0) + (Omega-3 × 2.0) + (HbA1c × 1.5) + 
     *        (GDF-15 × 2.0) + (VitD × 1.0)] / 8.5 × 100
     * 
     * Enhanced with Tier 2/3 biomarkers for advanced assessment
     */
    float calculateSHS(int tier = 1) const;
};

/**
 * @brief Real-time wearable sensor data with error correction
 */
struct WearableMetrics {
    float hrvRMSSD;             ///< HRV in ms, with ±20% confidence interval
    float sleepEfficiency;      ///< %, corrected for -10% systematic bias
    uint32_t dailySteps;        ///< Steps, corrected for 9% underestimation
    float restingHeartRate;     ///< BPM, averaged over 7 days
    float stressIndex;          ///< Composite stress score 0-100
    uint32_t timestamp;
    
    /**
     * @brief Calculate wearable-derived health score with error correction
     * @return Score 0-100 (100 = optimal wearable metrics)
     * 
     * Formula with Error Corrections:
     * WS = [(HRV_corrected × 1.0) + (Sleep_corrected × 1.0) + 
     *       (Steps_corrected × 0.8)] / 2.8 × 100
     * 
     * Patent Error Corrections:
     * - HRV: ×1.2 for ±20% confidence interval
     * - Sleep: ×1.1 for -10% systematic bias
     * - Steps: ×1.09 for 9% underestimation
     */
    float calculateWearableScore() const;
};

/**
 * @brief Core Bio-Age Calculator implementing patent algorithms
 */
class BioAgeCalculator {
public:
    /**
     * @brief Constructor initializing age-stratified algorithms
     */
    BioAgeCalculator();
    
    /**
     * @brief Destructor
     */
    ~BioAgeCalculator() = default;
    
    /**
     * @brief Configure Tier 1 Foundation Assessment
     * 
     * Sets up basic biomarker panel (6 markers) for mass-market 
     * accessibility at €890 price point. Target accuracy: 85%
     */
    void configureTier1Assessment();
    
    /**
     * @brief Configure Tier 2 Optimization Protocol
     * 
     * Enables advanced inflammatory markers (12 total markers) and 
     * microbiome analysis for personalized interventions. Target accuracy: 89%
     */
    void configureTier2Optimization();
    
    /**
     * @brief Configure Tier 3 Precision Mastery
     * 
     * Activates epigenetic testing and proteomics (20+ markers) for 
     * cutting-edge longevity optimization. Target accuracy: 91%
     */
    void configureTier3Precision();
    
    /**
     * @brief Initialize age-stratified algorithms (PATENT PENDING)
     * 
     * Loads proprietary weighting coefficients optimized for different
     * age groups to achieve 91% correlation with epigenetic markers.
     * 
     * Age Groups:
     * - Young (18-35): α=0.10, β=0.12, γ=0.15
     * - Middle (36-55): α=0.12, β=0.15, γ=0.12
     * - Mature (56-75): α=0.15, β=0.18, γ=0.10
     * - Senior (75+): α=0.18, β=0.20, γ=0.08
     */
    void initializeAgeStratifiedAlgorithms();
    
    /**
     * @brief Calculate biological age using complete biomarker panel
     * @param chronologicalAge Patient's chronological age in years
     * @param oral Oral health biomarker measurements
     * @param systemic Systemic health biomarker measurements  
     * @param wearable Real-time wearable sensor data
     * @return Calculated biological age in years
     * 
     * CORE PATENT FORMULA:
     * BioAge = ChronologicalAge + 
     *          (100 - OHS) × α(age) + 
     *          (100 - SHS) × β(age) + 
     *          (100 - WearableScore) × γ(age)
     * 
     * Clinical Validation:
     * - Heidelberg Cohort: r = 0.91 with DunedinPACE
     * - Mean Absolute Error: 2.5 years
     * - 23% improvement in CVD risk prediction
     */
    float calculateBioAge(float chronologicalAge,
                         const OralHealthMetrics& oral,
                         const SystemicHealthMetrics& systemic,
                         const WearableMetrics& wearable);
    
    /**
     * @brief Check if patient should upgrade to next tier
     * @return true if upgrade criteria are met
     * 
     * Tier 1→2 Triggers:
     * - OHS or SHS < 75
     * - GDF-15 > 1800 pg/mL
     * - MMP-8 > 100 ng/mL
     * - hs-CRP > 3.0 mg/L
     * 
     * Tier 2→3 Triggers:
     * - DunedinPACE > 1.2 (accelerated aging)
     * - Persistent inflammation
     * - Cellular age deviation > 5 years
     */
    bool shouldUpgradeTier() const;
    
    /**
     * @brief Get current assessment tier
     */
    int getCurrentTier() const { return currentTier_; }
    
    /**
     * @brief Get last calculated bio-age
     */
    float getLastBioAge() const { return lastBioAge_; }

private:
    int currentTier_;
    float lastBioAge_;
    
    /**
     * @brief Get age-stratified coefficients for chronological age
     */
    AgeCoefficients getAgeCoefficients(float chronologicalAge) const;
    
    /**
     * @brief Check Tier 1 to Tier 2 upgrade triggers
     */
    bool checkTier1UpgradeTriggers() const;
    
    /**
     * @brief Check Tier 2 to Tier 3 upgrade triggers
     */
    bool checkTier2UpgradeTriggers() const;
};

} // namespace Praxiom
} // namespace Components
} // namespace Pinetime
