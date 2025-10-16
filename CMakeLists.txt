# Wrapper CMakeLists.txt for Docker builds
# This file forwards the build to src/CMakeLists.txt

cmake_minimum_required(VERSION 3.10)
add_subdirectory(src)

# Forward all build commands to the src directory
add_subdirectory(src)
