#ifndef WEBSERVER_H
#define WEBSERVER_H

// Forward-declare to avoid pulling ESPAsyncWebServer.h (with its
// strict include-order requirements) into every translation unit.
class AsyncWebServer;

#include <functional>
#include <vector>
#include "PpcConnection.h"

// Called before startServer() to register device-specific HTTP routes
void setDeviceRouteHandler(std::function<void(AsyncWebServer&)> handler);

// Called before startServer() to register additional SPA client-side routes (served as index.html)
void setDeviceSpaRoutes(std::initializer_list<const char*> routes);
void setDeviceSpaRoutes(const char** routes, int count);

void startServer(PpcConnection *ppcConnection);
void loopServer();

#endif
