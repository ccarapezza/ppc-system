#ifndef TIMER_MQTT_H
#define TIMER_MQTT_H

#include <Arduino.h>

// Build and return the JSON payload for the timer device info MQTT message
String buildTimerDeviceInfoPayload();

// Publish the timer device info to MQTT (uses extern mqttClient and deviceId)
void publishTimerDeviceInfo();

#endif
