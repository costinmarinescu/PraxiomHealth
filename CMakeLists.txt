cmake_minimum_required(VERSION 3.10)
project(pinetime-app C CXX ASM)

# define some variables just for this example to determine file locations
set(NRF_PROJECT_NAME pinetime-app)
set(NRF_BOARD pca10040)

# check if all the necessary tools paths have been provided.
if (NOT NRF5_SDK_PATH)
    message(FATAL_ERROR "The path to the nRF5 SDK (NRF5_SDK_PATH) must be set.")
endif ()

if (DEFINED ARM_NONE_EABI_TOOLCHAIN_PATH)
    set(ARM_NONE_EABI_TOOLCHAIN_BIN_PATH ${ARM_NONE_EABI_TOOLCHAIN_PATH}/bin)
endif ()

# check if all the necessary tools paths have been provided.
if(NOT DEFINED TARGET_DEVICE)
    set(TARGET_DEVICE "PINETIME")
endif()

# Setup toolchain
include(${CMAKE_SOURCE_DIR}/cmake-nRF5x/arm-gcc-toolchain.cmake)
if (NOT DEFINED ARM_GCC_TOOLCHAIN)
    message(FATAL_ERROR "The toolchain must be set up before calling this macro")
endif ()

set(CMAKE_OSX_SYSROOT "/")
set(CMAKE_OSX_DEPLOYMENT_TARGET "")

set(SDK_SOURCE_FILES
        # Startup - FIXED: Removed /gcc/ from path
        ${NRF5_SDK_PATH}/modules/nrfx/mdk/system_nrf52.c
        ${NRF5_SDK_PATH}/modules/nrfx/mdk/gcc/startup_nrf52.S


        # Base SDK
        ${NRF5_SDK_PATH}/components/boards/boards.c
        ${NRF5_SDK_PATH}/integration/nrfx/legacy/nrf_drv_clock.c
        ${NRF5_SDK_PATH}/integration/nrfx/legacy/nrf_drv_clock.h
        ${NRF5_SDK_PATH}/modules/nrfx/drivers/src/nrfx_clock.c
        ${NRF5_SDK_PATH}/modules/nrfx/drivers/src/nrfx_gpiote.c
        ${NRF5_SDK_PATH}/modules/nrfx/soc/nrfx_atomic.c
        ${NRF5_SDK_PATH}/modules/nrfx/drivers/src/nrfx_saadc.c

        # FreeRTOS
        ${NRF5_SDK_PATH}/external/freertos/source/croutine.c
        ${NRF5_SDK_PATH}/external/freertos/source/event_groups.c
        ${NRF5_SDK_PATH}/external/freertos/source/list.c
        ${NRF5_SDK_PATH}/external/freertos/source/queue.c
        ${NRF5_SDK_PATH}/external/freertos/source/stream_buffer.c
        ${NRF5_SDK_PATH}/external/freertos/source/tasks.c
        ${NRF5_SDK_PATH}/external/freertos/source/timers.c

        # Libs
        ${NRF5_SDK_PATH}/components/libraries/atomic/nrf_atomic.c
        ${NRF5_SDK_PATH}/components/libraries/balloc/nrf_balloc.c
        ${NRF5_SDK_PATH}/components/libraries/util/nrf_assert.c
        ${NRF5_SDK_PATH}/components/libraries/util/app_error.c
        ${NRF5_SDK_PATH}/components/libraries/util/app_error_weak.c
        ${NRF5_SDK_PATH}/components/libraries/util/app_error_handler_gcc.c
        ${NRF5_SDK_PATH}/components/libraries/util/app_util_platform.c
        ${NRF5_SDK_PATH}/components/libraries/log/src/nrf_log_backend_rtt.c
        ${NRF5_SDK_PATH}/components/libraries/log/src/nrf_log_backend_serial.c
        ${NRF5_SDK_PATH}/components/libraries/log/src/nrf_log_default_backends.c
        ${NRF5_SDK_PATH}/components/libraries/log/src/nrf_log_frontend.c
        ${NRF5_SDK_PATH}/components/libraries/log/src/nrf_log_str_formatter.c
        ${NRF5_SDK_PATH}/components/libraries/memobj/nrf_memobj.c
        ${NRF5_SDK_PATH}/components/libraries/ringbuf/nrf_ringbuf.c
        ${NRF5_SDK_PATH}/components/libraries/strerror/nrf_strerror.c

        # Segger RTT
        ${NRF5_SDK_PATH}/external/segger_rtt/SEGGER_RTT_Syscalls_GCC.c
        ${NRF5_SDK_PATH}/external/segger_rtt/SEGGER_RTT.c
        ${NRF5_SDK_PATH}/external/segger_rtt/SEGGER_RTT_printf.c

        # Other
        ${NRF5_SDK_PATH}/external/utf_converter/utf.c
        ${NRF5_SDK_PATH}/external/fprintf/nrf_fprintf.c
        ${NRF5_SDK_PATH}/external/fprintf/nrf_fprintf_format.c

        # TWI
        ${NRF5_SDK_PATH}/modules/nrfx/drivers/src/nrfx_twim.c

        # GPIOTE
        ${NRF5_SDK_PATH}/components/libraries/gpiote/app_gpiote.c
        )

set(TINYCRYPT_SRC
        src/libs/mynewt-nimble/ext/tinycrypt/src/aes_encrypt.c
        src/libs/mynewt-nimble/ext/tinycrypt/src/utils.c
        src/libs/mynewt-nimble/ext/tinycrypt/src/cmac_mode.c
        src/libs/mynewt-nimble/ext/tinycrypt/src/ecc.c
        src/libs/mynewt-nimble/ext/tinycrypt/src/ecc_dh.c
        )

