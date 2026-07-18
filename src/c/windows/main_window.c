#include "main_window.h"

#include <string.h>

#include "../app_message/app_message.h"

static Window *s_main_window;

static TextLayer *s_airport_layer;
static TextLayer *s_category_layer;
static TextLayer *s_temperature_layer;
static TextLayer *s_pressure_layer;
static TextLayer *s_wind_layer;
static TextLayer *s_updated_layer;

static void configure_text_layer(
    TextLayer *layer,
    GColor text_color,
    GFont font,
    GTextAlignment alignment) {

  text_layer_set_background_color(
      layer,
      GColorClear
  );

  text_layer_set_text_color(
      layer,
      text_color
  );

  text_layer_set_font(
      layer,
      font
  );

  text_layer_set_text_alignment(
      layer,
      alignment
  );
}

static void select_click_handler(
    ClickRecognizerRef recognizer,
    void *context) {

  APP_LOG(
      APP_LOG_LEVEL_INFO,
      "Manual weather refresh requested"
  );

  app_message_request_weather();
}

static void click_config_provider(
    void *context) {

  window_single_click_subscribe(
      BUTTON_ID_SELECT,
      select_click_handler
  );
}

static void main_window_load(
    Window *window) {

  Layer *window_layer =
      window_get_root_layer(window);

  GRect bounds =
      layer_get_bounds(window_layer);

  int screen_height =
      bounds.size.h;

  int airport_y =
      screen_height * 3 / 100;

  int category_y =
      screen_height * 20 / 100;

  int weather_y =
      screen_height * 40 / 100;

  int wind_y =
      screen_height * 62 / 100;

  int updated_y =
      screen_height - 30;

  window_set_background_color(
      window,
      GColorBlack
  );

  /*
   * Airport
   */
  s_airport_layer = text_layer_create(
      GRect(
          0,
          airport_y,
          bounds.size.w,
          34
      )
  );

  configure_text_layer(
      s_airport_layer,
      GColorWhite,
      fonts_get_system_font(
          FONT_KEY_GOTHIC_28_BOLD
      ),
      GTextAlignmentCenter
  );

  text_layer_set_text(
      s_airport_layer,
      "KCXO"
  );

  layer_add_child(
      window_layer,
      text_layer_get_layer(
          s_airport_layer
      )
  );

  /*
   * Flight category
   */
  s_category_layer = text_layer_create(
      GRect(
          0,
          category_y,
          bounds.size.w,
          28
      )
  );

  configure_text_layer(
      s_category_layer,
      GColorGreen,
      fonts_get_system_font(
          FONT_KEY_GOTHIC_24_BOLD
      ),
      GTextAlignmentCenter
  );

  text_layer_set_text(
      s_category_layer,
      "VFR"
  );

  layer_add_child(
      window_layer,
      text_layer_get_layer(
          s_category_layer
      )
  );

  /*
   * Temperature
   */
  s_temperature_layer = text_layer_create(
      GRect(
          4,
          weather_y,
          bounds.size.w / 2 - 4,
          32
      )
  );

  configure_text_layer(
      s_temperature_layer,
      GColorWhite,
      fonts_get_system_font(
          FONT_KEY_GOTHIC_24_BOLD
      ),
      GTextAlignmentCenter
  );

  text_layer_set_text(
      s_temperature_layer,
      "72 F"
  );

  layer_add_child(
      window_layer,
      text_layer_get_layer(
          s_temperature_layer
      )
  );

  /*
   * Pressure
   */
  s_pressure_layer = text_layer_create(
      GRect(
          bounds.size.w / 2,
          weather_y,
          bounds.size.w / 2 - 4,
          32
      )
  );

  configure_text_layer(
      s_pressure_layer,
      GColorWhite,
      fonts_get_system_font(
          FONT_KEY_GOTHIC_24_BOLD
      ),
      GTextAlignmentCenter
  );

  text_layer_set_text(
      s_pressure_layer,
      "30.12"
  );

  layer_add_child(
      window_layer,
      text_layer_get_layer(
          s_pressure_layer
      )
  );

  /*
   * Wind
   */
  s_wind_layer = text_layer_create(
      GRect(
          0,
          wind_y,
          bounds.size.w,
          30
      )
  );

  configure_text_layer(
      s_wind_layer,
      GColorWhite,
      fonts_get_system_font(
          FONT_KEY_GOTHIC_18
      ),
      GTextAlignmentCenter
  );

  text_layer_set_text(
      s_wind_layer,
      "Wind 160 @ 8 kt"
  );

  layer_add_child(
      window_layer,
      text_layer_get_layer(
          s_wind_layer
      )
  );

  /*
   * Updated time
   */
  s_updated_layer = text_layer_create(
      GRect(
          0,
          updated_y,
          bounds.size.w,
          24
      )
  );

  configure_text_layer(
      s_updated_layer,
      GColorLightGray,
      fonts_get_system_font(
          FONT_KEY_GOTHIC_14
      ),
      GTextAlignmentCenter
  );

  text_layer_set_text(
      s_updated_layer,
      "Updated 3:25 PM"
  );

  layer_add_child(
      window_layer,
      text_layer_get_layer(
          s_updated_layer
      )
  );
}

