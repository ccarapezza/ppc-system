#include "TempController.h"
#include "core/TempService.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include <ESPAsyncWebServer.h>

void registerTempControllerRoutes(AsyncWebServer& server, TempService& svc) {

    server.on("/temp/readings", HTTP_GET,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            root["temperature"] = svc.temperature();
            root["sensorOk"]    = svc.sensorOk();
            response->setLength();
            request->send(response);
        });
}
