#include "MqttClient.h"
#include "Log.h"
#include "ArduinoJson.h"

extern Log logger;

void MqttClient::begin(const char* host, uint16_t port, PpcConnection* ppcConnection) {
    mqttHost = host;
    mqttPort = port;
    this->ppcConnection = ppcConnection;

    mqttClient.setClient(wifiClient);
    mqttClient.setServer(mqttHost, mqttPort);

    mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
        String msg;
        for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
        if (messageCallback) messageCallback(String(topic), msg);
    });

    logger.log(LOG_INFO, "MQTT client initialized");
}

void MqttClient::loop() {
    connection_state wifiState = ppcConnection->getCurrentState()->getType();

    if (wifiState == CONNECTED) {
        if (!mqttClient.connected()) {
            unsigned long currentTime = millis();
            if (state == MqttState::DISCONNECTED &&
                (currentTime - lastConnectionAttempt >= connectionRetryInterval)) {
                state = MqttState::CONNECTING;
                attemptConnect();
                lastConnectionAttempt = currentTime;
            }
        } else {
            if (state != MqttState::CONNECTED) {
                state = MqttState::CONNECTED;
                logger.log(LOG_INFO, "MQTT client connected");
            }
        }
    } else {
        if (state != MqttState::DISCONNECTED) {
            if (state == MqttState::CONNECTED) {
                logger.logf(LOG_INFO, "MQTT connection lost: WiFi state changed to %d", wifiState);
                publishDeviceOfflineStatus();
            }
            state = MqttState::DISCONNECTED;
        }
    }

    if (mqttClient.connected()) {
        mqttClient.loop();

        // Rotar link code cada 5 minutos
        if (millis() - lastCodeGenTime >= CODE_ROTATION_INTERVAL) {
            generateAndPublishLinkCode();
        }
    }
}

void MqttClient::setDeviceInfo(const String& id, const String& name) {
    deviceId = id;
    deviceName = name;
}

void MqttClient::setDeviceType(const String& type) {
    deviceType = type;
}

void MqttClient::publish(const char* topic, const char* payload) {
    if (mqttClient.connected()) {
        bool success = mqttClient.publish(topic, payload);
        if (success) {
            logger.logf(LOG_INFO, "Published to %s", topic);
        } else {
            logger.logf(LOG_WARNING, "Failed to publish to %s", topic);
        }
    } else {
        logger.log(LOG_WARNING, "Cannot publish: MQTT not connected");
    }
}

void MqttClient::subscribe(const char* topic, std::function<void(String, String)> callback) {
    messageCallback = callback;
    subscriptionTopic = String(topic);
    if (mqttClient.connected()) {
        mqttClient.subscribe(topic);
    }
}

void MqttClient::attemptConnect() {
    String clientId = "PPC-" + deviceId;
    logger.logf(LOG_INFO, "Attempting MQTT connection as %s...", clientId.c_str());
    logger.logf(LOG_INFO, "MQTT Host: %s, Port: %d", mqttHost, mqttPort);

    String willTopic = "devices/" + deviceId + "/presence";
    String willPayload = "{\"device_id\":\"" + deviceId +
                         "\",\"device_name\":\"" + deviceName +
                         "\",\"device_type\":\"" + deviceType +
                         "\",\"status\":\"offline\"}";

    bool connected = false;
    if (!deviceId.isEmpty()) {
        connected = mqttClient.connect(
            clientId.c_str(),
            nullptr,
            nullptr,
            willTopic.c_str(),
            0,
            false,
            willPayload.c_str()
        );
    } else {
        connected = mqttClient.connect(clientId.c_str());
    }

    if (connected) {
        logger.log(LOG_INFO, "MQTT Connected successfully");
        state = MqttState::CONNECTED;
        resubscribeTopics();
        setupAckSubscription();
        publishDevicePresence();
        generateAndPublishLinkCode();
    } else {
        int errorState = mqttClient.state();
        logger.logf(LOG_ERR, "MQTT connection failed, rc=%d", errorState);
        state = MqttState::DISCONNECTED;
    }
}

void MqttClient::resubscribeTopics() {
    if (!subscriptionTopic.isEmpty() && mqttClient.connected()) {
        mqttClient.subscribe(subscriptionTopic.c_str());
    }
}

void MqttClient::publishDevicePresence() {
    if (mqttClient.connected()) {
        String topic = "devices/" + deviceId + "/presence";
        String payload = "{\"device_id\":\"" + deviceId +
                         "\",\"device_name\":\"" + deviceName +
                         "\",\"device_type\":\"" + deviceType +
                         "\",\"status\":\"online\"}";
        mqttClient.publish(topic.c_str(), payload.c_str(), true);
        logger.logf(LOG_INFO, "Published presence to %s", topic.c_str());
    }
}

