import { useState, useEffect, useRef } from 'preact/hooks';
import { PpcApi, ThmReadings } from '../../api/PpcApi';
import { interpretVPD, VPD_RANGES } from '../../lib/vpd';
import Card from '../../components/Card';
import { FontAwesomeIcon } from '../../components/FontAwesomeIcon';

const POLL_INTERVAL = 5000;

const ThmDashboard = () => {
    const [data, setData] = useState<ThmReadings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchReadings = async () => {
        try {
            const readings = await PpcApi.getThmReadings();
            setData(readings);
            setError(null);
        } catch (e: any) {
            const msg = e?.message || String(e);
            console.error('[THM] fetch error:', msg);
            setError(`Error: ${msg}`);
        }
    };

    useEffect(() => {
        fetchReadings();
        intervalRef.current = setInterval(fetchReadings, POLL_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon="triangle-exclamation" className="text-4xl mb-4 text-amber-500" />
                <p>{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center py-12">
                <FontAwesomeIcon icon="circle-notch" className="animate-spin text-blue-500 text-3xl" />
            </div>
        );
    }

    const interpretation = interpretVPD(data.vpd);
    const vpdPercent = Math.min(Math.max((data.vpd / 2.0) * 100, 0), 100);

    return (
        <div className="flex flex-col gap-4">
            {/* Sensor readings */}
            <div className="grid grid-cols-2 gap-4">
                <Card title="Temperatura" icon="temperature-half" className="">
                    <div className="p-4 flex flex-col items-center">
                        <span className={`text-4xl font-bold ${data.sensorOk ? 'text-orange-500' : 'text-gray-400'}`}>
                            {data.sensorOk ? data.temperature.toFixed(1) : '--'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">°C</span>
                    </div>
                </Card>
                <Card title="Humedad" icon="droplet" className="">
                    <div className="p-4 flex flex-col items-center">
                        <span className={`text-4xl font-bold ${data.sensorOk ? 'text-blue-500' : 'text-gray-400'}`}>
                            {data.sensorOk ? data.humidity.toFixed(1) : '--'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">%</span>
                    </div>
                </Card>
            </div>

            {/* VPD */}
            <Card title="VPD (Deficit de Presion de Vapor)" icon="leaf" className="">
                <div className="p-4">
                    {/* VPD value + stage */}
                    <div className={`rounded-lg p-4 mb-4 ${interpretation.bgColor}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className={`text-3xl font-bold ${interpretation.color}`}>
                                    {data.sensorOk ? data.vpd.toFixed(2) : '--'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">kPa</span>
                            </div>
                            <div className="text-right">
                                <p className={`font-semibold ${interpretation.color}`}>{interpretation.status}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{interpretation.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <FontAwesomeIcon icon="lightbulb" className="mr-1" />
                            {interpretation.recommendation}
                        </p>
                    </div>

                    {/* VPD range bar */}
                    <div className="relative">
                        <div className="flex rounded-full overflow-hidden h-4">
                            {VPD_RANGES.map((range) => {
                                const width = ((range.max - range.min) / 2.0) * 100;
                                return (
                                    <div
                                        key={range.label}
                                        className={`${range.color} h-full`}
                                        style={{ width: `${width}%` }}
                                        title={`${range.label}: ${range.min} - ${range.max} kPa`}
                                    />
                                );
                            })}
                        </div>
                        {/* Current VPD marker */}
                        {data.sensorOk && (
                            <div
                                className="absolute top-0 w-0.5 h-6 bg-gray-800 dark:bg-white -mt-1 transition-all duration-500"
                                style={{ left: `${vpdPercent}%` }}
                            />
                        )}
                        {/* Labels */}
                        <div className="flex mt-1">
                            {VPD_RANGES.map((range) => {
                                const width = ((range.max - range.min) / 2.0) * 100;
                                return (
                                    <div
                                        key={range.label}
                                        className="text-center"
                                        style={{ width: `${width}%` }}
                                    >
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{range.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sensor status */}
                    {!data.sensorOk && (
                        <div className="mt-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                            <FontAwesomeIcon icon="triangle-exclamation" />
                            <span>Sensor sin lectura valida</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ThmDashboard;
