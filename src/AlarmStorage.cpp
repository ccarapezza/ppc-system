#include "AlarmStorage.h"
#include "Log.h"

extern Log logger;

const char* AlarmStorage::ALARMS_FILE = "/alarms.json";
const size_t AlarmStorage::MAX_JSON_SIZE = 2048;

bool AlarmStorage::init() {
    if (!LittleFS.begin()) {
        logger.log(LOG_ERR, "Failed to initialize LittleFS for AlarmStorage");
        return false;
    }
    return true;
}

bool AlarmStorage::saveAlarms(const std::vector<AlarmData>& alarms) {
    // Create a JSON document
    DynamicJsonDocument doc(MAX_JSON_SIZE);
    JsonArray alarmsArray = doc.createNestedArray("alarms");
    
    for (const auto& alarm : alarms) {
        JsonObject alarmObj = alarmsArray.createNestedObject();
        alarmObj["name"] = alarm.name;
        alarmObj["hour"] = alarm.hour;
        alarmObj["minute"] = alarm.minute;
        alarmObj["executed"] = alarm.executed;
        alarmObj["enabled"] = alarm.enabled;
        
        // Save extra parameters
        JsonArray extraParamsArray = alarmObj.createNestedArray("extraParams");
        for (int param : alarm.extraParams) {
            extraParamsArray.add(param);
        }
        
        // Save days of week
        JsonArray daysArray = alarmObj.createNestedArray("daysOfWeek");
        for (int i = 0; i < 7; i++) {
            daysArray.add(alarm.daysOfWeek[i]);
        }
    }
    
    // Open file for writing
    File file = LittleFS.open(ALARMS_FILE, "w");
    if (!file) {
        logger.log(LOG_ERR, "Failed to open alarms file for writing");
        return false;
    }
    
    // Serialize JSON to file
    if (serializeJson(doc, file) == 0) {
        logger.log(LOG_ERR, "Failed to write alarms to file");
        file.close();
        return false;
    }
    
    file.close();
    logger.logf(LOG_INFO, "Saved %d alarms to storage", alarms.size());
    return true;
}

bool AlarmStorage::loadAlarms(std::vector<AlarmData>& alarms) {
    if (!hasAlarms()) {
        return false;
    }
    
    // Open file for reading
    File file = LittleFS.open(ALARMS_FILE, "r");
    if (!file) {
        logger.log(LOG_ERR, "Failed to open alarms file for reading");
        return false;
    }
    
    // Parse JSON
    DynamicJsonDocument doc(MAX_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, file);
    file.close();
    
    if (error) {
        logger.logf(LOG_ERR, "Failed to parse alarms file: %s", error.c_str());
        return false;
    }
    
    // Clear existing alarms
    alarms.clear();
    
    // Extract alarms
    JsonArray alarmsArray = doc["alarms"];
    for (JsonObject alarmObj : alarmsArray) {
        AlarmData alarm;
        alarm.name = alarmObj["name"].as<String>();
        alarm.hour = alarmObj["hour"];
        alarm.minute = alarmObj["minute"];
        alarm.executed = alarmObj["executed"];
        alarm.enabled = alarmObj["enabled"];
        
        // Load extra parameters
        alarm.extraParams.clear();
        JsonArray extraParamsArray = alarmObj["extraParams"];
        for (JsonVariant param : extraParamsArray) {
            alarm.extraParams.push_back(param.as<int>());
        }
        
        // Load days of week
        JsonArray daysArray = alarmObj["daysOfWeek"];
        for (int i = 0; i < 7 && i < daysArray.size(); i++) {
            alarm.daysOfWeek[i] = daysArray[i];
        }
        
        alarms.push_back(alarm);
    }
    
    logger.logf(LOG_INFO, "Loaded %d alarms from storage", alarms.size());
    return true;
}

bool AlarmStorage::deleteAlarms() {
    if (!hasAlarms()) {
        return true; // Already no alarms
    }
    
    if (LittleFS.remove(ALARMS_FILE)) {
        logger.log(LOG_INFO, "Alarms deleted from storage");
        return true;
    } else {
        logger.log(LOG_ERR, "Failed to delete alarms from storage");
        return false;
    }
}

bool AlarmStorage::hasAlarms() {
    return LittleFS.exists(ALARMS_FILE);
}
