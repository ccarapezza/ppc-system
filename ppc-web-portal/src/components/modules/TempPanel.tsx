'use client';

interface TempPanelProps {
  temperature?: number;
  sensorOk?: boolean;
}

export const TempPanel: React.FC<TempPanelProps> = ({ temperature, sensorOk }) => {
  if (sensorOk === false) {
    return (
      <div className="bg-red-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Sensor DS18B20</h3>
        <p className="text-red-600">Sensor no disponible o con error de lectura.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Sensor DS18B20 (TEMP)</h3>
      <div className="max-w-xs">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Temperatura</div>
          <div className="text-3xl font-bold text-orange-600">
            {temperature !== undefined ? `${temperature.toFixed(1)}°C` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
