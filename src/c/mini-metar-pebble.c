#include <pebble.h>

#include "app_message/app_message.h"
#include "weather/weather.h"
#include "windows/main_window.h"

#define WEATHER_REFRESH_INTERVAL_MS (5 * 60 * 1000)

static AppTimer *s_weather_refresh_timer = NULL;

static void schedule_weather_refresh(void);

static void weather_refresh_timer_handler(void *context) {
  s_weather_refresh_timer = NULL;

  APP_LOG(
      APP_LOG_LEVEL_INFO,
      "Automatic weather refresh requested"
  );

  app_message_request_weather();
  schedule_weather_refresh();
}

static void schedule_weather_refresh(void) {
  if (s_weather_refresh_timer) {
    app_timer_cancel(s_weather_refresh_timer);
  }

  s_weather_refresh_timer = app_timer_register(
      WEATHER_REFRESH_INTERVAL_MS,
      weather_refresh_timer_handler,
      NULL
  );
}

static void minute_tick_handler(
    struct tm *tick_time,
    TimeUnits units_changed) {

  weather_refresh_status();

  APP_LOG(
      APP_LOG_LEVEL_INFO,
      "Minute tick: %d",
      tick_time->tm_min
  );
}

static void init(void) {
  weather_init();
  main_window_push();

  /*
   * Temporary fallback display.
   * Live data will replace this after the phone responds.
   */

  app_message_service_init();

  tick_timer_service_subscribe(
      MINUTE_UNIT,
      minute_tick_handler
  );

  app_message_request_weather();
  schedule_weather_refresh();
}

static void deinit(void) {
  if (s_weather_refresh_timer) {
    app_timer_cancel(s_weather_refresh_timer);
    s_weather_refresh_timer = NULL;
  }

  tick_timer_service_unsubscribe();
  app_message_service_deinit();
  main_window_destroy();
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
