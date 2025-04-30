#include "AlarmsManager.h"
#include "Clock.h"

// Initialize static instance to nullptr
AlarmsManager* AlarmsManager::instance = nullptr;

// Constructor implementation
AlarmsManager::AlarmsManager() {
  firstAlarm = nullptr;
  lastAlarm = nullptr;
}

// Destructor implementation - clean up any remaining alarms
AlarmsManager::~AlarmsManager() {
  Alarm* current = firstAlarm;
  while (current != nullptr) {
    Alarm* next = current->next;
    delete current;
    current = next;
  }
}

// Singleton access method
AlarmsManager& AlarmsManager::getInstance() {
  if (instance == nullptr) {
    instance = new AlarmsManager();
  }
  return *instance;
}

int AlarmsManager::addAlarm(String name, int hour, int minute, std::function<void(int)> execute, std::vector<int> extraParams) {
    Alarm *newAlarm = new Alarm;
    newAlarm->name = name;
    newAlarm->hour = hour;
    newAlarm->minute = minute;
    newAlarm->execute = execute;
    newAlarm->executed = false;
    newAlarm->extraParams = extraParams;
    newAlarm->next = nullptr;
  
    if(lastAlarm == nullptr){
      firstAlarm = newAlarm;
    }else{
      lastAlarm->next = newAlarm;
    }
  
    lastAlarm = newAlarm;
  
    return alarmsCount();
}

void AlarmsManager::alarmLoop(){
    Clock& clock = Clock::getInstance();
    RtcDateTime now = clock.getCurrentDateTime();
    Alarm *currentAlarm = firstAlarm;
    
    while(currentAlarm != nullptr){
      // Check if alarm should be executed (time has passed and not already executed)
      if(!currentAlarm->executed &&
         currentAlarm->hour <= (int)now.Hour() &&
         (currentAlarm->hour < (int)now.Hour() || currentAlarm->minute <= (int)now.Minute())){
        
        currentAlarm->executed = true;
        Serial.println(currentAlarm->name + " - Executed at: " + clock.getCurrentDate());
        currentAlarm->execute(1);
      }
      
      currentAlarm = currentAlarm->next;
    }
}

int AlarmsManager::alarmsCount(){
    Alarm *currentAlarm = firstAlarm;
    int count = 0;
    while(currentAlarm){
      count++;
      currentAlarm = currentAlarm->next;
    }
  
    return count;
}
  
String AlarmsManager::getAlarms(){
    String jsonOutput = "[";
    Alarm *currentAlarm = firstAlarm;
    bool first = true;

    while(currentAlarm){
        if(!first) {
            jsonOutput += ",";
        }
        first = false;

        String extraParamsJson = "[";
        for (size_t i = 0; i < currentAlarm->extraParams.size(); i++) {
            extraParamsJson += String(currentAlarm->extraParams[i]);
            if (i < currentAlarm->extraParams.size() - 1) {
                extraParamsJson += ",";
            }
        }
        extraParamsJson += "]";
        
        // Create a JSON object for each alarm
        jsonOutput += "{\"name\":\"" + currentAlarm->name + "\"," +
                     "\"hour\":" + String(currentAlarm->hour) + "," +
                     "\"minute\":" + String(currentAlarm->minute) + "," +
                     "\"extraParams\":" + extraParamsJson + "," +
                     "\"executed\":" + (currentAlarm->executed ? "true" : "false") + "}";

        currentAlarm = currentAlarm->next;
    }

    jsonOutput += "]";
    return jsonOutput;
}