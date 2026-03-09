#include "PpcApplication.h"

PpcApplication app("PPC-BASE", "base");

void setup() {
    app.init();
    app.start();
}

void loop() {
    app.loop();
}
