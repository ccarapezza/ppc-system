#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <vector>
#include <PpcConnection.h>
#include <NetworkInfo.h>

const char*   _apName               = ("ESP_" + String(ESP.getChipId())).c_str();
const char*   _apPassword           = NULL;

PpcConnection::PpcConnection() {
    // Constructor implementation (if needed)
}

PpcConnection::~PpcConnection() {
    // Destructor implementation (if needed)
}

void PpcConnection::start() {
    // Start implementation, por ejemplo, inicializar comunicación serie
    Serial.begin(115200);
    Serial.println();
    WiFi.mode(WIFI_AP_STA);
}

void PpcConnection::run() {
    // Run implementation, por ejemplo, leer datos o mantener la conexión
    Serial.println("PpcConnection running");
}

void PpcConnection::startAP() {
    static int channel = (MIN_WIFI_CHANNEL % MAX_WIFI_CHANNEL) + 1;
    WiFi.softAP(_apName, _apPassword, channel);
    IPAddress myIP = WiFi.softAPIP();
    String softApSSID = WiFi.softAPSSID();

    Serial.printf("AP SSID: %s\n", softApSSID);
    Serial.printf("AP IP address: %s\n", myIP.toString().c_str());
}

std::vector<NetworkInfo> PpcConnection::getNetworks(bool showHidden) {
    int n = WiFi.scanNetworks(false, showHidden);
    std::vector<NetworkInfo> networks(n);

    for (int i = 0; i < n; i++) {
        WiFi.getNetworkInfo(i, networks[i].ssid, networks[i].encryptionType, networks[i].RSSI, networks[i].BSSID, networks[i].channel, networks[i].isHidden);
        Serial.printf("%d: %s, Ch:%d (%ddBm) %s %s\n", i + 1, networks[i].ssid.c_str(), networks[i].channel, networks[i].RSSI, networks[i].encryptionType == ENC_TYPE_NONE ? "open" : "", networks[i].isHidden ? "hidden" : "");
    }

    return networks;
}

void PpcConnection::connectToNetwork(const char* ssid, const char* password) {
    WiFi.begin(ssid, password);
    Serial.printf("Connecting to %s\n", ssid);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.printf("Connected to %s , IP: %s\n", ssid, WiFi.localIP().toString().c_str());
}