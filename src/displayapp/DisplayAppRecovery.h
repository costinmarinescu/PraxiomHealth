#pragma once

#include <FreeRTOS.h>
#include <task.h>
#include <drivers/St7789.h>
#include <drivers/SpiMaster.h>
#include <components/gfx/Gfx.h>
#include <bits/unique_ptr.h>
#include <queue.h>
#include "components/brightness/BrightnessController.h"
#include "components/motor/MotorController.h"
#include "displayapp/TouchEvents.h"
// REMOVED: Apps.h is not available in recovery mode
// #include "displayapp/apps/Apps.h"

namespace Pinetime {
  namespace System {
    class SystemTask;
  }
  namespace Controllers {
    class Ble;
    class DateTime;
    class NotificationManager;
    class HeartRateController;
    class Settings;
    class MotorController;
    class BrightnessController;
    class TouchHandler;
    class AlarmController;
    class Ble;
  }

  namespace Applications {
    class DisplayAppRecovery {
    public:
      DisplayAppRecovery(System::SystemTask* systemTask,
                        Controllers::Ble& bleController,
                        Controllers::DateTime& dateTimeController,
                        Controllers::TimerController& timerController,
                        Controllers::AlarmController& alarmController,
                        Controllers::BrightnessController& brightnessController,
                        Controllers::TouchHandler& touchHandler,
                        Controllers::MotorController& motorController);
      void Start();
      void PushMessage(Display::Messages msg);

      void Register(System::SystemTask* systemTask);

    private:
      TaskHandle_t taskHandle;
      static void Process(void* instance);
      void InitHw();
      void Refresh();
      
      System::SystemTask* systemTask = nullptr;
      Controllers::Ble& bleController;
      Controllers::DateTime& dateTimeController;
      Controllers::TimerController& timerController;
      Controllers::AlarmController& alarmController;
      Controllers::BrightnessController& brightnessController;
      Controllers::TouchHandler& touchHandler;
      Controllers::MotorController& motorController;

      Pinetime::Controllers::Lvgl lvgl;
      QueueHandle_t msgQueue;

      static constexpr uint8_t queueSize = 10;
      static constexpr uint8_t itemSize = 1;

      enum class States { Idle, Running };
      States state = States::Running;
      TickType_t lastWakeTime;

      enum class Notifications : uint8_t {
        GoToSleep,
        GoToRunning,
        UpdateDateTime,
        NewNotification,
        TimerDone,
        AlarmTriggered,
        BleConnected,
        BleDisconnected,
        TouchEvent,
        ButtonEvent
      };
      uint32_t notification = 0;
    };
  }
}
