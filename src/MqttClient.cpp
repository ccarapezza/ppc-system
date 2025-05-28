#include "MqttClient.h"
#include "Log.h"
#include "ArduinoJson.h"

extern Log logger;

void MqttClient::begin(const char* host, uint16_t port, PpcConnection* ppcConnection) {
    mqttHost = host;
    mqttPort = port;
    this->ppcConnection = ppcConnection;

    //wifiClient.setInsecure(); // No TLS verification (puede mejorarse con certificados)
    mqttClient.setClient(wifiClient);
    mqttClient.setServer(mqttHost, mqttPort);
    
    mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
        String msg;
        for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
        if (messageCallback) messageCallback(msg);
    });
    
    logger.log(LOG_INFO, "MQTT client initialized");
}

void MqttClient::loop() {    // Verificar el estado de la conexión WiFi
    connection_state wifiState = ppcConnection->getCurrentState()->getType();
    
    // Solo intentar conectar si el WiFi está conectado
    if (wifiState == CONNECTED) {
        if (!mqttClient.connected()) {
            unsigned long currentTime = millis();
            
            // Si está desconectado y ha pasado suficiente tiempo desde el último intento
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
        }    } else {
        // Si el WiFi no está en estado CONNECTED (está en CONNECTING o DISCONNECTED)
        if (state != MqttState::DISCONNECTED) {
            // Si teníamos una conexión MQTT activa, registrar el cambio
            if (state == MqttState::CONNECTED) {
                logger.logf(LOG_INFO, "MQTT connection lost: WiFi state changed to %d", wifiState);
                // Intentar publicar un mensaje de offline antes de la desconexión
                publishDeviceOfflineStatus();
            }
            state = MqttState::DISCONNECTED;
        }
    }
    
    // Siempre procesar mensajes MQTT si hay conexión
    if (mqttClient.connected()) {
        mqttClient.loop();
    }
}

void MqttClient::setDeviceInfo(const String& id, const String& name) {
    deviceId = id;
    deviceName = name;
}

void MqttClient::publish(const char* topic, const char* payload) {
    if (mqttClient.connected()) {
        bool success = mqttClient.publish(topic, payload);
        if (success) {
            logger.logf(LOG_INFO, "Published message to %s", topic);
        } else {
            logger.logf(LOG_WARNING, "Failed to publish message to %s", topic);
        }
    } else {
        logger.log(LOG_WARNING, "Cannot publish: MQTT not connected");
    }
}

void MqttClient::subscribe(const char* topic, std::function<void(String)> callback) {
    messageCallback = callback;
    subscriptionTopic = String(topic); // Guardar el tema para resubscripciones
    
    if (mqttClient.connected()) {
        logger.logf(LOG_INFO, "Subscribing to %s", topic);
        mqttClient.subscribe(topic);
    } else {
        logger.logf(LOG_INFO, "Subscription to %s pending until connection", topic);
        // El tema quedará guardado y se suscribirá cuando nos conectemos
    }
}

void MqttClient::attemptConnect() {
    String clientId = "PPC-" + deviceId;
    logger.logf(LOG_INFO, "Attempting MQTT connection as %s...", clientId.c_str());
    
    // Preparar mensaje de Last Will Testament (LWT) para detectar desconexiones
    String willTopic = "devices/" + deviceId + "/presence";
    String willPayload = "{\"device_id\":\"" + deviceId + "\",\"device_name\":\"" + deviceName + "\",\"status\":\"offline\"}";
    
    // Conectar con opciones LWT
    bool connected = false;
    if (!deviceId.isEmpty()) {
        // Si tenemos ID de dispositivo, configuramos LWT
        connected = mqttClient.connect(
            clientId.c_str(),         // ID de cliente
            nullptr,                  // usuario (null si no se usa auth)
            nullptr,                  // contraseña (null si no se usa auth)
            willTopic.c_str(),        // tópico LWT
            0,                        // QoS para LWT (0, 1 o 2)
            false,                    // retain para LWT
            willPayload.c_str()       // payload LWT
        );
    } else {
        // Sin ID de dispositivo, conectar sin LWT
        connected = mqttClient.connect(clientId.c_str());
    }
    
    if (connected) {
        logger.log(LOG_INFO, "MQTT Connected successfully");
        state = MqttState::CONNECTED;
        
        // Restaurar las suscripciones si las había
        resubscribeTopics();
        
        // Suscribirse al tópico de ACK para las vinculaciones
        setupAckSubscription();

        // 🔔 Publicar presencia con status online
        publishDevicePresence();
    } else {
        int errorState = mqttClient.state();
        logger.logf(LOG_ERR, "MQTT connection failed, rc=%d", errorState);
        state = MqttState::DISCONNECTED;
    }
}

void MqttClient::resubscribeTopics() {
    if (!subscriptionTopic.isEmpty() && mqttClient.connected()) {
        logger.logf(LOG_INFO, "Resubscribing to topic: %s", subscriptionTopic.c_str());
        mqttClient.subscribe(subscriptionTopic.c_str());
    }
}

void MqttClient::publishDevicePresence() {
    if (mqttClient.connected()) {
        String topic = "devices/" + deviceId + "/presence";
        String payload = "{\"device_id\":\"" + deviceId + "\",\"device_name\":\"" + deviceName + "\",\"status\":\"online\"}";
        
        // Publicar con retain=true para que los nuevos clientes reciban el último estado conocido
        mqttClient.publish(topic.c_str(), payload.c_str(), true);
        logger.logf(LOG_INFO, "Published presence to %s", topic.c_str());
    }
}

