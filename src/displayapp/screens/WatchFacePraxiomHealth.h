/**
 * @file WatchFacePraxiomHealth.h
 * @brief Praxiom Health Custom Watch Face Header
 * @author Dr. Costin Marinescu, Praxiom Health
 * @date 2025
 * @copyright Patent Pending - Praxiom Health
 */

#pragma once

#include <lvgl/lvgl.h>
#include <cstdint>
#include <memory>
#include "displayapp/screens/Screen.h"
#include "components/datetime/DateTimeController.h"
#include "components/battery/BatteryController.h"
#include "components/ble/BleController.h"
#include "components/ble/NotificationManager.h"
#include "components/heartrate/HeartRateController.h"
#include "components/motion/MotionController.h"
#include "components/settings/Settings.h"
#include "components/ble/SimpleWeatherService.h"

// Praxiom Health Bio-Age Calculator
#include "components/praxiom/BioAgeCalculator.h"

namespace Pinetime {
  namespace Applications {
    namespace Screens {

      class WatchFacePraxiomHealth : public Screen {
      public:
        WatchFacePraxiomHealth(Controllers::DateTime& dateTimeController,
                              const Controllers::Battery& batteryController,
                              const Controllers::Ble& bleController,
                              Controllers::NotificationManager& notificationManager,
                              Controllers::Settings& settingsController,
                              Controllers::HeartRateController& heartRateController,
                              Controllers::MotionController& motionController,
                              Controllers::SimpleWeatherService& weatherService);

        ~WatchFacePraxiomHealth() override;

        void Refresh() override;

        bool OnButtonPushed() override;
        bool OnTouchEvent(TouchEvents event) override;

        /**
         * @brief Update biomarkers received from mobile app via BLE
         * @param data Binary data packet containing biomarker values
         * @param length Length of data packet
         */
        void UpdateBiomarkersFromBLE(const uint8_t* data, size_t length);

      private:
        char displayedChar[5] {};

        Pinetime::Controllers::DateTime::Months currentMonth = Pinetime::Controllers::DateTime::Months::Unknown;
        Pinetime::Controllers::DateTime::Days currentDayOfWeek = Pinetime::Controllers::DateTime::Days::Unknown;
        uint8_t currentDay = 0;

        DirtyValue<uint8_t> batteryPercentRemaining {};
        DirtyValue<bool> bleState {};
        DirtyValue<std::chrono::time_point<std::chrono::system_clock, std::chrono::nanoseconds>> currentDateTime {};
        DirtyValue<uint32_t> stepCount {};
        DirtyValue<uint8_t> heartrate {};

        lv_obj_t* logoImage;
        lv_obj_t* timeLabel;
        lv_obj_t* bioAgeTitle;
        lv_obj_t* bioAgeValue;
        lv_obj_t* bioAgeDelta;
        lv_obj_t* oralHealthLabel;
        lv_obj_t* systemicHealthLabel;
        lv_obj_t* hrvLabel;
        lv_obj_t* stepsLabel;
        lv_obj_t* batteryIcon;
        lv_obj_t* bleIcon;

        Controllers::DateTime& dateTimeController;
        const Controllers::Battery& batteryController;
        const Controllers::Ble& bleController;
        Controllers::NotificationManager& notificationManager;
        Controllers::Settings& settingsController;
        Controllers::HeartRateController& heartRateController;
        Controllers::MotionController& motionController;
        Controllers::SimpleWeatherService& weatherService;

        lv_task_t* taskRefresh;

        // Praxiom Health Bio-Age System
        std::unique_ptr<Pinetime::Components::Praxiom::BioAgeCalculator> bioAgeCalculator;
        
        Pinetime::Components::Praxiom::OralHealthMetrics currentOralMetrics;
        Pinetime::Components::Praxiom::SystemicHealthMetrics currentSystemicMetrics;
        Pinetime::Components::Praxiom::WearableMetrics currentWearableData;

        /**
         * @brief Update bio-age calculation and display
         */
        void UpdateBioAge();

        /**
         * @brief Calculate estimated HRV from heart rate
         * @param heartRate Current heart rate in BPM
         * @return Estimated HRV in ms (RMSSD)
         */
        uint16_t CalculateEstimatedHRV(uint8_t heartRate);

        /**
         * @brief Show tier upgrade notification
         */
        void ShowTierUpgradeNotification();

        static void RefreshTaskCallback(lv_task_t* task) {
          static_cast<WatchFacePraxiomHealth*>(task->user_data)->Refresh();
        }
      };
    }

    template <>
    struct WatchFaceTraits<WatchFace::PraxiomHealth> {
      static constexpr WatchFace watchFace = WatchFace::PraxiomHealth;
      static constexpr const char* name = "Praxiom Health";

      static Screens::Screen* Create(AppControllers& controllers) {
        return new Screens::WatchFacePraxiomHealth(controllers.dateTimeController,
                                                   controllers.batteryController,
                                                   controllers.bleController,
                                                   controllers.notificationManager,
                                                   controllers.settingsController,
                                                   controllers.heartRateController,
                                                   controllers.motionController,
                                                   *controllers.weatherController);
      };

      static bool IsAvailable(Pinetime::Controllers::FS& /*filesystem*/) {
        return true;
      }
    };
  }
}
