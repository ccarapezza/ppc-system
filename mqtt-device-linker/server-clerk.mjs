// mqtt-device-linker/server-clerk.mjs
// Versión del servidor con autenticación Clerk

import express from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import jwkToPem from "jwk-to-pem";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import aedes from "aedes";
import net from "net";
import { URL } from "url";
import dotenv from "dotenv";

// Cargar variables de entorno desde archivo .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Clerk - reemplaza estos valores con los tuyos
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || "YOUR_CLERK_PUBLISHABLE_KEY"; 
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "YOUR_CLERK_SECRET_KEY";
// Obtener el dominio de Clerk desde la clave pública (pk_test_capable-otter-123...)
const clerkDomain = CLERK_PUBLISHABLE_KEY ? CLERK_PUBLISHABLE_KEY.split('_')[2] : '<TU_DOMINIO>';
const CLERK_JWKS_URL = process.env.CLERK_JWKS_URL || `https://${clerkDomain}.clerk.accounts.dev/.well-known/jwks.json`;
const CLERK_API_URL = "https://api.clerk.dev/v1";
const DEVICE_LINK_TOPIC = "devices/+/link";
const DEVICE_UNLINK_TOPIC = "devices/+/unlink";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ------------------ STATIC FILES ------------------
//app.use(express.static(path.join(__dirname, "public")));

// Ruta raíz para devolver index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index-clerk.html"));
});

// ------------------ DB SETUP ------------------
const db = new sqlite3.Database("devices.db");
db.serialize(() => {
  // Tabla de dispositivos - registra todos los dispositivos que envían señal de presencia
  db.run(
    `CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      device_name TEXT,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_online BOOLEAN DEFAULT 0,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT,
      linked_at DATETIME
    )`
  );
  
  // Índice para búsquedas por usuario
  db.run("CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices (user_id)");
});

// ------------------ JWT VERIFICATION ------------------
let jwks = null;
async function fetchJWKs() {
  try {
    console.log("[AUTH] Obteniendo JWKS de Clerk...");
    //CLERK_JWKS_URL
    console.log(`[AUTH] URL de JWKS: ${CLERK_JWKS_URL}`);
    const res = await axios.get(CLERK_JWKS_URL);
    jwks = res.data.keys;
    console.log("[AUTH] JWKS obtenidos correctamente");
  } catch (error) {
    console.error("[AUTH] Error al obtener JWKS:", error.message);
    throw new Error("No se pudieron obtener las claves JWKS");
  }
}

function getKey(header, callback) {
  if (!jwks) {
    return callback(new Error("JWKS no disponibles"));
  }
  
  const key = jwks.find((k) => k.kid === header.kid);
  if (!key) return callback(new Error("No matching key"));
  
  try {
    const pubkey = jwkToPem(key);
    callback(null, pubkey);
  } catch (error) {
    callback(new Error("Error al convertir JWK a PEM"));
  }
}

async function verifyClerkToken(token) {
  if (!jwks) await fetchJWKs();
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        console.error("[AUTH] Error al verificar token:", err.message);
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

// ------------------ WEBSOCKET SERVER ------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ 
  server,
  verifyClient: async ({ req }, done) => {
    try {
      // Extraer token del query string
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        console.log("[WS] Conexión rechazada: No se proporcionó token");
        return done(false, 401, "No se proporcionó token de autenticación");
      }
      
      try {
        // Verificar el token
        const decoded = await verifyClerkToken(token);
        
        // Si llegamos aquí, el token es válido
        console.log(`[WS] Usuario autenticado: ${decoded.sub}`);
        
        // Almacenar la información del usuario en el objeto request
        req.userId = decoded.sub;
        req.userInfo = decoded;
        
        // Permitir la conexión
        done(true);
      } catch (authErr) {
        console.log("[WS] Conexión rechazada: Token inválido");
        done(false, 401, "Token de autenticación inválido");
      }
    } catch (err) {
      console.error("[WS] Error al verificar cliente:", err);
      done(false, 500, "Error interno del servidor");
    }
  }
});

let clients = [];

