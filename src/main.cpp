#include <Arduino.h>
#include "PpcConnection.h"
#include "WebServer.h"

PpcConnection ppcConnection;

void setup() {
  ppcConnection.start();
  ppcConnection.getNetworks(false);
  ppcConnection.startAP();
  ppcConnection.connectToNetwork("Chori-NET", "00434081431");
  startServer();
}

void loop() {
  //connection.run();
}

void criticalLoop() {

}

void safeLoop() {

}