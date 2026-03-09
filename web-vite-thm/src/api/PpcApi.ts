const API_HOST = import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_HOST : location.origin;

const API_ENDPOINTS = {
    WIFI_STATUS: '/wifi-status',
    WIFI_SCAN: '/wifi-scan',
    WIFI_CONNECT: '/wifi-connect',
    WIFI_DISCONNECT: '/wifi-disconnect',
    GET_TIME: '/get-time',
    CLOCK_STATUS: '/clock-status',
    SET_CLOCK: '/set-clock',
    THM_READINGS: '/thm/readings',
};

export interface ThmReadings {
    temperature: number;
    humidity: number;
    vpd: number;
    stage: string;
    sensorOk: boolean;
}

export class PpcApi {

    static async getTime() {
        const response = await fetch(new URL(API_ENDPOINTS.GET_TIME, API_HOST));
        return response.json();
    }

    static async getWifiStatus() {
        const response = await fetch(new URL(API_ENDPOINTS.WIFI_STATUS, API_HOST));
        return response.json();
    }

    static async getWifiScan() {
        const response = await fetch(new URL(API_ENDPOINTS.WIFI_SCAN, API_HOST));
        return response.json();
    }

    static async connectWifi(ssid: string, password: string) {
        const formData = new FormData();
        formData.append("ssid", ssid);
        formData.append("password", password);
        const response = await fetch(new URL(API_ENDPOINTS.WIFI_CONNECT, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    static async disconnectWifi() {
        const response = await fetch(new URL(API_ENDPOINTS.WIFI_DISCONNECT, API_HOST), {
            method: 'POST'
        });
        return response.json();
    }

    static async getClockStatus() {
        const response = await fetch(new URL(API_ENDPOINTS.CLOCK_STATUS, API_HOST));
        return response.json();
    }

    static async setClockNtp(timezoneOffset: number) {
        const formData = new FormData();
        formData.append('mode', 'ntp');
        formData.append('timezone', String(timezoneOffset));
        const response = await fetch(new URL(API_ENDPOINTS.SET_CLOCK, API_HOST), {
            method: 'POST',
            body: formData,
        });
        return response.json();
    }

    static async setClockManual(year: number, month: number, day: number,
                                hour: number, minute: number, second: number) {
        const formData = new FormData();
        formData.append('mode', 'manual');
        formData.append('year', String(year));
        formData.append('month', String(month));
        formData.append('day', String(day));
        formData.append('hour', String(hour));
        formData.append('minute', String(minute));
        formData.append('second', String(second));
        const response = await fetch(new URL(API_ENDPOINTS.SET_CLOCK, API_HOST), {
            method: 'POST',
            body: formData,
        });
        return response.json();
    }

    static async getThmReadings(): Promise<ThmReadings> {
        const url = new URL(API_ENDPOINTS.THM_READINGS, API_HOST);
        console.log('[THM] Fetching:', url.toString());
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}
