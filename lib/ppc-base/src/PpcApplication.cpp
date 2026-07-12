#include "PpcApplication.h"
#include <ESP8266WiFi.h>
#include "PpcConnection.h"
#include "Log.h"
#include "MqttClient.h"
#include "WebServer.h"
#include "Clock.h"
#include "WifiCredentialStorage.h"
#include "ArduinoJson.h"
#include "core/Runtime.h"

// Platform globals (ppc-base files reference these via extern declarations)
PpcConnection ppcConnection;
Log logger("192.168.0.214", 5140, "syslog", "esp8266", 115200);
MqttClient mqttClient;

static Runtime runtime;

PpcApplication::PpcApplication(const char* deviceName, const char* deviceType)
    : _deviceName(deviceName)
    , _deviceType(deviceType)
{}

PpcConnection& PpcApplication::connection() { return ppcConnection; }
Log& PpcApplication::logger() { return ::logger; }
MqttClient& PpcApplication::mqtt() { return mqttClient; }

void PpcApplication::init() {
    ::logger.init();
    ::logger.logf(LOG_INFO, "Booting %s...", _deviceName);

    if (!WifiCredentialStorage::init()) {
        ::logger.log(LOG_ERR, "Failed to initialize WiFi credential storage");
    }

    _deviceId = WiFi.macAddress();
    _deviceId.replace(":", "");
    ::logger.logf(LOG_INFO, "Device ID: %s", _deviceId.c_str());

    mqttClient.begin("mqtt.cc-lab.space", 1883, &ppcConnection);
    mqttClient.setDeviceInfo(_deviceId, String(_deviceName));
    mqttClient.setDeviceType(String(_deviceType));
}

void PpcApplication::addModule(Module* module) {
    runtime.addModule(module);
}

void PpcApplication::start() {
    // MQTT subscription: base routing + module delegation
    mqttClient.subscribe(("devices/" + _deviceId + "/+").c_str(),
        [this](String topic, String message) {
            ::logger.logf(LOG_INFO, "MQTT: %s -> %s", topic.c_str(), message.c_str());
            int lastSlash = topic.lastIndexOf('/');
            if (lastSlash == -1) return;
            String action = topic.substring(lastSlash + 1);

            if (action == "request_info") {
                mqttClient.publishDeviceInfo();
            }
            else if (action == "link") {
                JsonDocument doc;
                if (deserializeJson(doc, message) == DeserializationError::Ok) {
                    if (doc["linked"] == true) {
                        ::logger.logf(LOG_INFO, "Device linked to user: %s",
                                      doc["user_id"].as<String>().c_str());
                    }
                }
            }
            else if (action == "unlink") {
                ::logger.log(LOG_INFO, "Device unlinked from user");
            }
            else {
                // Delegate to modules (e.g. "control" -> TimerMqttAdapter)
                runtime.handleMqttMessage(topic, message);
            }
        });

    // Device info callback: delegate to modules or publish basic info
    mqttClient.setDeviceInfoCallback([this]() {
        if (runtime.moduleCount() > 0) {
            runtime.publishDeviceInfo();
        } else {
            String payload = "{\"device_type\":\"" + String(_deviceType)
                           + "\",\"device_id\":\"" + _deviceId + "\"}";
            mqttClient.publish(("devices/" + _deviceId + "/info").c_str(), payload.c_str());
        }
    });

    // Register module HTTP routes
    if (runtime.moduleCount() > 0) {
        setDeviceRouteHandler([](AsyncWebServer& server) {
            runtime.registerAllRoutes(server);
        });

        // Collect SPA routes from all modules
        const char* spaRoutes[8];
        int spaCount = 0;
        runtime.getSpaRoutes(spaRoutes, 8, spaCount);
        setDeviceSpaRoutes(spaRoutes, spaCount);
    }

    // WiFi
    ppcConnection.startAP();
    String ssid, password;
    if (WifiCredentialStorage::loadCredentials(ssid, password)) {
        ::logger.logf(LOG_INFO, "Found saved credentials for: %s", ssid.c_str());
        ppcConnection.connectToNetwork(ssid.c_str(), password.c_str());
    } else {
        ::logger.log(LOG_INFO, "No saved WiFi credentials, starting in AP mode");
    }

    // Module setup (after platform services are ready)
    runtime.setupAll();

    startServer(&ppcConnection);

    Clock& clock = Clock::getInstance();
    clock.start();

    ::logger.logf(LOG_INFO, "%s setup complete", _deviceName);
}

void PpcApplication::loop() {
    ppcConnection.run();
    Clock::getInstance().run(&ppcConnection);
    loopServer();
    runtime.loopAll();
    mqttClient.loop();
}
