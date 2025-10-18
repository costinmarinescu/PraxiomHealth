cmake_minimum_required(VERSION 3.22)
project(PraxiomHealth LANGUAGES C CXX)

# Enable C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Path to nRF5 SDK (require environment or pipeline variable)
if(NOT DEFINED NRF5_SDK_PATH)
  message(FATAL_ERROR "The path to the nRF5 SDK (NRF5_SDK_PATH) must be set.")
endif()

# Path to ARM toolchain
if(NOT DEFINED ARM_NONE_EABI_TOOLCHAIN_PATH)
  message(FATAL_ERROR "ARM_NONE_EABI_TOOLCHAIN_PATH must be set.")
endif()

# Add the source directory containing the main InfiniTime CMakeLists.txt
add_subdirectory(src)
