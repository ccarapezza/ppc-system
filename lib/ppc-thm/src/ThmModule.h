#ifndef THM_MODULE_H
#define THM_MODULE_H

#include "core/Module.h"
#include "core/ThmService.h"
#include "adapters/Dht22Sensor.h"
#include "adapters/ThmMqttAdapter.h"

class MqttClient;
class Log;
class AsyncWebServer;

class ThmModule : public Module {
public:
    ThmModule(uint8_t dhtPin, MqttClient& mqtt, Log& log, const char* deviceId);

    const char* getName() const override { return "thm"; }
    void setup() override;
    void loop() override;
    void registerRoutes(AsyncWebServer& server) override;
    const char** getSpaRoutes(int& count) const override;

    void handleMqttMessage(const String& topic, const String& message) override;
    void publishDeviceInfo() override;

private:
    Dht22Sensor      _sensor;
    ThmService       _service;
    ThmMqttAdapter   _mqttAdapter;
    Log&             _log;
    bool             _lastSensorOk;
    bool             _pinLogged;
    unsigned long    _lastLogTime;

    static const char* _spaRoutes[];
};

#endif