function sendDeviceList(ws) {
    
    // Construir la consulta SQL según si filtramos por usuario o no
    let sql = "SELECT * FROM devices";
    const params = [];
    
    /*
    // Si el usuario está autenticado, enviar solo sus dispositivos si tiene userId
    const userId = ws.userId;
  if (userId) {
    sql += " WHERE user_id = ?";
    params.push(userId);
  }
    */
  
  db.all(sql, params, (err, rows) => {
    if (err) return;
    
    // Convertir las filas a un formato más amigable para el frontend
    const devices = rows.map(device => ({
      ...device,
      is_online: !!device.is_online, // Convertir 0/1 a boolean
      linked: !!device.user_id,      // Determinar si está vinculado
      last_seen: device.last_seen,   // Mantener timestamp para cálculos de "último visto hace"
      first_seen: device.first_seen  // Cuando se descubrió por primera vez
    }));
    
    const payload = JSON.stringify({ type: "device_list", devices });
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  });
}

wss.on("connection", (ws, req) => {
  // Guardar información del usuario en el objeto WebSocket
  ws.userId = req.userId;
  ws.userInfo = req.userInfo;
  
  clients.push(ws);
  console.log(`[WS] Cliente conectado - Usuario: ${ws.userId}`);
  sendDeviceList(ws); // enviar el estado inicial al cliente recién conectado

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Aquí puedes procesar mensajes del cliente si es necesario
      if (data.type === "link_device" && data.deviceId) {
        console.log(`[WS] Solicitud de vinculación para dispositivo ${data.deviceId} por usuario ${ws.userId}`);
        
        // Vincular el dispositivo con el usuario
        db.run(
          "UPDATE devices SET user_id = ?, linked_at = CURRENT_TIMESTAMP WHERE device_id = ?",
          [ws.userId, data.deviceId],
          (err) => {
            if (err) {
              console.error("[DB] Error al vincular dispositivo:", err);
              ws.send(JSON.stringify({
                type: "link_result",
                success: false,
                deviceId: data.deviceId,
                error: "Error al vincular dispositivo"
              }));
            } else {
              console.log(`[WS] Dispositivo ${data.deviceId} vinculado a usuario ${ws.userId}`);
              
              // Publicar mensaje MQTT para informar al dispositivo
              aedesBroker.publish({
                topic: `devices/${data.deviceId}/link`,
                payload: JSON.stringify({ linked: true, user_id: ws.userId })
              });
              
              // Enviar confirmación al cliente web
              ws.send(JSON.stringify({
                type: "link_result",
                success: true,
                deviceId: data.deviceId
              }));
              
              // Actualizar todos los clientes
              broadcastDeviceList();
            }
          }
        );
      }
      
      if (data.type === "unlink_device" && data.deviceId) {
        console.log(`[WS] Solicitud de desvinculación para dispositivo ${data.deviceId} por usuario ${ws.userId}`);
        
        // Verificar que el dispositivo pertenece al usuario
        db.get("SELECT * FROM devices WHERE device_id = ? AND user_id = ?", 
          [data.deviceId, ws.userId], 
          (err, row) => {
            if (err) {
              console.error("[DB] Error al buscar dispositivo:", err);
              return;
            }
            
            if (!row) {
              ws.send(JSON.stringify({
                type: "unlink_result",
                success: false,
                deviceId: data.deviceId,
                error: "El dispositivo no pertenece a este usuario"
              }));
              return;
            }
            
            // Desvincular el dispositivo
            db.run(
              "UPDATE devices SET user_id = NULL, linked_at = NULL WHERE device_id = ?", 
              [data.deviceId], 
              (err) => {
                if (err) {
                  console.error("[DB] Error al desvincular dispositivo:", err);
                  ws.send(JSON.stringify({
                    type: "unlink_result",
                    success: false,
                    deviceId: data.deviceId,
                    error: "Error al desvincular dispositivo"
                  }));
                } else {
                  console.log(`[WS] Dispositivo ${data.deviceId} desvinculado`);
                  
                  // Publicar mensaje MQTT para informar al dispositivo
                  aedesBroker.publish({
                    topic: `devices/${data.deviceId}/unlink`,
                    payload: JSON.stringify({ unlinked: true })
                  });
                  
                  // Enviar confirmación al cliente web
                  ws.send(JSON.stringify({
                    type: "unlink_result",
                    success: true,
                    deviceId: data.deviceId
                  }));
                  
                  // Actualizar todos los clientes
                  broadcastDeviceList();
                }
              }
            );
          }
        );
      }
    } catch (err) {
      console.error("[WS] Error al procesar mensaje:", err);
    }
  });

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log(`[WS] Cliente desconectado - Usuario: ${ws.userId}`);
  });
});

