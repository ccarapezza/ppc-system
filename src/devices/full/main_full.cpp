#include "PpcApplication.h"
#include "DigitalOutput.h"
#include "TimerModule.h"
#include "ThmModule.h"
#include "TempModule.h"

#define RELAY1_PIN D0
#define RELAY2_PIN D6
#define RELAY3_PIN D7
#define DHT_PIN    D2   // GPIO4
#define DS18B20_PIN D4  // GPIO2

PpcApplication app("PPC-FULL1", "full");
DigitalOutput* outputs[3];

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n\n[FULL] Boot...");

    app.init();

    // Initialize relay outputs
    outputs[0] = new DigitalOutput(RELAY1_PIN, false);
    outputs[1] = new DigitalOutput(RELAY2_PIN, false);
    outputs[2] = new DigitalOutput(RELAY3_PIN, false);
    for (int i = 0; i < 3; i++) outputs[i]->begin();

    // Register all modules
    app.addModule(new TimerModule(outputs, 3,
                                   app.mqtt(), app.logger(),
                                   app.deviceId().c_str()));

    app.addModule(new ThmModule(DHT_PIN, app.mqtt(), app.logger(),
                                app.deviceId().c_str()));

    app.addModule(new TempModule(DS18B20_PIN, app.mqtt(), app.logger(),
                                 app.deviceId().c_str()));

    app.start();
}

void loop() {
    app.loop();
}
