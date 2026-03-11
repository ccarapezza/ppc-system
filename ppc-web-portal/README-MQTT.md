# Integración MQTT/WebSocket - PPC Web Portal

Este documento describe cómo usar la funcionalidad de gestión de dispositivos Arduino con el servidor MQTT/WebSocket, incluyendo control remoto de salidas digitales, visualización de alarmas y monitoreo de estado.

## Configuración

### 1. Variables de Entorno

Asegúrate de que el archivo `.env.local` esté configurado correctamente:

```bash
# URL del servidor MQTT/WebSocket 
NEXT_PUBLIC_MQTT_WS_URL=ws://localhost:3000

# Configuración de Clerk (debe estar ya configurado)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key
CLERK_SECRET_KEY=tu_clerk_secret_key
```

### 2. Servidor MQTT

El servidor MQTT/WebSocket debe estar ejecutándose en el puerto 3000. Para iniciarlo:

```bash
cd ppc-backend
node server-clerk.mjs
```

### 3. Aplicación Next.js

Para iniciar la aplicación Next.js:

```bash
cd ppc-web-portal
npm run dev
```

## Funcionalidades

### Gestión de Dispositivos

1. **Ver Dispositivos**: Navega a `/devices` para ver todos los dispositivos registrados
2. **Filtros**:
   - **Todos**: Muestra todos los dispositivos registrados
   - **Mis dispositivos**: Solo los dispositivos vinculados a tu cuenta
   - **Disponibles**: Dispositivos online que pueden ser vinculados

3. **Vincular Dispositivo**: 
   - Los dispositivos Arduino aparecen automáticamente cuando se conectan al broker MQTT
   - Solo puedes vincular dispositivos que estén online y no vinculados a otro usuario
   - Haz clic en "Vincular" en la tarjeta del dispositivo

4. **Desvincular Dispositivo**:
   - Solo puedes desvincular tus propios dispositivos
   - Haz clic en "Desvincular" en la tarjeta del dispositivo

### Control Remoto de Dispositivos

5. **Ver Detalles del Dispositivo**:
   - Haz clic en "Ver Detalles" en la tarjeta de un dispositivo vinculado
   - Se abrirá un modal con información completa del dispositivo

6. **Control de Salidas Digitales**:
   - Desde el modal de detalles, puedes encender/apagar las salidas digitales
   - Cada salida muestra su estado actual (ON/OFF) y el pin asignado
   - Solo usuarios vinculados al dispositivo pueden controlarlo

7. **Monitoreo de Tiempo**:
   - Visualiza la hora actual del dispositivo Arduino
   - Se actualiza automáticamente cada 30 segundos

8. **Visualización de Alarmas**:
   - Ve todas las alarmas programadas en el dispositivo
   - Muestra hora, canal, acción (ON/OFF) y estado (activa/inactiva)

### Estado de Conexión

- En la esquina inferior derecha verás un indicador de estado de conexión
- Verde: Conectado al servidor MQTT
- Rojo: Desconectado (intentará reconectar automáticamente)

## Flujo de Trabajo con Dispositivos Arduino

1. **Dispositivo Arduino se conecta**: 
   - El dispositivo publica un mensaje de presencia en `devices/{device_id}/presence`
   - Aparece automáticamente en la lista de dispositivos disponibles

2. **Usuario vincula dispositivo**:
   - El usuario hace clic en "Vincular" en la interfaz web
   - Se envía un mensaje WebSocket al servidor
   - El servidor actualiza la base de datos y publica un mensaje MQTT al dispositivo

3. **Usuario solicita información del dispositivo**:
   - Al hacer clic en "Ver Detalles", se envía una solicitud de información
   - El servidor solicita al Arduino vía MQTT la información actual
   - El Arduino responde con el estado de salidas digitales, alarmas y tiempo

4. **Control remoto de salidas**:
   - El usuario puede encender/apagar salidas desde la interfaz web
   - Se envía un comando MQTT al dispositivo específico
   - El Arduino ejecuta el comando y envía confirmación

## Mensajes MQTT

### Dispositivo Arduino -> Servidor

