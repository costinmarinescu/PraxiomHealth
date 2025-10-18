#include "BioAgeCalculator.h"
#include <algorithm>

using namespace Pinetime::Controllers;

uint8_t BioAgeCalculator::CalculateBioAge(uint8_t chronoAge,
                                          uint8_t restingHR,
                                          uint8_t hrv,
                                          uint16_t steps,
                                          uint8_t sleepScore) {
  // Simplified placeholder algorithm
  return chronoAge;
}

void BioAgeCalculator::UpdateMetrics() {
  // Collect sensor data, compute bio-age
  data_.chronologicalAge = 30;
  data_.biologicalAge = CalculateBioAge(data_.chronologicalAge, 65, 50, 5000, 75);
  data_.dataValid = true;
}

BioAgeCalculator::BioAgeData BioAgeCalculator::GetBioAgeData() const {
  return data_;
}

void BioAgeCalculator::Reset() {
  data_ = {};
}

uint8_t BioAgeCalculator::ComputeWeightedBioAge(uint8_t chronoAge,
                                                uint8_t hrvScore,
                                                uint8_t activityScore,
                                                uint8_t sleepScore,
                                                uint8_t stressScore) {
  // Implementation omitted
  return chronoAge;
}
