#ifndef WEBSOCKET_CLIENT_H
#define WEBSOCKET_CLIENT_H

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <SocketIOclient.h>
#include <ArduinoJson.h>
#include "Log.h"

// Clase para manejar la conexión WebSocket con el servidor
class WebSocketClient {
public:
    WebSocketClient();
    // Métodos de inicialización y conexión
    void begin(const char* host, uint16_t port);
    void setDeviceInfo(const String& id, const String& name);
    void connect();
    
    // Método principal que maneja toda la lógica de WebSocket
    void loop();
    
    // Métodos para interactuar con el servidor
    bool isConnected() const;
    bool isRegistered() const;
    void registerDevice();
    void sendStatus(const String& status);
    
    private:
    // Propiedades de configuración
    SocketIOclient socketIO;
    String serverHost;
    uint16_t serverPort;
    String deviceId;
    String deviceName;
    unsigned long lastWebSocketLoop;
    
    // Estado de conexión
    bool wsConnected;
    bool wsRegistered;
    unsigned long lastHeartbeat;
    
    // Métodos privados
    void startSocketClient();
    
    // Callback para eventos Socket.IO
    static void onSocketEvent(socketIOmessageType_t type, uint8_t * payload, size_t length);
    
    // Necesitamos una instancia estática para el callback
    static WebSocketClient* instance;
};

#endif