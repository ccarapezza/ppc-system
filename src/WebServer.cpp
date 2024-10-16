#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include "PpcConnection.h"

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

    server.on("/scan", HTTP_GET, [](AsyncWebServerRequest *request){
        //TODO: Esta funcion funciona correctamente
        String json = "[";
        int n = WiFi.scanComplete();
        if(n == -2){
        WiFi.scanNetworks(true);
        } else if(n){
        for (int i = 0; i < n; ++i){
            if(i) json += ",";
            json += "{";
            json += "\"rssi\":"+String(WiFi.RSSI(i));
            json += ",\"ssid\":\""+WiFi.SSID(i)+"\"";
            json += ",\"bssid\":\""+WiFi.BSSIDstr(i)+"\"";
            json += ",\"channel\":"+String(WiFi.channel(i));
            json += ",\"secure\":"+String(WiFi.encryptionType(i));
            json += ",\"hidden\":"+String(WiFi.isHidden(i)?"true":"false");
            json += "}";
        }
        WiFi.scanDelete();
        if(WiFi.scanComplete() == -2){
            WiFi.scanNetworks(true);
        }
        }
        json += "]";
        request->send(200, "text/json", json);
        json = String();
    });

    server.on("/wifi-scan", HTTP_GET, [](AsyncWebServerRequest* request) {
        //TODO: revisar y eliminar
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        JsonArray data = root.createNestedArray("data");

        std::vector<NetworkInfo> networks = PpcConnection::getNetworks(false);

        for (int i = 0; i < networks.size(); i++) {
            //create a json object
            JsonObject network = data.createNestedObject();
            network["ssid"] = networks[i].ssid;
            network["encryptionType"] = networks[i].encryptionType;
            network["RSSI"] = networks[i].RSSI;
            network["BSSID"] = networks[i].BSSID;
            network["channel"] = networks[i].channel;   
            network["isHidden"] = networks[i].isHidden;
        }

        response->setLength();
        request->send(response);
    });

    server.begin();
}