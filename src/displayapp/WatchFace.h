#pragma once

#include <cstdint>

namespace Pinetime {
  namespace Applications {
    enum class WatchFace : uint8_t {
      Digital = 0,
      Analog = 1,
      PineTimeStyle = 2,
      Terminal = 3,
      Infineat = 4,
      Casio = 5,
      PraxiomHealth = 6  // ADD THIS LINE FOR PRAXIOM HEALTH
    };
  }
}
