#include "formatter.h"

static int celsius_to_fahrenheit(int temperature_c) {
  /*
   * Round instead of truncating.
   *
   * 22 C becomes 72 F instead of 71 F.
   */
  if (temperature_c >= 0) {
    return ((temperature_c * 9) + 2) / 5 + 32;
  }

  return ((temperature_c * 9) - 2) / 5 + 32;
}

void formatter_temperature(
    char *buffer,
    size_t buffer_size,
    int temperature_c,
    bool use_celsius) {

  if (!buffer || buffer_size == 0) {
    return;
  }

  if (use_celsius) {
    snprintf(
        buffer,
        buffer_size,
        "%d C",
        temperature_c
    );

    return;
  }

  snprintf(
      buffer,
      buffer_size,
      "%d F",
      celsius_to_fahrenheit(temperature_c)
  );
}

void formatter_pressure(
    char *buffer,
    size_t buffer_size,
    int pressure_hpa,
    bool use_hpa) {

  if (!buffer || buffer_size == 0) {
    return;
  }

  if (use_hpa) {
    snprintf(
        buffer,
        buffer_size,
        "%d hPa",
        pressure_hpa
    );

    return;
  }

  /*
   * Convert hPa to hundredths of inHg without relying
   * on floating-point formatting.
   */
  int pressure_hundredths =
      (pressure_hpa * 2953 + 50000) / 1000;

  snprintf(
      buffer,
      buffer_size,
      "%d.%02d",
      pressure_hundredths / 100,
      pressure_hundredths % 100
  );
}

void formatter_wind(
    char *buffer,
    size_t buffer_size,
    int wind_direction,
    int wind_speed_kt) {

  if (!buffer || buffer_size == 0) {
    return;
  }

  if (wind_speed_kt == 0) {
    snprintf(
        buffer,
        buffer_size,
        "Wind calm"
    );

    return;
  }

  if (wind_direction < 0) {
    snprintf(
        buffer,
        buffer_size,
        "Wind VRB @ %d kt",
        wind_speed_kt
    );

    return;
  }

  snprintf(
      buffer,
      buffer_size,
      "Wind %03d @ %d kt",
      wind_direction,
      wind_speed_kt
  );
}

void formatter_updated_status(
    char *buffer,
    size_t buffer_size,
    time_t updated_at,
    bool offline) {

  if (!buffer || buffer_size == 0) {
    return;
  }

  time_t now = time(NULL);
  int elapsed_seconds = (int)difftime(now, updated_at);

  if (elapsed_seconds < 0) {
    elapsed_seconds = 0;
  }

  int elapsed_minutes = elapsed_seconds / 60;

  if (offline) {
    if (elapsed_minutes <= 0) {
      snprintf(
          buffer,
          buffer_size,
          "Offline"
      );
    } else {
      snprintf(
          buffer,
          buffer_size,
          "Offline - %d min old",
          elapsed_minutes
      );
    }

    return;
  }

    if (elapsed_minutes <= 0) {
    snprintf(
        buffer,
        buffer_size,
        "METAR just reported"
    );
  } else if (elapsed_minutes == 1) {
    snprintf(
        buffer,
        buffer_size,
        "METAR 1 min old"
    );
  } else if (elapsed_minutes < 60) {
    snprintf(
        buffer,
        buffer_size,
        "METAR %d min old",
        elapsed_minutes
    );
  } else {
    int elapsed_hours = elapsed_minutes / 60;
    int remaining_minutes = elapsed_minutes % 60;

    if (remaining_minutes == 0) {
      snprintf(
          buffer,
          buffer_size,
          "METAR %d hr old",
          elapsed_hours
      );
    } else {
      snprintf(
          buffer,
          buffer_size,
          "METAR %d hr %d min old",
          elapsed_hours,
          remaining_minutes
      );
    }
  }
}