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
    void publish(const char* topic, const char* payload);
    void subscribe(const char* topic, std::function<void(String message)> callback);
    bool isConnected() { return mqttClient.connected(); }
    int getState() { return mqttClient.state(); }
    String getStateName(); // Eliminado el modificador const
    MqttState getMqttState() const { return state; }
    
    // Nuevos métodos para vincular/desvincular con el servidor MQTT
    void linkDevice(const String& jwt, std::function<void(bool success, String user_id)> callback = nullptr);
    void unlinkDevice();
    bool isLinked() const { return linkedToUser; }
    String getLinkedUserId() const { return linkedUserId; }

private:
    String deviceId;
    String deviceName;

    WiFiClient wifiClient;
    PubSubClient mqttClient;
    PpcConnection* ppcConnection;

    std::function<void(String)> messageCallback;
    String subscriptionTopic;
    
    // Variables para el manejo de la vinculación
    bool linkedToUser = false;
    String linkedUserId = "";
    std::function<void(bool success, String user_id)> linkCallback = nullptr;

    const char* mqttHost;
    uint16_t mqttPort;
    
    MqttState state = MqttState::DISCONNECTED;
    unsigned long lastConnectionAttempt = 0;
    const unsigned long connectionRetryInterval = 5000; // 5 segundos entre intentos de conexión

    void attemptConnect();    void resubscribeTopics();
    void publishDevicePresence();
    void publishDeviceOfflineStatus();
    void setupAckSubscription();
    void handleAckMessage(const String& message);
};

#endif