# NIMBLE
set(NIMBLE_SRC
        src/libs/mynewt-nimble/porting/npl/freertos/src/nimble_port_freertos.c
        src/libs/mynewt-nimble/porting/npl/freertos/src/npl_os_freertos.c

        src/libs/mynewt-nimble/nimble/host/src/ble_hs.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_hci_evt.c
        src/libs/mynewt-nimble/nimble/host/src/ble_l2cap_sig_cmd.c
        src/libs/mynewt-nimble/nimble/host/src/ble_l2cap_sig.c
        src/libs/mynewt-nimble/nimble/host/src/ble_l2cap.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_mbuf.c
        src/libs/mynewt-nimble/nimble/host/src/ble_sm.c
        src/libs/mynewt-nimble/nimble/host/src/ble_sm_cmd.c
        src/libs/mynewt-nimble/nimble/host/src/ble_sm_lgcy.c
        src/libs/mynewt-nimble/nimble/host/src/ble_sm_alg.c
        src/libs/mynewt-nimble/nimble/host/src/ble_sm_sc.c
        src/libs/mynewt-nimble/nimble/host/src/ble_gap.c
        src/libs/mynewt-nimble/nimble/host/src/ble_gatts.c
        src/libs/mynewt-nimble/nimble/host/src/ble_gattc.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_conn.c
        src/libs/mynewt-nimble/nimble/host/src/ble_att_svr.c
        src/libs/mynewt-nimble/nimble/host/src/ble_store.c
        src/libs/mynewt-nimble/nimble/host/src/ble_store_util.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_pvcy.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_hci.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_log.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_hci_util.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_hci_cmd.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_cfg.c
        src/libs/mynewt-nimble/nimble/host/src/ble_uuid.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_id.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_misc.c
        src/libs/mynewt-nimble/nimble/host/src/ble_att.c
        src/libs/mynewt-nimble/nimble/host/src/ble_att_clt.c
        src/libs/mynewt-nimble/nimble/host/src/ble_att_svr.c
        src/libs/mynewt-nimble/nimble/host/src/ble_att_cmd.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_atomic.c

        src/libs/mynewt-nimble/nimble/host/src/ble_hs_adv.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_flow.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_mqueue.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_stop.c
        src/libs/mynewt-nimble/nimble/host/src/ble_hs_startup.c

        src/libs/mynewt-nimble/nimble/host/store/ram/src/ble_store_ram.c
        src/libs/mynewt-nimble/nimble/host/src/ble_monitor.c

        src/libs/mynewt-nimble/nimble/transport/ram/src/ble_hci_ram.c

        src/libs/mynewt-nimble/nimble/controller/src/ble_ll.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_rand.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_conn.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_ctrl.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_hci.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_conn_hci.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_utils.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_scan.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_whitelist.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_adv.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_sched.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_supp_cmd.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_hci_ev.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_rfmgmt.c
        src/libs/mynewt-nimble/nimble/controller/src/ble_ll_resolv.c

        src/libs/mynewt-nimble/porting/nimble/src/os_cputime.c
        src/libs/mynewt-nimble/porting/nimble/src/os_cputime_pwr2.c
        src/libs/mynewt-nimble/porting/nimble/src/os_mbuf.c
        src/libs/mynewt-nimble/porting/nimble/src/os_mempool.c
        src/libs/mynewt-nimble/porting/nimble/src/hal_timer.c
        src/libs/mynewt-nimble/porting/nimble/src/mem.c
        src/libs/mynewt-nimble/porting/nimble/src/endian.c
        src/libs/mynewt-nimble/porting/nimble/src/os_msys_init.c

        src/libs/mynewt-nimble/nimble/drivers/nrf52/src/ble_hw.c
        src/libs/mynewt-nimble/nimble/drivers/nrf52/src/ble_phy.c

        src/libs/mynewt-nimble/nimble/host/services/gap/src/ble_svc_gap.c
        src/libs/mynewt-nimble/nimble/host/services/gatt/src/ble_svc_gatt.c
        src/libs/mynewt-nimble/nimble/host/util/src/addr.c
        )

set(LITTLEFS_SRC
        src/libs/littlefs/lfs_util.h
        src/libs/littlefs/lfs.h
        src/libs/littlefs/lfs_util.c
        src/libs/littlefs/lfs.c
        )

set(LVGL_SRC
        src/libs/lv_conf.h
        src/libs/lvgl/lvgl.h
        )

list(APPEND IMAGEFILES src/displayapp/icons/battery/batteryicon.c)

