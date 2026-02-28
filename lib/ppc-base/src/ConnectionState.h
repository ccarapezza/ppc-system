#pragma once
#include "PpcConnection.h"

typedef enum {
    DISCONNECTED  = 0,
    CONNECTING    = 1,
    CONNECTED     = 2,
} connection_state;

// Forward declaration to resolve circular dependency/include
class PpcConnection;

class ConnectionState
{
  public:
    virtual connection_state getType() = 0;
    virtual void loop(PpcConnection *connection) = 0;
    virtual ~ConnectionState() {}
};