export function calculateVPD(temperature: number, humidity: number): number {
  const svp = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  const avp = (humidity / 100) * svp;
  const vpd = svp - avp;
  return Math.round(vpd * 100) / 100;
}

export interface VpdInterpretation {
  status: string;
  color: string;
  bgColor: string;
  description: string;
  recommendation: string;
}

export function interpretVPD(vpd: number): VpdInterpretation {
  if (vpd < 0.4) {
    return {
      status: 'Peligro (Bajo)',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      description: 'VPD demasiado bajo - riesgo de hongos y patogenos',
      recommendation: 'Incrementar temperatura o reducir HR con ventilacion'
    };
  }
  if (vpd < 0.8) {
    return {
      status: 'Propagacion / Veg. Temprano',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      description: 'Rango ideal para enraizamiento y vegetativo temprano',
      recommendation: 'Mantener HR elevada y temperatura moderada'
    };
  }
  if (vpd < 1.0) {
    return {
      status: 'Vegetativo Tardio',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      description: 'Transicion a crecimiento vigoroso antes de floracion',
      recommendation: 'Puedes empezar a bajar ligeramente la HR'
    };
  }
  if (vpd < 1.2) {
    return {
      status: 'Floracion Temprana',
      color: 'text-lime-600',
      bgColor: 'bg-lime-50 dark:bg-lime-900/30',
      description: 'Inicio de floracion; buena transpiracion controlada',
      recommendation: 'Mantener flujo de aire y evitar picos de calor'
    };
  }
  if (vpd <= 1.6) {
    return {
      status: 'Floracion Media / Tardia',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      description: 'Fase media/tardia de floracion; VPD alto acelera asimilacion',
      recommendation: 'Vigilar riego; evitar que pase de 1.6'
    };
  }
  return {
    status: 'Peligro (Alto)',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    description: 'VPD excesivo: estres hidrico y riesgo de marchitez',
    recommendation: 'Aumentar HR o bajar temperatura de inmediato'
  };
}

export const VPD_RANGES = [
  { label: 'Bajo',      min: 0,   max: 0.4, color: 'bg-blue-400' },
  { label: 'Prop/Veg',  min: 0.4, max: 0.8, color: 'bg-emerald-400' },
  { label: 'Veg. Tard', min: 0.8, max: 1.0, color: 'bg-green-400' },
  { label: 'Flor. Temp', min: 1.0, max: 1.2, color: 'bg-lime-400' },
  { label: 'Flor. M/T', min: 1.2, max: 1.6, color: 'bg-amber-400' },
  { label: 'Alto',       min: 1.6, max: 2.0, color: 'bg-red-400' },
];
