#include <cstdint>
#include <FreeRTOS.h>
#include <task.h>
#include <libraries/log/nrf_log.h>
#include <nrf_drv_clock.h>
#include <sys/time.h>
#include "systemtask/SystemTask.h"

// Fixed: suppress unused-parameter warning
void vTaskHRV(void *pvParameters) {
  (void)pvParameters;  // suppress unused-parameter warning
  while (true)  // Fixed: proper ASCII character
  }
}

void vApplicationDaemonTaskStartupHook(void) {}
void vApplicationIdleHook(void) {}
void vApplicationStackOverflowHook(TaskHandle_t xTask __attribute__((unused)), char *pcTaskName __attribute__((unused))) {
  NRF_LOG_ERROR("Stack overflow in task %s", pcTaskName);
  APP_ERROR_HANDLER(NRF_ERROR_NO_MEM);
}

int main(void) {
  NRF_LOG_INFO("Starting InfiniTime!");
  static Pinetime::System::SystemTask systemTask;
  systemTask.Start();
  vTaskStartScheduler();
  for (;;) { APP_ERROR_HANDLER(NRF_ERROR_FORBIDDEN); }
}
