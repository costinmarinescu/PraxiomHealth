cmake_minimum_required(VERSION 3.10)
project(pinetime-app C CXX ASM)

# Project variables
set(NRF_PROJECT_NAME pinetime-app)
set(NRF_BOARD pca10040)

if (NOT NRF5_SDK_PATH)
    message(FATAL_ERROR "The path to the nRF5 SDK (NRF5_SDK_PATH) must be set.")
endif ()

if (DEFINED ARM_NONE_EABI_TOOLCHAIN_PATH)
    set(ARM_NONE_EABI_TOOLCHAIN_BIN_PATH ${ARM_NONE_EABI_TOOLCHAIN_PATH}/bin)
endif ()

if(NOT DEFINED TARGET_DEVICE)
    set(TARGET_DEVICE "PINETIME")
endif()

# Toolchain
include(${CMAKE_SOURCE_DIR}/cmake-nRF5x/arm-gcc-toolchain.cmake)
if (NOT DEFINED ARM_GCC_TOOLCHAIN)
    message(FATAL_ERROR "The toolchain must be set up before calling this macro")
endif ()

# OS X settings (ignored on Linux)
set(CMAKE_OSX_SYSROOT "/")
set(CMAKE_OSX_DEPLOYMENT_TARGET "")

# SDK source files
set(SDK_SOURCE_FILES
    ${NRF5_SDK_PATH}/modules/nrfx/mdk/system_nrf5.c
    ${NRF5_SDK_PATH}/modules/nrfx/mdk/gcc_startup_nrf52.S
    # ... other SDK source files ...
)

# Build nrf-sdk library
add_library(nrf-sdk STATIC ${SDK_SOURCE_FILES})
target_include_directories(nrf-sdk PUBLIC
    ${NRF5_SDK_PATH}/modules/nrfx/mdk
    ${NRF5_SDK_PATH}/modules/nrfx/drivers/include
    # ... other include dirs ...
)

# Recovery loader
add_executable(${EXECUTABLE_RECOVERY_LOADER_NAME} ${RECOVERY_LOADER_SOURCES})
if(TARGET ${EXECUTABLE_RECOVERY_MCUBOOT_NAME})
    add_dependencies(${EXECUTABLE_RECOVERY_LOADER_NAME} ${EXECUTABLE_RECOVERY_MCUBOOT_NAME})
endif()
set_target_properties(${EXECUTABLE_RECOVERY_LOADER_NAME} PROPERTIES
    SUFFIX ".out"
)

# Main firmware
add_executable(${EXECUTABLE_MAIN_NAME} ${MAIN_SOURCES})
target_link_libraries(${EXECUTABLE_MAIN_NAME}
    nrf-sdk
    # ... other libs ...
)

# Displayapp (apps only, fonts removed)
add_subdirectory(displayapp/apps)

# Definitions and custom commands
add_definitions(-DMYNEWT_VAL_BLE_HS_LOG_LVL=0)

add_custom_command(TARGET ${EXECUTABLE_MCUBOOT_RECOVERY_LOADER_NAME}
    POST_BUILD
    # ... post-build commands ...
)
