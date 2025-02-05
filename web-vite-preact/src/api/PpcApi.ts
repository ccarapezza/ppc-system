const API_HOST = location.origin;

const API_ENDPOINTS = {
    WIFI_STATUS: '/wifi-status',
    WIFI_SCAN: '/wifi-scan',
    WIFI_CONNECT: '/wifi-connect',
    WIFI_DISCONNECT: '/wifi-disconnect'
};

export class PpcApi {

    static async getWifiStatus() {
        const response = await fetch(API_HOST + API_ENDPOINTS.WIFI_STATUS);
        //responseNotOk(response);
        return response.json();
    }

    static async getWifiScan() {
        const response = await fetch(API_HOST + API_ENDPOINTS.WIFI_SCAN);
        return response.json();
    }

    static async connectWifi(ssid: string, password: string) {
        const response = await fetch(API_HOST + API_ENDPOINTS.WIFI_CONNECT, {
            method: 'POST',
            body: JSON.stringify({
                ssid: ssid,
                password: password
            })  
        });
        return response.json();
    }

    static async disconnectWifi() {
        const response = await fetch(API_HOST + API_ENDPOINTS.WIFI_DISCONNECT,{
            method: 'POST'
        });
        return response.json();
    }
}