function broadcastDeviceList() {
  clients.forEach((ws) => sendDeviceList(ws));
}

// ------------------ MQTT BROKER (AEDES) ------------------
const aedesBroker = aedes();
const mqttServer = net.createServer(aedesBroker.handle);
mqttServer.listen(1883, () => {
  console.log("[AEDES] MQTT broker corriendo en puerto 1883");
});

// Mantener un registro de dispositivos online por client_id
const clientToDeviceMap = new Map(); // client_id -> device_id

// Suscripción a eventos de publicación
// Maneja mensajes publicados en los tópicos de link/unlink/presence
aedesBroker.on("publish", async (packet, client) => {
  try {
    if (!packet.topic) return;
    const [prefix, device_id, action] = packet.topic.split("/");
      // Asociar el cliente con el dispositivo para mensajes de presencia
    if (prefix === "devices" && action === "presence") {
      try {
        const payload = JSON.parse(packet.payload.toString());
        // Verificar si es un LWT (Last Will Testament) message (no tiene cliente asociado)
        const isLWT = !client && payload.status === "offline";
        
        if (isLWT) {
          console.log(`[AEDES] Recibido LWT de dispositivo ${device_id} (offline por desconexión)`);
          // Los LWT ya son manejados correctamente por el código de abajo para presencia
        } 
        // Mensaje normal con cliente conectado
        else if (client) {
          // Asociar cliente con dispositivo si está online
          if (payload.status === "online" || !payload.status) {
            console.log(`[AEDES] Asociando cliente ${client.id} con dispositivo ${device_id}`);
            clientToDeviceMap.set(client.id, device_id);
          } 
          // Mensaje explícito de offline de un cliente aún conectado
          else if (payload.status === "offline") {
            console.log(`[AEDES] Dispositivo ${device_id} envió estado offline explícito`);
            // Desasociar este cliente si está en el mapa
            if (clientToDeviceMap.get(client.id) === device_id) {
              console.log(`[AEDES] Eliminando asociación cliente-dispositivo para ${client.id}`);
              clientToDeviceMap.delete(client.id);
            }
          }
        }
      } catch (err) {
        console.error("[AEDES] Error al parsear payload de presencia:", err);
      }
    }
      if (prefix === "devices") {
      // Manejo de presencia de dispositivos
      if (action === "presence") {
        try {
          const payload = JSON.parse(packet.payload.toString());
          const device_name = payload.device_name || "Dispositivo sin nombre";
          const status = payload.status || "online";
          const is_online = status === "online";
          
          console.log(`[AEDES] Device presence: ${device_id} - ${device_name} - Status: ${status} (is_online: ${is_online})`);
          
          // Registrar o actualizar el dispositivo en la base de datos
          db.get("SELECT * FROM devices WHERE device_id = ?", [device_id], (err, row) => {
            if (err) {
              console.error("[DB] Error al buscar dispositivo:", err);
              return;
            }
            
            if (row) {
              // Dispositivo existe, actualizar estado y timestamp
              // Forzar la actualización del estado con el valor correcto
              console.log(`[DB] Actualizando dispositivo ${device_id} con estado ${is_online ? 'online' : 'offline'}`);
              db.run(
                "UPDATE devices SET last_seen = CURRENT_TIMESTAMP, is_online = ?, device_name = ? WHERE device_id = ?",
                [is_online ? 1 : 0, device_name, device_id],
                (err) => {
                  if (err) {
                    console.error("[DB] Error al actualizar dispositivo:", err);
                  } else {
                    console.log(`[DB] Dispositivo ${device_id} actualizado correctamente a ${is_online ? 'online' : 'offline'}`);
                    // Asociar o desasociar cliente según estado
                    if (is_online && client) {
                      console.log(`[AEDES] Registro asociación cliente ${client.id} -> dispositivo ${device_id}`);
                      clientToDeviceMap.set(client.id, device_id);
                    }
                    broadcastDeviceList(); // Enviar lista actualizada a clientes WebSocket
                  }
                }
              );
            } else {
              // Primer registro del dispositivo
              console.log(`[DB] Registrando nuevo dispositivo ${device_id} con estado ${is_online ? 'online' : 'offline'}`);
              db.run(
                "INSERT INTO devices (device_id, device_name, is_online, first_seen, last_seen) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                [device_id, device_name, is_online ? 1 : 0],
                (err) => {
                  if (err) {
                    console.error("[DB] Error al insertar dispositivo:", err);
                  } else {
                    console.log(`[DB] Dispositivo ${device_id} registrado correctamente con estado ${is_online ? 'online' : 'offline'}`);
                    // Asociar cliente si está online
                    if (is_online && client) {
                      console.log(`[AEDES] Registro asociación cliente ${client.id} -> dispositivo ${device_id}`);
                      clientToDeviceMap.set(client.id, device_id);
                    }
                    broadcastDeviceList(); // Enviar lista actualizada a clientes WebSocket
                  }
                }
              );
            }
          });
        } catch (parseErr) {
          console.error("[AEDES] Error al procesar mensaje de presencia:", parseErr);
        }
      }
      // Manejo de vinculaciones
      else if (action === "link") {
        try {
          const payload = JSON.parse(packet.payload.toString());
        
          try {
            const decoded = await verifyClerkToken(payload.jwt);
            const user_id = decoded.sub;
            
            // Actualizar solo la información de vinculación
            db.run(
              "UPDATE devices SET user_id = ?, linked_at = CURRENT_TIMESTAMP WHERE device_id = ?",
              [user_id, device_id],
              (err) => {
                if (err) {
                  console.error("[DB] Error:", err);
                  return;
                }
                
                console.log(`[AEDES] Vinculado ${device_id} a ${user_id}`);
                
                // Confirmar al dispositivo
                aedesBroker.publish({
                  topic: `devices/${device_id}/ack`,
                  payload: JSON.stringify({ linked: true, user_id })
                });
                
                broadcastDeviceList();
              }
            );
          } catch (authErr) {
            console.error("[AUTH] Error al verificar token:", authErr);
            // Informar al dispositivo del error de autenticación
            aedesBroker.publish({
              topic: `devices/${device_id}/ack`,
              payload: JSON.stringify({ linked: false, error: "Token de autenticación inválido" })
            });
          }
        } catch (parseErr) {
          console.error("[AEDES] Error al procesar mensaje de vinculación:", parseErr);
        }
      }
      // Manejo de desvinculaciones
      else if (action === "unlink") {
        // Solo limpiar la vinculación, no eliminar el registro del dispositivo
        db.run(
          "UPDATE devices SET user_id = NULL, linked_at = NULL WHERE device_id = ?", 
          [device_id], 
          (err) => {
            if (err) {
              console.error("[DB] Error:", err);
              return;
            }
            console.log(`[AEDES] Desvinculado ${device_id}`);
            broadcastDeviceList();
            
            // Confirmar al dispositivo
            aedesBroker.publish({
              topic: `devices/${device_id}/ack`,
              payload: JSON.stringify({ unlinked: true })
            });
          }
        );
      }
    }
  } catch (err) {
    console.error("[AEDES] Error general al procesar mensaje:", err);
  }
});

