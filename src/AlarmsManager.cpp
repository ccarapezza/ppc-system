#include "AlarmsManager.h"
#include "Clock.h"
#include "AlarmStorage.h"
#include "DigitalOutput.h"

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
  
    // Guardar en almacenamiento persistente después de agregar
    saveToStorage();
  
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
        // Verificar que la función execute no sea nullptr antes de llamarla
        if (currentAlarm->execute != nullptr) {
            currentAlarm->execute(1);
        } else {
            Serial.println("Warning: Alarm " + currentAlarm->name + " has no execute function assigned");
        }
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
        // Guardar cambios en almacenamiento persistente
        saveToStorage();
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
        // Guardar cambios en almacenamiento persistente
        saveToStorage();
        return true;
    }
    
    return false;
}

bool AlarmsManager::initStorage() {
    if (!AlarmStorage::init()) {
        Serial.println("Failed to initialize alarm storage");
        return false;
    }
    
    // Cargar alarmas existentes si las hay
    if (AlarmStorage::hasAlarms()) {
        return loadFromStorage();
    }
    
    return true;
}

bool AlarmsManager::saveToStorage() {
    std::vector<AlarmData> alarmsData = alarmsToVector();
    return AlarmStorage::saveAlarms(alarmsData);
}

bool AlarmsManager::loadFromStorage() {
    std::vector<AlarmData> alarmsData;
    
    if (!AlarmStorage::loadAlarms(alarmsData)) {
        return false;
    }
    
    // Limpiar alarmas existentes antes de cargar
    Alarm* current = firstAlarm;
    while (current != nullptr) {
        Alarm* next = current->next;
        delete current;
        current = next;
    }
    firstAlarm = nullptr;
    lastAlarm = nullptr;
    
    // Cargar alarmas desde el almacenamiento
    loadAlarmsFromVector(alarmsData);
    
    // Reasignar automáticamente las funciones de relé
    reassignRelayFunctions();
    
    return true;
}

std::vector<AlarmData> AlarmsManager::alarmsToVector() const {
    std::vector<AlarmData> alarmsData;
    
    Alarm* current = firstAlarm;
    while (current != nullptr) {
        AlarmData data;
        data.name = current->name;
        data.hour = current->hour;
        data.minute = current->minute;
        data.executed = current->executed;
        data.enabled = current->enabled;
        data.extraParams = current->extraParams;
        
        // Copiar días de la semana
        for (int i = 0; i < 7; i++) {
            data.daysOfWeek[i] = current->daysOfWeek[i];
        }
        
        alarmsData.push_back(data);
        current = current->next;
    }
    
    return alarmsData;
}

void AlarmsManager::loadAlarmsFromVector(const std::vector<AlarmData>& alarmsData) {
    for (const auto& data : alarmsData) {
        Alarm* newAlarm = new Alarm;
        newAlarm->name = data.name;
        newAlarm->hour = data.hour;
        newAlarm->minute = data.minute;
        newAlarm->executed = data.executed;
        newAlarm->enabled = data.enabled;
        newAlarm->extraParams = data.extraParams;
        
        // Copiar días de la semana
        for (int i = 0; i < 7; i++) {
            newAlarm->daysOfWeek[i] = data.daysOfWeek[i];
        }
        
        // Nota: No podemos restaurar la función execute desde almacenamiento
        // Las funciones deberán ser reasignadas después de cargar las alarmas
        newAlarm->execute = nullptr;
        newAlarm->next = nullptr;
        
        if (lastAlarm == nullptr) {
            firstAlarm = newAlarm;
        } else {
            lastAlarm->next = newAlarm;
        }
        
        lastAlarm = newAlarm;
    }
}

bool AlarmsManager::setAlarmFunction(String name, std::function<void(int)> execute) {
    Alarm *alarm = findAlarmByName(name);
    
    if (alarm != nullptr) {
        alarm->execute = execute;
        return true;
    }
    
    return false;
}

void AlarmsManager::reassignRelayFunctions() {
    // Declarar extern para acceder a digitalOutputs desde main.cpp
    extern DigitalOutput* digitalOutputs[];
    
    Alarm *currentAlarm = firstAlarm;
    
    while (currentAlarm != nullptr) {
        // Solo reasignar si no tiene función asignada
        if (currentAlarm->execute == nullptr && !currentAlarm->extraParams.empty()) {
            int channel = currentAlarm->extraParams[0]; // Primer parámetro es el canal
            
            // Verificar que el canal sea válido
            if (channel >= 1 && channel <= 3) { // Asumiendo 3 relés máximo
                if (currentAlarm->extraParams.size() > 1) {
                    int state = currentAlarm->extraParams[1]; // Segundo parámetro es el estado
                    
                    if (state == 1) {
                        // Función para encender relé
                        currentAlarm->execute = [channel](int) {
                            extern DigitalOutput* digitalOutputs[];
                            digitalOutputs[channel - 1]->setState(true);
                        };
                        Serial.println("Reassigned ON function to alarm: " + currentAlarm->name);
                    } else if (state == 0) {
                        // Función para apagar relé
                        currentAlarm->execute = [channel](int) {
                            extern DigitalOutput* digitalOutputs[];
                            digitalOutputs[channel - 1]->setState(false);
                        };
                        Serial.println("Reassigned OFF function to alarm: " + currentAlarm->name);
                    }
                }
            }
        }
        
        currentAlarm = currentAlarm->next;
    }
}