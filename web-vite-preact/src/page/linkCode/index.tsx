import Card from "../../components/Card";
import { useState, useEffect } from "preact/hooks";
import Loading from "../../components/Loading";

interface LinkCodeData {
    code: string;
    device_id: string;
    device_name: string;
}

export default function LinkCode() {
    const [data, setData] = useState<LinkCodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCode = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/link-code");
            if (!res.ok) throw new Error("Error al obtener el codigo");
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCode();
        // Refrescar cada 60 segundos
        const interval = setInterval(fetchCode, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div class="flex flex-col gap-6 w-full items-center">
            <Card title="Codigo de vinculacion" icon="link" className="w-full max-w-md">
                <div class="p-4 text-center">
                    {loading && <Loading />}
                    {error && (
                        <div class="text-red-500 mb-4">
                            <p>{error}</p>
                            <button
                                onClick={fetchCode}
                                class="mt-2 text-blue-600 hover:underline text-sm"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}
                    {data && !loading && (
                        <>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Ingresa este codigo en la app para vincular el dispositivo
                            </p>
                            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-4">
                                <div class="text-4xl font-mono font-bold tracking-[0.3em] text-blue-600 dark:text-blue-400">
                                    {data.code}
                                </div>
                            </div>
                            <div class="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                                <p>ID: {data.device_id}</p>
                                <p>El codigo se renueva cada 5 minutos</p>
                            </div>
                        </>
                    )}
                    {!data && !loading && !error && (
                        <p class="text-gray-500">
                            El dispositivo debe estar conectado al servidor MQTT para generar un codigo
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
}
