#include "ConcreteConnectionStates.h"
#include "PpcConnection.h"
#include <ESP8266WiFi.h>
#include "Log.h"

extern Log logger;

void Disconnected::loop(PpcConnection *connection)
{
    if(connection->getJob() == CONNECT){
        logger.logf(LOG_INFO, "Connecting to %s", connection->getSSID());
        connection->setJob(NONE);
        connection->connect();
        connection->setState(Connecting::getInstance());
    }   
    //cout << "Connecting to " << connection->getSSID() << endl;
}

ConnectionState &Disconnected::getInstance()
{
    logger.logf(LOG_INFO, "ConnectionState: DISCONNECTED");
    static Disconnected instance;
    return instance;
}

void Connecting::loop(PpcConnection *connection)
{
    if(WiFi.status() == WL_CONNECTED){
        logger.logf(LOG_INFO, "Connected to %s", connection->getSSID());
        connection->setState(Connected::getInstance());
    }
    if(WiFi.status() == WL_CONNECT_FAILED || WiFi.status() == WL_NO_SSID_AVAIL || WiFi.status() == WL_CONNECTION_LOST || WiFi.status() == WL_WRONG_PASSWORD){
        logger.logf(LOG_INFO, "Connection failed to %s", connection->getSSID());
        connection->setState(Disconnected::getInstance());
    }
}

ConnectionState &Connecting::getInstance()
{
    logger.logf(LOG_INFO, "ConnectionState: CONNECTING");
    static Connecting instance;
    return instance;
}

void Connected::loop(PpcConnection *connection)
{
    if(connection->getJob() == DISCONNECT){
        logger.logf(LOG_INFO, "Disconnecting from %s", connection->getSSID());
        connection->setJob(NONE);
        connection->disconnect();
        connection->setState(Disconnected::getInstance());
    }
    if(WiFi.status() != WL_CONNECTED){
        logger.logf(LOG_INFO, "Connection lost");
        connection->setState(Disconnected::getInstance());
    }
    if(connection->getJob() == CONNECT){
        logger.logf(LOG_INFO, "Disconnecting from %s to connect to new network", connection->getSSID());
        connection->setState(Disconnected::getInstance());
    }
}

ConnectionState &Connected::getInstance()
{
    logger.logf(LOG_INFO, "ConnectionState: CONNECTED");
    static Connected instance;
    return instance;
}