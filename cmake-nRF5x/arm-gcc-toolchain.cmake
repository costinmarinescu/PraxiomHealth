# ARM GCC Toolchain Configuration for nRF52
# This file sets up the ARM GCC toolchain for building InfiniTime/PraxiomHealth firmware

if(NOT ARM_NONE_EABI_TOOLCHAIN_PATH)
  message(FATAL_ERROR "ARM_NONE_EABI_TOOLCHAIN_PATH must be set")
endif()

# Set toolchain paths
set(ARM_NONE_EABI_TOOLCHAIN_BIN_PATH "${ARM_NONE_EABI_TOOLCHAIN_PATH}/bin")

# Set compiler
set(CMAKE_C_COMPILER "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-gcc" CACHE INTERNAL "C Compiler")
set(CMAKE_CXX_COMPILER "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-g++" CACHE INTERNAL "C++ Compiler")
set(CMAKE_ASM_COMPILER "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-gcc" CACHE INTERNAL "ASM Compiler")

# Set utilities
set(CMAKE_AR "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-ar" CACHE INTERNAL "Archiver")
set(CMAKE_OBJCOPY "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-objcopy" CACHE INTERNAL "Objcopy")
set(CMAKE_OBJDUMP "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-objdump" CACHE INTERNAL "Objdump")
set(CMAKE_SIZE_UTIL "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-size" CACHE INTERNAL "Size utility")
set(CMAKE_RANLIB "${ARM_NONE_EABI_TOOLCHAIN_BIN_PATH}/arm-none-eabi-ranlib" CACHE INTERNAL "Ranlib")

# System processor and platform
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR ARM)

# Compiler flags
set(CMAKE_C_FLAGS_INIT "-fno-common -ffunction-sections -fdata-sections")
set(CMAKE_CXX_FLAGS_INIT "-fno-common -ffunction-sections -fdata-sections -fno-exceptions -fno-rtti")
set(CMAKE_ASM_FLAGS_INIT "-x assembler-with-cpp")

# Linker flags
set(CMAKE_EXE_LINKER_FLAGS_INIT "-Wl,--gc-sections --specs=nano.specs -lc -lnosys -lm")

# Don't look for programs in the build host's directories
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Set the toolchain as ready
set(ARM_GCC_TOOLCHAIN TRUE)