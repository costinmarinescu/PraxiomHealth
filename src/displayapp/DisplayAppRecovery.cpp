/*
 * This file is part of the InfiniTime distribution (https://github.com/InfiniTimeOrg/InfiniTime).
 */

#include "DisplayAppRecovery.h"
#include <FreeRTOS.h>
#include <task.h>
#include <libraries/log/nrf_log.h>
#include <nrf_font.h>
#include "displayapp/lv_pinetime_theme.h"
// REMOVED: Apps.h is not available in recovery mode
// #include "displayapp/apps/Apps.h"
#include <cstring>

using namespace Pinetime::Applications;

DisplayAppRecovery::DisplayAppRecovery(System::SystemTask* systemTask,
                                       Controllers::Ble& bleController,
                                       Controllers::DateTime& dateTimeController,
                                       Controllers::TimerController& timerController,
                                       Controllers::AlarmController& alarmController,
                                       Controllers::BrightnessController& brightnessController,
                                       Controllers::TouchHandler& touchHandler,
                                       Controllers::MotorController& motorController)
  : systemTask{systemTask},
    bleController{bleController},
    dateTimeController{dateTimeController},
    timerController{timerController},
    alarmController{alarmController},
    brightnessController{brightnessController},
    touchHandler{touchHandler},
    motorController{motorController} {
}

void DisplayAppRecovery::Start() {
  if (pdPASS != xTaskCreate(Process, "displayapp", 512, this, 0, &taskHandle)) {
    APP_ERROR_HANDLER(NRF_ERROR_NO_MEM);
  }
}

void DisplayAppRecovery::Process(void* instance) {
  auto* app = static_cast<DisplayAppRecovery*>(instance);
  app->InitHw();
  NRF_LOG_INFO("displayapp task started!");
  xTaskNotifyGive(xTaskGetCurrentTaskHandle());
  while (true) {
    app->Refresh();
  }
}

void DisplayAppRecovery::InitHw() {
  brightnessController.Init();
}

void DisplayAppRecovery::Refresh() {
  // ... unchanged refresh implementation ...
}
