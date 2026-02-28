'use client';

import { useDeviceWebSocket } from '@/hooks/useDeviceWebSocket';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import type { Device, DigitalOutput, Alarm } from '@/types/mqtt';

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

  const formatAlarmTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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

              {/* ── Timer-specific sections ── */}
              {device.device_type === 'timer' && (
                <>
                  {/* Digital Outputs */}
                  {deviceInfo.digitalOutputs && deviceInfo.digitalOutputs.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        🔌 Salidas Digitales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deviceInfo.digitalOutputs.map((output: DigitalOutput) => (
                          <div
                            key={output.id}
                            className="bg-white rounded-lg border p-4 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">Salida {output.id}</div>
                              <div className="text-sm text-gray-500">Pin {output.pin}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  output.state
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {output.state ? 'ON' : 'OFF'}
                              </span>
                              <button
                                onClick={() => handleOutputToggle(output.id, output.state)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  output.state
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {output.state ? 'Apagar' : 'Encender'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alarms */}
                  {deviceInfo.alarms && deviceInfo.alarms.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        ⏰ Alarmas Programadas
                      </h3>
                      <div className="space-y-3">
                        {deviceInfo.alarms.map((alarm: Alarm) => (
                          <div
                            key={alarm.id}
                            className="bg-white rounded-lg border p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-lg font-mono font-bold">
                                {formatAlarmTime(alarm.hour, alarm.minute)}
                              </div>
                              <div>
                                <div className="font-medium">
                                  Canal {alarm.channel} - {alarm.action}
                                </div>
                                {alarm.description && (
                                  <div className="text-sm text-gray-500">{alarm.description}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  alarm.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {alarm.enabled ? 'Activa' : 'Inactiva'}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  alarm.action === 'ON'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {alarm.action}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Future: thermo-specific sections ── */}
              {device.device_type === 'thermo' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    🌡️ Sensor de Temperatura/Humedad
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Datos de temperatura y humedad disponibles próximamente.
                  </p>
                </div>
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
