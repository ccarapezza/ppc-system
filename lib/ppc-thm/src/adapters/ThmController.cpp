#include "ThmController.h"
#include "core/ThmService.h"
#include "core/VpdCalculator.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include <ESPAsyncWebServer.h>

void registerThmControllerRoutes(AsyncWebServer& server, ThmService& svc) {

    // GET current sensor readings + VPD
    server.on("/thm/readings", HTTP_GET,
        [&svc](AsyncWebServerRequest* request) {
            auto* response = new AsyncJsonResponse();
            JsonObject root = response->getRoot().to<JsonObject>();
            root["temperature"] = svc.temperature();
            root["humidity"]    = svc.humidity();
            root["vpd"]         = svc.vpd();
            root["stage"]       = VpdCalculator::stageName(svc.vpdStage());
            root["sensorOk"]    = svc.sensorOk();
            response->setLength();
            request->send(response);
        });
}
