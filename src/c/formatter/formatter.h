#pragma once

#include <pebble.h>

void formatter_temperature(
    char *buffer,
    size_t buffer_size,
    int temperature_c,
    bool use_celsius
);

void formatter_pressure(
    char *buffer,
    size_t buffer_size,
    int pressure_hpa,
    bool use_hpa
);

void formatter_wind(
    char *buffer,
    size_t buffer_size,
    int wind_direction,
    int wind_speed_kt
);

void formatter_updated_status(
    char *buffer,
    size_t buffer_size,
    time_t updated_at,
    bool offline
);