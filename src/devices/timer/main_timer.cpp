#include <Arduino.h>
#include <ESP8266WiFi.h>
#include "PpcConnection.h"
#include "WebServer.h"
#include "Clock.h"
#include <WiFiUdp.h>
#include <Syslog.h>
#include <Log.h>
#include "WifiCredentialStorage.h"
#include "DigitalOutput.h"
#include "AlarmsManager.h"
#include "MqttClient.h"
#include "ArduinoJson.h"
#include "TimerRoutes.h"
#include "TimerMqtt.h"

// ---- Pin definitions ----
#define RELAY1_PIN D0
#define RELAY2_PIN D6
#define RELAY3_PIN D7

// ---- Globals ----
DigitalOutput* digitalOutputs[3];
int numDigitalOutputs = 3;

PpcConnection ppcConnection;
Log logger("192.168.0.10", 5140, "syslog", "esp8266", 115200);
AlarmsManager& alarmManager = AlarmsManager::getInstance();
MqttClient mqttClient;

String deviceId   = "";
String deviceName = "PPC-T1000";

// ---- Forward declarations ----
void handleMqttMessage(String topic, String message);

void setup() {
    logger.init();
    logger.log(LOG_INFO, "Booting PPC Timer device...");

    if (!WifiCredentialStorage::init()) {
        logger.log(LOG_ERR, "Failed to initialize WiFi credential storage");
    }
    if (!alarmManager.initStorage()) {
        logger.log(LOG_ERR, "Failed to initialize alarm storage");
    }

    deviceId = WiFi.macAddress();
    deviceId.replace(":", "");
    logger.logf(LOG_INFO, "Device ID: %s", deviceId.c_str());

    mqttClient.begin("mqtt.powerplantcontrol.com.ar", 1883, &ppcConnection);
    mqttClient.setDeviceInfo(deviceId, deviceName);
    mqttClient.setDeviceType("timer");

    mqttClient.subscribe((String("devices/") + deviceId + "/+").c_str(), [](String topic, String message) {
        handleMqttMessage(topic, message);
    });

    mqttClient.setDeviceInfoCallback([]() {
        publishTimerDeviceInfo();
    });

    // Register timer-specific SPA routes (served as index.html)
    setDeviceSpaRoutes({"/timer"});

    // Register timer-specific HTTP routes
    setDeviceRouteHandler([](AsyncWebServer& server) {
        registerTimerRoutes(server);
    });

    ppcConnection.startAP();
    String ssid, password;
    if (WifiCredentialStorage::loadCredentials(ssid, password)) {
        logger.logf(LOG_INFO, "Found saved credentials for: %s", ssid.c_str());
        ppcConnection.connectToNetwork(ssid.c_str(), password.c_str());
    } else {
        logger.log(LOG_INFO, "No saved WiFi credentials, starting in AP mode");
    }

    // Initialize relay outputs
    digitalOutputs[0] = new DigitalOutput(RELAY1_PIN, false);
    digitalOutputs[1] = new DigitalOutput(RELAY2_PIN, false);
    digitalOutputs[2] = new DigitalOutput(RELAY3_PIN, false);
    for (int i = 0; i < numDigitalOutputs; i++) {
        digitalOutputs[i]->begin();
    }

    startServer(&ppcConnection);

    Clock& clock = Clock::getInstance();
    clock.start();

    logger.log(LOG_INFO, "Timer device setup complete");
}

void criticalLoop() {
    ppcConnection.run();
    Clock::getInstance().run(&ppcConnection);
    loopServer();
    alarmManager.alarmLoop();
    mqttClient.loop();
}

void loop() {
    criticalLoop();
}

void handleMqttMessage(String topic, String message) {
    logger.logf(LOG_INFO, "MQTT: %s → %s", topic.c_str(), message.c_str());

    int lastSlash = topic.lastIndexOf('/');
    if (lastSlash == -1) return;
    String action = topic.substring(lastSlash + 1);

    if (action == "request_info") {
        publishTimerDeviceInfo();
    }
    else if (action == "control") {
        DynamicJsonDocument doc(512);
        if (deserializeJson(doc, message) == DeserializationError::Ok) {
            if (String(doc["type"].as<const char*>()) == "digital_output") {
                int outputId = doc["output_id"];
                bool state   = doc["state"];
                if (outputId >= 0 && outputId < numDigitalOutputs) {
                    digitalOutputs[outputId]->setState(state);
                    DynamicJsonDocument resp(256);
                    resp["success"]   = true;
                    resp["output_id"] = outputId;
                    resp["state"]     = digitalOutputs[outputId]->getState();
                    String respPayload;
                    serializeJson(resp, respPayload);
                    String respTopic = "devices/" + deviceId + "/control_response";
                    mqttClient.publish(respTopic.c_str(), respPayload.c_str());
                }
            }
        }
    }
    else if (action == "link") {
        DynamicJsonDocument doc(256);
        if (deserializeJson(doc, message) == DeserializationError::Ok) {
            if (doc["linked"] == true) {
                logger.logf(LOG_INFO, "Device linked to user: %s", doc["user_id"].as<String>().c_str());
            }
        }
    }
    else if (action == "unlink") {
        logger.log(LOG_INFO, "Device unlinked from user");
    }
}
