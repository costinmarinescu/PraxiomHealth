#include "Version.h"
#include "components/settings/Settings.h"
#include "controllers/BioAgeCalculator.h"
#include <FreeRTOS.h>
#include <task.h>

extern "C" void vApplicationStackOverflowHook(TaskHandle_t xTask __attribute__((unused)), char* pcTaskName __attribute__((unused))) {
  // Handle stack overflow
  while (true) {}
}

int main() {
  // Initialize settings
  Pinetime::Controllers::Settings settings;
  settings.Init();

  // Initialize BioAge engine
  Pinetime::Controllers::BioAgeCalculator bioAgeCalc;

  // Main loop
  while (true) {
    // Collect data & calculate bio-age
    bioAgeCalc.UpdateMetrics(/* pass controllers here */);
    auto data = bioAgeCalc.GetBioAgeData();
    // Render on watchface...
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}
