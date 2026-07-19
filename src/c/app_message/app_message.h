#pragma once

#include <pebble.h>

void app_message_service_init(void);
void app_message_service_deinit(void);
void app_message_request_weather(void);
void app_message_request_next_airport(void);
void app_message_request_previous_airport(void);