// Detectar conexiones y desconexiones de clientes MQTT
aedesBroker.on("client", (client) => {
  console.log(`[AEDES] Client connected: ${client.id}`);
  
  // Podemos agregar un timeout para verificar si es un dispositivo conocido
  // y aún no ha enviado un mensaje de presencia
  setTimeout(() => {
    if (client && !clientToDeviceMap.has(client.id)) {
      console.log(`[AEDES] Client ${client.id} conectado pero sin identificar después de 5 segundos`);
    }
  }, 5000);
});

// Configurar manejo de Will Messages (LWT) para procesarlos correctamente
aedesBroker.on("publish", (packet, client) => {
  // Si es un último mensaje (LWT) procesarlo de forma especial
  if (packet.cmd === 'publish' && packet.retain && !client) {
    console.log(`[AEDES] Procesando LWT message en topic: ${packet.topic}`);
    // Los mensajes LWT normalmente no tienen cliente asociado (client es null)
  }
});

aedesBroker.on("clientDisconnect", (client) => {
  console.log(`[AEDES] Client disconnected: ${client.id}`);
  
  // Verificar si este cliente estaba asociado a un dispositivo
  const deviceId = clientToDeviceMap.get(client.id);
  if (deviceId) {
    console.log(`[AEDES] Device ${deviceId} marked as offline due to client disconnect`);
    
    // Marcar dispositivo como offline en la base de datos
    db.run(
      "UPDATE devices SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?",
      [deviceId],
      (err) => {
        if (err) {
          console.error("[DB] Error al actualizar estado de dispositivo:", err);
        } else {
          console.log(`[DB] Dispositivo ${deviceId} marcado como offline en la base de datos`);
        }
        
        // Eliminar la asociación cliente-dispositivo
        clientToDeviceMap.delete(client.id);
        
        // Informar a los clientes del cambio de estado
        broadcastDeviceList();
      }
    );
  }
});

