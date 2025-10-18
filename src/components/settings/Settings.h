#pragma once
#include <cstdint>

namespace Pinetime {
  namespace Controllers {
    enum class ClockType : uint8_t { H24, H12 };
    enum class WeatherFormat : uint8_t { Celsius, Fahrenheit };
    struct SettingsData {
      ClockType clockType = ClockType::H24;
      WeatherFormat weatherFormat = WeatherFormat::Celsius;
      // ...
    };

    class Settings {
    public:
      void Init();
      void SetClockType(ClockType ct) {
        if (ct != data.clockType) {
          data.clockType = ct;
        }
      }
      void SetWeatherFormat(WeatherFormat wf) {
        if (wf != data.weatherFormat) {
          data.weatherFormat = wf;
        }
      }
    private:
      SettingsData data;
    };
  }
}
