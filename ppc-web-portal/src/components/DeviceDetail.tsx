'use client';

import { useDeviceWebSocket } from '@/hooks/useDeviceWebSocket';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import type { Device } from '@/types/mqtt';
import { TimerPanel } from './modules/TimerPanel';
import { ThmPanel } from './modules/ThmPanel';
import { TempPanel } from './modules/TempPanel';

interface DeviceDetailProps {
  device: Device;
  onClose: () => void;
}

export const DeviceDetail: React.FC<DeviceDetailProps> = ({ device, onClose }) => {
  const { user } = useUser();
  const { deviceInfos, requestDeviceInfo, controlDigitalOutput } = useDeviceWebSocket();
  const [isLoading, setIsLoading] = useState(true);
  
  const deviceInfo = deviceInfos.get(device.device_id);
  const isOwnDevice = device.user_id === user?.id;

  useEffect(() => {
    if (isOwnDevice) {
      setIsLoading(true);
      requestDeviceInfo(device.device_id);
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(() => {
        requestDeviceInfo(device.device_id);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [device.device_id, isOwnDevice, requestDeviceInfo]);

  useEffect(() => {
    if (deviceInfo) {
      setIsLoading(false);
    }
  }, [deviceInfo]);

  const handleOutputToggle = (outputId: number, currentState: boolean) => {
    controlDigitalOutput(device.device_id, outputId, !currentState);
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString('es-ES');
    } catch {
      return timeString;
    }
  };

  if (!isOwnDevice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Acceso Denegado</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <p className="text-gray-600">
            No tienes permisos para ver los detalles de este dispositivo.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{device.device_name}</h2>
            <p className="text-sm text-gray-500">ID: {device.device_id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => requestDeviceInfo(device.device_id)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando información del dispositivo...</span>
            </div>
          ) : !deviceInfo ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⚠️</div>
              <p className="text-gray-600">
                No se pudo obtener la información del dispositivo.
              </p>
              <button
                onClick={() => requestDeviceInfo(device.device_id)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Device Time — shown for all device types */}
              {deviceInfo.time && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    🕐 Hora del Dispositivo
                  </h3>
                  <p className="text-xl font-mono">{formatTime(deviceInfo.time.time)}</p>
                </div>
              )}

              {/* Module panels — composable por tipo de dispositivo */}
              {(['timer', 'full'].includes(device.device_type)) && (
                <TimerPanel
                  digitalOutputs={deviceInfo.digitalOutputs}
                  alarms={deviceInfo.alarms}
                  onOutputToggle={handleOutputToggle}
                />
              )}

              {(['thm', 'full'].includes(device.device_type)) && (
                <ThmPanel
                  temperature={deviceInfo.temperature}
                  humidity={deviceInfo.humidity}
                  vpd={deviceInfo.vpd}
                  stage={deviceInfo.stage}
                  sensorOk={deviceInfo.sensorOk}
                />
              )}

              {(['temp', 'full'].includes(device.device_type)) && (
                <TempPanel
                  temperature={deviceInfo.temp_temperature ?? deviceInfo.temperature}
                  sensorOk={deviceInfo.temp_sensorOk ?? deviceInfo.sensorOk}
                />
              )}

              {/* Device Status Summary — shown for all device types */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  📊 Estado del Dispositivo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-700">Estado</div>
                    <div className={`font-bold ${device.is_online ? 'text-green-600' : 'text-red-600'}`}>
                      {device.is_online ? 'Conectado' : 'Desconectado'}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-700">Tipo</div>
                    <div className="font-mono text-gray-900 capitalize">{device.device_type}</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-700">Última conexión</div>
                    <div className="font-mono text-gray-900">{formatTime(device.last_seen)}</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-700">Primera detección</div>
                    <div className="font-mono text-gray-900">{formatTime(device.first_seen)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
