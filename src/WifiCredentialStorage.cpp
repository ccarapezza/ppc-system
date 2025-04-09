#include "WifiCredentialStorage.h"
#include "Log.h"

extern Log logger;

const char* WifiCredentialStorage::CREDENTIALS_FILE = "/wifi_credentials.json";

bool WifiCredentialStorage::init() {
    if (!LittleFS.begin()) {
        logger.log(LOG_ERR, "Failed to initialize LittleFS");
        return false;
    }
    return true;
}

bool WifiCredentialStorage::saveCredentials(const String& ssid, const String& password) {
    // Create a JSON document
    StaticJsonDocument<200> doc;
    doc["ssid"] = ssid;
    doc["password"] = password;
    
    // Open file for writing
    File file = LittleFS.open(CREDENTIALS_FILE, "w");
    if (!file) {
        logger.log(LOG_ERR, "Failed to open credentials file for writing");
        return false;
    }
    
    // Serialize JSON to file
    if (serializeJson(doc, file) == 0) {
        logger.log(LOG_ERR, "Failed to write credentials to file");
        file.close();
        return false;
    }
    
    file.close();
    logger.logf(LOG_INFO, "Saved WiFi credentials for network: %s", ssid.c_str());
    return true;
}

bool WifiCredentialStorage::loadCredentials(String& ssid, String& password) {
    if (!hasCredentials()) {
        return false;
    }
    
    // Open file for reading
    File file = LittleFS.open(CREDENTIALS_FILE, "r");
    if (!file) {
        logger.log(LOG_ERR, "Failed to open credentials file for reading");
        return false;
    }
    
    // Parse JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, file);
    file.close();
    
    if (error) {
        logger.logf(LOG_ERR, "Failed to parse credentials file: %s", error.c_str());
        return false;
    }
    
    // Extract credentials
    ssid = doc["ssid"].as<String>();
    password = doc["password"].as<String>();
    
    logger.logf(LOG_INFO, "Loaded WiFi credentials for network: %s", ssid.c_str());
    return true;
}

bool WifiCredentialStorage::deleteCredentials() {
    if (!hasCredentials()) {
        return true; // Already no credentials
    }
    
    if (LittleFS.remove(CREDENTIALS_FILE)) {
        logger.log(LOG_INFO, "WiFi credentials deleted");
        return true;
    } else {
        logger.log(LOG_ERR, "Failed to delete WiFi credentials");
        return false;
    }
}

bool WifiCredentialStorage::hasCredentials() {
    return LittleFS.exists(CREDENTIALS_FILE);
}