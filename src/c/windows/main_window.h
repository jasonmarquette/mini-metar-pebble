#pragma once

#include <pebble.h>

void main_window_push(void);

void main_window_set_airport(
    const char *airport
);

void main_window_set_category(
    const char *category
);

void main_window_set_temperature(
    const char *temperature
);

void main_window_set_pressure(
    const char *pressure
);

void main_window_set_wind(
    const char *wind
);

void main_window_set_updated(
    const char *updated
);