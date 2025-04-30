#ifndef ALARMS_MANAGER_H
#define ALARMS_MANAGER_H

#include <Arduino.h>
#include "Clock.h"
#include <PpcConnection.h>

/**
 * @brief Estructura que define una alarma
 */
struct Alarm {
  String name;
  boolean executed;
  int hour;
  int minute;
  //i need to create an int array of extra parameters
  std::vector<int> extraParams; // Parámetros adicionales para la alarma
  std::function<void(int)> execute; // Función a ejecutar cuando se cumple la alarma
  Alarm *next;
};

/**
 * @brief Clase que administra las alarmas siguiendo el patrón Singleton
 */
class AlarmsManager {
private:
  // Constructor privado para prevenir instanciación directa
  AlarmsManager();
  
  // Instancia única
  static AlarmsManager* instance;
  
  // Lista enlazada de alarmas
  Alarm *firstAlarm;
  Alarm *lastAlarm;
  
public:
  // Método para acceder a la instancia única
  static AlarmsManager& getInstance();
  
  // Destructor
  ~AlarmsManager();
  
  /**
   * @brief Añade una nueva alarma a la lista
   * 
   * @param name Nombre de la alarma
   * @param hour Hora de ejecución
   * @param minute Minuto de ejecución
   * @param execute Función a ejecutar cuando se cumpla la alarma
   * @return int Número de alarmas configuradas
   */
  int addAlarm(String name, int hour, int minute, std::function<void(int)> execute, std::vector<int> extraParams = {});

  /**
   * @brief Revisa y ejecuta las alarmas pendientes
   */
  void alarmLoop();

  /**
   * @brief Cuenta el número de alarmas configuradas
   * 
   * @return int Número de alarmas
   */
  int alarmsCount();

  /**
   * @brief Obtiene una representación en string de las alarmas configuradas
   * 
   * @return String Lista de alarmas en formato JSON
   */
  String getAlarms();
};

#endif // ALARMS_MANAGER_H
