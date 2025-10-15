/**
 * @file WatchFacePraxiomHealth.cpp
 * @brief Praxiom Health Custom Watch Face with Bio-Age Display
 * @author Dr. Costin Marinescu, Praxiom Health
 * @date 2025
 * @copyright Patent Pending - Praxiom Health
 * 
 * Custom watch face displaying real-time biological age calculated from:
 * - Oral health biomarkers (from mobile app)
 * - Systemic health biomarkers (from mobile app)
 * - Real-time wearable data (HRV, sleep, activity)
 * 
 * PATENT ALGORITHMS:
 * - Oral-Systemic Integration Protocol
 * - Age-Stratified Weighting
 * - Real-Time Bio-Age Calculation
 */

#include "displayapp/screens/WatchFacePraxiomHealth.h"
#include <lvgl/lvgl.h>
#include <cstdio>
#include <cmath>
#include "displayapp/DisplayApp.h"
#include "components/battery/BatteryController.h"
#include "components/ble/BleController.h"
#include "components/ble/NotificationManager.h"
#include "components/heartrate/HeartRateController.h"
#include "components/motion/MotionController.h"
#include "components/settings/Settings.h"

// Praxiom Health Bio-Age Calculator
#include "components/praxiom/BioAgeCalculator.h"

// Praxiom logo data (converted from your praxiom_logo.c)
LV_IMG_DECLARE(praxiom_logo);

using namespace Pinetime::Applications::Screens;

namespace {
  // Color scheme for Praxiom Health
  constexpr lv_color_t PRAXIOM_PRIMARY = LV_COLOR_MAKE(0x00, 0x7A, 0xFF);  // Blue
  constexpr lv_color_t PRAXIOM_SECONDARY = LV_COLOR_MAKE(0x00, 0xD4, 0xAA); // Teal
  constexpr lv_color_t PRAXIOM_WARNING = LV_COLOR_MAKE(0xFF, 0x8C, 0x00);   // Orange
  constexpr lv_color_t PRAXIOM_DANGER = LV_COLOR_MAKE(0xFF, 0x44, 0x44);    // Red
  constexpr lv_color_t PRAXIOM_SUCCESS = LV_COLOR_MAKE(0x28, 0xC8, 0x76);   // Green
}

