#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <ESPAsyncWebServer.h>
#include <functional>
#include "PpcConnection.h"

// Called before startServer() to register device-specific HTTP routes
void setDeviceRouteHandler(std::function<void(AsyncWebServer&)> handler);

// Called before startServer() to register additional SPA client-side routes (served as index.html)
void setDeviceSpaRoutes(std::initializer_list<const char*> routes);

void startServer(PpcConnection *ppcConnection);
void loopServer();

#endif
