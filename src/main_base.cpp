#include <Arduino.h>
#include <ESP8266WiFi.h>
#include "PpcConnection.h"
#include "WebServer.h"
#include "Clock.h"
#include <WiFiUdp.h>
#include <Syslog.h>
#include <Log.h>
#include "WifiCredentialStorage.h"
#include "MqttClient.h"

// ---- Globals ----
PpcConnection ppcConnection;
Log logger("192.168.0.10", 5140, "syslog", "esp8266", 115200);
MqttClient mqttClient;

String deviceId   = "";
String deviceName = "PPC-BASE";

void handleMqttMessage(String topic, String message) {
    logger.logf(LOG_INFO, "MQTT: %s → %s", topic.c_str(), message.c_str());
    int lastSlash = topic.lastIndexOf('/');
    if (lastSlash == -1) return;
    String action = topic.substring(lastSlash + 1);

    if (action == "request_info") {
        // Publish minimal base info
        String payload = "{\"device_type\":\"base\",\"time\":\"" + Clock::getInstance().getCurrentDate() + "\"}";
        String infoTopic = "devices/" + deviceId + "/info";
        mqttClient.publish(infoTopic.c_str(), payload.c_str());
    }
    else if (action == "link") {
        logger.log(LOG_INFO, "Device link confirmation received");
    }
    else if (action == "unlink") {
        logger.log(LOG_INFO, "Device unlinked");
    }
}

void setup() {
    logger.init();
    logger.log(LOG_INFO, "Booting PPC Base device...");

    if (!WifiCredentialStorage::init()) {
        logger.log(LOG_ERR, "Failed to initialize WiFi credential storage");
    }

    deviceId = WiFi.macAddress();
    deviceId.replace(":", "");
    logger.logf(LOG_INFO, "Device ID: %s", deviceId.c_str());

    mqttClient.begin("mqtt.powerplantcontrol.com.ar", 1883, &ppcConnection);
    mqttClient.setDeviceInfo(deviceId, deviceName);
    mqttClient.setDeviceType("base");

    mqttClient.subscribe((String("devices/") + deviceId + "/+").c_str(), [](String topic, String message) {
        handleMqttMessage(topic, message);
    });

    ppcConnection.startAP();
    String ssid, password;
    if (WifiCredentialStorage::loadCredentials(ssid, password)) {
        logger.logf(LOG_INFO, "Found saved credentials for: %s", ssid.c_str());
        ppcConnection.connectToNetwork(ssid.c_str(), password.c_str());
    } else {
        logger.log(LOG_INFO, "No saved WiFi credentials, starting in AP mode");
    }

    // No device-specific routes — base only
    startServer(&ppcConnection);

    Clock& clock = Clock::getInstance();
    clock.start();

    logger.log(LOG_INFO, "Base device setup complete");
}

void criticalLoop() {
    ppcConnection.run();
    Clock::getInstance().run(&ppcConnection);
    loopServer();
    mqttClient.loop();
}

void loop() {
    criticalLoop();
}
