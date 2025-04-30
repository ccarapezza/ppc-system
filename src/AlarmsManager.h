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
  bool daysOfWeek[7]; // Array para los días de la semana (domingo=0, lunes=1, ..., sábado=6)
  bool enabled; // Indica si la alarma está habilitada
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
  
  // Último día que se verificó para resetear alarmas
  int lastDayChecked;
  
  // Última vez que se verificaron las alarmas (milisegundos)
  unsigned long lastCheckTime;
  
  // Intervalo mínimo entre comprobaciones de alarmas (milisegundos)
  static const unsigned long CHECK_INTERVAL = 1000; // 1 segundo
  
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
  
  /**
   * @brief Verifica si ha cambiado el día y reinicia el estado de las alarmas
   * 
   * @return bool True si se han reiniciado las alarmas, false en caso contrario
   */
  bool resetAlarmsIfNewDay();

  /**
   * @brief Busca una alarma por su nombre
   * 
   * @param name Nombre de la alarma a buscar
   * @return Alarm* Puntero a la alarma encontrada, o nullptr si no existe
   */
  Alarm* findAlarmByName(String name);
  
  /**
   * @brief Habilita o deshabilita una alarma
   * 
   * @param name Nombre de la alarma
   * @param enabled Nuevo estado (true = habilitada, false = deshabilitada)
   * @return bool True si se encontró y actualizó la alarma, false si no se encontró
   */
  bool enableAlarm(String name, bool enabled);
  
  /**
   * @brief Configura los días de semana en que debe activarse una alarma
   * 
   * @param name Nombre de la alarma
   * @param daysOfWeek Array de 7 valores booleanos para cada día (dom-sáb)
   * @return bool True si se encontró y actualizó la alarma, false si no se encontró
   */
  bool setAlarmDays(String name, bool daysOfWeek[7]);
};

#endif // ALARMS_MANAGER_H
