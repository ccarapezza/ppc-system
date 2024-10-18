#include "ConnectionState.h"
#include "PpcConnection.h"

class Disconnected : public ConnectionState
{
public:
    connection_state getType() { return DISCONNECTED; }
    void loop(PpcConnection *connection);
    static ConnectionState &getInstance();

private:
    Disconnected() {}
    Disconnected(const Disconnected &other);
    Disconnected &operator=(const Disconnected &other);
};

class Connecting : public ConnectionState
{
public:
    connection_state getType() { return CONNECTING; }
    void loop(PpcConnection *connection);
    static ConnectionState &getInstance();

private:
    Connecting() {}
    Connecting(const Connecting &other);
    Connecting &operator=(const Connecting &other);
};

class Connected : public ConnectionState
{
public:
    connection_state getType() { return CONNECTED; }
    void loop(PpcConnection *connection);
    static ConnectionState &getInstance();

private:
    Connected() {}
    Connected(const Connected &other);
    Connected &operator=(const Connected &other);
};
