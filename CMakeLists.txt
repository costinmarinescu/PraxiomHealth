cmake_minimum_required(VERSION 3.10)

project(PraxiomFirmware)

# Set board
set(BOARD pine_time_nrf52832)

# Set FreeRTOS directory
set(FREERTOS_DIR ${PROJECT_SOURCE_DIR}/libs/FreeRTOS)

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

add_library(freertos STATIC ${FREERTOS_SOURCES})

target_include_directories(freertos PUBLIC
  ${FREERTOS_DIR}/include
  ${FREERTOS_DIR}/portable/GCC