static void main_window_unload(
    Window *window) {

  text_layer_destroy(
      s_airport_layer
  );

  text_layer_destroy(
      s_category_layer
  );

  text_layer_destroy(
      s_temperature_layer
  );

  text_layer_destroy(
      s_pressure_layer
  );

  text_layer_destroy(
      s_wind_layer
  );

  text_layer_destroy(
      s_updated_layer
  );

  s_airport_layer = NULL;
  s_category_layer = NULL;
  s_temperature_layer = NULL;
  s_pressure_layer = NULL;
  s_wind_layer = NULL;
  s_updated_layer = NULL;

  window_destroy(
      s_main_window
  );

  s_main_window = NULL;
}

void main_window_push(void) {
  if (!s_main_window) {
    s_main_window =
        window_create();

    window_set_click_config_provider(
        s_main_window,
        click_config_provider
    );

    window_set_window_handlers(
        s_main_window,
        (WindowHandlers) {
          .load = main_window_load,
          .unload = main_window_unload
        }
    );
  }

  window_stack_push(
      s_main_window,
      true
  );
}

void main_window_set_airport(
    const char *airport) {

  if (
      s_airport_layer &&
      airport
  ) {
    text_layer_set_text(
        s_airport_layer,
        airport
    );
  }
}

void main_window_set_category(
    const char *category) {

  if (
      !s_category_layer ||
      !category
  ) {
    return;
  }

  text_layer_set_text(
      s_category_layer,
      category
  );

#ifdef PBL_COLOR

  if (
      strcmp(category, "VFR") == 0
  ) {
    text_layer_set_text_color(
        s_category_layer,
        GColorGreen
    );
  } else if (
      strcmp(category, "MVFR") == 0
  ) {
    text_layer_set_text_color(
        s_category_layer,
        GColorBlue
    );
  } else if (
      strcmp(category, "IFR") == 0
  ) {
    text_layer_set_text_color(
        s_category_layer,
        GColorRed
    );
  } else if (
      strcmp(category, "LIFR") == 0
  ) {
    text_layer_set_text_color(
        s_category_layer,
        GColorMagenta
    );
  } else {
    text_layer_set_text_color(
        s_category_layer,
        GColorWhite
    );
  }

#else

  text_layer_set_text_color(
      s_category_layer,
      GColorWhite
  );

#endif
}

void main_window_set_temperature(
    const char *temperature) {

  if (
      s_temperature_layer &&
      temperature
  ) {
    text_layer_set_text(
        s_temperature_layer,
        temperature
    );
  }
}

void main_window_set_pressure(
    const char *pressure) {

  if (
      s_pressure_layer &&
      pressure
  ) {
    text_layer_set_text(
        s_pressure_layer,
        pressure
    );
  }
}

void main_window_set_wind(
    const char *wind) {

  if (
      s_wind_layer &&
      wind
  ) {
    text_layer_set_text(
        s_wind_layer,
        wind
    );
  }
}

void main_window_set_updated(
    const char *updated) {

  if (
      s_updated_layer &&
      updated
  ) {
    text_layer_set_text(
        s_updated_layer,
        updated
    );
  }
}