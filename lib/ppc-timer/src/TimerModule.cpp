#include "TimerModule.h"
#include "adapters/TimerController.h"
#include "MqttClient.h"
#include "Log.h"

const char* TimerModule::_spaRoutes[] = { "/timer" };

TimerModule::TimerModule(DigitalOutput** outputs, int outputCount,
                         MqttClient& mqtt, Log& log, const char* deviceId)
    : _relay(outputs, outputCount)
    , _alarms(AlarmsManager::getInstance())
    , _service(_relay, _alarms)
    , _mqttAdapter(_service, mqtt, log, deviceId)
{}

void TimerModule::setup() {
    _alarms.initStorage();
    // Reassign relay callbacks through the RelayPort interface
    _alarms.reassignRelayFunctions(_relay);
}

void TimerModule::loop() {
    _service.tick();
}

void TimerModule::registerRoutes(AsyncWebServer& server) {
    registerTimerControllerRoutes(server, _service);
}

const char** TimerModule::getSpaRoutes(int& count) const {
    count = 1;
    return const_cast<const char**>(_spaRoutes);
}

void TimerModule::handleMqttMessage(const String& topic, const String& message) {
    _mqttAdapter.handleMessage(topic, message);
}

void TimerModule::publishDeviceInfo() {
    _mqttAdapter.publishDeviceInfo();
}
