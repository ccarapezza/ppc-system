#include "TimerMqttAdapter.h"
#include "core/TimerService.h"
#include "MqttClient.h"
#include "Clock.h"
#include "Log.h"
#include "ArduinoJson.h"

TimerMqttAdapter::TimerMqttAdapter(TimerService& svc, MqttClient& mqtt,
                                   Log& log, const char* deviceId)
    : _svc(svc), _mqtt(mqtt), _log(log), _deviceId(deviceId) {}

void TimerMqttAdapter::handleMessage(const String& topic, const String& message) {
    int lastSlash = topic.lastIndexOf('/');
    if (lastSlash == -1) return;
    String action = topic.substring(lastSlash + 1);

    if (action == "request_info") {
        publishDeviceInfo();
    }
    else if (action == "control") {
        DynamicJsonDocument doc(512);
        if (deserializeJson(doc, message) != DeserializationError::Ok) return;
        if (String(doc["type"].as<const char*>()) != "digital_output") return;

        int outputId = doc["output_id"];
        bool state   = doc["state"];
        if (_svc.setRelay(outputId, state)) {
            DynamicJsonDocument resp(256);
            resp["success"]   = true;
            resp["output_id"] = outputId;
            resp["state"]     = _svc.getRelayState(outputId);
            String payload;
            serializeJson(resp, payload);
            _mqtt.publish(("devices/" + _deviceId + "/control_response").c_str(),
                          payload.c_str());
        }
    }
    // link/unlink handled by base platform (MqttClient) — not timer-specific
}

void TimerMqttAdapter::publishDeviceInfo() {
    DynamicJsonDocument doc(2048);
    JsonArray outputs = doc["digitalOutputs"].to<JsonArray>();
    for (int i = 0; i < _svc.relayCount(); i++) {
        JsonObject o = outputs.createNestedObject();
        o["id"]    = i;
        o["pin"]   = _svc.getRelayPin(i);
        o["state"] = _svc.getRelayState(i);
    }
    Clock& clock = Clock::getInstance();
    doc["time"]["time"] = clock.getCurrentDate();

    String alarmsJson = _svc.getAlarmsJson();
    DynamicJsonDocument alarmDoc(1024);
    deserializeJson(alarmDoc, alarmsJson);
    doc["alarms"] = alarmDoc["alarms"];

    String payload;
    serializeJson(doc, payload);
    _mqtt.publish(("devices/" + _deviceId + "/info").c_str(), payload.c_str());
    _log.logf(LOG_INFO, "Published timer device info to devices/%s/info", _deviceId.c_str());
}
