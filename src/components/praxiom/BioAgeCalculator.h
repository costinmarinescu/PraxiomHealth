#pragma once

#include <cstdint>
#include <array>
#include "components/settings/Settings.h"
#include "components/datetime/DateTimeController.h"
#include "components/battery/BatteryController.h"
#include "components/ble/BleController.h"
#include "components/ble/weather/WeatherService.h"
#include "components/motion/MotionController.h"

namespace Pinetime {
  namespace Controllers {
    class BioAgeCalculator {
    public:
      BioAgeCalculator() = default;

      struct BioAgeData {
        uint8_t chronologicalAge;
        uint8_t biologicalAge;
        uint8_t heartRateVariability;
        uint8_t restingHeartRate;
        uint16_t dailySteps;
        uint8_t sleepQuality;
        uint8_t stressLevel;
        uint8_t recoveryScore;
        bool dataValid;
      };

      // Calculate biological age based on health metrics
      uint8_t CalculateBioAge(uint8_t chronologicalAge,
                              uint8_t restingHR,
                              uint8_t hrv,
                              uint16_t steps,
                              uint8_t sleepScore);

      // Update with new sensor data
      void UpdateMetrics(const DateTime& dateTime,
                        const BatteryController& battery,
                        const Ble& bleController,
                        const MotionController& motionController);

      // Get current bio-age data
      BioAgeData GetBioAgeData() const { return currentData; }

      // Check if data is valid
      bool IsDataValid() const { return currentData.dataValid; }

      // Reset calculations
      void Reset();

    private:
      BioAgeData currentData{};
      
      // Calculate individual factor scores
      uint8_t CalculateHRVScore(uint8_t hrv);
      uint8_t CalculateActivityScore(uint16_t steps);
      uint8_t CalculateSleepScore(uint8_t sleepQuality);
      uint8_t CalculateStressScore(uint8_t stressLevel);
      
      // Weighted bio-age calculation
      uint8_t ComputeWeightedBioAge(uint8_t chronoAge,
                                    uint8_t hrvScore,
                                    uint8_t activityScore,
                                    uint8_t sleepScore,
                                    uint8_t stressScore);
    };
  }
}
