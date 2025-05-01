#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include "PpcConnection.h"
#include "Clock.h"
#include "AlarmsManager.h"  // Add AlarmsManager header
#include <WiFiUdp.h>
#include "Log.h"
#include <DNSServer.h>
#include "WifiCredentialStorage.h"
#include "DigitalOutput.h"  // Añadir el header de DigitalOutput

// Referencias externas a las salidas digitales
extern DigitalOutput* digitalOutputs[];
extern int numDigitalOutputs;

extern Log logger;
extern IPAddress apIP;

//const to save filenames in flash
const char INDEX_JS[] PROGMEM = "/assets/index-DbCBPAxY.js";
const char INDEX_CSS[] PROGMEM = "/assets/index-CWYTIsFi.css";

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
    AlarmsManager& alarmManager = AlarmsManager::getInstance();  // Get the alarm manager instance

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

    server.on("/vite.svg", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/vite.svg", "image/svg+xml");
    });
    server.on("/logo.svg", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/logo.svg", "image/svg+xml");
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

    server.on("/Montserrat-VariableFont_wght.ttf", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(LittleFS, "/Montserrat-VariableFont_wght.ttf", "font/ttf");
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

    // Endpoint para obtener el estado de todas las salidas digitales
    server.on("/digital-outputs", HTTP_GET, [](AsyncWebServerRequest *request) {
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        JsonArray outputs = root["outputs"].to<JsonArray>();
        
        for (int i = 0; i < numDigitalOutputs; i++) {
            JsonObject output = outputs.add<JsonObject>();
            output["id"] = i;
            output["pin"] = digitalOutputs[i]->getPin();
            output["state"] = digitalOutputs[i]->getState();
        }
        
        response->setLength();
        request->send(response);
    });

    // Endpoint para obtener el estado de una salida digital específica
    server.on("/digital-output", HTTP_GET, [](AsyncWebServerRequest *request) {
        if (!request->hasParam("id")) {
            logger.logf(LOG_INFO, "Missing id parameter");
            AsyncJsonResponse* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            root["success"] = false;
            root["message"] = "Missing id parameter";
            response->setLength();
            request->send(response);
            return;
        }
        logger.logf(LOG_INFO, "Getting state of digital output");
        String idParam = request->getParam("id")->value();
        logger.logf(LOG_INFO, "idParam: %s", idParam.c_str());
        int id = idParam.toInt();
        logger.logf(LOG_INFO, "Getting state of digital output %d", id);
        

        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        
        if (id >= 0 && id < numDigitalOutputs) {
            root["id"] = id;
            root["pin"] = digitalOutputs[id]->getPin();
            root["state"] = digitalOutputs[id]->getState();
            root["success"] = true;
        } else {
            root["success"] = false;
            root["message"] = "Invalid output ID";
        }
        
        response->setLength();
        request->send(response);
    });

    // Endpoint para cambiar el estado de una salida digital
    server.on("/digital-output", HTTP_POST, [](AsyncWebServerRequest *request) {
        if (!request->hasParam("id", true)) {
            logger.logf(LOG_INFO, "Missing id parameter");
            AsyncJsonResponse* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            root["success"] = false;
            root["message"] = "Missing id parameter";
            response->setLength();
            request->send(response);
            return;
        }
        String idParam = request->getParam("id", true)->value();
        int id = idParam.toInt();
        logger.logf(LOG_INFO, "Setting state of digital output %d", id);
        
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        
        if (id >= 0 && id < numDigitalOutputs) {
            bool newState = false;
            
            if (request->hasParam("state", true)) {
                String stateParam = request->getParam("state", true)->value();
                newState = (stateParam == "true" || stateParam == "1" || stateParam == "on");
                digitalOutputs[id]->setState(newState);
                
                root["id"] = id;
                root["pin"] = digitalOutputs[id]->getPin();
                root["state"] = digitalOutputs[id]->getState();
                root["success"] = true;
                logger.logf(LOG_INFO, "Digital output %d set to %s", id, newState ? "ON" : "OFF");
            } else {
                root["success"] = false;
                root["message"] = "Missing state parameter";
            }
        } else {
            root["success"] = false;
            root["message"] = "Invalid output ID";
        }
        
        response->setLength();
        request->send(response);
    });

    // GET endpoint to retrieve all alarms
    server.on("/alarms", HTTP_GET, [&alarmManager](AsyncWebServerRequest *request) {
        logger.logf(LOG_INFO, "Fetching all alarms");
        
        // Get the JSON representation of alarms from AlarmsManager
        String alarmsJson = alarmManager.getAlarms();
        
        // Send the raw JSON as response
        AsyncWebServerResponse *response = request->beginResponse(200, "application/json", alarmsJson);
        request->send(response);
    });

    // POST endpoint to create a new alarm
    server.on("/alarm", HTTP_POST, [&alarmManager](AsyncWebServerRequest *request) {
        logger.logf(LOG_INFO, "Creating a new alarm");
        
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        
        // Check that all required parameters are present
        if (request->hasParam("name", true) && 
            request->hasParam("hour", true) && 
            request->hasParam("minute", true) &&
            request->hasParam("channel", true) &&
            request->hasParam("action", true) 
        ) {
            String name = request->getParam("name", true)->value();
            int hour = request->getParam("hour", true)->value().toInt();
            int minute = request->getParam("minute", true)->value().toInt();
            int channel = request->getParam("channel", true)->value().toInt();
            bool state = request->getParam("action", true)->value().toInt() == 1;

            //if channel is 1,2 or 3
            if (channel < 1 || channel > 3) {
                root["success"] = false;
                root["message"] = "Invalid channel. Must be 1, 2 or 3";
                response->setLength();
                request->send(response);
                return;
            }

            // Validate the parameters
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                root["success"] = false;
                root["message"] = "Invalid time values. Hour must be 0-23, minute must be 0-59";
                response->setLength();
                request->send(response);
                return;
            }

            // Create the alarm execution function
            std::function<void(int)> alarmExecution = [channel, state](int) {
                digitalOutputs[channel - 1]->setState(state);
            };

            std::vector<int> extraParams;
            extraParams.push_back(channel);
            extraParams.push_back(state ? 1 : 0);

            // Add the alarm using the AlarmsManager
            int count = alarmManager.addAlarm(name, hour, minute, alarmExecution, extraParams);
            
            // Check if days parameter is provided
            if (request->hasParam("days", true)) {
                String daysParam = request->getParam("days", true)->value();
                bool daysOfWeek[7] = {true, true, true, true, true, true, true}; // Default all days to true
                
                int startPos = 0;
                int commaPos = daysParam.indexOf(',');
                int dayIndex = 0;
                
                // Parse the comma-separated list of days
                while (commaPos >= 0 && dayIndex < 7) {
                    String dayValue = daysParam.substring(startPos, commaPos);
                    daysOfWeek[dayIndex++] = (dayValue == "1" || dayValue == "true");
                    
                    startPos = commaPos + 1;
                    commaPos = daysParam.indexOf(',', startPos);
                }
                
                // Handle the last day (or single day if no commas)
                if (dayIndex < 7) {
                    String dayValue = daysParam.substring(startPos);
                    daysOfWeek[dayIndex] = (dayValue == "1" || dayValue == "true");
                }
                
                // Set the days of week for the alarm
                alarmManager.setAlarmDays(name, daysOfWeek);
            }
            
            root["success"] = true;
            root["message"] = "Alarm created successfully";
            root["name"] = name;
            root["hour"] = hour;
            root["minute"] = minute;
            root["alarmCount"] = count;
            //show extraParams in the response
            JsonArray extraParamsJson = root["extraParams"].to<JsonArray>();
            for (unsigned int i = 0; i < extraParams.size(); i++) {
                extraParamsJson.add(extraParams[i]);
            }
            root["channel"] = channel;
            root["state"] = state ? "ON" : "OFF";
        } else {
            root["success"] = false;
            root["message"] = "Missing required parameters (name, hour, minute)";
        }
        
        response->setLength();
        request->send(response);
    });
    
    // POST endpoint to enable/disable an alarm
    server.on("/alarm-enable", HTTP_POST, [&alarmManager](AsyncWebServerRequest *request) {
        logger.logf(LOG_INFO, "Modifying alarm state");
        
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        
        if (request->hasParam("name", true) && request->hasParam("enabled", true)) {
            String name = request->getParam("name", true)->value();
            String enabledParam = request->getParam("enabled", true)->value();
            bool enabled = (enabledParam == "true" || enabledParam == "1");
            
            if (alarmManager.enableAlarm(name, enabled)) {
                root["success"] = true;
                root["message"] = "Alarm " + name + " " + (enabled ? "enabled" : "disabled") + " successfully";
            } else {
                root["success"] = false;
                root["message"] = "Alarm not found: " + name;
            }
        } else {
            root["success"] = false;
            root["message"] = "Missing required parameters (name, enabled)";
        }
        
        response->setLength();
        request->send(response);
    });
    
    // POST endpoint to set days of week for an alarm
    server.on("/alarm-days", HTTP_POST, [&alarmManager](AsyncWebServerRequest *request) {
        logger.logf(LOG_INFO, "Setting alarm days of week");
        
        AsyncJsonResponse* response = new AsyncJsonResponse();
        JsonObject root = response->getRoot().to<JsonObject>();
        
        if (request->hasParam("name", true) && request->hasParam("days", true)) {
            String name = request->getParam("name", true)->value();
            String daysParam = request->getParam("days", true)->value();
            
            // Parse the days parameter which should be in format "1,1,1,1,1,1,1"
            // representing Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday
            bool daysOfWeek[7] = {false, false, false, false, false, false, false};
            int index = 0;
            int commaPos = -1;
            
            // Parse the comma-separated list
            do {
                int nextCommaPos = daysParam.indexOf(',', commaPos + 1);
                String dayValue;
                
                if (nextCommaPos == -1) {
                    // Last item or single item
                    dayValue = daysParam.substring(commaPos + 1);
                } else {
                    dayValue = daysParam.substring(commaPos + 1, nextCommaPos);
                }
                
                // Set the day value if within valid range
                if (index < 7) {
                    daysOfWeek[index] = (dayValue == "1" || dayValue == "true");
                }
                
                commaPos = nextCommaPos;
                index++;
            } while (commaPos != -1 && index < 7);
            
            // Update the alarm with the new days
            if (alarmManager.setAlarmDays(name, daysOfWeek)) {
                root["success"] = true;
                root["message"] = "Alarm days updated successfully for: " + name;
                
                // Include the parsed days in the response
                JsonArray daysJson = root["days"].to<JsonArray>();
                for (int i = 0; i < 7; i++) {
                    daysJson.add(daysOfWeek[i]);
                }
            } else {
                root["success"] = false;
                root["message"] = "Alarm not found: " + name;
            }
        } else {
            root["success"] = false;
            root["message"] = "Missing required parameters (name, days)";
        }
        
        response->setLength();
        request->send(response);
    });

    server.begin();
}

void loopServer() {
    dnsServer.processNextRequest();
}