#pragma once
#include "PpcConnection.h"

// Forward declaration to resolve circular dependency/include
class PpcConnection;

class ConnectionState
{
  public:
    virtual void loop(PpcConnection *connection) = 0;
    virtual ~ConnectionState() {}
};