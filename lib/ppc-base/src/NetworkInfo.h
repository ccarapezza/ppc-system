#ifndef NETWORKINFO_H
#define NETWORKINFO_H

#include <Arduino.h>

struct NetworkInfo {
    String ssid;
    uint8_t encryptionType;
    int32_t RSSI;
    uint8_t* BSSID;
    int32_t channel;
    bool isHidden;
};

#endif // NETWORKINFO_H
