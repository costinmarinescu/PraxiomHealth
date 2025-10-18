#include "BioAgeCalculator.h"
#include <algorithm>

using namespace Pinetime::Controllers;

uint8_t BioAgeCalculator::CalculateBioAge(uint8_t chronoAge, uint8_t restingHR, uint8_t hrv, uint16_t steps, uint8_t sleepScore) {
  // Implement scoring...
  return chronoAge;
}

void BioAgeCalculator::UpdateMetrics() {
  // Update data_...
  data_.dataValid = true;
}

BioAgeCalculator::BioAgeData BioAgeCalculator::GetBioAgeData() const {
  return data_;
}

void BioAgeCalculator::Reset() {
  data_ = {};
}
