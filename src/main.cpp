#include <FreeRTOS.h>
#include <task.h>

void vTaskHRV(void *pvParameters) {
    while (1) {
        (void)pvParameters;
        // Placeholder for HRV data collection (e.g., using HRS3300 sensor)
        vTaskDelay(pdMS_TO_TICKS(1000)); // Simulate 1-second interval
    }
}

int main(void) {
    xTaskCreate(vTaskHRV, "HRVTask", configMINIMAL_STACK_SIZE, NULL, 1, NULL);
    vTaskStartScheduler();
    while (1); // Should never reach here
    return 0;
}
