#include "WebSocketClient.h"
#include "ArduinoJson.h"
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

extern Log logger;

// Inicializar la variable estática para el patrón singleton
WebSocketClient* WebSocketClient::instance = nullptr;

WebSocketClient::WebSocketClient() : 
    wsConnected(false), 
    wsRegistered(false),
    lastHeartbeat(0) {
    // Guardar la instancia para los callbacks estáticos
    instance = this;
}

void WebSocketClient::begin(const char* host, uint16_t port) {
    serverHost = host;
    serverPort = port;
    logger.logf(LOG_INFO, "WebSocket configurado para conectar a: %s:%d", host, port);
}

void WebSocketClient::setDeviceInfo(const String& id, const String& name) {
    deviceId = id;
    deviceName = name;
    logger.logf(LOG_INFO, "Device ID: %s, Device Name: %s", deviceId.c_str(), deviceName.c_str());
}

void WebSocketClient::connect() {
    startSocketClient();
}

void WebSocketClient::loop() {
    unsigned long now = millis();
    if (now - lastWebSocketLoop > 50) { // solo cada 50ms
        socketIO.loop();
        lastWebSocketLoop = now;
    }

    if (WiFi.status() == WL_CONNECTED) {
        // Si el cliente WebSocket no está conectado, intentar reconectar
        if (!wsConnected) {
            startSocketClient();
            wsConnected = true;
            lastHeartbeat = millis(); // Reiniciar el temporizador de heartbeat
        }
    } else {
        // Si no hay conexión WiFi, desconectar el cliente WebSocket
        if (wsConnected) {
            socketIO.disconnect();
            wsConnected = false;
        }
    }
}

bool WebSocketClient::isConnected() const {
    return wsConnected;
}

bool WebSocketClient::isRegistered() const {
    return wsRegistered;
}

void WebSocketClient::registerDevice() {
    // Enviar el ID y nombre del dispositivo al servidor
    JsonDocument doc;
    JsonArray array = doc.to<JsonArray>();
    array.add("register-device");   // Primer elemento: nombre del evento
    
    JsonObject data = array.add<JsonObject>();
    data["id"] = deviceId;
    data["name"] = deviceName;
    data["ssid"] = WiFi.SSID();
    data["ip"] = WiFi.localIP().toString();
    data["mac"] = WiFi.macAddress();
    data["rssi"] = WiFi.RSSI();
    data["status"] = "online";
    
    String output;
    serializeJson(doc, output);

    socketIO.send(sIOtype_EVENT, output.c_str(), output.length());
    logger.logf(LOG_INFO, "Device registered with ID: %s", deviceId.c_str());
    wsRegistered = true;
}

void WebSocketClient::startSocketClient() {
    // Iniciar el cliente WebSocket
    if(serverPort == 443) {
        // Si el puerto es 443, usar SSL
        socketIO.beginSSL(serverHost.c_str(), serverPort, "/socket.io/?EIO=4");
        logger.log(LOG_INFO, "Iniciando conexión WebSocket SSL con Socket.IO");
    } else {
        // Si no, usar WebSocket normal
        socketIO.begin(serverHost.c_str(), serverPort, "/socket.io/?EIO=4");
        logger.log(LOG_INFO, "Iniciando conexión WebSocket con Socket.IO");
    }
    logger.logf(LOG_INFO, "Conectando a %s:%d", serverHost.c_str(), serverPort);
    
    // Configurar el callback para eventos
    socketIO.onEvent(WebSocketClient::onSocketEvent);
    socketIO.setReconnectInterval(10000);
}

// Callback para eventos Socket.IO
void WebSocketClient::onSocketEvent(socketIOmessageType_t type, uint8_t* payload, size_t length) {
    // Verificar que la instancia exista
    if (!instance) {
        return;
    }
    
    switch(type) {
        case sIOtype_DISCONNECT:
            logger.log(LOG_INFO, "Socket.IO disconnected");
            instance->wsConnected = false;
            instance->wsRegistered = false;
            break;
            
        case sIOtype_CONNECT:
            logger.logf(LOG_INFO, "Socket.IO connected to URL: %s", payload);
            instance->wsConnected = true;
            
            // Unirse al namespace por defecto (no auto join en Socket.IO V3)
            instance->socketIO.send(sIOtype_CONNECT, "/");
            
            // Registrar el dispositivo si no está registrado
            if(!instance->wsRegistered) {
                instance->registerDevice();
            }
            break;
            
        case sIOtype_EVENT:
            logger.logf(LOG_INFO, "Socket.IO event received: %s", payload);
            break;
            
        case sIOtype_ACK:
            logger.logf(LOG_INFO, "Socket.IO ACK received: %s", payload);
            break;
            
        case sIOtype_ERROR:
            logger.logf(LOG_ERR, "Socket.IO ERROR received: %s", payload);
            break;
            
        case sIOtype_BINARY_EVENT:
            logger.logf(LOG_INFO, "Socket.IO BINARY EVENT received: %s", payload);
            break;
            
        case sIOtype_BINARY_ACK:
            logger.logf(LOG_INFO, "Socket.IO BINARY ACK received: %s", payload);
            break;
            
        default:
            logger.logf(LOG_ERR, "Unknown Socket.IO event received: %d", type);
            break;
    }
}