list(APPEND SOURCE_FILES
        src/stdlib.c
        src/FreeRTOS/heap_4_infinitime.c
        src/BootloaderVersion.cpp
        src/logging/NrfLogger.cpp
        src/displayapp/DisplayApp.cpp
        src/displayapp/screens/Screen.cpp
        src/displayapp/screens/Tile.cpp
        src/displayapp/screens/InfiniPaint.cpp
        src/displayapp/screens/Paddle.cpp
        src/displayapp/screens/StopWatch.cpp
        src/displayapp/screens/BatteryIcon.cpp
        src/displayapp/screens/BleIcon.cpp
        src/displayapp/screens/NotificationIcon.cpp
        src/displayapp/screens/SystemInfo.cpp
        src/displayapp/screens/Label.cpp
        src/displayapp/screens/FirmwareUpdate.cpp
        src/displayapp/screens/Music.cpp
        src/displayapp/screens/Navigation.cpp
        src/displayapp/screens/Metronome.cpp
        src/displayapp/screens/Motion.cpp
        src/displayapp/screens/Weather.cpp
        src/displayapp/screens/Calculator.cpp
        src/displayapp/screens/FirmwareValidation.cpp
        src/displayapp/screens/ApplicationList.cpp
        src/displayapp/screens/Notifications.cpp
        src/displayapp/screens/Twos.cpp
        src/displayapp/screens/HeartRate.cpp
        src/displayapp/screens/FlashLight.cpp
        src/displayapp/screens/List.cpp
        src/displayapp/screens/CheckboxList.cpp
        src/displayapp/screens/BatteryInfo.cpp
        src/displayapp/screens/Steps.cpp
        src/displayapp/screens/Timer.cpp
        src/displayapp/screens/Dice.cpp
        src/displayapp/screens/PassKey.cpp
        src/displayapp/screens/Error.cpp
        src/displayapp/screens/Alarm.cpp
        src/displayapp/screens/Styles.cpp
        src/displayapp/screens/WeatherSymbols.cpp

        src/displayapp/Colors.cpp
        src/displayapp/widgets/Counter.cpp
        src/displayapp/widgets/PageIndicator.cpp
        src/displayapp/widgets/DotIndicator.cpp
        src/displayapp/widgets/StatusIcons.cpp

        # Settings
        src/displayapp/screens/settings/QuickSettings.cpp
        src/displayapp/screens/settings/Settings.cpp
        src/displayapp/screens/settings/SettingWatchFace.cpp
        src/displayapp/screens/settings/SettingTimeFormat.cpp
        src/displayapp/screens/settings/SettingWeatherFormat.cpp
        src/displayapp/screens/settings/SettingWakeUp.cpp
        src/displayapp/screens/settings/SettingDisplay.cpp
        src/displayapp/screens/settings/SettingSteps.cpp
        src/displayapp/screens/settings/SettingSetDateTime.cpp
        src/displayapp/screens/settings/SettingSetDate.cpp
        src/displayapp/screens/settings/SettingSetTime.cpp
        src/displayapp/screens/settings/SettingChimes.cpp
        src/displayapp/screens/settings/SettingShakeThreshold.cpp
        src/displayapp/screens/settings/SettingBluetooth.cpp
        src/displayapp/screens/settings/SettingOTA.cpp

        # Watch faces
        src/displayapp/screens/WatchFaceAnalog.cpp
        src/displayapp/screens/WatchFaceDigital.cpp
        src/displayapp/screens/WatchFaceInfineat.cpp
        src/displayapp/screens/WatchFaceTerminal.cpp
        src/displayapp/screens/WatchFacePineTimeStyle.cpp
        src/displayapp/screens/WatchFaceCasioStyleG7710.cpp
        src/displayapp/screens/WatchFacePrideFlag.cpp
        src/displayapp/screens/WatchFacePraxiomHealth.cpp
        
        # Praxiom Health Bio-Age Components
        src/components/praxiom/BioAgeCalculator.cpp

        src/main.cpp
        src/drivers/St7789.cpp
        src/drivers/SpiNorFlash.cpp
        src/drivers/SpiMaster.cpp
        src/drivers/Spi.cpp
        src/drivers/Watchdog.cpp
        src/drivers/InternalFlash.cpp
        src/drivers/Hrs3300.cpp
        src/drivers/Bma421.cpp
        src/drivers/Bma421_C/bma4.c
        src/drivers/Bma421_C/bma423.c

        src/components/battery/BatteryController.cpp
        src/components/ble/BleController.cpp
        src/components/ble/NotificationManager.cpp
        src/components/datetime/DateTimeController.cpp
        src/components/brightness/BrightnessController.cpp
        src/components/motion/MotionController.cpp
        src/components/ble/NimbleController.cpp
        src/components/ble/DeviceInformationService.cpp
        src/components/ble/CurrentTimeClient.cpp
        src/components/ble/AlertNotificationClient.cpp
        src/components/ble/DfuService.cpp
        src/components/ble/CurrentTimeService.cpp
        # FIXED: Corrected typo from "Alart" to "Alert"
        src/components/ble/AlertNotificationService.cpp
        src/components/ble/MusicService.cpp
        src/components/ble/SimpleWeatherService.cpp
        src/components/ble/NavigationService.cpp
        src/components/ble/BatteryInformationService.cpp
        src/components/ble/FSService.cpp
        src/components/ble/ImmediateAlertService.cpp
        src/components/ble/ServiceDiscovery.cpp
        src/components/ble/HeartRateService.cpp
        src/components/ble/MotionService.cpp
        src/components/firmwarevalidator/FirmwareValidator.cpp
        src/components/motor/MotorController.cpp
        src/components/settings/Settings.cpp
        src/components/timer/Timer.cpp
        src/components/alarm/AlarmController.cpp
        src/components/fs/FS.cpp

        src/drivers/Cst816s.cpp
        src/FreeRTOS/port.c
        src/FreeRTOS/port_cmsis_systick.c
        src/FreeRTOS/port_cmsis.c
        src/displayapp/LittleVgl.cpp
        src/displayapp/InfiniTimeTheme.cpp
        src/systemtask/SystemTask.cpp
        src/systemtask/SystemMonitor.cpp
        src/systemtask/WakeLock.cpp
        src/drivers/TwiMaster.cpp
        src/heartratetask/HeartRateTask.cpp
        src/components/heartrate/HeartRateController.cpp
        src/components/heartrate/Ppg.cpp
        src/buttonhandler/ButtonHandler.cpp
        src/touchhandler/TouchHandler.cpp
        src/utility/Math.cpp
        )

