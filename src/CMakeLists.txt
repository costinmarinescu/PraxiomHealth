# src/CMakeLists.txt
# Build the firmware

# Add component directories only if they contain a CMakeLists.txt
add_subdirectory(components/praxiom)
add_subdirectory(components/settings)
add_subdirectory(controllers)
add_subdirectory(displayapp)

# Link all targets together (example)
# add_executable(praxiom src/main.cpp)
# target_link_libraries(praxiom PRIVATE BioAgeController ...)
