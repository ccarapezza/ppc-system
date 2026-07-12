'use client';

import type { DigitalOutput, Alarm } from '@/types/mqtt';

interface TimerPanelProps {
  digitalOutputs?: DigitalOutput[];
  alarms?: Alarm[];
  onOutputToggle: (outputId: number, currentState: boolean) => void;
}

const formatAlarmTime = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const TimerPanel: React.FC<TimerPanelProps> = ({ digitalOutputs, alarms, onOutputToggle }) => {
  return (
    <>
      {/* Digital Outputs */}
      {digitalOutputs && digitalOutputs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            Salidas Digitales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {digitalOutputs.map((output) => (
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
                    onClick={() => onOutputToggle(output.id, output.state)}
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
      {alarms && alarms.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            Alarmas Programadas
          </h3>
          <div className="space-y-3">
            {alarms.map((alarm) => (
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
  );
};
