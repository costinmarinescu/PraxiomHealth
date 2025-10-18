#pragma once

#include <cstdint>
#include "components/datetime/DateTimeController.h"
#include "components/brightness/BrightnessController.h"
// REMOVED for recovery mode: Apps.h is not available
#ifndef PINETIME_IS_RECOVERY
// #include "displayapp/apps/Apps.h"
#endif

namespace Pinetime {
  namespace Controllers {
    class Settings {
    public:
      enum class ClockType : uint8_t { H24, H12 };
      enum class Notification : uint8_t { On, Off, Sleep };
      enum class ChimesOption : uint8_t { None, Hours, HalfHours };
      enum class WakeUpMode : uint8_t {
        None,
        SingleTap,
        DoubleTap,
        RaiseWrist,
        Shake,
        LowerWrist
      };

      Settings() = default;

      void Init();
      void SaveSettings();

      void SetClockFace(uint8_t face) {
        if (face != settings.clockFace) {
          settings.clockFace = face;
          settingsChanged = true;
        }
      }

      uint8_t GetClockFace() const {
        return settings.clockFace;
      }

      void SetAppMenu(uint8_t menu) {
        if (menu != settings.appMenu) {
          settings.appMenu = menu;
          settingsChanged = true;
        }
      }

      uint8_t GetAppMenu() const {
        return settings.appMenu;
      }

      void SetSettingsMenu(uint8_t menu) {
        if (menu != settings.settingsMenu) {
          settings.settingsMenu = menu;
          settingsChanged = true;
        }
      }

      uint8_t GetSettingsMenu() const {
        return settings.settingsMenu;
      }

      void SetClockType(ClockType clocktype) {
        if (clocktype != settings.clockType) {
          settings.clockType = clocktype;
          settingsChanged = true;
        }
      }

      ClockType GetClockType() const {
        return settings.clockType;
      }

      void SetNotificationStatus(Notification status) {
        if (status != settings.notificationStatus) {
          settings.notificationStatus = status;
          settingsChanged = true;
        }
      }

      Notification GetNotificationStatus() const {
        return settings.notificationStatus;
      }

      void SetChimeOption(ChimesOption chimeOption) {
        if (chimeOption != settings.chimesOption) {
          settings.chimesOption = chimeOption;
          settingsChanged = true;
        }
      }

      ChimesOption GetChimeOption() const {
        return settings.chimesOption;
      }

      void SetPTSColorTime(uint32_t colorTime) {
        if (colorTime != settings.PTS.ColorTime) {
          settings.PTS.ColorTime = colorTime;
          settingsChanged = true;
        }
      }

      uint32_t GetPTSColorTime() const {
        return settings.PTS.ColorTime;
      }

      void SetPTSColorBar(uint32_t colorBar) {
        if (colorBar != settings.PTS.ColorBar) {
          settings.PTS.ColorBar = colorBar;
          settingsChanged = true;
        }
      }

      uint32_t GetPTSColorBar() const {
        return settings.PTS.ColorBar;
      }

      void SetPTSColorBG(uint32_t colorBG) {
        if (colorBG != settings.PTS.ColorBG) {
          settings.PTS.ColorBG = colorBG;
          settingsChanged = true;
        }
      }

      uint32_t GetPTSColorBG() const {
        return settings.PTS.ColorBG;
      }

      void SetPTSGaugeStyle(uint8_t gaugeStyle) {
        if (gaugeStyle != settings.PTS.gaugeStyle) {
          settings.PTS.gaugeStyle = static_cast<GaugeStyle>(gaugeStyle);
          settingsChanged = true;
        }
      }

      uint8_t GetPTSGaugeStyle() const {
        return static_cast<uint8_t>(settings.PTS.gaugeStyle);
      }

      void SetPTSWeather(uint8_t weatherFormat) {
        if (weatherFormat != settings.PTS.weatherFormat) {
          settings.PTS.weatherFormat = static_cast<WeatherFormat>(weatherFormat);
          settingsChanged = true;
        }
      }

      uint8_t GetPTSWeather() const {
        return static_cast<uint8_t>(settings.PTS.weatherFormat);
      }

      void SetWatchfaceInfineat(uint8_t face, uint8_t colorIndex) {
        if (face < 4) {
          settings.watchFaceInfineat[face] = colorIndex;
          settingsChanged = true;
        }
      }

