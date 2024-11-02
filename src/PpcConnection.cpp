#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <vector>
#include <PpcConnection.h>
#include <NetworkInfo.h>
#include <ConcreteConnectionStates.h>
#include "Log.h"

extern Log logger;

String apName = "PPC-AP_" + String(ESP.getChipId());
const char* _apName = apName.c_str();

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
    logger.logf(LOG_INFO, "Initial status: %d", status);
    WiFi.mode(WIFI_AP_STA);
}

String PpcConnection::getSSID() {
    return WiFi.SSID();
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
    logger.logf(LOG_INFO, "Connecting to %s", _ssid.c_str());
}

void PpcConnection::disconnect() {
    WiFi.disconnect();
    logger.logf(LOG_INFO, "Disconnecting from %s", _ssid.c_str());
}

void PpcConnection::startAP() {
    static int channel = (MIN_WIFI_CHANNEL % MAX_WIFI_CHANNEL) + 1;
    logger.logf(LOG_INFO, "Starting AP %s", _apName);
    WiFi.softAP(_apName, _apPassword, channel);
}

ApInfo PpcConnection::getApInfo() {
    ApInfo apInfo;
    apInfo.ssid = WiFi.softAPSSID();
    apInfo.ip = WiFi.softAPIP().toString();
    return apInfo;
}

std::vector<NetworkInfo> PpcConnection::getNetworks(bool showHidden) {
    int n = WiFi.scanNetworks(false, showHidden);
    std::vector<NetworkInfo> networks(n);

    for (int i = 0; i < n; i++) {
        WiFi.getNetworkInfo(i, networks[i].ssid, networks[i].encryptionType, networks[i].RSSI, networks[i].BSSID, networks[i].channel, networks[i].isHidden);
        logger.logf(LOG_INFO, "%d: %s, Ch:%d (%ddBm) %s %s", i + 1, networks[i].ssid.c_str(), networks[i].channel, networks[i].RSSI, networks[i].encryptionType == ENC_TYPE_NONE ? "open" : "", networks[i].isHidden ? "hidden" : "");
    }

    return networks;
}

void PpcConnection::connectToNetworkSync(const char* ssid, const char* password) {
    WiFi.begin(ssid, password);
    logger.logf(LOG_INFO, "Connecting to %s", ssid);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        logger.logf(LOG_INFO, ".");
    }
    logger.logf(LOG_INFO, "Connected to %s , IP: %s\n", ssid, WiFi.localIP().toString().c_str());

}