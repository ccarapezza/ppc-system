#include <Arduino.h>
#include "PpcConnection.h"
#include "WebServer.h"
#include "Clock.h"
#include <WiFiUdp.h>
#include <Syslog.h>
#include <Log.h>

PpcConnection ppcConnection;

Log logger("192.168.0.10", 5140, "syslog", "esp8266", 115200);

void setup() {
  ppcConnection.start();
  ppcConnection.startAP();
  ppcConnection.connectToNetwork("Chori-NET", "00434081431"/*, NULL*/);

  logger.init();

  logger.logf(LOG_INFO, "Starting server...");
  startServer(&ppcConnection);

  logger.logf(LOG_INFO, "Starting clock...");
  Clock& clock = Clock::getInstance();
  clock.start();

  logger.logf(LOG_INFO, "Setup complete");
}

void loop() {
  ppcConnection.run();
  Clock& clock = Clock::getInstance();
  clock.run(&ppcConnection);
}

void criticalLoop() {

}

void safeLoop() {

}