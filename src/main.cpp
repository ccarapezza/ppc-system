#include <Arduino.h>
#include "PpcConnection.h"
#include "WebServer.h"
#include "Clock.h"

PpcConnection ppcConnection;

void setup() {
  ppcConnection.start();
  ppcConnection.startAP();
  ppcConnection.connectToNetwork("Chori-NET", "00434081431"/*, NULL*/);
  startServer(&ppcConnection);

  Clock& clock = Clock::getInstance();
  clock.start();
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