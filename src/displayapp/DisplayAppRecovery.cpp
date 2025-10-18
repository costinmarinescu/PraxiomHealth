#include <FreeRTOS.h>
#include <task.h>
#include <drivers/St7789.h>
#include <lvgl/lvgl.h>
#include "components/settings/Settings.h"

// Minimal recovery task stub
extern "C" void StartRecoveryTask(void* pvParameters) {
  // Immediately exit recovery
  vTaskDelete(nullptr);
}
