cmake_minimum_required(VERSION 3.22)
project(PraxiomHealth LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Add your source directories
add_subdirectory(components)
add_subdirectory(controllers)
add_subdirectory(displayapp)

# Link BioAge module
# ...
