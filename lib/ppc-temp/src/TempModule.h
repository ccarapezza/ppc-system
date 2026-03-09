#ifndef TEMP_MODULE_H
#define TEMP_MODULE_H

#include "core/Module.h"
#include "core/TempService.h"
#include "adapters/Ds18b20Sensor.h"
#include "adapters/TempMqttAdapter.h"

class MqttClient;
class Log;
class AsyncWebServer;

class TempModule : public Module {
public:
    TempModule(uint8_t sensorPin, MqttClient& mqtt, Log& log, const char* deviceId);

    const char* getName() const override { return "temp"; }
    void setup() override;
    void loop() override;
    void registerRoutes(AsyncWebServer& server) override;
    const char** getSpaRoutes(int& count) const override;

    void handleMqttMessage(const String& topic, const String& message) override;
    void publishDeviceInfo() override;

private:
    Ds18b20Sensor    _sensor;
    TempService      _service;
    TempMqttAdapter  _mqttAdapter;
    Log&             _log;
    bool             _lastSensorOk;
    bool             _pinLogged;
    unsigned long    _lastLogTime;

    static const char* _spaRoutes[];
};

#endif