```javascript
// Mensaje de presencia
Topic: devices/{device_id}/presence
Payload: {
  "device_name": "Nombre del dispositivo",
  "status": "online" | "offline"
}

// Información del dispositivo (respuesta a solicitud)
Topic: devices/{device_id}/info
Payload: {
  "digitalOutputs": [
    {"id": 0, "pin": 16, "state": true},
    {"id": 1, "pin": 12, "state": false}
  ],
  "time": {"time": "2024-01-15T10:30:00Z"},
  "alarms": [
    {"id": "1", "hour": 8, "minute": 0, "enabled": true, "channel": 1, "action": "ON"}
  ]
}

// Respuesta de control
Topic: devices/{device_id}/control_response
Payload: {
  "success": true,
  "output_id": 0,
  "state": true
}
```

### Servidor -> Dispositivo Arduino

```javascript
// Solicitud de información
Topic: devices/{device_id}/request_info
Payload: {
  "type": "request_info",
  "user_id": "clerk_user_id",
  "request_id": "timestamp"
}

// Control de salida digital
Topic: devices/{device_id}/control
Payload: {
  "type": "digital_output",
  "output_id": 0,
  "state": true,
  "user_id": "clerk_user_id"
}

// Confirmación de vinculación
Topic: devices/{device_id}/link
Payload: {
  "linked": true,
  "user_id": "clerk_user_id"
}

// Notificación de desvinculación  
Topic: devices/{device_id}/unlink
Payload: {
  "unlinked": true
}
```

## Arquitectura

```
[Arduino] --MQTT--> [Aedes Broker] <--WebSocket--> [Next.js App]
    |                     |                           |
    |               [SQLite DB]                  [DeviceManager]
    |                     |                           |
    v               [Clerk Auth]                [DeviceDetail Modal]
[Control Response]                               [Digital Output Controls]
```

- **Arduino**: Publica presencia, responde a solicitudes y ejecuta comandos
- **Aedes Broker**: Broker MQTT embebido que maneja las comunicaciones
- **WebSocket**: Comunicación en tiempo real entre el servidor y la aplicación web
- **SQLite**: Base de datos que almacena el estado de los dispositivos
- **Clerk**: Sistema de autenticación que identifica a los usuarios
- **DeviceDetail Modal**: Interfaz para control detallado del dispositivo

## Componentes Principales

### Frontend (Next.js)
- `useDeviceWebSocket`: Hook que maneja la conexión WebSocket y la comunicación con el servidor
- `DeviceManager`: Componente principal que muestra la lista de dispositivos y permite gestionarlos
- `DeviceCard`: Componente individual para cada dispositivo
- `DeviceDetail`: Modal con información detallada y controles del dispositivo
- `ConnectionStatus`: Indicador de estado de conexión en tiempo real

### Backend (Arduino)
- `MqttClient`: Cliente MQTT que maneja toda la comunicación
- `publishCurrentDeviceInfo()`: Función que recopila y envía información del dispositivo
- `handleMqttMessage()`: Maneja comandos entrantes del servidor
- `DigitalOutput`: Clase para manejar salidas digitales
- `AlarmsManager`: Gestor de alarmas del dispositivo
- `Clock`: Sistema de tiempo del dispositivo

## Seguridad

- **Autenticación**: Solo usuarios autenticados con Clerk pueden acceder
- **Autorización**: Solo el propietario vinculado puede controlar un dispositivo
- **Validación**: Todos los comandos son validados antes de ejecución
- **Tokens JWT**: Verificación de tokens en todas las operaciones

## Solución de Problemas

1. **Dispositivos no aparecen**: Verifica que el Arduino esté publicando mensajes de presencia correctamente
2. **No se puede vincular**: Asegúrate de que el dispositivo esté online y no vinculado a otro usuario
3. **Conexión WebSocket falla**: Verifica que el servidor MQTT esté ejecutándose y que las credenciales de Clerk sean correctas
4. **Control no funciona**: Verifica que el dispositivo esté online y que seas el propietario vinculado
5. **Información no actualiza**: El sistema actualiza automáticamente, pero puedes usar el botón "Actualizar" en el modal
6. **Reconexión automática**: El sistema intentará reconectar automáticamente cada 5 segundos si se pierde la conexión

## Personalización

- Cambia `deviceName` en `main.cpp` para personalizar el nombre del dispositivo
- Modifica los pines en `main.cpp` según tu configuración hardware
- Ajusta el intervalo de actualización en `DeviceDetail.tsx` (línea con `setInterval`)
- Personaliza los estilos CSS en los componentes según tu diseño