list(APPEND RECOVERY_SOURCE_FILES
        src/stdlib.c
        src/FreeRTOS/heap_4_infinitime.c
        src/BootloaderVersion.cpp
        src/logging/NrfLogger.cpp
        src/displayapp/DisplayAppRecovery.cpp
        src/main.cpp
        src/drivers/St7789.cpp
        src/drivers/SpiNorFlash.cpp
        src/drivers/SpiMaster.cpp
        src/drivers/Spi.cpp
        src/drivers/Watchdog.cpp
        src/drivers/InternalFlash.cpp
        src/drivers/Hrs3300.cpp
        src/drivers/Bma421.cpp
        src/drivers/Bma421_C/bma4.c
        src/drivers/Bma421_C/bma423.c

        src/components/battery/BatteryController.cpp
        src/components/ble/BleController.cpp
        src/components/ble/NotificationManager.cpp
        src/components/datetime/DateTimeController.cpp
        src/components/brightness/BrightnessController.cpp
        src/components/motion/MotionController.cpp
        src/components/ble/NimbleController.cpp
        src/components/ble/DeviceInformationService.cpp
        src/components/ble/CurrentTimeClient.cpp
        src/components/ble/AlertNotificationClient.cpp
        src/components/ble/DfuService.cpp
        src/components/ble/CurrentTimeService.cpp
        # FIXED: Corrected typo from "Alart" to "Alert"  
        src/components/ble/AlertNotificationService.cpp
        src/components/ble/MusicService.cpp
        src/components/ble/SimpleWeatherService.cpp
        src/components/ble/BatteryInformationService.cpp
        src/components/ble/FSService.cpp
        src/components/ble/ImmediateAlertService.cpp
        src/components/ble/ServiceDiscovery.cpp
        src/components/ble/NavigationService.cpp
        src/components/ble/HeartRateService.cpp
        src/components/ble/MotionService.cpp
        src/components/firmwarevalidator/FirmwareValidator.cpp
        src/components/settings/Settings.cpp
        src/components/timer/Timer.cpp
        src/components/alarm/AlarmController.cpp

        src/drivers/Cst816s.cpp
        src/FreeRTOS/port.c
        src/FreeRTOS/port_cmsis_systick.c
        src/FreeRTOS/port_cmsis.c
        src/systemtask/SystemTask.cpp
        src/systemtask/SystemMonitor.cpp
        src/systemtask/WakeLock.cpp
        src/drivers/TwiMaster.cpp
        src/components/rle/RleDecoder.cpp
        src/components/heartrate/HeartRateController.cpp
        src/heartratetask/HeartRateTask.cpp
        src/components/heartrate/Ppg.cpp
        src/components/motor/MotorController.cpp
        src/components/fs/FS.cpp
        src/buttonhandler/ButtonHandler.cpp
        src/touchhandler/TouchHandler.cpp
        src/utility/Math.cpp
        )

list(APPEND RECOVERYLOADER_SOURCE_FILES
        src/stdlib.c
        src/FreeRTOS/heap_4_infinitime.c
        src/FreeRTOS/port.c
        src/FreeRTOS/port_cmsis_systick.c
        src/FreeRTOS/port_cmsis.c
        src/drivers/SpiNorFlash.cpp
        src/drivers/SpiMaster.cpp
        src/drivers/Spi.cpp
        src/logging/NrfLogger.cpp
        src/components/rle/RleDecoder.cpp
        src/drivers/St7789.cpp
        src/components/brightness/BrightnessController.cpp
        src/recoveryLoader.cpp
        )

set(INCLUDE_FILES
        ${CMAKE_CURRENT_BINARY_DIR}/src/Version.h
        src/BootloaderVersion.h
        src/logging/Logger.h
        src/logging/NrfLogger.h
        src/displayapp/DisplayApp.h
        src/displayapp/Messages.h
        src/displayapp/TouchEvents.h
        src/displayapp/screens/Screen.h
        src/displayapp/screens/Tile.h
        src/displayapp/screens/InfiniPaint.h
        src/displayapp/screens/StopWatch.h
        src/displayapp/screens/Paddle.h
        src/displayapp/screens/BatteryIcon.h
        src/displayapp/screens/BleIcon.h
        src/displayapp/screens/NotificationIcon.h
        src/displayapp/screens/SystemInfo.h
        src/displayapp/screens/ScreenList.h
        src/displayapp/screens/Label.h
        src/displayapp/screens/FirmwareUpdate.h
        src/displayapp/screens/FirmwareValidation.h
        src/displayapp/screens/ApplicationList.h
        src/displayapp/screens/CheckboxList.h
        src/displayapp/Apps.h
        src/displayapp/screens/Notifications.h
        src/displayapp/screens/HeartRate.h
        src/displayapp/screens/Metronome.h
        src/displayapp/screens/Motion.h
        src/displayapp/screens/Timer.h
        src/displayapp/screens/Dice.h
        src/displayapp/screens/Alarm.h
        src/displayapp/Colors.h
        src/displayapp/widgets/Counter.h
        src/displayapp/widgets/PageIndicator.h
        src/displayapp/widgets/DotIndicator.h
        src/displayapp/widgets/StatusIcons.h
        src/displayapp/screens/WatchFacePraxiomHealth.h
        src/components/praxiom/BioAgeCalculator.h

        src/drivers/St7789.h
        src/drivers/SpiNorFlash.h
        src/drivers/SpiMaster.h
        src/drivers/Spi.h
        src/drivers/Watchdog.h
        src/drivers/InternalFlash.h
        src/drivers/Hrs3300.h
        src/drivers/PinMap.h
        src/drivers/Bma421.h
        src/drivers/Bma421_C/bma4.c
        src/drivers/Bma421_C/bma423.c

        src/components/battery/BatteryController.h
        src/components/ble/BleController.h
        src/components/ble/NotificationManager.h
        src/components/datetime/DateTimeController.h
        src/components/brightness/BrightnessController.h
        src/components/motion/MotionController.h
        src/components/firmwarevalidator/FirmwareValidator.h
        src/components/ble/BleController.h
        src/components/ble/NotificationManager.h
        src/components/ble/NimbleController.h
        src/components/ble/DeviceInformationService.h
        src/components/ble/CurrentTimeClient.h
        src/components/ble/AlertNotificationClient.h
        src/components/ble/DfuService.h
        src/components/firmwarevalidator/FirmwareValidator.h
        src/components/ble/BatteryInformationService.h
        src/components/ble/FSService.h
        src/components/ble/ImmediateAlertService.h
        src/components/ble/ServiceDiscovery.h
        src/components/ble/BleClient.h
        src/components/ble/HeartRateService.h
        src/components/ble/MotionService.h
        src/components/ble/SimpleWeatherService.h
        src/components/settings/Settings.h
        src/components/timer/Timer.h
        src/components/alarm/AlarmController.h

        src/drivers/Cst816s.h
        src/FreeRTOS/portmacro.h
        src/FreeRTOS/portmacro_cmsis.h
        src/displayapp/LittleVgl.h
        src/displayapp/InfiniTimeTheme.h
        src/systemtask/SystemTask.h
        src/systemtask/SystemMonitor.h
        src/systemtask/WakeLock.h
        src/displayapp/screens/Symbols.h
        src/drivers/TwiMaster.h
        src/heartratetask/HeartRateTask.h
        src/components/heartrate/Ppg.h
        src/components/heartrate/HeartRateController.h
        src/libs/arduinoFFT/src/arduinoFFT.h
        src/libs/arduinoFFT/src/defs.h
        src/libs/arduinoFFT/src/types.h
        src/components/motor/MotorController.h
        src/buttonhandler/ButtonHandler.h
        src/touchhandler/TouchHandler.h
        src/utility/Math.h
        
        # Praxiom Health Headers
        src/components/praxiom/BioAgeCalculator.h
        )

