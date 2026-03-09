#ifndef THM_CONTROLLER_H
#define THM_CONTROLLER_H

class AsyncWebServer;
class ThmService;

// HTTP adapter: registers THM routes that delegate to ThmService.
void registerThmControllerRoutes(AsyncWebServer& server, ThmService& service);

#endif
