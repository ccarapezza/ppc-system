#ifndef PPCCONNECTION_H
#define PPCCONNECTION_H

#include <vector>
#include <NetworkInfo.h>

#define MIN_WIFI_CHANNEL      1
#define MAX_WIFI_CHANNEL      11

class PpcConnection
{
public:
    PpcConnection();  // Constructor
    ~PpcConnection(); // Destructor
    void start();
    void run();
    std::vector<NetworkInfo> getNetworks(bool showHidden);
    void startAP();
    void connectToNetwork(const char* ssid, const char* password);

private:
    static void printScanResult(int networksFound); // Declarar como estática
};

#endif // PPCCONNECTION_H
