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

// Definición de pines para salidas digitales
#define RELAY1_PIN D0  // Ejemplo de pin para relay 1
#define RELAY2_PIN D6  // Ejemplo de pin para relay 2
#define RELAY3_PIN D7  // Ejemplo de pin para relay 3

// Array de salidas digitales
DigitalOutput* digitalOutputs[3];  // Cambia el tamaño según el número de salidas digitales
int numDigitalOutputs = 3;  // Cambia el número según el número de salidas digitales

PpcConnection ppcConnection;

Log logger("192.168.0.10", 5140, "syslog", "esp8266", 115200);

AlarmsManager& alarmManager = AlarmsManager::getInstance();  // Get the alarm manager instance

MqttClient mqttClient;

// ID único del dispositivo (usar MAC por defecto)
String deviceId = "";
String deviceName = "PPC-T1000"; // Cambia esto según necesites

// Declaraciones forward de funciones
void publishCurrentDeviceInfo();
void handleMqttMessage(String topic, String message);

void setup() {
  // Initialize serial and logging
  logger.init();
  logger.log(LOG_INFO, "Booting PPC System...");
  
  // Initialize the WiFi credential storage
  if (!WifiCredentialStorage::init()) {
    logger.log(LOG_ERR, "Failed to initialize WiFi credential storage");
  }
  
  // Initialize the alarm storage and load saved alarms
  if (!alarmManager.initStorage()) {
    logger.log(LOG_ERR, "Failed to initialize alarm storage");
  }
  
  // Generar ID único del dispositivo basado en la dirección MAC
  deviceId = WiFi.macAddress();
  deviceId.replace(":", ""); // Eliminar los dos puntos para un ID limpio
  logger.logf(LOG_INFO, "Device ID: %s", deviceId.c_str());
  
  mqttClient.begin("mqtt.powerplantcontrol.com.ar", 1883, &ppcConnection);  // o IP/broker local
  //mqttClient.begin("192.168.0.36", 1883, &ppcConnection);  // o IP/broker local
  mqttClient.setDeviceInfo(deviceId, deviceName);
  
  // Configurar callback para manejar mensajes MQTT del dispositivo
  mqttClient.subscribe((String("devices/") + deviceId + "/+").c_str(), [](String topic, String message) {
    handleMqttMessage(topic, message);
  });
  
  // Configurar callback para generar información del dispositivo
  mqttClient.setDeviceInfoCallback([]() {
    publishCurrentDeviceInfo();
  });
  
  // Try to load saved WiFi credentials
  ppcConnection.startAP();
  String ssid, password;
  if (WifiCredentialStorage::loadCredentials(ssid, password)) {
    logger.logf(LOG_INFO, "Found saved credentials for network: %s", ssid.c_str());
    // Connect to the saved network
    ppcConnection.connectToNetwork(ssid.c_str(), password.c_str());
  } else {
    // No saved credentials, start in AP mode by default
    logger.log(LOG_INFO, "No saved WiFi credentials found, starting in AP mode");
  }
  
  // Continue with normal setup

  // Inicialización de las salidas digitales
  digitalOutputs[0] = new DigitalOutput(RELAY1_PIN, false);  // false si lógica normal, true si lógica invertida
  digitalOutputs[1] = new DigitalOutput(RELAY2_PIN, false);  // false si lógica normal, true si lógica invertida
  digitalOutputs[2] = new DigitalOutput(RELAY3_PIN, false);  // false si lógica normal, true si lógica invertida
  
  // Inicializar cada salida digital
  for (int i = 0; i < numDigitalOutputs; i++) {
    digitalOutputs[i]->begin();
  }

  logger.logf(LOG_INFO, "Starting server...");
  startServer(&ppcConnection);

  logger.logf(LOG_INFO, "Starting clock...");
  Clock& clock = Clock::getInstance();
  clock.start();

  logger.logf(LOG_INFO, "Setup complete");
}

void criticalLoop() {
  ppcConnection.run();
  Clock& clock = Clock::getInstance();
  clock.run(&ppcConnection);
  loopServer();
  alarmManager.alarmLoop();
  mqttClient.loop();
}

void safeLoop() {
  
}

void loop() {
  criticalLoop();
  //safeLoop();
}

// Función para publicar información completa del dispositivo
void publishCurrentDeviceInfo() {
  DynamicJsonDocument doc(2048);
  
  // Información de salidas digitales
  JsonArray outputs = doc["digitalOutputs"].to<JsonArray>();
  for (int i = 0; i < numDigitalOutputs; i++) {
    JsonObject output = outputs.createNestedObject();
    output["id"] = i;
    output["pin"] = digitalOutputs[i]->getPin();
    output["state"] = digitalOutputs[i]->getState();
  }
  
  // Información de tiempo
  Clock& clock = Clock::getInstance();
  doc["time"]["time"] = clock.getCurrentDate();
  
  // Información de alarmas
  String alarmsJson = alarmManager.getAlarms();
  DynamicJsonDocument alarmDoc(1024);
  deserializeJson(alarmDoc, alarmsJson);
  doc["alarms"] = alarmDoc["alarms"];
  
  // Serializar y publicar
  String payload;
  serializeJson(doc, payload);
  
  String topic = "devices/" + deviceId + "/info";
  mqttClient.publish(topic.c_str(), payload.c_str());
  
  logger.logf(LOG_INFO, "Published device info: %s", payload.c_str());
}

// Función para manejar mensajes MQTT entrantes
void handleMqttMessage(String topic, String message) {
  logger.logf(LOG_INFO, "MQTT Topic: %s, Message: %s", topic.c_str(), message.c_str());
  
  // Parsear el topic para determinar la acción
  int lastSlash = topic.lastIndexOf('/');
  if (lastSlash == -1) return;
  
  String action = topic.substring(lastSlash + 1);
  
  if (action == "request_info") {
    // Solicitud de información del dispositivo
    publishCurrentDeviceInfo();
  }
  else if (action == "control") {
    // Control de salidas digitales
    DynamicJsonDocument doc(512);
    if (deserializeJson(doc, message) == DeserializationError::Ok) {
      String type = doc["type"];
      
      if (type == "digital_output") {
        int outputId = doc["output_id"];
        bool state = doc["state"];
        
        if (outputId >= 0 && outputId < numDigitalOutputs) {
          digitalOutputs[outputId]->setState(state);
          logger.logf(LOG_INFO, "Digital output %d set to %s", outputId, state ? "ON" : "OFF");
          
          // Enviar confirmación
          DynamicJsonDocument response(256);
          response["success"] = true;
          response["output_id"] = outputId;
          response["state"] = digitalOutputs[outputId]->getState();
          
          String responsePayload;
          serializeJson(response, responsePayload);
          
          String responseTopic = "devices/" + deviceId + "/control_response";
          mqttClient.publish(responseTopic.c_str(), responsePayload.c_str());
        }
      }
    }
  }
  else if (action == "link") {
    // Manejar vinculación desde el servidor
    DynamicJsonDocument doc(256);
    if (deserializeJson(doc, message) == DeserializationError::Ok) {
      if (doc["linked"] == true) {
        logger.logf(LOG_INFO, "Device linked to user: %s", doc["user_id"].as<String>().c_str());
      }
    }
  }
  else if (action == "unlink") {
    // Manejar desvinculación
    logger.log(LOG_INFO, "Device unlinked from user");
  }
}