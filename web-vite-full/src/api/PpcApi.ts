const API_HOST = import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_HOST : location.origin;

const API_ENDPOINTS = {
    WIFI_STATUS: '/wifi-status',
    WIFI_SCAN: '/wifi-scan',
    WIFI_CONNECT: '/wifi-connect',
    WIFI_DISCONNECT: '/wifi-disconnect',
    GET_TIME: '/get-time',
    CLOCK_STATUS: '/clock-status',
    SET_CLOCK: '/set-clock',
    GET_DIGITAL_OUTPUTS: '/digital-outputs',
    GET_DIGITAL_OUTPUT: '/digital-output',
    GET_ALARMS: '/alarms',
    CREATE_ALARM: '/alarm',
    CREATE_ALARM_ON_OFF: '/alarm-on-off',
    ENABLE_ALARM: '/alarm-enable',
    SET_ALARM_DAYS: '/alarm-days',
    THM_READINGS: '/thm/readings',
    TEMP_READINGS: '/temp/readings',
};

export interface ThmReadings {
    temperature: number;
    humidity: number;
    vpd: number;
    stage: string;
    sensorOk: boolean;
}

export interface TempReadings {
    temperature: number;
    sensorOk: boolean;
}

export class PpcApi {

    static async getTime() {
        const response = await fetch(new URL(API_ENDPOINTS.GET_TIME, API_HOST));
        return response.json();
    }

    static async getWifiStatus() {
        const response = await fetch(new URL(API_ENDPOINTS.WIFI_STATUS, API_HOST));
        //responseNotOk(response);
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

    static async getDigitalOutputs() {
        const response = await fetch(new URL(API_ENDPOINTS.GET_DIGITAL_OUTPUTS, API_HOST));
        return response.json();
    }

    static async getDigitalOutput(pin: number) {
        const response = await fetch(new URL(`${API_ENDPOINTS.GET_DIGITAL_OUTPUT}?id=${pin}`, API_HOST));
        return response.json();
    }

    static async setDigitalOutput(pin: number, state: boolean) {
        const formData = new FormData();
        formData.append("id", String(pin));
        formData.append("state", String(state));

        const response = await fetch(new URL(`${API_ENDPOINTS.GET_DIGITAL_OUTPUT}`, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    static async getAlarms() {
        const response = await fetch(new URL(API_ENDPOINTS.GET_ALARMS, API_HOST));
        return response.json();
    }

    static async createAlarm(alarm: {
        name: string,
        hour: number,
        minute: number,
        channel: number,
        action: boolean,
        days?: boolean[],  // Añadir parámetro opcional de días
    }) {
        const formData = new FormData();
        formData.append("name", alarm.name);
        formData.append("hour", String(alarm.hour));
        formData.append("minute", String(alarm.minute));
        formData.append("channel", String(alarm.channel));
        formData.append("action", String(alarm.action ? 1 : 0));
        
        // Si se proporcionan los días, los agregamos al formData
        if (alarm.days && alarm.days.length === 7) {
            formData.append("days", alarm.days.map(day => day ? '1' : '0').join(','));
        }
        
        const response = await fetch(new URL(API_ENDPOINTS.CREATE_ALARM, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    static async enableAlarm(name: string, enabled: boolean) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("enabled", String(enabled ? 1 : 0));
        const response = await fetch(new URL(API_ENDPOINTS.ENABLE_ALARM, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    static async setAlarmDays(name: string, days: boolean[]) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("days", days.map(day => day ? '1' : '0').join(','));
        const response = await fetch(new URL(API_ENDPOINTS.SET_ALARM_DAYS, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }

    static async getThmReadings(): Promise<ThmReadings> {
        const url = new URL(API_ENDPOINTS.THM_READINGS, API_HOST);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    static async getTempReadings(): Promise<TempReadings> {
        const url = new URL(API_ENDPOINTS.TEMP_READINGS, API_HOST);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    static async createAlarmOnOff(alarm: {
        name: string,
        onHour: number,
        onMinute: number,
        offHour: number,
        offMinute: number,
        channel: number,
        days?: boolean[],  // Optional days parameter
    }) {
        const formData = new FormData();
        formData.append("name", alarm.name);
        formData.append("onHour", String(alarm.onHour));
        formData.append("onMinute", String(alarm.onMinute));
        formData.append("offHour", String(alarm.offHour));
        formData.append("offMinute", String(alarm.offMinute));
        formData.append("channel", String(alarm.channel));
        
        // If days are provided, add them to formData
        if (alarm.days && alarm.days.length === 7) {
            formData.append("days", alarm.days.map(day => day ? '1' : '0').join(','));
        }
        
        const response = await fetch(new URL(API_ENDPOINTS.CREATE_ALARM_ON_OFF, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }
}