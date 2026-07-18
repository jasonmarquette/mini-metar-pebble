#include <pebble.h>

#include "app_message/app_message.h"
#include "weather/weather.h"
#include "windows/main_window.h"

static void minute_tick_handler(
    struct tm *tick_time,
    TimeUnits units_changed) {

  weather_refresh_status();

  /*
   * Request fresh weather every five minutes.
   * Using tm_min keeps the schedule aligned to the clock:
   * 10:00, 10:05, 10:10, etc.
   */
  if ((tick_time->tm_min % 5) == 0) {
    APP_LOG(
        APP_LOG_LEVEL_INFO,
        "Requesting scheduled METAR refresh"
    );

    app_message_request_weather();
  }
}

static void init(void) {
  weather_init();
  main_window_push();

  /*
   * Temporary fallback display.
   * Live data will replace this after the phone responds.
   */
  weather_show_sample_data();

  app_message_service_init();

  tick_timer_service_subscribe(
      MINUTE_UNIT,
      minute_tick_handler
  );

  app_message_request_weather();
}

static void deinit(void) {
  tick_timer_service_unsubscribe();
  app_message_service_deinit();
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}