#include "AlarmsManager.h"
#include "Clock.h"

// Initialize static instance to nullptr
AlarmsManager* AlarmsManager::instance = nullptr;

// Constructor implementation
AlarmsManager::AlarmsManager() {
  firstAlarm = nullptr;
  lastAlarm = nullptr;
  // Inicializar con -1 para asegurarnos de que se reseteen las alarmas en el primer ciclo
  lastDayChecked = -1;
  lastCheckTime = 0;
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
    newAlarm->enabled = true; // Por defecto habilitada
    // Por defecto, la alarma se activará todos los días
    for (int i = 0; i < 7; i++) {
        newAlarm->daysOfWeek[i] = true;
    }
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
    // Limitar la frecuencia de verificación para mejorar rendimiento
    unsigned long currentTime = millis();
    if (currentTime - lastCheckTime < CHECK_INTERVAL) {
        return; // No verificar si no ha pasado el intervalo mínimo
    }
    lastCheckTime = currentTime;
    
    // Primero verificamos si es un nuevo día para resetear las alarmas
    resetAlarmsIfNewDay();
    
    Clock& clock = Clock::getInstance();
    RtcDateTime now = clock.getCurrentDateTime();
    int dayOfWeek = now.DayOfWeek(); // 0=domingo, 1=lunes, ..., 6=sábado
    Alarm *currentAlarm = firstAlarm;
    
    while(currentAlarm != nullptr){
      // Verificar si la alarma está habilitada y si corresponde al día actual
      if(currentAlarm->enabled && 
         currentAlarm->daysOfWeek[dayOfWeek] &&
         !currentAlarm->executed &&
         currentAlarm->hour <= (int)now.Hour() &&
         (currentAlarm->hour < (int)now.Hour() || currentAlarm->minute <= (int)now.Minute())){
        
        currentAlarm->executed = true;
        Serial.println(currentAlarm->name + " - Executed at: " + clock.getCurrentDate());
        currentAlarm->execute(1);
      }
      
      currentAlarm = currentAlarm->next;
    }
}

bool AlarmsManager::resetAlarmsIfNewDay() {
    Clock& clock = Clock::getInstance();
    RtcDateTime now = clock.getCurrentDateTime();
    int currentDay = now.Day();
    
    // Si es un nuevo día o no se ha inicializado lastDayChecked
    if (lastDayChecked != currentDay) {
        // Registro del cambio de día
        if (lastDayChecked > 0) {
            Serial.println("Nuevo día detectado. Reseteando estados de alarmas.");
        }
        
        // Recorrer todas las alarmas y resetear su estado
        Alarm *currentAlarm = firstAlarm;
        while (currentAlarm != nullptr) {
            currentAlarm->executed = false;
            currentAlarm = currentAlarm->next;
        }
        
        // Actualizar el día actual
        lastDayChecked = currentDay;
        return true;
    }
    
    return false;
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
        
        // Generar el array de días de la semana
        String daysOfWeekJson = "[";
        for (int i = 0; i < 7; i++) {
            daysOfWeekJson += currentAlarm->daysOfWeek[i] ? "true" : "false";
            if (i < 6) {
                daysOfWeekJson += ",";
            }
        }
        daysOfWeekJson += "]";
        
        // Create a JSON object for each alarm
        jsonOutput += "{\"name\":\"" + currentAlarm->name + "\"," +
                     "\"hour\":" + String(currentAlarm->hour) + "," +
                     "\"minute\":" + String(currentAlarm->minute) + "," +
                     "\"extraParams\":" + extraParamsJson + "," +
                     "\"executed\":" + (currentAlarm->executed ? "true" : "false") + "," +
                     "\"enabled\":" + (currentAlarm->enabled ? "true" : "false") + "," +
                     "\"daysOfWeek\":" + daysOfWeekJson + "}";

        currentAlarm = currentAlarm->next;
    }

    jsonOutput += "]";
    return jsonOutput;
}

Alarm* AlarmsManager::findAlarmByName(String name) {
    Alarm *currentAlarm = firstAlarm;
    
    while (currentAlarm != nullptr) {
        if (currentAlarm->name == name) {
            return currentAlarm;
        }
        currentAlarm = currentAlarm->next;
    }
    
    return nullptr; // No se encontró la alarma
}

bool AlarmsManager::enableAlarm(String name, bool enabled) {
    Alarm *alarm = findAlarmByName(name);
    
    if (alarm != nullptr) {
        alarm->enabled = enabled;
        return true;
    }
    
    return false;
}

bool AlarmsManager::setAlarmDays(String name, bool daysOfWeek[7]) {
    Alarm *alarm = findAlarmByName(name);
    
    if (alarm != nullptr) {
        // Copiar los valores de cada día de la semana
        for (int i = 0; i < 7; i++) {
            alarm->daysOfWeek[i] = daysOfWeek[i];
        }
        return true;
    }
    
    return false;
}