void MqttClient::publishDeviceOfflineStatus() {
    // Intentar publicar incluso si ya no estamos conectados, como último intento
    if (!deviceId.isEmpty()) {
        String topic = "devices/" + deviceId + "/presence";
        String payload = "{\"device_id\":\"" + deviceId + "\",\"device_name\":\"" + deviceName + "\",\"status\":\"offline\"}";
        
        // Publicar con retain=true para que los nuevos clientes sepan que estamos offline
        bool success = mqttClient.publish(topic.c_str(), payload.c_str(), true);
        
        if (success) {
            logger.logf(LOG_INFO, "Published offline status to %s", topic.c_str());
        } else {
            logger.log(LOG_WARNING, "Failed to publish offline status before disconnect");
        }
    }
}

void MqttClient::setupAckSubscription() {
    if (!mqttClient.connected() || deviceId.isEmpty()) return;
    
    String ackTopic = "devices/" + deviceId + "/ack";
    logger.logf(LOG_INFO, "Setting up ACK subscription on: %s", ackTopic.c_str());
    
    mqttClient.subscribe(ackTopic.c_str());
    mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
        String topicStr(topic);
        String msg;
        for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
        
        // Si es un ACK para este dispositivo
        if (topicStr == "devices/" + deviceId + "/ack") {
            handleAckMessage(msg);
        } 
        // Otros mensajes de tópicos suscritos
        else if (messageCallback) {
            messageCallback(msg);
        }
    });
}

void MqttClient::handleAckMessage(const String& message) {
    logger.logf(LOG_INFO, "Received ACK: %s", message.c_str());
    
    bool success = false;
    String userId = "";
    String errorMsg = "";
    
    // Parse the JSON message with ArduinoJson
    JsonDocument doc;
    DeserializationError jsonError = deserializeJson(doc, message);
    
    if (jsonError) {
        logger.logf(LOG_ERR, "Failed to parse ACK message: %s", jsonError.c_str());
    } else {
        // Process the ACK message
        if (!doc["linked"].isNull()) {
            success = doc["linked"].as<bool>();
            
            if (success && !doc["user_id"].isNull()) {
                userId = doc["user_id"].as<String>();
            }
        } else if (!doc["unlinked"].isNull()) {
            // Handle unlink confirmation
            success = doc["unlinked"].as<bool>();
        }
        
        if (!doc["error"].isNull()) {
            errorMsg = doc["error"].as<String>();
            logger.logf(LOG_WARNING, "ACK error: %s", errorMsg.c_str());
        }
    }
    
    // Update device link status
    linkedToUser = success && !userId.isEmpty();
    if (linkedToUser) {
        linkedUserId = userId;
        logger.logf(LOG_INFO, "Device linked to user: %s", userId.c_str());
    } else if (success && userId.isEmpty()) {
        // Successfully unlinked
        linkedUserId = "";
        logger.logf(LOG_INFO, "Device unlinked successfully");
    }
    
    // Call the callback if it exists
    if (linkCallback) {
        linkCallback(success, userId);
        linkCallback = nullptr; // Clear after use
    }
}

void MqttClient::linkDevice(const String& jwt, std::function<void(bool success, String user_id)> callback) {
    if (!mqttClient.connected() || deviceId.isEmpty()) {
        logger.log(LOG_WARNING, "Cannot link: MQTT not connected or device ID not set");
        if (callback) callback(false, "");
        return;
    }
    
    // Guardar el callback para cuando llegue la respuesta
    linkCallback = callback;
    
    // Construir el tópico y payload para la vinculación
    String topic = "devices/" + deviceId + "/link";
    String payload = "{\"jwt\":\"" + jwt + "\"}";
    
    logger.logf(LOG_INFO, "Requesting device link with topic: %s", topic.c_str());
    publish(topic.c_str(), payload.c_str());
}

void MqttClient::unlinkDevice() {
    if (!mqttClient.connected() || deviceId.isEmpty()) {
        logger.log(LOG_WARNING, "Cannot unlink: MQTT not connected or device ID not set");
        return;
    }
    
    // Construir el tópico para la desvinculación
    String topic = "devices/" + deviceId + "/unlink";
    String payload = "{}"; // Payload vacío, el server.mjs no requiere datos adicionales para unlink
    
    logger.logf(LOG_INFO, "Requesting device unlink with topic: %s", topic.c_str());
    publish(topic.c_str(), payload.c_str());
    
    // Resetear el estado de vinculación inmediatamente
    // (podríamos esperar una confirmación, pero el servidor no la envía para unlink)
    linkedToUser = false;
    linkedUserId = "";
}

String MqttClient::getStateName() {
    if (state == MqttState::CONNECTED) {
        return "Connected";
    } else if (state == MqttState::CONNECTING) {
        return "Connecting...";
    } else {
        int errorCode = mqttClient.state();
        switch (errorCode) {
            case -4: return "Connection timeout";
            case -3: return "Connection lost";
            case -2: return "Connection failed";
            case -1: return "Disconnected";
            case 1: return "Bad protocol";
            case 2: return "Bad client ID";
            case 3: return "Server unavailable";
            case 4: return "Bad credentials";
            case 5: return "Not authorized";
            default: return "Unknown error (" + String(errorCode) + ")";
        }
    }
}
