#pragma once

#include <pebble.h>

typedef enum {
  TEMPERATURE_UNIT_FAHRENHEIT,
  TEMPERATURE_UNIT_CELSIUS
} TemperatureUnit;

typedef enum {
  PRESSURE_UNIT_INHG,
  PRESSURE_UNIT_HPA
} PressureUnit;

typedef struct {
  char airport[8];
  char category[8];

  int temperature_c;
  int pressure_hpa;
  int wind_direction;
  int wind_speed_kt;

  time_t updated_at;
  bool offline;

  TemperatureUnit temperature_unit;
  PressureUnit pressure_unit;
} WeatherData;

void weather_init(void);
void weather_show_sample_data(void);

void weather_refresh_display(void);
void weather_refresh_status(void);

void weather_set_airport(const char *airport);
void weather_set_category(const char *category);

void weather_set_temperature_c(int temperature_c);
void weather_set_pressure_hpa(int pressure_hpa);
void weather_set_wind_direction(int wind_direction);
void weather_set_wind_speed_kt(int wind_speed_kt);

void weather_set_updated_at(time_t updated_at);
void weather_set_offline(bool offline);

void weather_set_temperature_unit(
    TemperatureUnit unit
);

void weather_set_pressure_unit(
    PressureUnit unit
);

void weather_set_units(
    bool use_celsius,
    bool use_hpa
);