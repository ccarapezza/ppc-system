'use client';

import type { VpdStage } from '@/types/mqtt';

interface ThmPanelProps {
  temperature?: number;
  humidity?: number;
  vpd?: number;
  stage?: VpdStage;
  sensorOk?: boolean;
}

const stageConfig: Record<VpdStage, { label: string; color: string; bgColor: string }> = {
  DangerLow: { label: 'Peligro Bajo', color: 'text-red-800', bgColor: 'bg-red-100' },
  PropagationEarlyVeg: { label: 'Propagacion / Veg. Temprana', color: 'text-lime-800', bgColor: 'bg-lime-100' },
  LateVeg: { label: 'Veg. Tardia', color: 'text-green-800', bgColor: 'bg-green-100' },
  EarlyFlower: { label: 'Flora Temprana', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  MidLateFlower: { label: 'Flora Media/Tardia', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  DangerHigh: { label: 'Peligro Alto', color: 'text-red-800', bgColor: 'bg-red-100' },
  Unknown: { label: 'Desconocido', color: 'text-gray-800', bgColor: 'bg-gray-100' },
};

export const ThmPanel: React.FC<ThmPanelProps> = ({ temperature, humidity, vpd, stage, sensorOk }) => {
  const stageInfo = stage ? stageConfig[stage] || stageConfig.Unknown : stageConfig.Unknown;

  if (sensorOk === false) {
    return (
      <div className="bg-red-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Sensor DHT22</h3>
        <p className="text-red-600">Sensor no disponible o con error de lectura.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Sensor DHT22 (THM)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Temperature */}
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Temperatura</div>
          <div className="text-3xl font-bold text-blue-600">
            {temperature !== undefined ? `${temperature.toFixed(1)}°C` : '—'}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Humedad</div>
          <div className="text-3xl font-bold text-teal-600">
            {humidity !== undefined ? `${humidity.toFixed(1)}%` : '—'}
          </div>
        </div>

        {/* VPD */}
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">VPD</div>
          <div className="text-3xl font-bold text-purple-600">
            {vpd !== undefined ? `${vpd.toFixed(2)} kPa` : '—'}
          </div>
        </div>
      </div>

      {/* Growth Stage */}
      {stage && (
        <div className={`rounded-lg p-3 ${stageInfo.bgColor} flex items-center justify-between`}>
          <span className="text-sm font-medium text-gray-700">Etapa de crecimiento:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stageInfo.color} ${stageInfo.bgColor}`}>
            {stageInfo.label}
          </span>
        </div>
      )}
    </div>
  );
};
