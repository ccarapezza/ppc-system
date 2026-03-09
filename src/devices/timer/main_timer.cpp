#include "PpcApplication.h"
#include "DigitalOutput.h"
#include "TimerModule.h"

#define RELAY1_PIN D0
#define RELAY2_PIN D6
#define RELAY3_PIN D7

PpcApplication app("PPC-T1000", "timer");
DigitalOutput* outputs[3];

void setup() {
    app.init();

    // Initialize relay outputs
    outputs[0] = new DigitalOutput(RELAY1_PIN, false);
    outputs[1] = new DigitalOutput(RELAY2_PIN, false);
    outputs[2] = new DigitalOutput(RELAY3_PIN, false);
    for (int i = 0; i < 3; i++) outputs[i]->begin();

    // Wire up the timer module (manual DI)
    app.addModule(new TimerModule(outputs, 3,
                                   app.mqtt(), app.logger(),
                                   app.deviceId().c_str()));
    app.start();
}

void loop() {
    app.loop();
}
