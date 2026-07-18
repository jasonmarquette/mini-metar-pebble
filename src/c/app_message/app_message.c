#include "app_message.h"

#include "../weather/weather.h"

#include "../windows/main_window.h"

static AppTimer *s_updated_timer = NULL;

static void restore_updated_status(void *context) {
  s_updated_timer = NULL;
  weather_refresh_status();
}

static void inbox_received_handler(
    DictionaryIterator *iterator,
    void *context) {

  Tuple *airport_tuple =
      dict_find(iterator, MESSAGE_KEY_Airport);

  Tuple *category_tuple =
      dict_find(iterator, MESSAGE_KEY_Category);

  Tuple *temperature_tuple =
      dict_find(iterator, MESSAGE_KEY_TemperatureC);

  Tuple *pressure_tuple =
      dict_find(iterator, MESSAGE_KEY_PressureHpa);

  Tuple *wind_direction_tuple =
      dict_find(iterator, MESSAGE_KEY_WindDirection);

  Tuple *wind_speed_tuple =
      dict_find(iterator, MESSAGE_KEY_WindSpeedKt);

  Tuple *updated_tuple =
      dict_find(iterator, MESSAGE_KEY_UpdatedAt);

  Tuple *offline_tuple =
      dict_find(iterator, MESSAGE_KEY_Offline);

  Tuple *use_celsius_tuple =
      dict_find(iterator, MESSAGE_KEY_UseCelsius);

  Tuple *use_hpa_tuple =
      dict_find(iterator, MESSAGE_KEY_UseHpa);

  if (airport_tuple) {
    weather_set_airport(
        airport_tuple->value->cstring
    );
  }

  if (category_tuple) {
    weather_set_category(
        category_tuple->value->cstring
    );
  }

  if (temperature_tuple) {
    weather_set_temperature_c(
        temperature_tuple->value->int32
    );
  }

  if (pressure_tuple) {
    weather_set_pressure_hpa(
        pressure_tuple->value->int32
    );
  }

  if (wind_direction_tuple) {
    weather_set_wind_direction(
        wind_direction_tuple->value->int32
    );
  }

  if (wind_speed_tuple) {
    weather_set_wind_speed_kt(
        wind_speed_tuple->value->int32
    );
  }

  if (updated_tuple) {
  weather_set_updated_at(
      updated_tuple->value->int32
  );
} else {
  weather_set_updated_at(time(NULL));
}

  if (offline_tuple) {
    weather_set_offline(
        offline_tuple->value->int32 != 0
    );
  } else {
    weather_set_offline(false);
  }

  bool use_celsius = false;
  bool use_hpa = false;

  if (use_celsius_tuple) {
    use_celsius =
        use_celsius_tuple->value->int32 != 0;
  }

  if (use_hpa_tuple) {
    use_hpa =
        use_hpa_tuple->value->int32 != 0;
  }

  weather_set_units(
      use_celsius,
      use_hpa
  );

  weather_refresh_display();

main_window_set_updated("Updated now");

if (s_updated_timer) {
  app_timer_cancel(s_updated_timer);
}

s_updated_timer = app_timer_register(
    2000,
    restore_updated_status,
    NULL
);
}

static void inbox_dropped_handler(
    AppMessageResult reason,
    void *context) {

  APP_LOG(
      APP_LOG_LEVEL_ERROR,
      "Inbox dropped: %d",
      reason
  );
}

static void outbox_sent_handler(
    DictionaryIterator *iterator,
    void *context) {

  APP_LOG(
      APP_LOG_LEVEL_INFO,
      "Outbox message sent"
  );
}

static void outbox_failed_handler(
    DictionaryIterator *iterator,
    AppMessageResult reason,
    void *context) {

  APP_LOG(
      APP_LOG_LEVEL_ERROR,
      "Outbox failed: %d",
      reason
  );
}

void app_message_request_weather(void) {
  DictionaryIterator *iterator = NULL;

  AppMessageResult result =
      app_message_outbox_begin(&iterator);

  if (result != APP_MSG_OK || !iterator) {
    APP_LOG(
        APP_LOG_LEVEL_ERROR,
        "Could not begin outbox: %d",
        result
    );

    return;
  }

  dict_write_uint8(
      iterator,
      MESSAGE_KEY_RequestWeather,
      1
  );

  result = app_message_outbox_send();

  if (result != APP_MSG_OK) {
    APP_LOG(
        APP_LOG_LEVEL_ERROR,
        "Could not send request: %d",
        result
    );
  }
}

void app_message_service_init(void) {
  app_message_register_inbox_received(
      inbox_received_handler
  );

  app_message_register_inbox_dropped(
      inbox_dropped_handler
  );

  app_message_register_outbox_sent(
      outbox_sent_handler
  );

  app_message_register_outbox_failed(
      outbox_failed_handler
  );

  AppMessageResult result =
      app_message_open(
          512,
          128
      );

  if (result != APP_MSG_OK) {
    APP_LOG(
        APP_LOG_LEVEL_ERROR,
        "Could not open AppMessage: %d",
        result
    );
  }
}

void app_message_service_deinit(void) {
  app_message_deregister_callbacks();
}