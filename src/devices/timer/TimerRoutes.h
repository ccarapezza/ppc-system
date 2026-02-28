#ifndef TIMER_ROUTES_H
#define TIMER_ROUTES_H

// Forward-declare to avoid strict include-order issues with ESPAsyncWebServer.h
class AsyncWebServer;

// Register all timer-specific HTTP routes onto the given server instance
void registerTimerRoutes(AsyncWebServer& server);

#endif
