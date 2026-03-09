#include "TempMqttAdapter.h"
#include "core/TempService.h"
#include "MqttClient.h"
#include "Clock.h"
#include "Log.h"
#include "ArduinoJson.h"

TempMqttAdapter::TempMqttAdapter(TempService& svc, MqttClient& mqtt,
                                 Log& log, const char* deviceId)
    : _svc(svc), _mqtt(mqtt), _log(log), _deviceId(deviceId) {}

void TempMqttAdapter::handleMessage(const String& topic, const String& message) {
    int lastSlash = topic.lastIndexOf('/');
    if (lastSlash == -1) return;
    String action = topic.substring(lastSlash + 1);

    if (action == "request_info") {
        publishDeviceInfo();
    }
}

void TempMqttAdapter::publishDeviceInfo() {
    DynamicJsonDocument doc(256);

    doc["temperature"] = _svc.temperature();
    doc["sensorOk"]    = _svc.sensorOk();

    Clock& clock = Clock::getInstance();
    doc["time"]["time"] = clock.getCurrentDate();

    String payload;
    serializeJson(doc, payload);
    _mqtt.publish(("devices/" + _deviceId + "/info").c_str(), payload.c_str());
    _log.logf(LOG_INFO, "Published TEMP device info to devices/%s/info", _deviceId.c_str());
}