include_directories(
        ${CMAKE_BINARY_DIR}/src # generated files like Version.h
        src
        .
        )

include_directories(SYSTEM PUBLIC
        src/libs
        src/FreeRTOS
        src/components/praxiom
        src/libs/mynewt-nimble/porting/npl/freertos/include
        src/libs/mynewt-nimble/nimble/include
        src/libs/mynewt-nimble/porting/nimble/include
        src/libs/mynewt-nimble/nimble/host/include
        src/libs/mynewt-nimble/nimble/controller/include
        src/libs/mynewt-nimble/nimble/transport/ram/include
        src/libs/mynewt-nimble/nimble/drivers/nrf52/include
        src/libs/mynewt-nimble/ext/tinycrypt/include
        src/libs/mynewt-nimble/nimble/host/services/gap/include
        src/libs/mynewt-nimble/nimble/host/services/gatt/include
        src/libs/mynewt-nimble/nimble/host/util/include
        src/libs/mynewt-nimble/nimble/host/store/ram/include

        ${NRF5_SDK_PATH}/components/drivers_nrf/nrf_soc_nosd
        ${NRF5_SDK_PATH}/components
        ${NRF5_SDK_PATH}/components/boards
        ${NRF5_SDK_PATH}/components/softdevice/common
        ${NRF5_SDK_PATH}/integration/nrfx
        ${NRF5_SDK_PATH}/integration/nrfx/legacy
        ${NRF5_SDK_PATH}/modules/nrfx
        ${NRF5_SDK_PATH}/modules/nrfx/drivers/include
        ${NRF5_SDK_PATH}/modules/nrfx/hal
        ${NRF5_SDK_PATH}/modules/nrfx/mdk
        ${NRF5_SDK_PATH}/external/freertos/source/include
        ${NRF5_SDK_PATH}/components/toolchain/cmsis/include
        ${NRF5_SDK_PATH}/components/libraries/atomic
        ${NRF5_SDK_PATH}/components/libraries/atomic_fifo
        ${NRF5_SDK_PATH}/components/libraries/atomic_flags
        ${NRF5_SDK_PATH}/components/libraries/balloc
        ${NRF5_SDK_PATH}/components/libraries/bootloader/ble_dfu
        ${NRF5_SDK_PATH}/components/libraries/cli
        ${NRF5_SDK_PATH}/components/libraries/crc16
        ${NRF5_SDK_PATH}/components/libraries/crc32
        ${NRF5_SDK_PATH}/components/libraries/crypto
        ${NRF5_SDK_PATH}/components/libraries/csense
        ${NRF5_SDK_PATH}/components/libraries/csense_drv
        ${NRF5_SDK_PATH}/components/libraries/delay
        ${NRF5_SDK_PATH}/components/libraries/ecc
        ${NRF5_SDK_PATH}/components/libraries/experimental_section_vars
        ${NRF5_SDK_PATH}/components/libraries/experimental_task_manager
        ${NRF5_SDK_PATH}/components/libraries/fds
        ${NRF5_SDK_PATH}/components/libraries/fstorage
        ${NRF5_SDK_PATH}/components/libraries/gfx
        ${NRF5_SDK_PATH}/components/libraries/gpiote
        ${NRF5_SDK_PATH}/components/libraries/hardfault
        ${NRF5_SDK_PATH}/components/libraries/hci
        ${NRF5_SDK_PATH}/components/libraries/led_softblink
        ${NRF5_SDK_PATH}/components/libraries/log
        ${NRF5_SDK_PATH}/components/libraries/log/src
        ${NRF5_SDK_PATH}/components/libraries/low_power_pwm
        ${NRF5_SDK_PATH}/components/libraries/mem_manager
        ${NRF5_SDK_PATH}/components/libraries/memobj
        ${NRF5_SDK_PATH}/components/libraries/mpu
        ${NRF5_SDK_PATH}/components/libraries/mutex
        ${NRF5_SDK_PATH}/components/libraries/pwm
        ${NRF5_SDK_PATH}/components/libraries/pwr_mgmt
        ${NRF5_SDK_PATH}/components/libraries/queue
        ${NRF5_SDK_PATH}/components/libraries/ringbuf
        ${NRF5_SDK_PATH}/components/libraries/scheduler
        ${NRF5_SDK_PATH}/components/libraries/sdcard
        ${NRF5_SDK_PATH}/components/libraries/slip
        ${NRF5_SDK_PATH}/components/libraries/sortlist
        ${NRF5_SDK_PATH}/components/libraries/spi_mngr
        ${NRF5_SDK_PATH}/components/libraries/stack_guard
        ${NRF5_SDK_PATH}/components/libraries/strerror
        ${NRF5_SDK_PATH}/components/libraries/svc
        ${NRF5_SDK_PATH}/components/libraries/timer
        ${NRF5_SDK_PATH}/components/libraries/usbd
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/audio
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/cdc
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/cdc/acm
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/hid
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/hid/generic
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/hid/kbd
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/hid/mouse
        ${NRF5_SDK_PATH}/components/libraries/usbd/class/msc
        ${NRF5_SDK_PATH}/components/libraries/util
        ${NRF5_SDK_PATH}/external/segger_rtt
        ${NRF5_SDK_PATH}/external/fprintf
        ${NRF5_SDK_PATH}/external/thedotfactory_fonts
        ${NRF5_SDK_PATH}/components/libraries/gpiote
        )

