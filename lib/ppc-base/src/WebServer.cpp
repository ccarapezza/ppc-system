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
#include <ESP8266HTTPClient.h>
#include "MqttClient.h"
#include "WebServer.h"
#include <vector>

extern Log logger;
extern IPAddress apIP;

static std::function<void(AsyncWebServer&)> _deviceRouteHandler = nullptr;
static std::vector<const char*> _deviceSpaRoutes;

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
        logger.logf(LOG_INFO, "CaptiveRequestHandler: %s", request->url().c_str());
        AsyncWebServerResponse *response = request->beginResponse(302, "text/plain", "");
        response->addHeader("Location", String("http://") + myHostname + ".local/");
        request->send(response);
    }
};

void setDeviceRouteHandler(std::function<void(AsyncWebServer&)> handler) {
    _deviceRouteHandler = handler;
}

void setDeviceSpaRoutes(std::initializer_list<const char*> routes) {
    _deviceSpaRoutes.assign(routes.begin(), routes.end());
}

void startServer(PpcConnection *ppcConnection) {

    Clock& clock = Clock::getInstance();

    LittleFS.begin();

    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
    dnsServer.start(53, "*", apIP);
    server.addHandler(new CaptiveRequestHandler()).setFilter(ON_AP_FILTER);

    // Serve all static assets from LittleFS /assets/ folder
    server.serveStatic("/assets/", LittleFS, "/assets/");

    // Base SPA routes (all serve index.html for client-side routing)
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });
    server.on("/wifi", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });
    server.on("/about", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/index.html", "text/html");
    });

    // Device-specific SPA routes registered by device firmware
    for (const char* route : _deviceSpaRoutes) {
        server.on(route, HTTP_GET, [](AsyncWebServerRequest *request) {
            request->send(LittleFS, "/index.html", "text/html");
        });
    }

    // Static assets
    server.on("/vite.svg", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/vite.svg", "image/svg+xml");
    });
    server.on("/logo.svg", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/logo.svg", "image/svg+xml");
    });
    server.on("/robot-avatar.png", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/robot-avatar.png", "image/png");
    });
    server.on("/DSEG7Modern-BoldItalic.woff", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/DSEG7Modern-BoldItalic.woff", "font/woff");
    });
    server.on("/Montserrat.woff2", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/Montserrat.woff2", "font/woff2");
    });
    server.on("/fontawesome.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/fontawesome.js", "text/javascript");
    });

    // --- Base API endpoints ---

    server.on("/get-time", HTTP_GET, [&clock](AsyncWebServerRequest *request) {
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        root["time"] = clock.getCurrentDate();
        response->setLength();
        request->send(response);
    });

    server.on("/wifi-status", HTTP_GET, [ppcConnection](AsyncWebServerRequest* request) {
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
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        JsonArray data = root["data"].to<JsonArray>();
        int n = WiFi.scanComplete();
        if(n == -2){
            WiFi.scanNetworks(true);
        } else if(n){
            for (int i = 0; i < n; ++i){
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
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        if (request->hasParam("ssid", true) && request->hasParam("password", true)) {
            const char* ssid = request->getParam("ssid", true)->value().c_str();
            const char* password = request->getParam("password", true)->value().c_str();
            WifiCredentialStorage::saveCredentials(ssid, password);
            ppcConnection->connectToNetwork(ssid, password);
            root["status"] = "connecting";
        } else {
            root["status"] = "error";
        }
        response->setLength();
        request->send(response);
    });

    server.on("/wifi-disconnect", HTTP_POST, [ppcConnection](AsyncWebServerRequest *request){
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        ppcConnection->disconnectNetwork();
        root["status"] = "disconnected";
        response->setLength();
        request->send(response);
    });

    server.on("/link-device", HTTP_POST, [ppcConnection](AsyncWebServerRequest *request){
        WiFiClient client;
        HTTPClient http;
        if (!request->hasParam("token", true)) {
            AsyncJsonResponse* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            root["success"] = false;
            root["message"] = "Missing token parameter";
            response->setLength();
            request->send(response);
            return;
        }
        String tokenToVerify = request->getParam("token", true)->value();
        logger.logf(LOG_INFO, "Verifying token: %s", tokenToVerify.c_str());
        http.begin(client, "https://api.clerk.dev/v1/tokens/verify");
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", String("Bearer sk_test_BeysHgpCk6XnSw3wgGWKAZtrqh4OwtluBJQBZLcW32"));
        String body = "{\"token\":\"" + String(tokenToVerify) + "\"}";
        int httpResponseCode = http.POST(body);
        if (httpResponseCode > 0) {
            String responseBody = http.getString();
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, responseBody);
            if (error) {
                AsyncJsonResponse* response = new AsyncJsonResponse();
                JsonObject root = response->getRoot().to<JsonObject>();
                root["success"] = false;
                root["message"] = "Failed to parse JSON";
                response->setLength();
                request->send(response);
                return;
            }
            bool success = doc.as<JsonObject>()["success"];
            if (success) {
                extern MqttClient mqttClient;
                mqttClient.linkDevice(tokenToVerify, [](bool success, String user_id) {
                    if (success) {
                        logger.logf(LOG_INFO, "Device linked to user: %s", user_id.c_str());
                    } else {
                        logger.log(LOG_ERR, "Failed to link device");
                    }
                });
                AsyncJsonResponse* response = new AsyncJsonResponse();
                JsonObject root = response->getRoot().to<JsonObject>();
                root["success"] = true;
                root["message"] = "Token verified and device linking initiated";
                response->setLength();
                request->send(response);
            } else {
                AsyncJsonResponse* response = new AsyncJsonResponse();
                JsonObject root = response->getRoot().to<JsonObject>();
                root["success"] = false;
                root["message"] = "Invalid token";
                response->setLength();
                request->send(response);
            }
        } else {
            AsyncJsonResponse* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            root["success"] = false;
            root["message"] = "HTTP request failed";
            response->setLength();
            request->send(response);
        }
        http.end();
    });

    // Register device-specific routes (e.g. /alarms, /digital-outputs)
    if (_deviceRouteHandler) {
        _deviceRouteHandler(server);
    }

    server.onNotFound([](AsyncWebServerRequest *request) {
        if (request->method() == HTTP_OPTIONS) {
            request->send(200);
        } else {
            request->send(404);
        }
    });

    server.begin();
}

void loopServer() {
    dnsServer.processNextRequest();
}
