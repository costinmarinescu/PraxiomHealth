#pragma once

#include <cstdint>
#include <lvgl/lvgl.h>
#include "components/settings/Settings.h"
#include "displayapp/screens/Screen.h"
#include "components/fs/FS.h"

namespace Pinetime {
  namespace Applications {
    namespace Screens {
      class SettingWatchFace : public Screen {
      public:
        SettingWatchFace(DisplayApp* app,
                        Pinetime::Controllers::Settings& settingsController,
                        Pinetime::Controllers::FS& filesystem);
        ~SettingWatchFace() override;

        void Refresh() override {}

      private:
        DisplayApp* app;
        Pinetime::Controllers::Settings& settingsController;
        Pinetime::Controllers::FS& filesystem;

        static constexpr std::size_t nScreens = 7;  // CHANGE FROM 6 TO 7

        lv_obj_t* cbOption[nScreens];  // CHANGE ARRAY SIZE
        uint32_t currentIndex;

        static void event_handler(lv_obj_t* obj, lv_event_t event);
      };
    }
  }
}
