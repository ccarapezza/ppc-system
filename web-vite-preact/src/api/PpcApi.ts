const API_HOST = location.origin;

const API_ENDPOINTS = {
    WIFI_STATUS: '/wifi-status',
    WIFI_SCAN: '/wifi-scan',
    WIFI_CONNECT: '/wifi-connect',
    WIFI_DISCONNECT: '/wifi-disconnect',
    GET_TIME: '/get-time'
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
}