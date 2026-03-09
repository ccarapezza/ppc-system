#ifndef TIMER_CONTROLLER_H
#define TIMER_CONTROLLER_H

class AsyncWebServer;
class TimerService;

// HTTP adapter: registers timer routes that delegate to TimerService.
// Never touches hardware directly.
void registerTimerControllerRoutes(AsyncWebServer& server, TimerService& service);

#endif
