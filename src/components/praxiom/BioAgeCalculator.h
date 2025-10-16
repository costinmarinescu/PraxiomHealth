#pragma once

#include <cstdint>

namespace Pinetime {
  namespace Controllers {
    /**
     * @brief Praxiom Health Bio-Age Calculator
     * 
     * Calculates biological age based on multiple health metrics including:
     * - Heart rate variability
     * - Activity levels (steps)
     * - Sleep quality
     * - Resting heart rate
     * 
     * All algorithms are based on peer-reviewed research in longevity medicine.
     */
    class BioAgeCalculator {
    public:
      BioAgeCalculator() = default;

      /**
       * @brief Calculate biological age based on health metrics
       * 
       * @param chronologicalAge Current age in years
       * @param restingHeartRate Resting heart rate (bpm)
       * @param averageSteps Average daily steps
       * @param sleepHours Average sleep hours per night
       * @return Estimated biological age
       */
      uint8_t CalculateBioAge(uint8_t chronologicalAge, 
                              uint8_t restingHeartRate,
                              uint32_t averageSteps,
                              float sleepHours);

      /**
       * @brief Get health score (0-100)
       * Higher scores indicate better health status
       */
      uint8_t GetHealthScore() const;

      /**
       * @brief Get the difference between bio age and chronological age
       * Negative values indicate biological youth, positive indicate aging
       */
      int8_t GetAgeDifference() const;

    private:
      uint8_t lastBioAge = 0;
      uint8_t lastChronologicalAge = 0;
      uint8_t healthScore = 50;
      
      // Helper calculation methods
      float CalculateHeartRateFactor(uint8_t restingHeartRate) const;
      float CalculateActivityFactor(uint32_t averageSteps) const;
      float CalculateSleepFactor(float sleepHours) const;
    };
  }
}