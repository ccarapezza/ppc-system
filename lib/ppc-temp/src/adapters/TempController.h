#ifndef TEMP_CONTROLLER_H
#define TEMP_CONTROLLER_H

class AsyncWebServer;
class TempService;

void registerTempControllerRoutes(AsyncWebServer& server, TempService& service);

#endif
