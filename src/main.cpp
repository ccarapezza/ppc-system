#include <Arduino.h>
#include "PpcConnection.h"
#include "WebServer.h"
#include "Clock.h"
#include <WiFiUdp.h>
#include <Syslog.h>
#include <Log.h>
#include "WifiCredentialStorage.h" // Add this include

PpcConnection ppcConnection;

Log logger("192.168.0.10", 5140, "syslog", "esp8266", 115200);

void setup() {
  // Initialize serial and logging
  logger.init();
  logger.log(LOG_INFO, "Booting PPC System...");
  
  // Initialize the WiFi credential storage
  if (!WifiCredentialStorage::init()) {
    logger.log(LOG_ERR, "Failed to initialize WiFi credential storage");
  }
  
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
}

void safeLoop() {
  
}

void loop() {
  criticalLoop();
  //safeLoop();
}