#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "AsyncJson.h"
#include "ArduinoJson.h"

AsyncWebServer server(80);

void startServer() {

    LittleFS.begin();
    
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });

    server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/style.css", "text/css");
    });

    server.on("/script.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/script.js", "text/javascript");
    });

    server.on("/image.jpg", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/image.jpg", "image/jpeg");
    });
  
    server.on("/DSEG7Modern-BoldItalic.woff", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/DSEG7Modern-BoldItalic.woff", "font/woff");
    });

      // sends JSON
    server.on("/json1", HTTP_GET, [](AsyncWebServerRequest* request) {
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        root["hello"] = "world";
        response->setLength();
        request->send(response);
    });

    server.begin();
}