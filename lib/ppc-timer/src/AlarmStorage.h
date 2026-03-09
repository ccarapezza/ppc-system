#ifndef ALARM_STORAGE_H
#define ALARM_STORAGE_H

#include <Arduino.h>
#include <LittleFS.h>
#include "ArduinoJson.h"
#include <vector>

struct AlarmData {
    String name;
    int hour;
    int minute;
    std::vector<int> extraParams;
    bool executed;
    bool enabled;
    bool daysOfWeek[7];
};

class AlarmStorage {
public:
    // Initialize the storage system
    static bool init();

    // Save all alarms to flash
    static bool saveAlarms(const std::vector<AlarmData>& alarms);

    // Load all alarms from flash
    static bool loadAlarms(std::vector<AlarmData>& alarms);

    // Delete saved alarms
    static bool deleteAlarms();

    // Check if alarms file exists
    static bool hasAlarms();

private:
    static const char* ALARMS_FILE;
    static const size_t MAX_JSON_SIZE;
};

#endif // ALARM_STORAGE_H
