#include <Arduino.h>
#include "PpcConnection.h"
#include "WebServer.h"

PpcConnection ppcConnection;

void setup() {
  ppcConnection.start();
  ppcConnection.startAP();
  ppcConnection.connectToNetwork("Chori-NET", "00434081431s"/*, NULL*/);
  startServer(&ppcConnection);
}

void loop() {
  ppcConnection.run();
}

void criticalLoop() {

}

void safeLoop() {

}