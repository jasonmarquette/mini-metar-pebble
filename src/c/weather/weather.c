#include "weather.h"

#include "../formatter/formatter.h"
#include "../windows/main_window.h"

static WeatherData s_weather;

static char s_temperature_buffer[16];
static char s_pressure_buffer[20];
static char s_wind_buffer[32];
static char s_status_buffer[32];

void weather_init(void) {
  memset(&s_weather, 0, sizeof(s_weather));

  snprintf(
      s_weather.airport,
      sizeof(s_weather.airport),
      "----"
  );

  snprintf(
      s_weather.category,
      sizeof(s_weather.category),
      "---"
  );

  s_weather.wind_direction = -1;
  s_weather.updated_at = time(NULL);

  s_weather.temperature_unit =
      TEMPERATURE_UNIT_FAHRENHEIT;

  s_weather.pressure_unit =
      PRESSURE_UNIT_INHG;
}

void weather_show_sample_data(void) {
  weather_set_airport("KCXO");
  weather_set_category("VFR");

  weather_set_temperature_c(22);
  weather_set_pressure_hpa(1020);
  weather_set_wind_direction(160);
  weather_set_wind_speed_kt(8);

  weather_set_updated_at(time(NULL));
  weather_set_offline(false);

  weather_refresh_display();
}

void weather_refresh_display(void) {
  formatter_temperature(
      s_temperature_buffer,
      sizeof(s_temperature_buffer),
      s_weather.temperature_c,
      s_weather.temperature_unit ==
          TEMPERATURE_UNIT_CELSIUS
  );

  formatter_pressure(
      s_pressure_buffer,
      sizeof(s_pressure_buffer),
      s_weather.pressure_hpa,
      s_weather.pressure_unit ==
          PRESSURE_UNIT_HPA
  );

  formatter_wind(
      s_wind_buffer,
      sizeof(s_wind_buffer),
      s_weather.wind_direction,
      s_weather.wind_speed_kt
  );

  main_window_set_airport(s_weather.airport);
  main_window_set_category(s_weather.category);
  main_window_set_temperature(s_temperature_buffer);
  main_window_set_pressure(s_pressure_buffer);
  main_window_set_wind(s_wind_buffer);

  weather_refresh_status();
}

void weather_refresh_status(void) {
  formatter_updated_status(
      s_status_buffer,
      sizeof(s_status_buffer),
      s_weather.updated_at,
      s_weather.offline
  );

  main_window_set_updated(s_status_buffer);
}

void weather_set_airport(const char *airport) {
  if (!airport) {
    return;
  }

  snprintf(
      s_weather.airport,
      sizeof(s_weather.airport),
      "%s",
      airport
  );
}

void weather_set_category(const char *category) {
  if (!category) {
    return;
  }

  snprintf(
      s_weather.category,
      sizeof(s_weather.category),
      "%s",
      category
  );
}

void weather_set_temperature_c(int temperature_c) {
  s_weather.temperature_c = temperature_c;
}

void weather_set_pressure_hpa(int pressure_hpa) {
  s_weather.pressure_hpa = pressure_hpa;
}

void weather_set_wind_direction(int wind_direction) {
  s_weather.wind_direction = wind_direction;
}

void weather_set_wind_speed_kt(int wind_speed_kt) {
  s_weather.wind_speed_kt = wind_speed_kt;
}

void weather_set_updated_at(time_t updated_at) {
  s_weather.updated_at = updated_at;
}

void weather_set_offline(bool offline) {
  s_weather.offline = offline;
}

void weather_set_temperature_unit(TemperatureUnit unit) {
  s_weather.temperature_unit = unit;
  weather_refresh_display();
}

void weather_set_pressure_unit(PressureUnit unit) {
  s_weather.pressure_unit = unit;
  weather_refresh_display();
}