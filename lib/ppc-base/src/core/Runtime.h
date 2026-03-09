#ifndef PPC_RUNTIME_H
#define PPC_RUNTIME_H

#include "Module.h"

class AsyncWebServer;

class Runtime {
public:
    static constexpr int MAX_MODULES = 4;

    void addModule(Module* module);
    void setupAll();
    void loopAll();
    void registerAllRoutes(AsyncWebServer& server);

    // Collect all SPA routes from modules for WebServer registration
    void getSpaRoutes(const char** out, int maxOut, int& count) const;

    // Forward MQTT messages to all modules
    void handleMqttMessage(const String& topic, const String& message);

    // Request device info publish from all modules
    void publishDeviceInfo();

    int moduleCount() const { return _count; }

private:
    Module* _modules[MAX_MODULES] = {};
    int _count = 0;
};

#endif
