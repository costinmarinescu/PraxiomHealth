/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

#include <cstdint>
#include <FreeRTOS.h>
#include <task.h>
#include <libraries/log/nrf_log.h>
#include <nrf_drv_clock.h>
#include <sys/time.h>
#include "systemtask/SystemTask.h"

// PATCHED: Fixed unused parameter warning
void vTaskHRV(void *pvParameters)
{
  (void)pvParameters;  // ADDED: Mark parameter as intentionally unused to suppress warning
  // Function implementation goes here
  // This task handles Heart Rate Variability monitoring
  while(1) {
    // HRV task loop
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

// Optional: If you need RTOS daemon task
void vApplicationDaemonTaskStartupHook(void)
{
  // Initialization code when daemon task starts
}

// Optional: If you need a minimal implementation
void vApplicationIdleHook(void)
{
  // Code to execute when idle
}

void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName)
{
  NRF_LOG_ERROR("Stack overflow in task %s", pcTaskName);
  APP_ERROR_HANDLER(NRF_ERROR_NO_MEM);
}

int main(void) {
  NRF_LOG_INFO("Starting InfiniTime!");
  
  // Initialize the system task
  static Pinetime::System::SystemTask systemTask;
  systemTask.Start();
  
  // Start the FreeRTOS scheduler
  vTaskStartScheduler();
  
  // Should never reach here
  for (;;) {
    APP_ERROR_HANDLER(NRF_ERROR_FORBIDDEN);
  }
}
