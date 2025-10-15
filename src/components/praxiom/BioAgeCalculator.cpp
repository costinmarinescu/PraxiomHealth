#include "components/praxiom/BioAgeCalculator.h"
#include <cmath>
#include <algorithm>

namespace Pinetime {
namespace Components {
namespace Praxiom {

// (Full implementation as provided earlier)

float OralHealthMetrics::calculateOHS() const {
  // ...
}

float SystemicHealthMetrics::calculateSHS(int tier) const {
  // ...
}

float WearableMetrics::calculateWearableScore() const {
  // ...
}

BioAgeCalculator::BioAgeCalculator() : currentTier_(1), lastBioAge_(0.0f) {}
void BioAgeCalculator::configureTier1Assessment() { currentTier_ = 1; }
void BioAgeCalculator::configureTier2Optimization() { currentTier_ = 2; }
void BioAgeCalculator::configureTier3Precision() { currentTier_ = 3; }
void BioAgeCalculator::initializeAgeStratifiedAlgorithms() {}
AgeCoefficients BioAgeCalculator::getAgeCoefficients(float age) const {
  if (age <= 35) return YOUNG_COEFFS;
  if (age <= 55) return MIDDLE_COEFFS;
  if (age <= 75) return MATURE_COEFFS;
  return SENIOR_COEFFS;
}
float BioAgeCalculator::calculateBioAge(float chronoAge,
                                       const OralHealthMetrics& oral,
                                       const SystemicHealthMetrics& systemic,
                                       const WearableMetrics& wearable) {
  float ohs = oral.calculateOHS();
  float shs = systemic.calculateSHS(currentTier_);
  float wscore = wearable.calculateWearableScore();
  auto coeffs = getAgeCoefficients(chronoAge);
  float deviation = (100 - ohs)*coeffs.alpha
                  + (100 - shs)*coeffs.beta
                  + (100 - wscore)*coeffs.gamma;
  return lastBioAge_ = chronoAge + deviation;
}
bool BioAgeCalculator::shouldUpgradeTier() const {
  if (currentTier_ == 1) return checkTier1UpgradeTriggers();
  if (currentTier_ == 2) return checkTier2UpgradeTriggers();
  return false;
}
// Placeholder trigger checks:
bool BioAgeCalculator::checkTier1UpgradeTriggers() const { return false; }
bool BioAgeCalculator::checkTier2UpgradeTriggers() const { return false; }

} // namespace Praxiom
} // namespace Components
} // namespace Pinetime
