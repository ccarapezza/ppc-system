#ifndef TEMP_MQTT_ADAPTER_H
#define TEMP_MQTT_ADAPTER_H

#include <Arduino.h>

class TempService;
class MqttClient;
class Log;

class TempMqttAdapter {
public:
    TempMqttAdapter(TempService& svc, MqttClient& mqtt, Log& log,
                    const char* deviceId);

    void handleMessage(const String& topic, const String& message);
    void publishDeviceInfo();

private:
    TempService& _svc;
    MqttClient&  _mqtt;
    Log&         _log;
    String       _deviceId;
};

#endif
