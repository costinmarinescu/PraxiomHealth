cmake_minimum_required(VERSION 3.10)

project(PraxiomFirmware)

# Set board
set(BOARD pine_time_nrf52832)

# Set FreeRTOS directory (using submodule)
set(FREERTOS_DIR ${PROJECT_SOURCE_DIR}/src/libs/FreeRTOS)

# Check if FreeRTOS directory exists
if(NOT EXISTS ${FREERTOS_DIR})
    message(FATAL_ERROR "FreeRTOS directory not found at ${FREERTOS_DIR}. Ensure submodule is initialized.")
endif()

# FreeRTOS sources
set(FREERTOS_SOURCES
    ${FREERTOS_DIR}/croutine.c
    ${FREERTOS_DIR}/event_groups.c
    ${FREERTOS_DIR}/list.c
    ${FREERTOS_DIR}/queue.c
    ${FREERTOS_DIR}/stream_buffer.c
    ${FREERTOS_DIR}/tasks.c
    ${FREERTOS_DIR}/timers.c
    ${FREERTOS_DIR}/portable/MemMang/heap_4.c
    ${FREERTOS_DIR}/portable/GCC/ARM_CM4F/port.c
)

# Add FreeRTOS library
add_library(freertos STATIC ${FREERTOS_SOURCES})

# Include directories for FreeRTOS
target_include_directories(freertos PUBLIC
    "${FREERTOS_DIR}/include"
    "${FREERTOS_DIR}/portable/GCC/ARM_CM4F"
)

# Add main executable
add_executable(praxiom src/main.cpp)
target_link_libraries(praxiom freertos)

# Board-specific settings
if(NOT BOARD MATCHES "nrf52")
    message(FATAL_ERROR "Only nRF52 boards are supported right now")
endif()

# nRF5 SDK path check
if(NOT NRF5_SDK_PATH)
    message(FATAL_ERROR "The path to the nRF5 SDK (NRF5_SDK_PATH) must be set.")
endif()

# Include nRF5 SDK headers
target_include_directories(praxiom PRIVATE ${NRF5_SDK_PATH}/components/boards)