// ------------------ API REST AUTENTICADA ------------------
// Middleware para verificar el token de autenticación en las peticiones API
async function authMiddleware(req, res, next) {
  try {
    // Excluir rutas públicas específicas (como la configuración de Clerk)
    if (req.path === '/clerk-config') {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Se requiere token de autenticación' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = await verifyClerkToken(token);
      req.userId = decoded.sub;
      req.userInfo = decoded;
      next();
    } catch (err) {
      console.error('[API] Error de autenticación:', err.message);
      return res.status(401).json({ error: 'Token no válido' });
    }
  } catch (err) {
    console.error('[API] Error en middleware de autenticación:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Ruta pública para obtener la clave publicable de Clerk
app.get('/api/clerk-config', (req, res) => {
  res.json({
    publishableKey: CLERK_PUBLISHABLE_KEY
  });
});

// Proteger todas las rutas API con el middleware de autenticación
app.use('/api', authMiddleware);

// API para obtener dispositivos (ahora filtrados por el usuario autenticado)
app.get("/api/devices", (req, res) => {
  // El usuario está autenticado, obtener sus dispositivos
  const userId = req.userId;
  
  // Opciones de filtrado
  const { online, linked } = req.query;
  
  let sql = "SELECT * FROM devices WHERE user_id = ?";
  const params = [userId];
  
  // Construir condiciones de filtrado adicionales
  if (online === 'true') {
    sql += " AND is_online = 1";
  } else if (online === 'false') {
    sql += " AND is_online = 0";
  }
  
  // Ordenar por último visto más reciente primero
  sql += " ORDER BY last_seen DESC";
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Convertir a formato amigable para frontend
    const devices = rows.map(device => ({
      ...device,
      is_online: !!device.is_online,
      linked: !!device.user_id
    }));
    
    res.json(devices);
  });
});

// API para obtener dispositivos disponibles para vincular (no vinculados a ningún usuario)
app.get("/api/devices/available", (req, res) => {
  db.all("SELECT * FROM devices WHERE is_online = 1 AND user_id IS NULL ORDER BY last_seen DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(device => ({
      ...device,
      is_online: true,
      linked: false
    })));
  });
});

// API para vincular un dispositivo al usuario autenticado
app.post("/api/devices/:deviceId/link", (req, res) => {
  const { deviceId } = req.params;
  const userId = req.userId;
  
  db.run(
    "UPDATE devices SET user_id = ?, linked_at = CURRENT_TIMESTAMP WHERE device_id = ? AND user_id IS NULL",
    [userId, deviceId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      if (this.changes === 0) {
        return res.status(400).json({ error: "El dispositivo ya está vinculado o no existe" });
      }
      
      console.log(`[API] Dispositivo ${deviceId} vinculado a usuario ${userId}`);
      
      // Publicar mensaje MQTT para informar al dispositivo
      aedesBroker.publish({
        topic: `devices/${deviceId}/link`,
        payload: JSON.stringify({ linked: true, user_id: userId })
      });
      
      broadcastDeviceList();
      
      res.json({ success: true });
    }
  );
});

