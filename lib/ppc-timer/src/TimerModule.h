#ifndef TIMER_MODULE_H
#define TIMER_MODULE_H

#include "core/Module.h"
#include "core/TimerService.h"
#include "adapters/GpioRelay.h"
#include "adapters/TimerMqttAdapter.h"
#include "AlarmsManager.h"

class DigitalOutput;
class MqttClient;
class Log;
class AsyncWebServer;

class TimerModule : public Module {
public:
    TimerModule(DigitalOutput** outputs, int outputCount,
                MqttClient& mqtt, Log& log, const char* deviceId);

    const char* getName() const override { return "timer"; }
    void setup() override;
    void loop() override;
    void registerRoutes(AsyncWebServer& server) override;
    const char** getSpaRoutes(int& count) const override;

    // Module MQTT hooks (routed by PpcApplication)
    void handleMqttMessage(const String& topic, const String& message) override;
    void publishDeviceInfo() override;

private:
    GpioRelay        _relay;
    AlarmsManager&   _alarms;
    TimerService     _service;
    TimerMqttAdapter _mqttAdapter;

    static const char* _spaRoutes[];
};

#endif
