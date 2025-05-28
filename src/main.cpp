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

void setup() {
  // Initialize serial and logging
  logger.init();
  logger.log(LOG_INFO, "Booting PPC System...");
  
  // Initialize the WiFi credential storage
  if (!WifiCredentialStorage::init()) {
    logger.log(LOG_ERR, "Failed to initialize WiFi credential storage");
  }
  
  // Generar ID único del dispositivo basado en la dirección MAC
  deviceId = WiFi.macAddress();
  deviceId.replace(":", ""); // Eliminar los dos puntos para un ID limpio
  logger.logf(LOG_INFO, "Device ID: %s", deviceId.c_str());
  
  //mqttClient.begin("mqtt.powerplantcontrol.com.ar", 8883, &ppcConnection);  // o IP/broker local
  mqttClient.begin("192.168.0.10", 1883, &ppcConnection);  // o IP/broker local
  mqttClient.setDeviceInfo(deviceId, deviceName);
  mqttClient.subscribe((String("ppc/") + deviceId).c_str(), [](String message) {
    logger.logf(LOG_INFO, "MQTT Message: %s", message.c_str());
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