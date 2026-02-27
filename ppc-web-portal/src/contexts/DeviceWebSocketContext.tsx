'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import type { Device, WebSocketMessage } from '@/types/mqtt';

interface DeviceWebSocketContextType {
  devices: Device[];
  deviceInfos: Map<string, any>;
  isConnected: boolean;
  error: string | null;
  linkDevice: (deviceId: string) => void;
  unlinkDevice: (deviceId: string) => void;
  requestDeviceInfo: (deviceId: string) => void;
  controlDigitalOutput: (deviceId: string, outputId: number, state: boolean) => void;
  reconnect: () => void;
}

const DeviceWebSocketContext = createContext<DeviceWebSocketContextType | null>(null);

interface DeviceWebSocketProviderProps {
  children: ReactNode;
}

export const DeviceWebSocketProvider: React.FC<DeviceWebSocketProviderProps> = ({ children }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceInfos, setDeviceInfos] = useState<Map<string, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 10;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    // Evitar múltiples conexiones simultáneas
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Ya existe una conexión activa o en progreso');
      return;
    }

    if (!user) {
      console.log('[WS] Usuario no autenticado, saltando conexión');
      return;
    }

    try {
      console.log('[WS] Intentando conectar...');
      const token = await getToken();
      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      // Cerrar conexión existente si existe
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const wsUrl = `${process.env.NEXT_PUBLIC_MQTT_WS_URL || 'ws://localhost:3000'}?token=${token}`;
      console.log(`[WS] Conectando a: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Conectado al servidor MQTT');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'device_list':
              console.log(`[WS] Lista de dispositivos recibida: ${message.devices.length} dispositivos`);
              setDevices(message.devices);
              break;
              
            case 'link_result':
              if (message.success) {
                console.log(`[WS] Dispositivo ${message.deviceId} vinculado exitosamente`);
                clearError();
              } else {
                console.error(`[WS] Error al vincular dispositivo: ${message.error}`);
                setError(message.error || 'Error al vincular dispositivo');
              }
              break;
              
            case 'unlink_result':
              if (message.success) {
                console.log(`[WS] Dispositivo ${message.deviceId} desvinculado exitosamente`);
                clearError();
              } else {
                console.error(`[WS] Error al desvincular dispositivo: ${message.error}`);
                setError(message.error || 'Error al desvincular dispositivo');
              }
              break;
              
            case 'device_info':
              console.log(`[WS] Información del dispositivo ${message.deviceId} recibida`);
              setDeviceInfos(prev => new Map(prev.set(message.deviceId, message.data)));
              clearError();
              break;
              
            case 'device_info_error':
              console.error(`[WS] Error al obtener información del dispositivo ${message.deviceId}: ${message.error}`);
              setError(`Error de dispositivo: ${message.error}`);
              break;
              
            case 'control_result':
              if (message.success) {
                console.log(`[WS] Control ejecutado exitosamente en dispositivo ${message.deviceId}`);
                // Actualizar la información del dispositivo si es necesario
                if (message.data) {
                  setDeviceInfos(prev => new Map(prev.set(message.deviceId, message.data)));
                }
                clearError();
              } else {
                console.error(`[WS] Error al controlar dispositivo ${message.deviceId}: ${message.error}`);
                setError(message.error || 'Error al controlar dispositivo');
              }
              break;
              
            default:
              console.warn('[WS] Mensaje no reconocido:', message);
          }
        } catch (err) {
          console.error('[WS] Error al procesar mensaje WebSocket:', err);
          setError('Error al procesar mensaje del servidor');
        }
      };

      ws.onclose = (event) => {
        console.log(`[WS] Desconectado del servidor MQTT (código: ${event.code})`);
        setIsConnected(false);
        
        // Solo intentar reconectar si el usuario sigue autenticado y no hemos excedido el límite
        if (user && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Backoff exponencial
          console.log(`[WS] Reintentando conexión en ${delay}ms (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (user && wsRef.current?.readyState !== WebSocket.OPEN) {
              reconnectAttemptsRef.current++;
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Conexión perdida. Máximo número de reintentos alcanzado.');
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error de conexión WebSocket:', error);
        setError('Error de conexión WebSocket');
      };

    } catch (err) {
      console.error('[WS] Error al conectar WebSocket:', err);
      setError('Error al conectar con el servidor');
    }
  }, [user, getToken, clearError]);

  const disconnect = useCallback(() => {
    console.log('[WS] Desconectando...');
    
    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Resetear estado
    setIsConnected(false);
    setDevices([]);
    setDeviceInfos(new Map());
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('[WS] Intento de envío con WebSocket no conectado');
      setError('No hay conexión al servidor');
      return false;
    }
  }, []);

  const linkDevice = useCallback((deviceId: string) => {
    console.log(`[WS] Solicitando vinculación de dispositivo: ${deviceId}`);
    sendMessage({
      type: 'link_device',
      deviceId
    });
  }, [sendMessage]);

  const unlinkDevice = useCallback((deviceId: string) => {
    console.log(`[WS] Solicitando desvinculación de dispositivo: ${deviceId}`);
    sendMessage({
      type: 'unlink_device',
      deviceId
    });
  }, [sendMessage]);

  const requestDeviceInfo = useCallback((deviceId: string) => {
    console.log(`[WS] Solicitando información de dispositivo: ${deviceId}`);
    sendMessage({
      type: 'request_device_info',
      deviceId
    });
  }, [sendMessage]);

  const controlDigitalOutput = useCallback((deviceId: string, outputId: number, state: boolean) => {
    console.log(`[WS] Controlando salida ${outputId} del dispositivo ${deviceId}: ${state ? 'ON' : 'OFF'}`);
    sendMessage({
      type: 'control_digital_output',
      deviceId,
      outputId,
      state
    });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    console.log('[WS] Reconexión manual solicitada');
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  // Manejar conexión/desconexión basada en el estado de autenticación
  useEffect(() => {
    if (user) {
      console.log('[WS] Usuario autenticado, iniciando conexión');
      connect();
    } else {
      console.log('[WS] Usuario no autenticado, desconectando');
      disconnect();
    }

    // Cleanup al desmontar
    return () => {
      disconnect();
    };
  }, [user?.id]); // Solo reconectar si cambia el ID del usuario, no el objeto completo

  const contextValue: DeviceWebSocketContextType = {
    devices,
    deviceInfos,
    isConnected,
    error,
    linkDevice,
    unlinkDevice,
    requestDeviceInfo,
    controlDigitalOutput,
    reconnect,
  };

  return (
    <DeviceWebSocketContext.Provider value={contextValue}>
      {children}
    </DeviceWebSocketContext.Provider>
  );
};

// Hook para usar el contexto
export const useDeviceWebSocket = (): DeviceWebSocketContextType => {
  const context = useContext(DeviceWebSocketContext);
  if (!context) {
    throw new Error('useDeviceWebSocket debe usarse dentro de DeviceWebSocketProvider');
  }
  return context;
};