void MqttClient::publishDeviceOfflineStatus() {
    if (!deviceId.isEmpty()) {
        String topic = "devices/" + deviceId + "/presence";
        String payload = "{\"device_id\":\"" + deviceId +
                         "\",\"device_name\":\"" + deviceName +
                         "\",\"device_type\":\"" + deviceType +
                         "\",\"status\":\"offline\"}";
        mqttClient.publish(topic.c_str(), payload.c_str(), true);
    }
}

void MqttClient::setupAckSubscription() {
    if (!mqttClient.connected() || deviceId.isEmpty()) return;

    String ackTopic = "devices/" + deviceId + "/ack";
    mqttClient.subscribe(ackTopic.c_str());

    mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
        String topicStr(topic);
        String msg;
        for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

        if (topicStr == "devices/" + deviceId + "/ack") {
            handleAckMessage(msg);
        } else if (messageCallback) {
            messageCallback(topicStr, msg);
        }
    });
}

void MqttClient::handleAckMessage(const String& message) {
    logger.logf(LOG_INFO, "Received ACK: %s", message.c_str());

    bool success = false;
    String userId = "";

    JsonDocument doc;
    DeserializationError jsonError = deserializeJson(doc, message);

    if (jsonError) {
        logger.logf(LOG_ERR, "Failed to parse ACK: %s", jsonError.c_str());
    } else {
        if (!doc["linked"].isNull()) {
            success = doc["linked"].as<bool>();
            if (success && !doc["user_id"].isNull()) {
                userId = doc["user_id"].as<String>();
            }
        } else if (!doc["unlinked"].isNull()) {
            success = doc["unlinked"].as<bool>();
        }
        if (!doc["error"].isNull()) {
            logger.logf(LOG_WARNING, "ACK error: %s", doc["error"].as<String>().c_str());
        }
    }

    linkedToUser = success && !userId.isEmpty();
    if (linkedToUser) {
        linkedUserId = userId;
        logger.logf(LOG_INFO, "Device linked to user: %s", userId.c_str());
    } else if (success && userId.isEmpty()) {
        linkedUserId = "";
        logger.logf(LOG_INFO, "Device unlinked successfully");
    }

    if (linkCallback) {
        linkCallback(success, userId);
        linkCallback = nullptr;
    }
}

void MqttClient::linkDevice(const String& jwt, std::function<void(bool success, String user_id)> callback) {
    if (!mqttClient.connected() || deviceId.isEmpty()) {
        if (callback) callback(false, "");
        return;
    }
    linkCallback = callback;
    String topic = "devices/" + deviceId + "/link";
    String payload = "{\"jwt\":\"" + jwt + "\"}";
    publish(topic.c_str(), payload.c_str());
}

void MqttClient::unlinkDevice() {
    if (!mqttClient.connected() || deviceId.isEmpty()) return;
    String topic = "devices/" + deviceId + "/unlink";
    publish(topic.c_str(), "{}");
    linkedToUser = false;
    linkedUserId = "";
}

String MqttClient::getStateName() {
    if (state == MqttState::CONNECTED) return "Connected";
    if (state == MqttState::CONNECTING) return "Connecting...";
    int errorCode = mqttClient.state();
    switch (errorCode) {
        case -4: return "Connection timeout";
        case -3: return "Connection lost";
        case -2: return "Connection failed";
        case -1: return "Disconnected";
        case 1:  return "Bad protocol";
        case 2:  return "Bad client ID";
        case 3:  return "Server unavailable";
        case 4:  return "Bad credentials";
        case 5:  return "Not authorized";
        default: return "Unknown error (" + String(errorCode) + ")";
    }
}

void MqttClient::setDeviceInfoCallback(std::function<void()> callback) {
    deviceInfoCallback = callback;
}

void MqttClient::publishDeviceInfo() {
    if (!mqttClient.connected()) return;
    if (deviceInfoCallback) {
        deviceInfoCallback();
    }
}

String MqttClient::generateLinkCode() {
    static const char charset[] = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    static const int charsetLen = sizeof(charset) - 1;

    // Seed from chip ID + time window (changes every 5 min)
    uint32_t seed = ESP.getChipId() ^ (millis() / CODE_ROTATION_INTERVAL);
    // Simple hash mixing
    seed = (seed ^ (seed >> 16)) * 0x45d9f3b;
    seed = (seed ^ (seed >> 16)) * 0x45d9f3b;
    seed = seed ^ (seed >> 16);

    String code = "";
    for (int i = 0; i < 6; i++) {
        code += charset[seed % charsetLen];
        seed /= charsetLen;
    }
    return code;
}

void MqttClient::generateAndPublishLinkCode() {
    previousLinkCode = currentLinkCode;
    currentLinkCode = generateLinkCode();
    lastCodeGenTime = millis();

    if (mqttClient.connected() && !deviceId.isEmpty()) {
        String topic = "devices/" + deviceId + "/link_code";
        String payload = "{\"code\":\"" + currentLinkCode + "\"}";
        mqttClient.publish(topic.c_str(), payload.c_str());
        logger.logf(LOG_INFO, "Link code published: %s", currentLinkCode.c_str());
    }
}
