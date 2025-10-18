#include "BioAgeCalculator.h"
#include <algorithm>
#include <cmath>

using namespace Pinetime::Controllers;

uint8_t BioAgeCalculator::CalculateBioAge(uint8_t chronologicalAge,
                                          uint8_t restingHR,
                                          uint8_t hrv,
                                          uint16_t steps,
                                          uint8_t sleepScore) {
  // Calculate component scores
  uint8_t hrvScore = CalculateHRVScore(hrv);
  uint8_t activityScore = CalculateActivityScore(steps);
  uint8_t sleepScoreValue = CalculateSleepScore(sleepScore);
  
  // Estimate stress from resting HR
  uint8_t stressScore = (restingHR > 70) ? ((restingHR - 70) * 2) : 0;
  stressScore = std::min(stressScore, static_cast<uint8_t>(100));
  
  // Compute weighted bio-age
  return ComputeWeightedBioAge(chronologicalAge, hrvScore, activityScore, sleepScoreValue, stressScore);
}

void BioAgeCalculator::UpdateMetrics(const DateTime& dateTime,
                                    const BatteryController& battery,
                                    const Ble& bleController,
                                    const MotionController& motionController) {
  // Update from motion controller
  currentData.dailySteps = motionController.NbSteps();
  
  // Simulated data (replace with actual sensor integration)
  currentData.restingHeartRate = 65;  // From heart rate sensor
  currentData.heartRateVariability = 50;  // From HRV analysis
  currentData.sleepQuality = 75;  // From sleep tracking
  currentData.stressLevel = 30;  // From HRV/activity patterns
  
  // Calculate biological age
  currentData.chronologicalAge = 35;  // From user profile
  currentData.biologicalAge = CalculateBioAge(
    currentData.chronologicalAge,
    currentData.restingHeartRate,
    currentData.heartRateVariability,
    currentData.dailySteps,
    currentData.sleepQuality
  );
  
  currentData.recoveryScore = (currentData.heartRateVariability + currentData.sleepQuality) / 2;
  currentData.dataValid = true;
}

void BioAgeCalculator::Reset() {
  currentData = BioAgeData{};
}

uint8_t BioAgeCalculator::CalculateHRVScore(uint8_t hrv) {
  // Higher HRV is better (reduces bio-age)
  // HRV typically ranges from 20-100ms
  if (hrv >= 70) return 100;  // Excellent
  if (hrv >= 50) return 80;   // Good
  if (hrv >= 30) return 60;   // Average
  return 40;                  // Poor
}

uint8_t BioAgeCalculator::CalculateActivityScore(uint16_t steps) {
  // More steps = better score
  if (steps >= 10000) return 100;
  if (steps >= 7500) return 80;
  if (steps >= 5000) return 60;
  if (steps >= 2500) return 40;
  return 20;
}

uint8_t BioAgeCalculator::CalculateSleepScore(uint8_t sleepQuality) {
  // Direct mapping (already 0-100)
  return sleepQuality;
}

uint8_t BioAgeCalculator::CalculateStressScore(uint8_t stressLevel) {
  // Lower stress is better
  return 100 - std::min(stressLevel, static_cast<uint8_t>(100));
}

uint8_t BioAgeCalculator::ComputeWeightedBioAge(uint8_t chronoAge,
                                                uint8_t hrvScore,
                                                uint8_t activityScore,
                                                uint8_t sleepScore,
                                                uint8_t stressScore) {
  // Weighted average of health factors
  // HRV: 30%, Activity: 25%, Sleep: 25%, Stress: 20%
  uint16_t weightedScore = (hrvScore * 30 + 
                           activityScore * 25 + 
                           sleepScore * 25 + 
                           stressScore * 20) / 100;
  
  // Convert score to age adjustment (-10 to +10 years)
  int8_t ageAdjustment = static_cast<int8_t>((100 - weightedScore) / 5) - 10;
  
  // Apply adjustment
  int16_t bioAge = chronoAge + ageAdjustment;
  
  // Clamp to reasonable range
  bioAge = std::max(static_cast<int16_t>(18), std::min(bioAge, static_cast<int16_t>(120)));
  
  return static_cast<uint8_t>(bioAge);
}
