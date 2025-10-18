#include <FreeRTOS.h>
#include <task.h>
#include <drivers/St7789.h>
#include <lvgl/lvgl.h>
#include "components/settings/Settings.h"

// Empty recovery implementation
void StartRecoveryTask() {
  vTaskDelete(nullptr);
}
