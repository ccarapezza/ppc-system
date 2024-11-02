#include <Arduino.h>
#include "PpcConnection.h"
#include "WebServer.h"
#include "Clock.h"
#include <WiFiUdp.h>
#include <Syslog.h>
#include <Log.h>

PpcConnection ppcConnection;

Log logger("192.168.0.10", 5140, "syslog", "esp8266"); // Crear una instancia de Log

void setup() {
  ppcConnection.start();
  ppcConnection.startAP();
  ppcConnection.connectToNetwork("Chori-NET", "00434081431"/*, NULL*/);
  startServer(&ppcConnection);

  Clock& clock = Clock::getInstance();
  clock.start();
}

//start time
unsigned long lastTime = 0;
unsigned long timerDelay = 15000;
int iteration = 1;

void messageLoop() {
  if (millis() - lastTime > timerDelay) {
    lastTime = millis();
    logger.log(LOG_INFO, "Begin loop"); // Usar logger

    logger.logf(LOG_ERR, "This is error message no. %d", iteration);
    logger.logf(LOG_INFO, "This is info message no. %d", iteration);
    logger.logf(LOG_DAEMON | LOG_INFO, "This is daemon info message no. %d", iteration);
    logger.log(LOG_INFO, F("End loop"));
    iteration++;
  }
}

void loop() {
  ppcConnection.run();
  Clock& clock = Clock::getInstance();
  clock.run(&ppcConnection);
  messageLoop();
}

void criticalLoop() {

}

void safeLoop() {

}