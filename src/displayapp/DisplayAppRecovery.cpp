/*
 * This file is part of the InfiniTime distribution (https://github.com/InfiniTimeOrg/InfiniTime).
 * Copyright (c) 2020 JF002
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
 
#include "DisplayAppRecovery.h"
#include <FreeRTOS.h>
#include <task.h>
#include <libraries/log/nrf_log.h>
#include <nrf_font.h>
#include "displayapp/lv_pinetime_theme.h"
// NOTE: Removed problematic include - not needed for recovery mode
// #include "displayapp/apps/Apps.h"  // REMOVED - This header is not available in recovery mode
#include <cstring>

using namespace Pinetime::Applications;

DisplayAppRecovery::DisplayAppRecovery(Pinetime::System::SystemTask* systemTask,
                                       Pinetime::Controllers::Ble& bleController,
                                       Pinetime::Controllers::DateTime& dateTimeController,
                                       Pinetime::Controllers::TimerController& timerController,
                                       Pinetime::Controllers::AlarmController& alarmController,
                                       Pinetime::Controllers::BrightnessController& brightnessController,
                                       Pinetime::Controllers::TouchHandler& touchHandler,
                                       Pinetime::Controllers::MotorController& motorController)
  : systemTask {systemTask},
    bleController {bleController},
    dateTimeController {dateTimeController},
    timerController {timerController},
    alarmController {alarmController},
    brightnessController {brightnessController},
    touchHandler {touchHandler},
    motorController {motorController} {
}

void DisplayAppRecovery::Start() {
  if (pdPASS != xTaskCreate(DisplayAppRecovery::Process, "displayapp", 512, this, 0, &taskHandle)) {
    APP_ERROR_HANDLER(NRF_ERROR_NO_MEM);
  }
}

void DisplayAppRecovery::Process(void* instance) {
  auto* app = static_cast<DisplayAppRecovery*>(instance);
  app->InitHw();
  NRF_LOG_INFO("displayapp task started!");

  // Send a dummy notification to unlock the lvgl display driver for the first iteration
  xTaskNotifyGive(xTaskGetCurrentTaskHandle());

  while (true) {
    app->Refresh();
  }
}

void DisplayAppRecovery::InitHw() {
  brightnessController.Init();
}

uint32_t count = 0;
bool toggle = true;
void DisplayAppRecovery::Refresh() {
  TickType_t queueTimeout;
  TickType_t delta;
  switch (state) {
    case States::Idle:
      delta = 0;
      queueTimeout = portMAX_DELAY;
      break;
    case States::Running:
      delta = xTaskGetTickCount() - lastWakeTime;
      if (delta > 1) {
        delta = 1;
      }
      queueTimeout = 1 - delta;
      break;
    default:
      queueTimeout = portMAX_DELAY;
      break;
  }

  BaseType_t xHigherPriorityTaskWoken = pdFALSE;
  xTaskNotifyWait(0, ULONG_MAX, &notification, queueTimeout);
  if (xHigherPriorityTaskWoken == pdTRUE) {
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
  }

  if (notification) {
    if (notification & Notifications::GoToSleep) {
      notification &= ~Notifications::GoToSleep;
      state = States::Idle;
      PushMessage(Pinetime::Applications::Display::Messages::GoToSleep);
    }
    if (notification & Notifications::GoToRunning) {
      notification &= ~Notifications::GoToRunning;
      state = States::Running;
      PushMessage(Pinetime::Applications::Display::Messages::GoToRunning);
    }
    if (notification & Notifications::UpdateDateTime) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::NewNotification) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::TimerDone) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::AlarmTriggered) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::BleConnected) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::BleDisconnected) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::TouchEvent) {
      // Added empty implementation - not critical for recovery mode
    }
    if (notification & Notifications::ButtonEvent) {
      // Added empty implementation - not critical for recovery mode
    }
  }

  if (state != States::Idle) {
    lvgl.FlushDisplay();
  }

  if (state == States::Running) {
    lastWakeTime = xTaskGetTickCount();
  }
}

void DisplayAppRecovery::PushMessage(Pinetime::Applications::Display::Messages msg) {
  BaseType_t xHigherPriorityTaskWoken = pdFALSE;
  xQueueSendFromISR(msgQueue, &msg, &xHigherPriorityTaskWoken);
  if (xHigherPriorityTaskWoken == pdTRUE) {
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
  }
}

void DisplayAppRecovery::Register(Pinetime::System::SystemTask* systemTask) {
  this->systemTask = systemTask;
}
