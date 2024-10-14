#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <vector>
#include <PpcConnection.h>
#include <NetworkInfo.h>
#include <ConcreteConnectionStates.h>

const char*   _apName               = ("ESP_" + String(ESP.getChipId())).c_str();
const char*   _apPassword           = NULL;

String _ssid = "";
String _pass = "";

//void(*_jobcallback)()                = NULL;

PpcConnection::PpcConnection() {
    currentState = &Disconnected::getInstance();
}

PpcConnection::~PpcConnection() {
    // Destructor implementation (if needed)
}

void PpcConnection::setState(ConnectionState& newState) {
    currentState = &newState;
}

void PpcConnection::setJob(jobs_t job) {
    this->job = job;
}

void PpcConnection::start() {
    // Start implementation, por ejemplo, inicializar comunicación serie
    wl_status_t status = WiFi.status();
    Serial.printf("Initial status: %d\n", status);
    Serial.begin(115200);
    Serial.println();
    WiFi.mode(WIFI_AP_STA);
}

void PpcConnection::run() {
    currentState->loop(this);
}

void PpcConnection::connectToNetwork(const char* ssid, const char* password/*, void(*func)()*/)
{
    _ssid = ssid;
    _pass = password;
    //_jobcallback = func;
    job = CONNECT;
}

void PpcConnection::connect() {
    WiFi.begin(_ssid.c_str(), _pass.c_str());
    Serial.printf("Connecting to %s\n", _ssid.c_str());
}

void PpcConnection::disconnect() {
    WiFi.disconnect();
    Serial.println("Disconnecting");
}

void PpcConnection::startAP() {
    static int channel = (MIN_WIFI_CHANNEL % MAX_WIFI_CHANNEL) + 1;
    WiFi.softAP(_apName, _apPassword, channel);
    IPAddress myIP = WiFi.softAPIP();
    String softApSSID = WiFi.softAPSSID();

    Serial.printf("AP SSID: %s\n", softApSSID.c_str());
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

void PpcConnection::connectToNetworkSync(const char* ssid, const char* password) {
    WiFi.begin(ssid, password);
    Serial.printf("Connecting to %s\n", ssid);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.printf("Connected to %s , IP: %s\n", ssid, WiFi.localIP().toString().c_str());
}