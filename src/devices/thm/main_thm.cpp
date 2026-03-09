#include "PpcApplication.h"
#include "ThmModule.h"

#define DHT_PIN D2  // GPIO4

PpcApplication app("PPC-THM1", "thm");

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n\n[THM] Boot...");

    app.init();

    app.addModule(new ThmModule(DHT_PIN, app.mqtt(), app.logger(),
                                app.deviceId().c_str()));
    app.start();
}

void loop() {
    app.loop();
}
