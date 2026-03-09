#ifndef PPC_APPLICATION_H
#define PPC_APPLICATION_H

#include <Arduino.h>

class PpcConnection;
class Log;
class MqttClient;
class Module;

class PpcApplication {
public:
    PpcApplication(const char* deviceName, const char* deviceType);

    // Phase 1: init logger, compute deviceId, begin MQTT
    void init();

    // Phase 2: add modules between init() and start()
    void addModule(Module* module);

    // Phase 3: WiFi connect, module setup, web server, clock
    void start();

    // Call from Arduino loop()
    void loop();

    // Accessors for dependency injection into modules
    PpcConnection& connection();
    Log& logger();
    MqttClient& mqtt();
    const String& deviceId() const { return _deviceId; }

private:
    String      _deviceId;
    const char* _deviceName;
    const char* _deviceType;
};

#endif
