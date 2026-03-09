#ifndef PPC_MODULE_H
#define PPC_MODULE_H

#include <Arduino.h>

class AsyncWebServer;  // forward-declare

class Module {
public:
    virtual ~Module() = default;

    virtual const char* getName() const = 0;

    // Called once during setup(), after platform services are ready
    virtual void setup() = 0;

    // Called every iteration of loop()
    virtual void loop() = 0;

    // Register device-specific HTTP routes on the shared server
    virtual void registerRoutes(AsyncWebServer& server) = 0;

    // Return SPA client-side routes this module needs (served as index.html)
    // Default: none. Override to add e.g. {"/timer"}
    virtual const char** getSpaRoutes(int& count) const {
        count = 0;
        return nullptr;
    }

    // Handle incoming MQTT messages routed by PpcApplication
    virtual void handleMqttMessage(const String& topic, const String& message) {
        (void)topic; (void)message;
    }

    // Publish device info (called on request_info MQTT message)
    virtual void publishDeviceInfo() {}
};

#endif
