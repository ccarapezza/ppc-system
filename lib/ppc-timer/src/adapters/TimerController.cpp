#include "TimerController.h"
#include "core/TimerService.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include <ESPAsyncWebServer.h>

void registerTimerControllerRoutes(AsyncWebServer& server, TimerService& svc) {

    // GET all digital output states
    server.on("/digital-outputs", HTTP_GET,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            JsonArray outputs = root["outputs"].to<JsonArray>();
            for (int i = 0; i < svc.relayCount(); i++) {
                JsonObject o = outputs.add<JsonObject>();
                o["id"]    = i;
                o["pin"]   = svc.getRelayPin(i);
                o["state"] = svc.getRelayState(i);
            }
            response->setLength();
            request->send(response);
        });

    // GET single digital output state
    server.on("/digital-output", HTTP_GET,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            if (!request->hasParam("id")) {
                root["success"] = false;
                root["message"] = "Missing id parameter";
            } else {
                int id = request->getParam("id")->value().toInt();
                if (id >= 0 && id < svc.relayCount()) {
                    root["id"]      = id;
                    root["pin"]     = svc.getRelayPin(id);
                    root["state"]   = svc.getRelayState(id);
                    root["success"] = true;
                } else {
                    root["success"] = false;
                    root["message"] = "Invalid output ID";
                }
            }
            response->setLength();
            request->send(response);
        });

    // POST set digital output state
    server.on("/digital-output", HTTP_POST,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            if (!request->hasParam("id", true)) {
                root["success"] = false;
                root["message"] = "Missing id parameter";
            } else {
                int id = request->getParam("id", true)->value().toInt();
                if (id >= 0 && id < svc.relayCount()) {
                    if (request->hasParam("state", true)) {
                        String sp = request->getParam("state", true)->value();
                        bool state = (sp == "true" || sp == "1" || sp == "on");
                        svc.setRelay(id, state);
                        root["id"]      = id;
                        root["pin"]     = svc.getRelayPin(id);
                        root["state"]   = svc.getRelayState(id);
                        root["success"] = true;
                    } else {
                        root["success"] = false;
                        root["message"] = "Missing state parameter";
                    }
                } else {
                    root["success"] = false;
                    root["message"] = "Invalid output ID";
                }
            }
            response->setLength();
            request->send(response);
        });

    // GET all alarms
    server.on("/alarms", HTTP_GET,
        [&svc](AsyncWebServerRequest* request) {
            String alarmsJson = svc.getAlarmsJson();
            AsyncWebServerResponse* response = request->beginResponse(200, "application/json", alarmsJson);
            request->send(response);
        });

    // POST create ON/OFF alarm pair
    server.on("/alarm-on-off", HTTP_POST,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();

            if (request->hasParam("name", true) &&
                request->hasParam("onHour", true) &&
                request->hasParam("onMinute", true) &&
                request->hasParam("offHour", true) &&
                request->hasParam("offMinute", true) &&
                request->hasParam("channel", true))
            {
                String name    = request->getParam("name", true)->value();
                int onHour     = request->getParam("onHour", true)->value().toInt();
                int onMinute   = request->getParam("onMinute", true)->value().toInt();
                int offHour    = request->getParam("offHour", true)->value().toInt();
                int offMinute  = request->getParam("offMinute", true)->value().toInt();
                int channel    = request->getParam("channel", true)->value().toInt();

                if (channel < 1 || channel > svc.relayCount()) {
                    root["success"] = false;
                    root["message"] = "Invalid channel";
                    response->setLength();
                    request->send(response);
                    return;
                }
                if (onHour < 0 || onHour > 23 || onMinute < 0 || onMinute > 59 ||
                    offHour < 0 || offHour > 23 || offMinute < 0 || offMinute > 59) {
                    root["success"] = false;
                    root["message"] = "Invalid time values";
                    response->setLength();
                    request->send(response);
                    return;
                }

                // channel is 1-based from API, convert to 0-based for service
                int zeroBasedChannel = channel - 1;

                bool daysOfWeek[7] = {true, true, true, true, true, true, true};
                bool hasDays = false;

                if (request->hasParam("days", true)) {
                    hasDays = true;
                    String daysParam = request->getParam("days", true)->value();
                    int startPos = 0, commaPos = daysParam.indexOf(','), dayIndex = 0;
                    while (commaPos >= 0 && dayIndex < 7) {
                        daysOfWeek[dayIndex++] = (daysParam.substring(startPos, commaPos) == "1");
                        startPos = commaPos + 1;
                        commaPos = daysParam.indexOf(',', startPos);
                    }
                    if (dayIndex < 7) daysOfWeek[dayIndex] = (daysParam.substring(startPos) == "1");
                }

                int count = svc.addAlarmPair(name.c_str(), onHour, onMinute,
                                             offHour, offMinute, zeroBasedChannel,
                                             hasDays ? daysOfWeek : nullptr);

                root["success"] = true;
                root["message"] = "Alarms created successfully";
                root["name"]    = name;
                root["alarmCount"] = count;
                root["channel"] = channel;
            } else {
                root["success"] = false;
                root["message"] = "Missing required parameters";
            }
            response->setLength();
            request->send(response);
        });

    // POST create single alarm
    server.on("/alarm", HTTP_POST,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();

            if (request->hasParam("name", true) &&
                request->hasParam("hour", true) &&
                request->hasParam("minute", true) &&
                request->hasParam("channel", true) &&
                request->hasParam("action", true))
            {
                String name  = request->getParam("name", true)->value();
                int hour     = request->getParam("hour", true)->value().toInt();
                int minute   = request->getParam("minute", true)->value().toInt();
                int channel  = request->getParam("channel", true)->value().toInt();
                bool state   = request->getParam("action", true)->value().toInt() == 1;

                if (channel < 1 || channel > svc.relayCount()) {
                    root["success"] = false;
                    root["message"] = "Invalid channel";
                    response->setLength();
                    request->send(response);
                    return;
                }
                if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                    root["success"] = false;
                    root["message"] = "Invalid time values";
                    response->setLength();
                    request->send(response);
                    return;
                }

                // channel is 1-based from API, convert to 0-based for service
                int zeroBasedChannel = channel - 1;
                int count = svc.addAlarm(name.c_str(), hour, minute, zeroBasedChannel, state);

                if (request->hasParam("days", true)) {
                    String daysParam = request->getParam("days", true)->value();
                    bool daysOfWeek[7] = {true, true, true, true, true, true, true};
                    int startPos = 0, commaPos = daysParam.indexOf(','), dayIndex = 0;
                    while (commaPos >= 0 && dayIndex < 7) {
                        daysOfWeek[dayIndex++] = (daysParam.substring(startPos, commaPos) == "1");
                        startPos = commaPos + 1;
                        commaPos = daysParam.indexOf(',', startPos);
                    }
                    if (dayIndex < 7) daysOfWeek[dayIndex] = (daysParam.substring(startPos) == "1");
                    svc.setAlarmDays(name.c_str(), daysOfWeek);
                }

                root["success"] = true;
                root["message"] = "Alarm created successfully";
                root["name"]    = name;
                root["hour"]    = hour;
                root["minute"]  = minute;
                root["alarmCount"] = count;
                root["channel"] = channel;
                root["state"]   = state ? "ON" : "OFF";
            } else {
                root["success"] = false;
                root["message"] = "Missing required parameters";
            }
            response->setLength();
            request->send(response);
        });

    // POST enable/disable alarm
    server.on("/alarm-enable", HTTP_POST,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            if (request->hasParam("name", true) && request->hasParam("enabled", true)) {
                String name = request->getParam("name", true)->value();
                String ep   = request->getParam("enabled", true)->value();
                bool enabled = (ep == "true" || ep == "1");
                if (svc.enableAlarm(name.c_str(), enabled)) {
                    root["success"] = true;
                    root["message"] = "Alarm " + name + (enabled ? " enabled" : " disabled");
                } else {
                    root["success"] = false;
                    root["message"] = "Alarm not found: " + name;
                }
            } else {
                root["success"] = false;
                root["message"] = "Missing required parameters";
            }
            response->setLength();
            request->send(response);
        });

    // POST set days of week for alarm
    server.on("/alarm-days", HTTP_POST,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            if (request->hasParam("name", true) && request->hasParam("days", true)) {
                String name      = request->getParam("name", true)->value();
                String daysParam = request->getParam("days", true)->value();
                bool daysOfWeek[7] = {false};
                int index = 0, commaPos = -1;
                do {
                    int nextCommaPos = daysParam.indexOf(',', commaPos + 1);
                    String dayValue = (nextCommaPos == -1)
                        ? daysParam.substring(commaPos + 1)
                        : daysParam.substring(commaPos + 1, nextCommaPos);
                    if (index < 7) daysOfWeek[index] = (dayValue == "1" || dayValue == "true");
                    commaPos = nextCommaPos;
                    index++;
                } while (commaPos != -1 && index < 7);

                if (svc.setAlarmDays(name.c_str(), daysOfWeek)) {
                    root["success"] = true;
                    root["message"] = "Alarm days updated for: " + name;
                    JsonArray daysJson = root["days"].to<JsonArray>();
                    for (int i = 0; i < 7; i++) daysJson.add(daysOfWeek[i]);
                } else {
                    root["success"] = false;
                    root["message"] = "Alarm not found: " + name;
                }
            } else {
                root["success"] = false;
                root["message"] = "Missing required parameters";
            }
            response->setLength();
            request->send(response);
        });
}