link_directories(
        ../
        )

set(COMMON_FLAGS -MP -MD -mthumb -mabi=aapcs -ftree-vrp -ffunction-sections -fdata-sections -fno-strict-aliasing -fno-builtin -fshort-enums -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16 -fstack-usage -fno-exceptions -fno-non-call-exceptions)

set(WARNING_FLAGS -Wall -Wextra -Warray-bounds=2 -Wformat=2 -Wformat-overflow=2 -Wformat-truncation=2 -Wformat-nonliteral -Wno-missing-field-initializers -Wno-unknown-pragmas -Wno-expansion-to-defined -Wreturn-type -Werror=return-type -Werror)

set(DEBUG_FLAGS -Og -g3)
set(RELEASE_FLAGS -Os)
set(CXX_FLAGS -fno-rtti)

set(ASM_FLAGS -x assembler-with-cpp)

add_definitions(-DCONFIG_GPIO_AS_PINRESET)
add_definitions(-DNIMBLE_CFG_CONTROLLER)
add_definitions(-DOS_CPUTIME_FREQ)
add_definitions(-DNRF52 -DNRF52832 -DNRF52832_XXAA -DNRF52_PAN_74 -DNRF52_PAN_64 -DNRF52_PAN_12 -DNRF52_PAN_58 -DNRF52_PAN_54 -DNRF52_PAN_31 -DNRF52_PAN_51 -DNRF52_PAN_36 -DNRF52_PAN_15 -DNRF52_PAN_20 -DNRF52_PAN_55 -DBOARD_PCA10040)
add_definitions(-DFREERTOS)
add_definitions(-DSTACK_SIZE=1024)
add_definitions(-DHEAP_SIZE=0)
add_definitions(-DMYNEWT_VAL_BLE_LL_RFMGMT_ENABLE_TIME=1500)
add_definitions(-DLFS_CONFIG=src/libs/lfs_config.h)

add_link_options(-Wl,--wrap,malloc -Wl,--wrap,free -Wl,--wrap,calloc -Wl,--wrap,realloc -Wl,--wrap,malloc_r -Wl,--wrap,sbrk)
# sbrk is purposefully not implemented so that builds fail when it is used

add_definitions(-DTARGET_DEVICE=${TARGET_DEVICE})
add_definitions(-DTARGET_DEVICE_NAME=${TARGET_DEVICE})

if (TARGET_DEVICE STREQUAL "PINETIME")
    add_definitions(-DDRIVER_PINMAP_PINETIME)
    add_definitions(-DCLOCK_CONFIG_LF_SRC=1) # XTAL
elseif (TARGET_DEVICE STREQUAL "MOY-TFK5") # P8a
    add_definitions(-DDRIVER_PINMAP_P8)
    add_definitions(-DCLOCK_CONFIG_LF_SRC=1) # XTAL
elseif (TARGET_DEVICE STREQUAL "MOY-TIN5") # P8a variant 2
    add_definitions(-DDRIVER_PINMAP_P8)
    add_definitions(-DCLOCK_CONFIG_LF_SRC=1) # XTAL
elseif (TARGET_DEVICE STREQUAL "MOY-TON5") # P8b
    add_definitions(-DDRIVER_PINMAP_P8)
    add_definitions(-DCLOCK_CONFIG_LF_SRC=0) # RC
    add_definitions(-DMYNEWT_VAL_BLE_LL_SCA=500)
    add_definitions(-DCLOCK_CONFIG_LF_CAL_ENABLED=1)
elseif (TARGET_DEVICE STREQUAL "MOY-UNK") # P8b mirrored
    add_definitions(-DDRIVER_PINMAP_P8)
    add_definitions(-DCLOCK_CONFIG_LF_SRC=0) # RC
    add_definitions(-DMYNEWT_VAL_BLE_LL_SCA=500)
    add_definitions(-DCLOCK_CONFIG_LF_CAL_ENABLED=1)
    add_definitions(-DDRIVER_DISPLAY_MIRROR)
else ()
    message(FATAL_ERROR "Invalid TARGET_DEVICE")
endif ()

# Target hardware configuration options...
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_definitions(-DDEBUG)
    add_definitions(-DDEBUG_NRF_USER)
    # Debug configuration...
endif ()

add_definitions(-DNRF_LOG_ENABLED=1)
# NRF SDK Logging...

