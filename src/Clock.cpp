#include <Arduino.h>
#include <Wire.h> // must be included here so that Arduino library object file references work
#include <RtcDS1307.h>
#include <PpcConnection.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "Clock.h"

/*
TwoWire tWire;
tWire.begin(2, 0); 
RtcDS1307<TwoWire> Rtc(tWire);
WiFiUDP ntpUDP;
*/

/*
//#define NTP_SERVER "0.us.pool.ntp.org"
#define NTP_SERVER "3.ar.pool.ntp.org"

// You can specify the time server pool and the offset (in seconds, can be
// changed later with setTimeOffset() ). Additionally you can specify the
// update interval (in milliseconds, can be changed using setUpdateInterval() ).
NTPClient timeClient(ntpUDP, NTP_SERVER, 3600, 60000);
*/

// Definición de la variable estática.
Clock* Clock::instance = nullptr;

// Constructor privado
Clock::Clock() : Rtc(tWire) {
    // Inicialización del reloj (si es necesario)
    Serial.begin(9600); // Ejemplo de inicialización del puerto serie
    tWire.begin(2, 0); 
    Rtc.Begin();
}

// Destructor privado
Clock::~Clock() {
    // Limpiar recursos (si es necesario)
}

// Método estático que controla el acceso a la instancia Clock.
Clock& Clock::getInstance() {
    if (instance == nullptr) {
        instance = new Clock();
    }
    return *instance;
}

void Clock::start() {
  Serial.begin(115200);
  Serial.println("Starting clock...");
   
  if (!Rtc.IsDateTimeValid()) {
    Serial.println("RTC lost confidence in the DateTime!");
    Rtc.SetIsRunning(true);
    RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
    Rtc.SetDateTime(compiled);
    if (!Rtc.GetIsRunning()) {
      Serial.println("RTC was unable to start");
    }
  }
  Serial.println("Clock started.");
}

String Clock::getCurrentDate() {
  if (!Rtc.IsDateTimeValid()) {
    return "RTC lost confidence in the DateTime!";
  }
  String currentTime;
  RtcDateTime now = Rtc.GetDateTime();
  char datestring[20];

  snprintf_P(datestring,
             countof(datestring),
             PSTR("%02u/%02u/%04u %02u:%02u:%02u"),
             now.Month(),
             now.Day(),
             now.Year(),
             now.Hour(),
             now.Minute(),
             now.Second());

  currentTime = datestring;
  return currentTime;
}


void Clock::run(PpcConnection *ppcConn) {
  if (ppcConn != NULL && ppcConn->getCurrentState()->getType() == CONNECTED) {
    withInternet();
  } else {
    withoutInternet();
  }
}

void Clock::withInternet() {
  //timeClient.update();
}

void Clock::withoutInternet() {

}