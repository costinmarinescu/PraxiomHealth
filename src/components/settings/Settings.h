#pragma once
#include <cstdint>

namespace Pinetime {
  namespace Controllers {
    enum class ClockType : uint8_t { H24, H12 };
    struct SettingsData {
      ClockType clockType = ClockType::H24;
      // Additional fields...
    };

    class Settings {
    public:
      void Init();
      void SetClockType(ClockType ct) {
        if (ct != data.clockType) {
          data.clockType = ct;
        }
      }
    private:
      SettingsData data;
    };
  }
}
