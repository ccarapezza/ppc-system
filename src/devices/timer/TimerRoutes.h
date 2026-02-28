#ifndef TIMER_ROUTES_H
#define TIMER_ROUTES_H

#include <ESPAsyncWebServer.h>

// Register all timer-specific HTTP routes onto the given server instance
void registerTimerRoutes(AsyncWebServer& server);

#endif