add_library(nrf-sdk STATIC ${SDK_SOURCE_FILES})
target_include_directories(nrf-sdk SYSTEM PUBLIC src .)
target_include_directories(nrf-sdk SYSTEM PUBLIC ${INCLUDES_FROM_LIBS})
target_compile_options(nrf-sdk PRIVATE
        ${COMMON_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

# NRF SDK...

set(EXECUTABLE_RECOVERY_NAME pinetime-recovery)
set(EXECUTABLE_RECOVERY_FILE_NAME ${EXECUTABLE_RECOVERY_NAME}-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH})
add_executable(${EXECUTABLE_RECOVERY_NAME} ${RECOVERY_SOURCE_FILES})
set(NRF5_LINKER_SCRIPT ${CMAKE_SOURCE_DIR}/gcc_nrf52.ld)
target_link_libraries(${EXECUTABLE_RECOVERY_NAME} nimble nrf-sdk littlefs)
set_target_properties(${EXECUTABLE_RECOVERY_NAME} PROPERTIES OUTPUT_NAME ${EXECUTABLE_RECOVERY_FILE_NAME})
target_compile_definitions(${EXECUTABLE_RECOVERY_NAME} PUBLIC PINETIME_IS_RECOVERY)
target_compile_options(${EXECUTABLE_RECOVERY_NAME} PUBLIC
        ${COMMON_FLAGS}
        ${WARNING_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

set_target_properties(${EXECUTABLE_RECOVERY_NAME} PROPERTIES
        SUFFIX ".out"
        LINK_FLAGS "-mthumb -mabi=aapcs -L ${NRF5_SDK_PATH}/modules/nrfx/mdk -T${NRF5_LINKER_SCRIPT} -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16 -Wl,--gc-sections -Wl,--print-memory-usage --specs=nano.specs -lc -lnosys -lm -Wl,-Map=${EXECUTABLE_RECOVERY_FILE_NAME}.map"
        )

add_custom_command(TARGET ${EXECUTABLE_RECOVERY_NAME}
        POST_BUILD
        COMMAND ${CMAKE_SIZE_UTIL} ${EXECUTABLE_RECOVERY_FILE_NAME}.out
        COMMAND ${CMAKE_OBJCOPY} -O binary ${EXECUTABLE_RECOVERY_FILE_NAME}.out "${EXECUTABLE_RECOVERY_FILE_NAME}.bin"
        COMMAND ${CMAKE_OBJCOPY} -O ihex ${EXECUTABLE_RECOVERY_FILE_NAME}.out "${EXECUTABLE_RECOVERY_FILE_NAME}.hex"
        COMMENT "post build steps for ${EXECUTABLE_RECOVERY_FILE_NAME}")

# InfiniTime recovery firmware (autonomous)...

add_library(nimble STATIC ${NIMBLE_SRC} ${TINYCRYPT_SRC})
target_include_directories(nimble SYSTEM PUBLIC src .)
target_include_directories(nimble SYSTEM PUBLIC ${INCLUDES_FROM_LIBS})
target_compile_options(nimble PRIVATE
        ${COMMON_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

# NimBLE...

set(EXECUTABLE_RECOVERY_LOADER_NAME pinetime-recovery-loader)
set(EXECUTABLE_RECOVERY_LOADER_FILE_NAME ${EXECUTABLE_RECOVERY_LOADER_NAME}-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH})
add_executable(${EXECUTABLE_RECOVERY_LOADER_NAME} ${RECOVERYLOADER_SOURCE_FILES})
target_link_libraries(${EXECUTABLE_RECOVERY_LOADER_NAME} nrf-sdk)
set_target_properties(${EXECUTABLE_RECOVERY_LOADER_NAME} PROPERTIES OUTPUT_NAME ${EXECUTABLE_RECOVERY_LOADER_FILE_NAME})
target_compile_options(${EXECUTABLE_RECOVERY_LOADER_NAME} PUBLIC
        ${COMMON_FLAGS}
        ${WARNING_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

target_include_directories(${EXECUTABLE_RECOVERY_LOADER_NAME} PUBLIC ${CMAKE_BINARY_DIR}/src)

set_target_properties(${EXECUTABLE_RECOVERY_LOADER_NAME} PROPERTIES
        SUFFIX ".out"
        LINK_FLAGS "-mthumb -mabi=aapcs -L ${NRF5_SDK_PATH}/modules/nrfx/mdk -T${NRF5_LINKER_SCRIPT} -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16 -Wl,--gc-sections -Wl,--print-memory-usage --specs=nano.specs -lc -lnosys -lm -Wl,-Map=${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}.map"
        )

add_custom_command(TARGET ${EXECUTABLE_RECOVERY_LOADER_NAME}
        POST_BUILD
        COMMAND ${CMAKE_SIZE_UTIL} ${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}.out
        COMMAND ${CMAKE_OBJCOPY} -O binary ${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}.out "${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}.bin"
        COMMAND ${CMAKE_OBJCOPY} -O ihex ${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}.out "${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}.hex"
        COMMENT "post build steps for ${EXECUTABLE_RECOVERY_LOADER_FILE_NAME}")

# Build binary that writes the recovery image into the SPI flash memory...

add_library(littlefs STATIC ${LITTLEFS_SRC})
target_include_directories(littlefs SYSTEM PUBLIC src .)
target_include_directories(littlefs SYSTEM PUBLIC ${INCLUDES_FROM_LIBS})
target_compile_options(littlefs PRIVATE
        ${COMMON_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

# LITTLEFS_SRC...

set(EXECUTABLE_NAME pinetime-app)
set(EXECUTABLE_FILE_NAME ${EXECUTABLE_NAME}-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH})
add_executable(${EXECUTABLE_NAME} ${SOURCE_FILES})
set_target_properties(${EXECUTABLE_NAME} PROPERTIES OUTPUT_NAME ${EXECUTABLE_FILE_NAME})
target_link_libraries(${EXECUTABLE_NAME} nimble nrf-sdk lvgl littlefs)
target_compile_options(${EXECUTABLE_NAME} PUBLIC
        ${COMMON_FLAGS}
        ${WARNING_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

set_target_properties(${EXECUTABLE_NAME} PROPERTIES
        SUFFIX ".out"
        LINK_FLAGS "-mthumb -mabi=aapcs -L ${NRF5_SDK_PATH}/modules/nrfx/mdk -T${NRF5_LINKER_SCRIPT} -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16 -Wl,--gc-sections -Wl,--print-memory-usage --specs=nano.specs -lc -lnosys -lm -Wl,-Map=${EXECUTABLE_FILE_NAME}.map"
        )

add_custom_command(TARGET ${EXECUTABLE_NAME}
        POST_BUILD
        COMMAND ${CMAKE_SIZE_UTIL} ${EXECUTABLE_FILE_NAME}.out
        COMMAND ${CMAKE_OBJCOPY} -O binary ${EXECUTABLE_FILE_NAME}.out "${EXECUTABLE_FILE_NAME}.bin"
        COMMAND ${CMAKE_OBJCOPY} -O ihex ${EXECUTABLE_FILE_NAME}.out "${EXECUTABLE_FILE_NAME}.hex"
        COMMENT "post build steps for ${EXECUTABLE_FILE_NAME}")

if (BUILD_RESOURCES)
    # add_dependencies(${EXECUTABLE_NAME} GenerateResources)
endif ()

# Build autonomous binary without support for bootloader...

add_library(lvgl STATIC ${LVGL_SRC})
target_include_directories(lvgl SYSTEM PUBLIC src .)
target_include_directories(lvgl SYSTEM PUBLIC ${INCLUDES_FROM_LIBS})
target_compile_options(lvgl PRIVATE
        ${COMMON_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

# lvgl...

set(EXECUTABLE_MCUBOOT_NAME pinetime-mcuboot-app)
set(EXECUTABLE_MCUBOOT_FILE_NAME ${EXECUTABLE_MCUBOOT_NAME}-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH})
set(IMAGE_MCUBOOT_FILE_NAME_HEX ${EXECUTABLE_MCUBOOT_NAME}-image-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH}.hex)
set(IMAGE_MCUBOOT_FILE_NAME_BIN ${EXECUTABLE_MCUBOOT_NAME}-image-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH}.bin)
set(DFU_MCUBOOT_FILE_NAME ${EXECUTABLE_MCUBOOT_NAME}-dfu-${pinetime_VERSION_MAJOR}.${pinetime_VERSION_MINOR}.${pinetime_VERSION_PATCH}.zip)
set(NRF5_LINKER_SCRIPT_MCUBOOT ${CMAKE_SOURCE_DIR}/gcc_nrf52-mcuboot.ld)
add_executable(${EXECUTABLE_MCUBOOT_NAME} ${SOURCE_FILES})
target_link_libraries(${EXECUTABLE_MCUBOOT_NAME} nimble nrf-sdk lvgl littlefs)
set_target_properties(${EXECUTABLE_MCUBOOT_NAME} PROPERTIES OUTPUT_NAME ${EXECUTABLE_MCUBOOT_FILE_NAME})
target_compile_options(${EXECUTABLE_MCUBOOT_NAME} PUBLIC
        ${COMMON_FLAGS}
        ${WARNING_FLAGS}
        $<$<CONFIG:Debug>:${DEBUG_FLAGS}>
        $<$<CONFIG:Release>:${RELEASE_FLAGS}>
        $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
        $<$<COMPILE_LANGUAGE:ASM>:${ASM_FLAGS}>
        )

set_target_properties(${EXECUTABLE_MCUBOOT_NAME} PROPERTIES
        SUFFIX ".out"
        LINK_FLAGS "-mthumb -mabi=aapcs -L ${NRF5_SDK_PATH}/modules/nrfx/mdk -T${NRF5_LINKER_SCRIPT_MCUBOOT} -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16 -Wl,--gc-sections -Wl,--print-memory-usage --specs=nano.specs -lc -lnosys -lm -Wl,-Map=${EXECUTABLE_MCUBOOT_FILE_NAME}.map"
        )

# Build binary intended to be used by bootloader...

add_custom_command(TARGET ${EXECUTABLE_MCUBOOT_NAME}
        POST_BUILD
        COMMAND ${CMAKE_SIZE_UTIL} ${EXECUTABLE_MCUBOOT_FILE_NAME}.out
        COMMAND ${CMAKE_OBJCOPY} -O binary ${EXECUTABLE_MCUBOOT_FILE_NAME}.out "${EXECUTABLE_MCUBOOT_FILE_NAME}.bin"
        COMMAND ${CMAKE_OBJCOPY} -O ihex ${EXECUTABLE_MCUBOOT_FILE_NAME}.out "${EXECUTABLE_MCUBOOT_FILE_NAME}.hex"
        COMMAND ${CMAKE_SOURCE_DIR}/tools/mcuboot/imgtool.py create --align 1 --version 1.0.0 --header-size 32 --slot-size 475136 --pad-header "${EXECUTABLE_MCUBOOT_FILE_NAME}.hex" "${IMAGE_MCUBOOT_FILE_NAME_HEX}"
        COMMAND ${CMAKE_SOURCE_DIR}/tools/mcuboot/imgtool.py create --align 1 --version 1.0.0 --header-size 32 --slot-size 475136 --pad-header "${EXECUTABLE_MCUBOOT_FILE_NAME}.bin" "${IMAGE_MCUBOOT_FILE_NAME_BIN}"
        COMMENT "post build steps for ${EXECUTABLE_MCUBOOT_FILE_NAME}")

if (BUILD_RESOURCES)
    # add_dependencies(${EXECUTABLE_MCUBOOT_NAME} GenerateResources)
endif ()

if (BUILD_DFU)
    add_custom_command(TARGET ${EXECUTABLE_MCUBOOT_NAME}
            POST_BUILD
            COMMAND adafruit-nrfutil dfu genpkg --dev-type 0x0052 --application "${IMAGE_MCUBOOT_FILE_NAME_HEX}" "${DFU_MCUBOOT_FILE_NAME}"
            COMMENT "post build DFU steps for ${EXECUTABLE_MCUBOOT_FILE_NAME}")
endif ()

# Build binary intended to be used by bootloader...

# FIXED: Comment out missing directory references
# add_subdirectory(displayapp/fonts)
# add_subdirectory(displayapp/apps)
# add_subdirectory(resources)

add_definitions(-DMYNEWT_VAL_BLE_HS_LOG_LVL=0)
add_definitions(-DMYNEWT_VAL_NEWT_FEATURE_LOGCFG=1)
# Nimble Logging
