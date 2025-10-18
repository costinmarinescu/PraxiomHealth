#pragma once

#include <FreeRTOS.h>
#include <task.h>
#include <drivers/St7789.h>
#include <drivers/SpiMaster.h>
#include <Components.h>
// REMOVED: #include "components/gfx/Gfx.h" - No longer exists in InfiniTime 1.13+
#include <lvgl/lvgl.h>

namespace Pinetime {
  namespace Drivers {
    class Cst816S;
    class WatchdogView;
  }
  namespace Controllers {
    class Battery;
    class Ble;
    class DateTime;
    class NotificationManager;
    class HeartRateController;
    class Settings;
    class MotionController;
    class TouchHandler;
  }

  namespace System {
    class SystemTask;
  };
  namespace Applications {
    class DisplayApp {
    public:
      DisplayApp(Drivers::St7789& lcd,
                 Components::LittleVgl& lvgl,
                 Drivers::Cst816S& touchPanel,
                 Controllers::Battery& batteryController,
                 Controllers::Ble& bleController,
                 Controllers::DateTime& dateTimeController,
                 Drivers::WatchdogView& watchdog,
                 Pinetime::Controllers::NotificationManager& notificationManager,
                 Pinetime::Controllers::HeartRateController& heartRateController,
                 Controllers::Settings& settingsController,
                 Pinetime::Controllers::MotionController& motionController,
                 Pinetime::Controllers::TouchHandler& touchHandler);
      void Start(System::SystemTask* systemTask);
      void PushMessage(Display::Messages msg);

      void Register(Pinetime::System::SystemTask* systemTask);
      void Stop();

    private:
      Pinetime::Drivers::St7789& lcd;
      Components::LittleVgl& lvgl;
      Pinetime::Drivers::Cst816S& touchPanel;
      Pinetime::Controllers::Battery& batteryController;
      Pinetime::Controllers::Ble& bleController;
      Pinetime::Controllers::DateTime& dateTimeController;
      Pinetime::Drivers::WatchdogView& watchdog;
      Pinetime::Controllers::NotificationManager& notificationManager;
      Pinetime::Controllers::HeartRateController& heartRateController;
      Pinetime::Controllers::Settings& settingsController;
      Pinetime::Controllers::MotionController& motionController;
      Pinetime::Controllers::TouchHandler& touchHandler;
      Pinetime::System::SystemTask* systemTask = nullptr;
      TaskHandle_t taskHandle;

      static void Process(void* instance);
      void DisplayLogo(uint16_t color);
      void DisplayOtaProgress(uint8_t percent, uint16_t color);
      void InitHw();
      void Refresh();
      void ReturnApp(Apps app, DisplayApp::FullRefreshDirections direction, TouchEvents touchEvent);
      void LoadApp(Apps app, DisplayApp::FullRefreshDirections direction);

      Controllers::TouchHandler::Gestures OnTouchEvent();
      void RunningState();
      void IdleState();
      void PushMessageToSystemTask(Pinetime::System::Messages message);

      static constexpr uint8_t queueSize = 10;
      static constexpr uint8_t itemSize = 1;
      QueueHandle_t msgQueue;

      lv_point_t touchPoint;
    };
  }
}
