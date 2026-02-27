'use client';

import { useDeviceWebSocket } from '@/hooks/useDeviceWebSocket';
import { useUser } from '@clerk/nextjs';

export const ConnectionStatus: React.FC = () => {
  const { isConnected, error } = useDeviceWebSocket();
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg ${
          isConnected
            ? 'bg-green-100 border border-green-200 text-green-800'
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          {isConnected ? 'Conectado al servidor MQTT' : 'Desconectado'}
        </span>
        {error && (
          <span className="text-xs text-red-600 ml-2">({error})</span>
        )}
      </div>
    </div>
  );
};
