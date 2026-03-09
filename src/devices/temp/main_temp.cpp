#include "PpcApplication.h"
#include "TempModule.h"

#define DS18B20_PIN D4  // GPIO2

PpcApplication app("PPC-TEMP1", "temp");

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n\n[TEMP] Boot...");

    app.init();

    app.addModule(new TempModule(DS18B20_PIN, app.mqtt(), app.logger(),
                                 app.deviceId().c_str()));
    app.start();
}

void loop() {
    app.loop();
}
