#include "TimerMqtt.h"
#include "AlarmsManager.h"
#include "DigitalOutput.h"
#include "Clock.h"
#include "MqttClient.h"
#include "Log.h"
#include "ArduinoJson.h"

extern Log logger;
extern DigitalOutput* digitalOutputs[];
extern int numDigitalOutputs;
extern MqttClient mqttClient;
extern String deviceId;

String buildTimerDeviceInfoPayload() {
    DynamicJsonDocument doc(2048);

    JsonArray outputs = doc["digitalOutputs"].to<JsonArray>();
    for (int i = 0; i < numDigitalOutputs; i++) {
        JsonObject output = outputs.createNestedObject();
        output["id"]    = i;
        output["pin"]   = digitalOutputs[i]->getPin();
        output["state"] = digitalOutputs[i]->getState();
    }

    Clock& clock = Clock::getInstance();
    doc["time"]["time"] = clock.getCurrentDate();

    AlarmsManager& alarmManager = AlarmsManager::getInstance();
    String alarmsJson = alarmManager.getAlarms();
    DynamicJsonDocument alarmDoc(1024);
    deserializeJson(alarmDoc, alarmsJson);
    doc["alarms"] = alarmDoc["alarms"];

    String payload;
    serializeJson(doc, payload);
    return payload;
}

void publishTimerDeviceInfo() {
    String payload = buildTimerDeviceInfoPayload();
    String topic = "devices/" + deviceId + "/info";
    mqttClient.publish(topic.c_str(), payload.c_str());
    logger.logf(LOG_INFO, "Published timer device info to %s", topic.c_str());
}
