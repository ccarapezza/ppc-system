// Cliente simple de Socket.IO para probar la conexión al servidor
const { io } = require("socket.io-client");

// Configuración del cliente
const SERVER_URL = "https://socket.powerplantcontrol.com.ar";
const DEVICE_ID = "test-device-" + Math.floor(Math.random() * 1000);
const DEVICE_NAME = "Test Client";

console.log(`Conectando a Socket.IO server: ${SERVER_URL}`);
console.log(`ID del dispositivo: ${DEVICE_ID}`);

// Opciones de conexión - importante para HTTPS
const socket = io(SERVER_URL, {
  reconnectionDelay: 1000,
  reconnection: true,
  transports: ['websocket'],
  rejectUnauthorized: false, // Importante para conexiones HTTPS con certificados autofirmados
  agent: false,
  upgrade: true,
  forceNew: true
});

// Evento de conexión
socket.on("connect", () => {
  console.log("Conectado al servidor Socket.IO");
  console.log(`Socket ID: ${socket.id}`);
  
  // Registrar el dispositivo
  registerDevice();
  
  // Enviar un estado cada 10 segundos
  setInterval(() => {
    sendStatus("active");
  }, 10000);
});

// Evento de desconexión
socket.on("disconnect", (reason) => {
  console.log(`Desconectado del servidor: ${reason}`);
});

// Evento de error
socket.on("connect_error", (error) => {
  console.error(`Error de conexión: ${error.message}`);
});

// Evento de reconexión
socket.on("reconnect", (attemptNumber) => {
  console.log(`Reconectado después de ${attemptNumber} intentos`);
});

// Evento de intento de reconexión
socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`Intento de reconexión #${attemptNumber}`);
});

// Recibir actualizaciones de la lista de dispositivos
socket.on("device-list-updated", (deviceList) => {
  console.log("Lista de dispositivos actualizada:");
  console.table(deviceList.map(device => ({
    id: device.id,
    name: device.name,
    status: device.status,
    lastSeen: device.lastSeen
  })));
});

// Función para registrar el dispositivo
function registerDevice() {
  const deviceInfo = {
    id: DEVICE_ID,
    name: DEVICE_NAME,
    ssid: "Test Network",
    ip: "127.0.0.1",
    mac: "00:00:00:00:00:00",
    rssi: -50,
    status: "online"
  };
  
  console.log("Registrando dispositivo...");
  socket.emit("register-device", deviceInfo);
}

// Función para enviar estado
function sendStatus(status) {
  const statusInfo = {
    id: DEVICE_ID,
    status: "online", // Siempre enviar 'online' para mantener el estado de conexión
    activityStatus: status, // Usar un campo separado para el estado de actividad
    timestamp: Date.now()
  };
}

// Manejar cierre del programa
process.on('SIGINT', () => {
  console.log("Cerrando cliente...");
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 500);
});

console.log("Cliente iniciado. Presione Ctrl+C para salir.");