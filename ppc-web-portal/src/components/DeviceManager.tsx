'use client';

import { useDeviceWebSocket } from '@/hooks/useDeviceWebSocket';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import type { Device } from '@/types/mqtt';
import { DeviceDetail } from './DeviceDetail';

interface DeviceCardProps {
  device: Device;
  onLink: (deviceId: string) => void;
  onUnlink: (deviceId: string) => void;
  onViewDetails: (device: Device) => void;
  currentUserId?: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onLink, onUnlink, onViewDetails, currentUserId }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const isOwnDevice = device.user_id === currentUserId;
  const canLink = !device.linked && device.is_online;
  const canUnlink = device.linked && isOwnDevice;

  const handleLink = async () => {
    setIsLoading(true);
    try {
      await onLink(device.device_id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      await onUnlink(device.device_id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {device.device_name}
          </h3>
          <p className="text-sm text-gray-500">ID: {device.device_id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              device.is_online
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {device.is_online ? 'Online' : 'Offline'}
          </span>
          {device.linked && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Vinculado
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p>
          <span className="font-medium">Última conexión:</span>{' '}
          {formatDate(device.last_seen)}
        </p>
        <p>
          <span className="font-medium">Primera detección:</span>{' '}
          {formatDate(device.first_seen)}
        </p>
        {device.linked_at && (
          <p>
            <span className="font-medium">Vinculado el:</span>{' '}
            {formatDate(device.linked_at)}
          </p>
        )}
        {device.user_id && !isOwnDevice && (
          <p>
            <span className="font-medium">Propietario:</span> Otro usuario
          </p>
        )}
      </div>

      <div className="flex space-x-2">
        {isOwnDevice && (
          <button
            onClick={() => onViewDetails(device)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Ver Detalles
          </button>
        )}
        
        {canLink && (
          <button
            onClick={handleLink}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Vinculando...' : 'Vincular'}
          </button>
        )}
        
        {canUnlink && (
          <button
            onClick={handleUnlink}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Desvinculando...' : 'Desvincular'}
          </button>
        )}
        
        {!canLink && !canUnlink && device.is_online && !isOwnDevice && (
          <div className="flex-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-center">
            No disponible
          </div>
        )}
        
        {!device.is_online && (
          <div className="flex-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-center">
            Dispositivo desconectado
          </div>
        )}
      </div>
    </div>
  );
};

export const DeviceManager: React.FC = () => {
  const { user } = useUser();
  const { devices, isConnected, error, linkDevice, unlinkDevice } = useDeviceWebSocket();
  const [filter, setFilter] = useState<'all' | 'linked' | 'available'>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleCloseDetails = () => {
    setSelectedDevice(null);
  };

  const filteredDevices = devices.filter(device => {
    switch (filter) {
      case 'linked':
        return device.linked && device.user_id === user?.id;
      case 'available':
        return !device.linked && device.is_online;
      default:
        return true;
    }
  });

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.is_online).length,
    linked: devices.filter(d => d.linked && d.user_id === user?.id).length,
    available: devices.filter(d => !d.linked && d.is_online).length
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Debes iniciar sesión para ver los dispositivos</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestor de Dispositivos PPC
        </h1>
        <div className="flex items-center space-x-4">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </div>
          {error && (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total dispositivos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{stats.online}</div>
          <div className="text-sm text-gray-500">Online</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.linked}</div>
          <div className="text-sm text-gray-500">Mis dispositivos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{stats.available}</div>
          <div className="text-sm text-gray-500">Disponibles</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setFilter('linked')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'linked'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mis dispositivos ({stats.linked})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Disponibles ({stats.available})
          </button>
        </div>
      </div>

      {/* Device Grid */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🔌</div>
          <p className="text-gray-500 text-lg">
            {filter === 'all' && 'No hay dispositivos registrados'}
            {filter === 'linked' && 'No tienes dispositivos vinculados'}
            {filter === 'available' && 'No hay dispositivos disponibles para vincular'}
          </p>
          {filter === 'available' && (
            <p className="text-gray-400 text-sm mt-2">
              Los dispositivos Arduino aparecerán aquí cuando se conecten al broker MQTT
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              onLink={linkDevice}
              onUnlink={unlinkDevice}
              onViewDetails={handleViewDetails}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}
      
      {/* Modal de detalles del dispositivo */}
      {selectedDevice && (
        <DeviceDetail 
          device={selectedDevice} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
};
