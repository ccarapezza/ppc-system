#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <PubSubClient.h>
#include <WiFiClient.h>
#include <functional>
#include <Arduino.h>
#include "PpcConnection.h"

enum class MqttState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED
};

class MqttClient {
public:
    void begin(const char* host, uint16_t port, PpcConnection* ppcConnection);
    void loop();
    void setDeviceInfo(const String& id, const String& name);
    // Set the device type reported in presence messages (e.g. "timer", "thermo")
    void setDeviceType(const String& type);
    void publish(const char* topic, const char* payload);
    void subscribe(const char* topic, std::function<void(String topic, String message)> callback);
    bool isConnected() { return mqttClient.connected(); }
    int getState() { return mqttClient.state(); }
    String getStateName();
    MqttState getMqttState() const { return state; }

    void linkDevice(const String& jwt, std::function<void(bool success, String user_id)> callback = nullptr);
    void unlinkDevice();
    bool isLinked() const { return linkedToUser; }
    String getLinkedUserId() const { return linkedUserId; }

    void publishDeviceInfo();
    void setDeviceInfoCallback(std::function<void()> callback);

    String getCurrentLinkCode() const { return currentLinkCode; }

private:
    String deviceId;
    String deviceName;
    String deviceType = "base";  // Default type; set by device firmware

    WiFiClient wifiClient;
    PubSubClient mqttClient;
    PpcConnection* ppcConnection;

    std::function<void(String, String)> messageCallback;
    String subscriptionTopic;

    bool linkedToUser = false;
    String linkedUserId = "";
    std::function<void(bool success, String user_id)> linkCallback = nullptr;

    std::function<void()> deviceInfoCallback = nullptr;

    const char* mqttHost;
    uint16_t mqttPort;

    MqttState state = MqttState::DISCONNECTED;
    unsigned long lastConnectionAttempt = 0;
    const unsigned long connectionRetryInterval = 35000;

    void attemptConnect();
    void resubscribeTopics();
    void publishDevicePresence();
    void publishDeviceOfflineStatus();
    void setupAckSubscription();
    void handleAckMessage(const String& message);

    // Link code
    String currentLinkCode;
    String previousLinkCode;
    unsigned long lastCodeGenTime = 0;
    static const unsigned long CODE_ROTATION_INTERVAL = 300000; // 5 minutos
    void generateAndPublishLinkCode();
    String generateLinkCode();
};

#endif
