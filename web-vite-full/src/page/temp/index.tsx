import { useState, useEffect, useRef } from 'preact/hooks';
import { PpcApi, TempReadings } from '../../api/PpcApi';
import Card from '../../components/Card';
import { FontAwesomeIcon } from '../../components/FontAwesomeIcon';

const POLL_INTERVAL = 5000;

const TempDashboard = () => {
    const [data, setData] = useState<TempReadings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchReadings = async () => {
        try {
            const readings = await PpcApi.getTempReadings();
            setData(readings);
            setError(null);
        } catch (e: any) {
            const msg = e?.message || String(e);
            console.error('[TEMP] fetch error:', msg);
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

    return (
        <div className="flex flex-col gap-4">
            <Card title="Temperatura" icon="temperature-half" className="">
                <div className="p-6 flex flex-col items-center">
                    <span className={`text-6xl font-bold ${data.sensorOk ? 'text-orange-500' : 'text-gray-400'}`}>
                        {data.sensorOk ? data.temperature.toFixed(1) : '--'}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400 mt-2">°C</span>
                </div>
                {!data.sensorOk && (
                    <div className="px-4 pb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                        <FontAwesomeIcon icon="triangle-exclamation" />
                        <span>Sensor sin lectura valida</span>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TempDashboard;
