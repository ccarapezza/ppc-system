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
#include <DNSServer.h>
#include "WifiCredentialStorage.h"

extern Log logger;
extern IPAddress apIP;

//const to save filenames in flash
const char INDEX_JS[] PROGMEM = "/assets/index-CueeE-uZ.js";
const char INDEX_CSS[] PROGMEM = "/assets/index-D_5QlPvm.css";

const char *myHostname = "ppc.captiveportal";

DNSServer dnsServer;
AsyncWebServer server(80);

boolean isIp(String str) {
    for (size_t i = 0; i < str.length(); i++) {
      int c = str.charAt(i);
      if (c != '.' && (c < '0' || c > '9')) { return false; }
    }
    return true;
}

class CaptiveRequestHandler : public AsyncWebHandler {
    bool canHandle(__unused AsyncWebServerRequest* request) const {
        String host = request->getHeader("Host")->value();
        boolean isIpHost = isIp(host);
        boolean isMyHostname = host.equals(String(myHostname) + ".local");
        return !isIpHost && !isMyHostname;
    }
  
    void handleRequest(AsyncWebServerRequest* request) {
        logger.logf(LOG_INFO, "CaptiveRequestHandler::handleRequest url: %s", request->url().c_str());
        AsyncWebServerResponse *response = request->beginResponse(302, "text/plain", "");
        response->addHeader("Location", String("http://") + myHostname + ".local/");
        request->send(response);
    }
};

//WiFiUDP udpClient;
//Syslog syslog(udpClient, "192.168.0.10", 5140, "esp8266", "syslog", LOG_KERN);

void startServer(PpcConnection *ppcConnection) {

    Clock& clock = Clock::getInstance();

    LittleFS.begin();

    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
    dnsServer.start(53, "*", apIP);
    server.addHandler(new CaptiveRequestHandler()).setFilter(ON_AP_FILTER);

    server.onNotFound([](AsyncWebServerRequest *request) {
        logger.logf(LOG_INFO, "Not found: %s", request->url().c_str());
        if (request->method() == HTTP_OPTIONS) {
            request->send(200);
        } else {
            request->send(404);
        }
    });
    
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        //capture all request to the captive portal
        logger.logf(LOG_INFO, "CaptiveRequestHandler::handleRequest url: %s", request->url().c_str());
        request->send(LittleFS, "/index.html", "text/html");
    });

    server.on("/about", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });

    server.on("/timer", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });
    
    server.on(INDEX_JS, HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, INDEX_JS, "text/javascript");
    });

    server.on(INDEX_CSS, HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, INDEX_CSS, "text/css");
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
        int params = request->params();
        for(int i=0;i<params;i++){
            const AsyncWebParameter* p = request->getParam(i);
            if(p->isPost()){
                logger.logf(LOG_INFO, "POST[%s]: %s\n", p->name().c_str(), p->value().c_str());
            } else if(!p->isFile()){
                logger.logf(LOG_INFO, "GET[%s]: %s\n", p->name().c_str(), p->value().c_str());
            } else{
                logger.logf(LOG_INFO, "UNDEF[%s]: %s\n", p->name().c_str(), p->value().c_str());
            }
        }

        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        if (request->hasParam("ssid", true) && request->hasParam("password", true)) {
            logger.logf(LOG_INFO, "Connecting to network %s", request->getParam("ssid", true)->value().c_str());
            const char* ssid = request->getParam("ssid", true)->value().c_str();
            const char* password = request->getParam("password", true)->value().c_str();

            WifiCredentialStorage::saveCredentials(ssid, password);
            logger.logf(LOG_INFO, "Saving credentials: %s %s", ssid, password);
            ppcConnection->connectToNetwork(ssid, password);

            root["status"] = "connecting";
        } else {
            logger.logf(LOG_INFO, "Missing ssid or password");
            root["status"] = "error";
        }

        response->setLength();
        request->send(response);
    });

    server.on("/wifi-disconnect", HTTP_POST, [ppcConnection](AsyncWebServerRequest *request){
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

void loopServer() {
    dnsServer.processNextRequest();
}