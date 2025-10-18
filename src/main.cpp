#include "Version.h"
#include "components/settings/Settings.h"
#include "controllers/BioAgeCalculator.h"
#include <FreeRTOS.h>
#include <task.h>

extern "C" void vApplicationStackOverflowHook(TaskHandle_t xTask __attribute__((unused)), char* pcTaskName __attribute__((unused))) {
  while (true) {}  // Endless loop on stack overflow
}

int main() {
  // Initialize settings and BioAge engine
  Pinetime::Controllers::Settings settings;
  settings.Init();
  Pinetime::Controllers::BioAgeCalculator bioAgeCalc;

  // Main application loop
  for (;;) {
    bioAgeCalc.UpdateMetrics(/* pass controllers here */);
    auto data = bioAgeCalc.GetBioAgeData();
    // TODO: Render data on your watchface
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}
