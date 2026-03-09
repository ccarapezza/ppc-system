import { useEffect, useState } from "preact/hooks";
import { PpcApi } from "../../api/PpcApi";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon";

interface ClockStatus {
    ntpEnabled: boolean;
    ntpSynced: boolean;
    lastNtpSyncEpoch: number;
    timeZoneOffset: number;
    currentTime: string;
}

const TIMEZONES = [
    { label: "UTC-12", value: -12 },
    { label: "UTC-11", value: -11 },
    { label: "UTC-10 (Hawaii)", value: -10 },
    { label: "UTC-9 (Alaska)", value: -9 },
    { label: "UTC-8 (Los Angeles)", value: -8 },
    { label: "UTC-7 (Denver)", value: -7 },
    { label: "UTC-6 (Chicago)", value: -6 },
    { label: "UTC-5 (New York)", value: -5 },
    { label: "UTC-4 (Santiago)", value: -4 },
    { label: "UTC-3 (Buenos Aires / Brasilia)", value: -3 },
    { label: "UTC-2", value: -2 },
    { label: "UTC-1", value: -1 },
    { label: "UTC+0 (London)", value: 0 },
    { label: "UTC+1 (Madrid / Paris)", value: 1 },
    { label: "UTC+2 (Cairo / Athens)", value: 2 },
    { label: "UTC+3 (Moscow)", value: 3 },
    { label: "UTC+4 (Dubai)", value: 4 },
    { label: "UTC+5 (Karachi)", value: 5 },
    { label: "UTC+5:30 (Mumbai)", value: 5 },
    { label: "UTC+6 (Dhaka)", value: 6 },
    { label: "UTC+7 (Bangkok)", value: 7 },
    { label: "UTC+8 (Beijing / Singapore)", value: 8 },
    { label: "UTC+9 (Tokyo)", value: 9 },
    { label: "UTC+10 (Sydney)", value: 10 },
    { label: "UTC+11", value: 11 },
    { label: "UTC+12 (Auckland)", value: 12 },
];

function formatEpoch(epoch: number): string {
    if (!epoch) return "—";
    try {
        return new Date(epoch * 1000).toLocaleString();
    } catch {
        return "—";
    }
}

export default function ClockSettings() {
    const [status, setStatus] = useState<ClockStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

    // Form state
    const [mode, setMode] = useState<"ntp" | "manual">("ntp");
    const [timezone, setTimezone] = useState<number>(-3);
    const [manualDatetime, setManualDatetime] = useState<string>("");

    const loadStatus = () => {
        setIsLoading(true);
        PpcApi.getClockStatus()
            .then((data: ClockStatus) => {
                setStatus(data);
                setMode(data.ntpEnabled ? "ntp" : "manual");
                setTimezone(data.timeZoneOffset);
            })
            .catch(() => setStatus(null))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        try {
            let result: any;
            if (mode === "ntp") {
                result = await PpcApi.setClockNtp(timezone);
            } else {
                if (!manualDatetime) {
                    setSaveMessage({ ok: false, text: "Por favor ingresa la fecha y hora." });
                    setIsSaving(false);
                    return;
                }
                const d = new Date(manualDatetime);
                result = await PpcApi.setClockManual(
                    d.getFullYear(), d.getMonth() + 1, d.getDate(),
                    d.getHours(), d.getMinutes(), d.getSeconds()
                );
            }
            if (result?.success) {
                setSaveMessage({ ok: true, text: result.message || "Guardado correctamente." });
                setTimeout(loadStatus, 1000);
            } else {
                setSaveMessage({ ok: false, text: result?.message || "Error al guardar." });
            }
        } catch {
            setSaveMessage({ ok: false, text: "Error de comunicación con el dispositivo." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div class="w-full flex flex-col gap-4">
            {/* Header */}
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FontAwesomeIcon icon="clock" className="text-primary" />
                    Reloj del dispositivo
                </h1>
                <button
                    onClick={loadStatus}
                    disabled={isLoading}
                    class="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white disabled:opacity-50"
                >
                    {isLoading ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {/* Current time card */}
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-2">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Hora actual del dispositivo</div>
                {isLoading ? (
                    <div class="flex items-center gap-2 text-gray-400">
                        <FontAwesomeIcon icon="spinner" className="animate-spin" />
                        <span>Cargando...</span>
                    </div>
                ) : status ? (
                    <div class="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                        {status.currentTime}
                    </div>
                ) : (
                    <div class="text-red-500 text-sm">No se pudo obtener la hora.</div>
                )}
            </div>

            {/* NTP status card */}
            {status && (
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-3">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Estado de sincronización NTP</div>
                    <div class="flex flex-wrap gap-3">
                        <div class="flex items-center gap-2">
                            <span class={`w-3 h-3 rounded-full ${status.ntpEnabled ? "bg-blue-500" : "bg-gray-400"}`}></span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                                NTP {status.ntpEnabled ? "habilitado" : "deshabilitado"}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class={`w-3 h-3 rounded-full ${status.ntpSynced ? "bg-green-500" : "bg-yellow-400"}`}></span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                                {status.ntpSynced ? "Sincronizado" : "No sincronizado"}
                            </span>
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            Última sync: {formatEpoch(status.lastNtpSyncEpoch)}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            Zona horaria: UTC{status.timeZoneOffset >= 0 ? "+" : ""}{status.timeZoneOffset}
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration form */}
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Configuración del reloj</div>

                {/* Mode toggle */}
                <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="clock-mode"
                            value="ntp"
                            checked={mode === "ntp"}
                            onChange={() => setMode("ntp")}
                            class="w-4 h-4 text-primary"
                        />
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Automático (NTP)
                        </span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="clock-mode"
                            value="manual"
                            checked={mode === "manual"}
                            onChange={() => setMode("manual")}
                            class="w-4 h-4 text-primary"
                        />
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Manual
                        </span>
                    </label>
                </div>

                {/* NTP options */}
                {mode === "ntp" && (
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Zona horaria
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(Number((e.target as HTMLSelectElement).value))}
                            class="block w-full max-w-sm p-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p class="text-xs text-gray-400 dark:text-gray-500">
                            El dispositivo sincronizará la hora automáticamente cuando tenga conexión WiFi.
                        </p>
                    </div>
                )}

                {/* Manual options */}
                {mode === "manual" && (
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fecha y hora
                        </label>
                        <input
                            type="datetime-local"
                            value={manualDatetime}
                            onChange={(e) => setManualDatetime((e.target as HTMLInputElement).value)}
                            class="block w-full max-w-sm p-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <p class="text-xs text-gray-400 dark:text-gray-500">
                            Ingresa la hora local del dispositivo. La sincronización NTP se deshabilitará.
                        </p>
                    </div>
                )}

                {/* Save feedback */}
                {saveMessage && (
                    <div class={`text-sm px-3 py-2 rounded ${saveMessage.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {saveMessage.text}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    class="w-fit px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving && <FontAwesomeIcon icon="spinner" className="animate-spin" />}
                    {isSaving ? "Guardando..." : "Guardar configuración"}
                </button>
            </div>
        </div>
    );
}
