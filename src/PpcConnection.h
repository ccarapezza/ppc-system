#ifndef PPCCONNECTION_H
#define PPCCONNECTION_H

#include <vector>
#include <NetworkInfo.h>
#include <ConnectionState.h>

#define MIN_WIFI_CHANNEL      1
#define MAX_WIFI_CHANNEL      11


typedef enum {
    NONE,
    CONNECT,
    DISCONNECT,
} jobs_t;

// Forward declaration to resolve circular dependency/include
class ConnectionState;

class PpcConnection
{
public:
    PpcConnection();  // Constructor
    ~PpcConnection(); // Destructor
    void start();
    void run();
    void startAP();
    void connectToNetwork(const char* ssid, const char* password/*, void(*func)()*/);
    void connectToNetworkSync(const char* ssid, const char* password);

	//StateMachine
	inline ConnectionState* getCurrentState() const { return currentState; }
	void setState(ConnectionState& newState);
    inline jobs_t getJob() const { return job; }
    void setJob(jobs_t job);
    static std::vector<NetworkInfo> getNetworks(bool showHidden);

    void connect();
    void disconnect();
private:
    //START - StateMachine
    ConnectionState* currentState;
    jobs_t job;
    //END - StateMachine
    static void printScanResult(int networksFound); // Declarar como estática
    void checkConnectionStatus();
    void checkConnection();
};

#endif // PPCCONNECTION_H
