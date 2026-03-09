#ifndef THM_MQTT_ADAPTER_H
#define THM_MQTT_ADAPTER_H

#include <Arduino.h>

class ThmService;
class MqttClient;
class Log;

class ThmMqttAdapter {
public:
    ThmMqttAdapter(ThmService& svc, MqttClient& mqtt, Log& log,
                   const char* deviceId);

    void handleMessage(const String& topic, const String& message);
    void publishDeviceInfo();

private:
    ThmService& _svc;
    MqttClient& _mqtt;
    Log&        _log;
    String      _deviceId;
};

#endif
