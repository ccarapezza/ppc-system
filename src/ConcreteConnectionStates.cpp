#include "ConcreteConnectionStates.h"
#include "PpcConnection.h"
#include <ESP8266WiFi.h>

void Disconnected::loop(PpcConnection *connection)
{
    if(connection->getJob() == CONNECT){
        connection->setJob(NONE);
        connection->connect();
        connection->setState(Connecting::getInstance());
    }   
    //cout << "Connecting to " << connection->getSSID() << endl;
}

ConnectionState &Disconnected::getInstance()
{
    Serial.println("ConnectionState: DISCONNECTED");
    static Disconnected instance;
    return instance;
}

void Connecting::loop(PpcConnection *connection)
{
    if(WiFi.status() == WL_CONNECTED){
        connection->setState(Connected::getInstance());
    }
    if(WiFi.status() == WL_CONNECT_FAILED || WiFi.status() == WL_NO_SSID_AVAIL || WiFi.status() == WL_CONNECTION_LOST || WiFi.status() == WL_WRONG_PASSWORD){
        connection->setState(Disconnected::getInstance());
    }
}


ConnectionState &Connecting::getInstance()
{
    Serial.println("ConnectionState: CONNECTING");
    static Connecting instance;
    return instance;
}

void Connected::loop(PpcConnection *connection)
{
    if(connection->getJob() == DISCONNECT){
        connection->setJob(NONE);
        connection->disconnect();
        connection->setState(Disconnected::getInstance());
    }
    if(WiFi.status() != WL_CONNECTED){
        connection->setState(Disconnected::getInstance());
    }
}

ConnectionState &Connected::getInstance()
{
    Serial.println("ConnectionState: CONNECTED");
    static Connected instance;
    return instance;
}