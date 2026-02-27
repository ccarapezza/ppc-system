# Alarm Storage System

Este documento describe el nuevo sistema de almacenamiento persistente para las alarmas implementado en el proyecto PPC System.

## Archivos Creados

1. **`AlarmStorage.h`** - Archivo de cabecera con la definición de la clase AlarmStorage
2. **`AlarmStorage.cpp`** - Implementación del sistema de almacenamiento persistente

## Archivos Modificados

1. **`AlarmsManager.h`** - Agregados métodos para persistencia
2. **`AlarmsManager.cpp`** - Implementación de los métodos de persistencia 
3. **`main.cpp`** - Inicialización del sistema de almacenamiento

## Funcionalidad

### Características del AlarmStorage

- **Persistencia automática**: Las alarmas se guardan automáticamente cuando se modifican
- **Formato JSON**: Utiliza formato JSON para almacenar los datos de manera estructurada
- **Compatibilidad**: Compatible con el sistema existente de AlarmsManager sin romper funcionalidad
- **Almacenamiento en flash**: Utiliza LittleFS para guardar en la memoria flash del ESP8266

### Métodos Agregados al AlarmsManager

```cpp
// Inicialización del sistema de almacenamiento
bool initStorage();

// Guardar todas las alarmas
bool saveToStorage();

// Cargar alarmas desde almacenamiento
bool loadFromStorage();

// Reasignar función execute a una alarma específica
bool setAlarmFunction(String name, std::function<void(int)> execute);
```

## Puntos Clave de Integración

### 1. Inicialización en main.cpp

```cpp
// En setup(), después de WifiCredentialStorage::init()
if (!alarmManager.initStorage()) {
    logger.log(LOG_ERR, "Failed to initialize alarm storage");
}
```

### 2. Guardado Automático

El sistema guarda automáticamente las alarmas cuando:
- Se agrega una nueva alarma (`addAlarm`)
- Se habilita/deshabilita una alarma (`enableAlarm`) 
- Se modifican los días de activación (`setAlarmDays`)

### 3. Carga de Alarmas

Al inicializar el sistema:
1. Se cargan las alarmas guardadas desde el almacenamiento
2. **IMPORTANTE**: Las funciones `execute` NO se pueden serializar, por lo que quedan como `nullptr`
3. Se ejecuta automáticamente `reassignRelayFunctions()` para reasignar funciones de relé basadas en `extraParams`
4. Para alarmas personalizadas, usar `setAlarmFunction()` manualmente

### 4. Protección contra Crashes

El sistema incluye protección contra crashes:
- Verificación de `nullptr` antes de ejecutar funciones
- Logs de advertencia para alarmas sin función asignada
- Reasignación automática de funciones de relé comunes

### 4. Reasignación de Funciones (Automática y Manual)

#### Reasignación Automática
Las alarmas de relé se reasignan automáticamente basándose en `extraParams`:
- `extraParams[0]`: Canal del relé (1-3)
- `extraParams[1]`: Estado (0=OFF, 1=ON)

#### Reasignación Manual
Para alarmas personalizadas:

```cpp
std::function<void(int)> customFunction = [](int param) {
    // Tu lógica personalizada aquí
};

alarmManager.setAlarmFunction("CustomAlarm", customFunction);
```

## Estructura de Datos Guardada

```json
{
  "alarms": [
    {
      "name": "RelayControl_ON",
      "hour": 8,
      "minute": 30,
      "executed": false,
      "enabled": true,
      "extraParams": [1, 1],
      "daysOfWeek": [true, true, true, true, true, false, false]
    }
  ]
}
```

## Consideraciones Importantes

1. **Funciones Execute**: No se pueden serializar, deben reasignarse después de cargar
2. **Tamaño del JSON**: Configurado para máximo 2KB (ajustable en `MAX_JSON_SIZE`)
3. **Archivo de almacenamiento**: `/alarms.json` en el sistema de archivos LittleFS
4. **Compatibilidad**: El sistema es completamente compatible con la funcionalidad existente

## Uso Recomendado

1. Inicializar el storage al inicio de la aplicación
2. Usar las funciones normales del AlarmsManager (addAlarm, enableAlarm, etc.)
3. El guardado se realiza automáticamente
4. **La reasignación de funciones de relé es automática**
5. Para alarmas personalizadas, usar `setAlarmFunction()` después de la inicialización

## Protección contra Errores

- **Verificación de nullptr**: Previene crashes si una alarma no tiene función asignada
- **Reasignación automática**: Las alarmas de relé se reasignan automáticamente al cargar
- **Logs informativos**: Indica qué alarmas fueron reasignadas y cuáles tienen problemas

## Registro de Logs

El sistema genera logs informativos para:
- Inicialización del storage
- Guardado exitoso de alarmas
- Carga exitosa de alarmas
- Errores en operaciones de archivo
