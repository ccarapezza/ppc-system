import 'dotenv/config'; // Cargar variables de entorno desde .env
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path, { dirname } from 'node:path';
import { Server } from 'socket.io';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
});

// Inicializar aplicación Express
const app = express();
app.use(clerkMiddleware())
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));


// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
//express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Almacenar dispositivos conectados
const connectedDevices = {};

// Socket.IO - Manejar conexiones de dispositivos
io.on('connection', (socket) => {
    console.log(`Nueva conexión: ${socket.id}`);

    // emitir la lista de dispositivos conectados solo al nuevo cliente
    io.to(socket.id).emit('device-list-updated', Object.values(connectedDevices));

    // Cuando un dispositivo se registra
    socket.on('register-device', (deviceInfo) => {
        const deviceId = deviceInfo.id || socket.id;
        console.log(`Dispositivo registrado: ${deviceId}`);
        
        // Guardar información del dispositivo
        connectedDevices[deviceId] = {
            id: deviceId,
            name: deviceInfo.name || 'Dispositivo sin nombre',
            ip: deviceInfo.ip || socket.handshake.address,
            ssid: deviceInfo.ssid || 'Desconocido',
            connectedAt: new Date(),
            disconnectedAt: null,
            status: 'online',
            socketId: socket.id,
            ...deviceInfo
        };
        
        // Emitir evento a todos los clientes sobre el nuevo dispositivo
        io.emit('device-list-updated', Object.values(connectedDevices));
    });
    
    // Manejar desconexión
    socket.on('disconnect', () => {
        console.log(`Dispositivo desconectado: ${socket.id}`);
        
        // Buscar y marcar dispositivos desconectados
        Object.keys(connectedDevices).forEach(deviceId => {
            if (connectedDevices[deviceId].socketId === socket.id) {
                connectedDevices[deviceId].status = 'offline';
                connectedDevices[deviceId].disconnectedAt = new Date();

                io.emit('device-list-updated', Object.values(connectedDevices));
            }
        });
    });
});

// API REST para obtener la lista de dispositivos
app.get('/api/devices', requireAuth(), (req, res) => {
    const { userId } = getAuth(req);
    console.log(`/api/devices Usuario autenticado: ${userId}`);

    res.json(Object.values(connectedDevices));
});

app.get('/js/main.js', requireAuth(), (req, res) => {
    // Enviar el archivo JavaScript al cliente con el mime type correcto
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'main.js'));
});

app.get('/dashboard', requireAuth(), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta principal para la página web
app.get('/', (req, res) => {
    const { userId } = getAuth(req);
    if (userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/unauthorized', (req, res) => {
    res.status(401).send('Acceso no autorizado. Por favor, inicia sesión para continuar.');
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});