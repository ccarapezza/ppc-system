#ifndef WIFI_CREDENTIAL_STORAGE_H
#define WIFI_CREDENTIAL_STORAGE_H

#include <Arduino.h>
#include <LittleFS.h>
#include "ArduinoJson.h"

class WifiCredentialStorage {
public:
    // Initialize the storage system
    static bool init();
    
    // Save credentials to flash
    static bool saveCredentials(const String& ssid, const String& password);
    
    // Load credentials from flash
    static bool loadCredentials(String& ssid, String& password);
    
    // Delete saved credentials
    static bool deleteCredentials();
    
    // Check if credentials exist
    static bool hasCredentials();

private:
    static const char* CREDENTIALS_FILE;
};

#endif // WIFI_CREDENTIAL_STORAGE_H