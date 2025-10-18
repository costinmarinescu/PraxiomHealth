# InfiniTime-based build script (PraxiomHealth custom)

# Load toolchain
set(CMAKE_TOOLCHAIN_FILE "${ARM_NONE_EABI_TOOLCHAIN_PATH}/arm-none-eabi-gcc.cmake" CACHE STRING "")

# Project options
option(BUILD_DFU "Build DFU package" ON)
option(BUILD_RESOURCES "Generate LVGL resources" ON)

# nRF5 SDK
set(NRF5_SDK_ROOT "${NRF5_SDK_PATH}" CACHE STRING "")

# Include InfiniTime core
add_subdirectory(InfiniTime)

# Include custom Praxiom modules
add_subdirectory(components/praxiom)