// API para desvincular un dispositivo
app.post("/api/devices/:deviceId/unlink", (req, res) => {
  const { deviceId } = req.params;
  const userId = req.userId;
  
  // Verificar que el dispositivo pertenece al usuario
  db.get(
    "SELECT * FROM devices WHERE device_id = ? AND user_id = ?",
    [deviceId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (!row) {
        return res.status(403).json({ error: "El dispositivo no pertenece a este usuario" });
      }
      
      // Desvincular
      db.run(
        "UPDATE devices SET user_id = NULL, linked_at = NULL WHERE device_id = ?", 
        [deviceId], 
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          
          console.log(`[API] Dispositivo ${deviceId} desvinculado por usuario ${userId}`);
          
          // Publicar mensaje MQTT
          aedesBroker.publish({
            topic: `devices/${deviceId}/unlink`,
            payload: JSON.stringify({ unlinked: true })
          });
          
          broadcastDeviceList();
          res.json({ success: true });
        }
      );
    }
  );
});

// ------------------ INICIAR SERVIDOR ------------------

// Inicializar obteniendo JWKS para autenticación
fetchJWKs().then(() => {
  server.listen(3000, () => {
    console.log("[API+WS] Escuchando en http://localhost:3000");
    console.log("[AUTH] Autenticación con Clerk activada");
  });
}).catch(err => {
  console.error("[FATAL] Error al inicializar autenticación:", err);
  process.exit(1);
});

// Añadir diagnóstico periódico para verificar el estado de conexiones y dispositivos
function runDiagnostics() {
  console.log("\n[DIAGNÓSTICO] Inicio de verificación periódica de estado -------------");
  
  // Contar conexiones actuales
  console.log(`[DIAGNÓSTICO] Conexiones MQTT activas: ${clientToDeviceMap.size}`);
  
  // Listar conexiones
  if (clientToDeviceMap.size > 0) {
    console.log("[DIAGNÓSTICO] Listado de conexiones activas:");
    
    for (const [clientId, deviceId] of clientToDeviceMap.entries()) {
      console.log(`  - Cliente ${clientId} -> Dispositivo ${deviceId}`);
    }
  }
  
  // Verificar inconsistencias en la base de datos
  db.all("SELECT * FROM devices", [], (err, rows) => {
    if (err) {
      console.error("[DIAGNÓSTICO] Error al consultar dispositivos:", err);
      return;
    }
    
    // Total de dispositivos y estado
    console.log(`[DIAGNÓSTICO] Total dispositivos registrados: ${rows.length}`);
    const onlineCount = rows.filter(d => d.is_online === 1).length;
    console.log(`[DIAGNÓSTICO] Dispositivos online: ${onlineCount}, offline: ${rows.length - onlineCount}`);
    
    // Detectar inconsistencias: dispositivos marcados como online sin conexión MQTT activa
    const inconsistentDevices = rows
      .filter(d => d.is_online === 1)
      .filter(d => !Array.from(clientToDeviceMap.values()).includes(d.device_id));
    
    if (inconsistentDevices.length > 0) {
      console.log(`[DIAGNÓSTICO] ⚠️ Se encontraron ${inconsistentDevices.length} dispositivos marcados como online sin conexión MQTT activa:`);
      
      // Corregir automáticamente las inconsistencias
      inconsistentDevices.forEach(device => {
        console.log(`  - Corrigiendo estado de dispositivo ${device.device_id} (${device.device_name})`);
        
        // Actualizar a offline en la base de datos
        db.run(
          "UPDATE devices SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?",
          [device.device_id],
          (err) => {
            if (err) {
              console.error(`[DIAGNÓSTICO] Error al corregir estado de ${device.device_id}:`, err);
            } else {
              console.log(`[DIAGNÓSTICO] ✓ Estado de ${device.device_id} corregido a offline`);
              broadcastDeviceList();
            }
          }
        );
      });
    }
    
    console.log("[DIAGNÓSTICO] Fin de verificación periódica -------------\n");
  });
}

// Ejecutar diagnóstico cada minuto
const DIAGNOSTICS_INTERVAL = 60 * 1000; // 60 segundos
setInterval(runDiagnostics, DIAGNOSTICS_INTERVAL);

// Ejecutar un diagnóstico inicial después de 5 segundos
setTimeout(runDiagnostics, 5000);
