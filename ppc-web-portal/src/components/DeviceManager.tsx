'use client';

import { useDeviceWebSocket } from '@/hooks/useDeviceWebSocket';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import type { Device, DeviceType } from '@/types/mqtt';
import { DeviceDetail } from './DeviceDetail';

const deviceTypeBadge: Record<DeviceType, { label: string; className: string }> = {
  base: { label: 'Base', className: 'bg-gray-100 text-gray-800' },
  timer: { label: 'Timer', className: 'bg-purple-100 text-purple-800' },
  thm: { label: 'THM', className: 'bg-teal-100 text-teal-800' },
  temp: { label: 'Temp', className: 'bg-orange-100 text-orange-800' },
  full: { label: 'Full', className: 'bg-indigo-100 text-indigo-800' },
};

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
          {/* Device type badge */}
          {(() => {
            const badge = deviceTypeBadge[device.device_type as DeviceType] || deviceTypeBadge.base;
            return (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            );
          })()}
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
  const { devices, isConnected, error, linkDeviceByCode, unlinkDevice } = useDeviceWebSocket();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleCloseDetails = () => {
    setSelectedDevice(null);
  };

  const handleLinkByCode = () => {
    if (!linkCode.trim()) return;
    setLinkLoading(true);
    linkDeviceByCode(linkCode.trim());
    // Reset after a brief delay (link_result will arrive via WS)
    setTimeout(() => {
      setLinkLoading(false);
      setLinkCode('');
      setShowLinkModal(false);
    }, 2000);
  };

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.is_online).length,
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Dispositivos
            </h1>
            <div className="flex items-center space-x-4">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isConnected ? 'Conectado' : 'Desconectado'}
              </div>
              {error && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Vincular dispositivo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Mis dispositivos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{stats.online}</div>
          <div className="text-sm text-gray-500">Online</div>
        </div>
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📡</div>
          <p className="text-gray-500 text-lg mb-2">
            No tienes dispositivos vinculados
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Conecta un dispositivo a tu red y usa el código de vinculación para agregarlo
          </p>
          <button
            onClick={() => setShowLinkModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Vincular mi primer dispositivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              onLink={() => {}}
              onUnlink={unlinkDevice}
              onViewDetails={handleViewDetails}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}

      {/* Modal de vinculación por código */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vincular dispositivo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa el código de 6 caracteres que aparece en el portal web de tu dispositivo.
            </p>
            <input
              type="text"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Ej: A3X7K9"
              className="w-full px-4 py-3 border rounded-md text-center text-2xl font-mono tracking-widest uppercase mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleLinkByCode()}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => { setShowLinkModal(false); setLinkCode(''); }}
                className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLinkByCode}
                disabled={linkCode.length < 6 || linkLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {linkLoading ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
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