WatchFacePraxiomHealth::WatchFacePraxiomHealth(Controllers::DateTime& dateTimeController,
                                               const Controllers::Battery& batteryController,
                                               const Controllers::Ble& bleController,
                                               Controllers::NotificationManager& notificationManager,
                                               Controllers::Settings& settingsController,
                                               Controllers::HeartRateController& heartRateController,
                                               Controllers::MotionController& motionController,
                                               Controllers::SimpleWeatherService& weatherService)
  : currentDateTime {{}},
    dateTimeController {dateTimeController},
    batteryController {batteryController},
    bleController {bleController},
    notificationManager {notificationManager},
    settingsController {settingsController},
    heartRateController {heartRateController},
    motionController {motionController},
    weatherService {weatherService},
    bioAgeCalculator(new Pinetime::Components::Praxiom::BioAgeCalculator()) {

  // Create main screen container
  lv_obj_t* container = lv_obj_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_bg_color(container, LV_OBJ_PART_MAIN, LV_STATE_DEFAULT, lv_color_hex(0x000000));
  lv_obj_set_style_local_pad_all(container, LV_OBJ_PART_MAIN, LV_STATE_DEFAULT, 0);
  lv_obj_set_style_local_border_width(container, LV_OBJ_PART_MAIN, LV_STATE_DEFAULT, 0);
  lv_obj_set_size(container, LV_HOR_RES, LV_VER_RES);
  lv_obj_align(container, nullptr, LV_ALIGN_CENTER, 0, 0);

  // =============================================================================
  // PRAXIOM HEALTH LOGO (Top Center)
  // =============================================================================
  logoImage = lv_img_create(lv_scr_act(), nullptr);
  lv_img_set_src(logoImage, &praxiom_logo);
  lv_obj_align(logoImage, nullptr, LV_ALIGN_IN_TOP_MID, 0, 10);

  // =============================================================================
  // TIME DISPLAY (Large, Center-Top)
  // =============================================================================
  timeLabel = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(timeLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_bold_20);
  lv_obj_set_style_local_text_color(timeLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, LV_COLOR_WHITE);
  lv_label_set_text_static(timeLabel, "00:00");
  lv_obj_align(timeLabel, logoImage, LV_ALIGN_OUT_BOTTOM_MID, 0, 15);

  // =============================================================================
  // BIO-AGE DISPLAY (Main Feature - Large and Prominent)
  // =============================================================================
  
  // Bio-Age Title
  bioAgeTitle = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(bioAgeTitle, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_obj_set_style_local_text_color(bioAgeTitle, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SECONDARY);
  lv_label_set_text_static(bioAgeTitle, "BIO-AGE");
  lv_obj_align(bioAgeTitle, timeLabel, LV_ALIGN_OUT_BOTTOM_MID, 0, 20);

  // Bio-Age Value (LARGE)
  bioAgeValue = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(bioAgeValue, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_bold_20);
  lv_obj_set_style_local_text_color(bioAgeValue, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_PRIMARY);
  lv_label_set_text_static(bioAgeValue, "-- years");
  lv_obj_align(bioAgeValue, bioAgeTitle, LV_ALIGN_OUT_BOTTOM_MID, 0, 5);

  // Bio-Age Delta (vs Chronological Age)
  bioAgeDelta = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(bioAgeDelta, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_obj_set_style_local_text_color(bioAgeDelta, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SUCCESS);
  lv_label_set_text_static(bioAgeDelta, "Calculating...");
  lv_obj_align(bioAgeDelta, bioAgeValue, LV_ALIGN_OUT_BOTTOM_MID, 0, 5);

  // =============================================================================
  // BIOMARKER STATUS INDICATORS (Bottom Section)
  // =============================================================================
  
  // Oral Health Score
  oralHealthLabel = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(oralHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_obj_set_style_local_text_color(oralHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, LV_COLOR_WHITE);
  lv_label_set_text_static(oralHealthLabel, "OHS: --");
  lv_obj_align(oralHealthLabel, nullptr, LV_ALIGN_IN_BOTTOM_LEFT, 10, -40);

  // Systemic Health Score
  systemicHealthLabel = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(systemicHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_obj_set_style_local_text_color(systemicHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, LV_COLOR_WHITE);
  lv_label_set_text_static(systemicHealthLabel, "SHS: --");
  lv_obj_align(systemicHealthLabel, nullptr, LV_ALIGN_IN_BOTTOM_RIGHT, -10, -40);

  // =============================================================================
  // WEARABLE DATA INDICATORS (Bottom Row)
  // =============================================================================
  
  // Heart Rate Variability (HRV)
  hrvLabel = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(hrvLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_obj_set_style_local_text_color(hrvLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SECONDARY);
  lv_label_set_text_static(hrvLabel, "HRV: --");
  lv_obj_align(hrvLabel, nullptr, LV_ALIGN_IN_BOTTOM_LEFT, 10, -20);

  // Steps Counter
  stepsLabel = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(stepsLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_obj_set_style_local_text_color(stepsLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SECONDARY);
  lv_label_set_text_static(stepsLabel, "Steps: --");
  lv_obj_align(stepsLabel, nullptr, LV_ALIGN_IN_BOTTOM_RIGHT, -10, -20);

  // =============================================================================
  // STATUS ICONS (Top Right)
  // =============================================================================
  
  // Battery indicator
  batteryIcon = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(batteryIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_label_set_text_static(batteryIcon, Symbols::batteryFull);
  lv_obj_align(batteryIcon, nullptr, LV_ALIGN_IN_TOP_RIGHT, -5, 5);

  // Bluetooth indicator
  bleIcon = lv_label_create(lv_scr_act(), nullptr);
  lv_obj_set_style_local_text_font(bleIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, &jetbrains_mono_12);
  lv_label_set_text_static(bleIcon, "");
  lv_obj_align(bleIcon, batteryIcon, LV_ALIGN_OUT_LEFT_MID, -5, 0);

  // Initialize bio-age calculator with default tier
  bioAgeCalculator->configureTier1Assessment();
  bioAgeCalculator->initializeAgeStratifiedAlgorithms();

  // Start update task
  taskRefresh = lv_task_create(RefreshTaskCallback, LV_DISP_DEF_REFR_PERIOD, LV_TASK_PRIO_MID, this);
  Refresh();
}

WatchFacePraxiomHealth::~WatchFacePraxiomHealth() {
  lv_task_del(taskRefresh);
  lv_obj_clean(lv_scr_act());
  delete bioAgeCalculator;
}

void WatchFacePraxiomHealth::Refresh() {
  // =============================================================================
  // UPDATE TIME
  // =============================================================================
  currentDateTime = std::chrono::time_point_cast<std::chrono::minutes>(dateTimeController.CurrentDateTime());

  if (currentDateTime.IsUpdated(dateTimeMinutes)) {
    uint8_t hour = dateTimeController.Hours();
    uint8_t minute = dateTimeController.Minutes();

    if (settingsController.GetClockType() == Controllers::Settings::ClockType::H12) {
      char ampmChar[3] = "AM";
      if (hour == 0) {
        hour = 12;
      } else if (hour == 12) {
        ampmChar[0] = 'P';
      } else if (hour > 12) {
        hour = hour - 12;
        ampmChar[0] = 'P';
      }
      lv_label_set_text_fmt(timeLabel, "%2d:%02d %s", hour, minute, ampmChar);
    } else {
      lv_label_set_text_fmt(timeLabel, "%02d:%02d", hour, minute);
    }
  }

  // =============================================================================
  // UPDATE BIO-AGE CALCULATION (Every minute)
  // =============================================================================
  if (currentDateTime.IsUpdated(dateTimeMinutes)) {
    UpdateBioAge();
  }

  // =============================================================================
  // UPDATE WEARABLE DATA
  // =============================================================================
  
  // Update HRV from heart rate sensor
  uint8_t currentHR = heartRateController.HeartRate();
  if (currentHR > 0) {
    // Simplified HRV calculation (real implementation would use RR intervals)
    uint16_t estimatedHRV = CalculateEstimatedHRV(currentHR);
    lv_label_set_text_fmt(hrvLabel, "HRV: %d", estimatedHRV);
    
    // Store for bio-age calculation
    currentWearableData.hrvRMSSD = estimatedHRV;
  } else {
    lv_label_set_text_static(hrvLabel, "HRV: --");
  }

  // Update steps from motion controller
  uint32_t steps = motionController.NbSteps();
  lv_label_set_text_fmt(stepsLabel, "%ld", steps);
  currentWearableData.dailySteps = steps;

  // Update sleep efficiency (would come from sleep tracking)
  currentWearableData.sleepEfficiency = 85.0f; // Placeholder

  // =============================================================================
  // UPDATE STATUS ICONS
  // =============================================================================
  
  // Battery
  batteryPercentRemaining = batteryController.PercentRemaining();
  if (batteryPercentRemaining.IsUpdated()) {
    auto batteryPercent = batteryPercentRemaining.Get();
    if (batteryPercent == 100) {
      lv_label_set_text_static(batteryIcon, Symbols::batteryFull);
      lv_obj_set_style_local_text_color(batteryIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SUCCESS);
    } else if (batteryPercent > 75) {
      lv_label_set_text_static(batteryIcon, Symbols::batteryThreeQuarters);
      lv_obj_set_style_local_text_color(batteryIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SUCCESS);
    } else if (batteryPercent > 50) {
      lv_label_set_text_static(batteryIcon, Symbols::batteryHalf);
      lv_obj_set_style_local_text_color(batteryIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, LV_COLOR_WHITE);
    } else if (batteryPercent > 25) {
      lv_label_set_text_static(batteryIcon, Symbols::batteryQuarter);
      lv_obj_set_style_local_text_color(batteryIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_WARNING);
    } else {
      lv_label_set_text_static(batteryIcon, Symbols::batteryEmpty);
      lv_obj_set_style_local_text_color(batteryIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_DANGER);
    }
  }

  // Bluetooth
  bleState = bleController.IsConnected();
  if (bleState.IsUpdated()) {
    if (bleState.Get()) {
      lv_label_set_text_static(bleIcon, Symbols::bluetooth);
      lv_obj_set_style_local_text_color(bleIcon, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_PRIMARY);
    } else {
      lv_label_set_text_static(bleIcon, "");
    }
  }
}

void WatchFacePraxiomHealth::UpdateBioAge() {
  /**
   * PRAXIOM HEALTH BIO-AGE CALCULATION (Patent Pending)
   * 
   * Integrates:
   * 1. Oral Health Biomarkers (from mobile app via BLE)
   * 2. Systemic Health Biomarkers (from mobile app via BLE)
   * 3. Real-time Wearable Data (from watch sensors)
   * 
   * Formula:
   * BioAge = ChronologicalAge + 
   *          (100 - OHS) × α(age) + 
   *          (100 - SHS) × β(age) + 
   *          (100 - WearableScore) × γ(age)
   */

  // Get chronological age from settings (would be synced from mobile app)
  float chronologicalAge = 45.0f; // Placeholder - sync from mobile app

  // Calculate bio-age using patent algorithm
  float calculatedBioAge = bioAgeCalculator->calculateBioAge(
    chronologicalAge,
    currentOralMetrics,
    currentSystemicMetrics,
    currentWearableData
  );

  // Update display
  lv_label_set_text_fmt(bioAgeValue, "%.1f yrs", calculatedBioAge);

  // Calculate and display delta
  float delta = calculatedBioAge - chronologicalAge;
  if (delta > 0) {
    lv_label_set_text_fmt(bioAgeDelta, "+%.1f years", delta);
    lv_obj_set_style_local_text_color(bioAgeDelta, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_WARNING);
  } else {
    lv_label_set_text_fmt(bioAgeDelta, "%.1f years", delta);
    lv_obj_set_style_local_text_color(bioAgeDelta, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SUCCESS);
  }

  // Update Oral Health Score display
  float ohs = currentOralMetrics.calculateOHS();
  lv_label_set_text_fmt(oralHealthLabel, "OHS: %.0f", ohs);
  if (ohs >= 85) {
    lv_obj_set_style_local_text_color(oralHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SUCCESS);
  } else if (ohs >= 75) {
    lv_obj_set_style_local_text_color(oralHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_WARNING);
  } else {
    lv_obj_set_style_local_text_color(oralHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_DANGER);
  }

  // Update Systemic Health Score display
  float shs = currentSystemicMetrics.calculateSHS(bioAgeCalculator->getCurrentTier());
  lv_label_set_text_fmt(systemicHealthLabel, "SHS: %.0f", shs);
  if (shs >= 85) {
    lv_obj_set_style_local_text_color(systemicHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_SUCCESS);
  } else if (shs >= 75) {
    lv_obj_set_style_local_text_color(systemicHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_WARNING);
  } else {
    lv_obj_set_style_local_text_color(systemicHealthLabel, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_DANGER);
  }

  // Check for tier upgrade triggers
  if (bioAgeCalculator->shouldUpgradeTier()) {
    // Show upgrade notification (would trigger mobile app notification)
    ShowTierUpgradeNotification();
  }
}

uint16_t WatchFacePraxiomHealth::CalculateEstimatedHRV(uint8_t heartRate) {
  /**
   * Simplified HRV estimation from heart rate
   * Real implementation would use RR interval data
   * 
   * This uses inverse relationship: lower HR typically = higher HRV
   */
  if (heartRate == 0 || heartRate > 200) {
    return 0;
  }

  // Approximate HRV based on resting heart rate
  // Typical range: 20-100 ms for RMSSD
  float estimatedHRV = 120.0f - (heartRate * 0.8f);
  
  if (estimatedHRV < 20) estimatedHRV = 20;
  if (estimatedHRV > 100) estimatedHRV = 100;

  return static_cast<uint16_t>(estimatedHRV);
}

void WatchFacePraxiomHealth::ShowTierUpgradeNotification() {
  // Trigger notification to mobile app via BLE
  // Mobile app will show detailed upgrade recommendations
  
  // Visual feedback on watch
  lv_obj_set_style_local_text_color(bioAgeTitle, LV_LABEL_PART_MAIN, LV_STATE_DEFAULT, PRAXIOM_WARNING);
  lv_label_set_text_static(bioAgeTitle, "UPGRADE TIER");
}

void WatchFacePraxiomHealth::UpdateBiomarkersFromBLE(const uint8_t* data, size_t length) {
  /**
   * Receive biomarker data from Praxiom Health mobile app
   * 
   * Data packet format:
   * [0-3]: Chronological age (float)
   * [4-7]: Salivary pH (float)
   * [8-11]: MMP-8 level (float)
   * [12-15]: Flow rate (float)
   * [16-19]: hs-CRP (float)
   * [20-23]: Omega-3 Index (float)
   * [24-27]: HbA1c (float)
   * [28-31]: GDF-15 (float)
   * [32-35]: Vitamin D (float)
   * ... additional biomarkers for Tier 2/3
   */

  if (length < 36) {
    return; // Invalid packet
  }

  // Parse oral health metrics
  memcpy(&currentOralMetrics.salivaryPH, &data[4], sizeof(float));
  memcpy(&currentOralMetrics.mmp8Level, &data[8], sizeof(float));
  memcpy(&currentOralMetrics.flowRate, &data[12], sizeof(float));

  // Parse systemic health metrics (Tier 1)
  memcpy(&currentSystemicMetrics.hsCRP, &data[16], sizeof(float));
  memcpy(&currentSystemicMetrics.omega3Index, &data[20], sizeof(float));
  memcpy(&currentSystemicMetrics.hba1c, &data[24], sizeof(float));
  memcpy(&currentSystemicMetrics.gdf15, &data[28], sizeof(float));
  memcpy(&currentSystemicMetrics.vitaminD, &data[32], sizeof(float));

  // Timestamp
  currentOralMetrics.timestamp = std::time(nullptr);
  currentSystemicMetrics.timestamp = std::time(nullptr);

  // Trigger bio-age recalculation
  UpdateBioAge();
}

bool WatchFacePraxiomHealth::OnButtonPushed() {
  // Cycle through display modes or return to app menu
  return false; // Return true to prevent default behavior
}

bool WatchFacePraxiomHealth::OnTouchEvent(Pinetime::Applications::TouchEvents event) {
  // Handle touch gestures
  // Could implement swipe to see detailed biomarker breakdown
  return false;
}
