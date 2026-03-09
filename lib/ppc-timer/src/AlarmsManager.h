#ifndef ALARMS_MANAGER_H
#define ALARMS_MANAGER_H

#include <Arduino.h>
#include "Clock.h"
#include "AlarmStorage.h"

class RelayPort;  // forward-declare port interface

/**
 * @brief Estructura que define una alarma
 */
struct Alarm {
  String name;
  boolean executed;
  int hour;
  int minute;
  std::vector<int> extraParams;
  std::function<void(int)> execute;
  bool daysOfWeek[7];
  bool enabled;
  Alarm *next;
};

/**
 * @brief Clase que administra las alarmas siguiendo el patrón Singleton
 */
class AlarmsManager {
private:
  AlarmsManager();

  static AlarmsManager* instance;

  Alarm *firstAlarm;
  Alarm *lastAlarm;

  int lastDayChecked;
  unsigned long lastCheckTime;
  static const unsigned long CHECK_INTERVAL = 1000;

public:
  static AlarmsManager& getInstance();
  ~AlarmsManager();

  int addAlarm(String name, int hour, int minute, std::function<void(int)> execute, std::vector<int> extraParams = {});
  void alarmLoop();
  int alarmsCount();
  String getAlarms();
  bool resetAlarmsIfNewDay();
  Alarm* findAlarmByName(String name);
  bool enableAlarm(String name, bool enabled);
  bool setAlarmDays(String name, bool daysOfWeek[7]);
  bool initStorage();
  bool saveToStorage();
  bool loadFromStorage();
  bool setAlarmFunction(String name, std::function<void(int)> execute);

  /**
   * @brief Reasigna funciones execute para alarmas de relé basadas en extraParams.
   *        Usa un RelayPort en lugar de acceder a extern digitalOutputs[].
   */
  void reassignRelayFunctions(RelayPort& relay);

private:
  std::vector<AlarmData> alarmsToVector() const;
  void loadAlarmsFromVector(const std::vector<AlarmData>& alarmsData);
};

#endif // ALARMS_MANAGER_H
