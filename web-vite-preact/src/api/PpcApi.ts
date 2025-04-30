const API_HOST = location.origin;

const API_ENDPOINTS = {
    WIFI_STATUS: '/wifi-status',
    WIFI_SCAN: '/wifi-scan',
    WIFI_CONNECT: '/wifi-connect',
    WIFI_DISCONNECT: '/wifi-disconnect',
    GET_TIME: '/get-time',
    GET_DIGITAL_OUTPUTS: '/digital-outputs',
    GET_DIGITAL_OUTPUT: '/digital-output',
    GET_ALARMS: '/alarms',
    CREATE_ALARM: '/alarm',
};

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
    }) {
        const formData = new FormData();
        formData.append("name", alarm.name);
        formData.append("hour", String(alarm.hour));
        formData.append("minute", String(alarm.minute));
        formData.append("channel", String(alarm.channel));
        formData.append("action", String(alarm.action ? 1 : 0));
        const response = await fetch(new URL(API_ENDPOINTS.CREATE_ALARM, API_HOST), {
            method: 'POST',
            body: formData
        });
        return response.json();
    }
}