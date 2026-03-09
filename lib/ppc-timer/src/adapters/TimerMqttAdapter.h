#ifndef TIMER_MQTT_ADAPTER_H
#define TIMER_MQTT_ADAPTER_H

#include <Arduino.h>

class TimerService;
class MqttClient;
class Log;

class TimerMqttAdapter {
public:
    TimerMqttAdapter(TimerService& svc, MqttClient& mqtt, Log& log,
                     const char* deviceId);

    void handleMessage(const String& topic, const String& message);
    void publishDeviceInfo();

private:
    TimerService& _svc;
    MqttClient&   _mqtt;
    Log&          _log;
    String        _deviceId;
};

#endif
