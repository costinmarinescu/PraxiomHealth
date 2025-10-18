#pragma once
#include <cstdint>

namespace Pinetime {
  namespace Controllers {
    class BioAgeCalculator {
    public:
      struct BioAgeData {
        uint8_t chronologicalAge;
        uint8_t biologicalAge;
        bool dataValid;
      };

      uint8_t CalculateBioAge(uint8_t chronoAge, uint8_t restingHR, uint8_t hrv, uint16_t steps, uint8_t sleepScore);
      void UpdateMetrics(/* controllers */);
      BioAgeData GetBioAgeData() const;
      void Reset();
    private:
      BioAgeData data_;
      uint8_t ComputeWeightedBioAge(uint8_t chronoAge, uint8_t hrvScore, uint8_t activityScore, uint8_t sleepScore, uint8_t stressScore);
    };
  }
}