      uint8_t GetWatchfaceInfineat(uint8_t face) const {
        return face < 4 ? settings.watchFaceInfineat[face] : 0;
      }

      void SetStepsGoal(uint32_t goal) {
        if (goal != settings.stepsGoal) {
          settings.stepsGoal = goal;
          settingsChanged = true;
        }
      }

      uint32_t GetStepsGoal() const {
        return settings.stepsGoal;
      }

      void SetScreenTimeOut(uint32_t timeout) {
        if (timeout != settings.screenTimeOut) {
          settings.screenTimeOut = timeout;
          settingsChanged = true;
        }
      }

      uint32_t GetScreenTimeOut() const {
        return settings.screenTimeOut;
      }

      void SetWakeUpMode(WakeUpMode wakeUp, bool enabled) {
        if (enabled != isWakeUpModeOn(wakeUp)) {
          uint8_t bit = static_cast<uint8_t>(wakeUp);
          if (enabled) {
            settings.wakeUpMode |= (1 << bit);
          } else {
            settings.wakeUpMode &= ~(1 << bit);
          }
          settingsChanged = true;
        }
      }

      WakeUpMode GetWakeUpMode() const {
        for (uint8_t i = 0; i < 6; i++) {
          if ((settings.wakeUpMode & (1 << i)) != 0) {
            return static_cast<WakeUpMode>(i);
          }
        }
        return WakeUpMode::None;
      }

      bool isWakeUpModeOn(WakeUpMode mode) const {
        uint8_t bit = static_cast<uint8_t>(mode);
        return (settings.wakeUpMode & (1 << bit)) != 0;
      }

      void SetBrightness(Controllers::BrightnessController::Levels level) {
        if (level != settings.brightLevel) {
          settings.brightLevel = level;
          settingsChanged = true;
        }
      }

      Controllers::BrightnessController::Levels GetBrightness() const {
        return settings.brightLevel;
      }

      void SetStepsPerMM(uint16_t stepsPerMM) {
        if (stepsPerMM != settings.stepsPerMM) {
          settings.stepsPerMM = stepsPerMM;
          settingsChanged = true;
        }
      }

      uint16_t GetStepsPerMM() const {
        return settings.stepsPerMM;
      }

      void SetAlwaysOnDisplay(bool state) {
        if (state != settings.alwaysOnDisplay) {
          settings.alwaysOnDisplay = state;
          settingsChanged = true;
        }
      }

      bool GetAlwaysOnDisplay() const {
        return settings.alwaysOnDisplay;
      }

      void SetWeatherFormat(uint8_t format) {
        if (format != settings.PTS.weatherFormat) {
          settings.PTS.weatherFormat = static_cast<WeatherFormat>(format);
          settingsChanged = true;
        }
      }

      uint8_t GetWeatherFormat() const {
        return static_cast<uint8_t>(settings.PTS.weatherFormat);
      }

    private:
      enum class GaugeStyle : uint8_t { Full, Half, Numeric };
      enum class WeatherFormat : uint8_t { Celsius, Fahrenheit };

      struct {
        uint32_t version = 4;
        uint32_t stepsGoal = 10000;
        uint32_t screenTimeOut = 15000;

        ClockType clockType = ClockType::H24;
        Notification notificationStatus = Notification::On;
        ChimesOption chimesOption = ChimesOption::None;

        uint8_t clockFace = 0;
        uint8_t appMenu = 0;
        uint8_t settingsMenu = 0;

        uint8_t watchFaceInfineat[4] = {0, 0, 0, 0};

        struct {
          uint32_t ColorTime = 0xFFFFFF;
          uint32_t ColorBar = 0x0000FF;
          uint32_t ColorBG = 0x000000;
          GaugeStyle gaugeStyle = GaugeStyle::Full;
          WeatherFormat weatherFormat = WeatherFormat::Celsius;
        } PTS;

        uint8_t wakeUpMode = 0;
        uint16_t stepsPerMM = 110;
        Controllers::BrightnessController::Levels brightLevel = Controllers::BrightnessController::Levels::Medium;
        bool alwaysOnDisplay = false;
      } settings;

      bool settingsChanged = false;

      void LoadSettingsFromFlash();
      void SaveSettingsToFlash();
    };
  }
}
