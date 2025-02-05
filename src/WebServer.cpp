#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include "PpcConnection.h"
#include "Clock.h"
#include <WiFiUdp.h>
#include "Log.h"

extern Log logger;

AsyncWebServer server(80);

//WiFiUDP udpClient;
//Syslog syslog(udpClient, "192.168.0.10", 5140, "esp8266", "syslog", LOG_KERN);

void startServer(PpcConnection *ppcConnection) {

    Clock& clock = Clock::getInstance();

    LittleFS.begin();

    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    server.onNotFound([](AsyncWebServerRequest *request) {
        if (request->method() == HTTP_OPTIONS) {
            request->send(200);
        } else {
            request->send(404);
        }
    });
    
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });

    server.on("/about", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });
    
    server.on("/assets/index-Bl7wJD4T.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/assets/index-Bl7wJD4T.js", "text/javascript");
    });

    server.on("/assets/index-CkZt9zC8.css", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/assets/index-CkZt9zC8.css", "text/css");
    });

    server.on("/ppc-bot.jpg", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/ppc-bot.jpg", "image/jpeg");
    });

    server.on("/DSEG7Modern-BoldItalic.woff", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/DSEG7Modern-BoldItalic.woff", "font/woff");
    });

     server.on("/fontawesome.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/fontawesome.js", "text/javascript");
    });

    server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/style.css", "text/css");
    });

    server.on("/script.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/script.js", "text/javascript");
    });

    server.on("/get-time", HTTP_GET, [&clock](AsyncWebServerRequest *request) {
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        root["time"] = clock.getCurrentDate();
        response->setLength();
        request->send(response);
    });

      // sends JSON
    server.on("/wifi-status", HTTP_GET, [ppcConnection](AsyncWebServerRequest* request) {
        logger.logf(LOG_INFO, "Sending wifi status");
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        switch(ppcConnection->getCurrentState()->getType()){
            case DISCONNECTED:
                root["status"] = "disconnected";
                break;
            case CONNECTING:
                root["status"] = "connecting";
                break;
            case CONNECTED:
                root["status"] = "connected";
                root["ssid"] = ppcConnection->getSSID();
                break;
        }

        JsonObject apJsonInfo = root["ap-info"].to<JsonObject>();
        ApInfo apInfo = ppcConnection->getApInfo();
        apJsonInfo["ssid"] = apInfo.ssid;
        apJsonInfo["ip"] = apInfo.ip;

        response->setLength();
        request->send(response);
    });

    server.on("/wifi-scan", HTTP_GET, [](AsyncWebServerRequest *request){
        logger.logf(LOG_INFO, "Scanning for networks");
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        JsonArray data = root["data"].to<JsonArray>();
        
        int n = WiFi.scanComplete();
        if(n == -2){
            WiFi.scanNetworks(true);
        } else if(n){
            for (int i = 0; i < n; ++i){
                //create a json object
                JsonObject network = data.add<JsonObject>();

                network["ssid"] = WiFi.SSID(i);
                network["encryptionType"] = WiFi.encryptionType(i);
                network["RSSI"] = WiFi.RSSI(i);
                network["BSSID"] = WiFi.BSSIDstr(i);
                network["channel"] = WiFi.channel(i);
                network["isHidden"] = WiFi.isHidden(i);

            }
            WiFi.scanDelete();
            if(WiFi.scanComplete() == -2){
                WiFi.scanNetworks(true);
            }
        }
        response->setLength();
        request->send(response);
    });

    server.on("/wifi-connect", HTTP_POST, [ppcConnection](AsyncWebServerRequest *request){
        logger.logf(LOG_INFO, "Connecting to network %s", request->getParam("ssid", true)->value().c_str());
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();

        //get body json params


        if (request->hasParam("ssid", true) && request->hasParam("password", true)) {
            const char* ssid = request->getParam("ssid", true)->value().c_str();
            const char* password = request->getParam("password", true)->value().c_str();

            ppcConnection->connectToNetwork(ssid, password);

            root["status"] = "connecting";
        } else {
            root["status"] = "error";
        }

        response->setLength();
        request->send(response);
    });

    server.on("/wifi-disconnect", HTTP_POST, [ppcConnection, logger](AsyncWebServerRequest *request){
        logger.logf(LOG_INFO, "Disconnecting from network");

        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();

        ppcConnection->disconnectNetwork();

        root["status"] = "disconnected";

        response->setLength();
        request->send(response);
    });

    server.begin();
}