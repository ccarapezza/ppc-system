#include "Runtime.h"

void Runtime::addModule(Module* module) {
    if (_count < MAX_MODULES) {
        _modules[_count++] = module;
    }
}

void Runtime::setupAll() {
    for (int i = 0; i < _count; i++) {
        _modules[i]->setup();
    }
}

void Runtime::loopAll() {
    for (int i = 0; i < _count; i++) {
        _modules[i]->loop();
    }
}

void Runtime::registerAllRoutes(AsyncWebServer& server) {
    for (int i = 0; i < _count; i++) {
        _modules[i]->registerRoutes(server);
    }
}

void Runtime::getSpaRoutes(const char** out, int maxOut, int& count) const {
    count = 0;
    for (int i = 0; i < _count && count < maxOut; i++) {
        int mc = 0;
        const char** routes = _modules[i]->getSpaRoutes(mc);
        for (int j = 0; j < mc && count < maxOut; j++) {
            out[count++] = routes[j];
        }
    }
}

void Runtime::handleMqttMessage(const String& topic, const String& message) {
    for (int i = 0; i < _count; i++) {
        _modules[i]->handleMqttMessage(topic, message);
    }
}

void Runtime::publishDeviceInfo() {
    for (int i = 0; i < _count; i++) {
        _modules[i]->publishDeviceInfo();
    }
}
