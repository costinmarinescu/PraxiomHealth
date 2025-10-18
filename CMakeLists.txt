cmake_minimum_required(VERSION 3.22)
project(PraxiomHealth LANGUAGES C CXX)

# Enable C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Include the src directory
add_subdirectory(src)
