# Adding a New Module

This guide walks through adding a new device module to ppc-system.
We use a hypothetical **ppc-thm** (thermometer) module as the example.

---

## 1. Create the Library

```
lib/ppc-thm/
├── library.json
└── src/
    ├── core/
    │   ├── ports/
    │   │   └── TemperaturePort.h      # port interface
    │   ├── ThmService.h               # use-case
    │   └── ThmService.cpp
    ├── adapters/
    │   ├── Dht22Sensor.h/.cpp         # adapter: implements TemperaturePort
    │   ├── ThmController.h/.cpp       # adapter: HTTP routes → ThmService
    │   └── ThmMqttAdapter.h/.cpp      # adapter: MQTT → ThmService
    ├── ThmModule.h/.cpp               # Module implementation
    └── ... (domain classes if any)
```

`library.json`:
```json
{
    "name": "ppc-thm",
    "version": "1.0.0",
    "dependencies": {
        "ppc-base": "*"
    }
}
```

---

## 2. Define the Port

The port is a pure C++ interface with **no framework includes**:

```cpp
// core/ports/TemperaturePort.h
#ifndef TEMPERATURE_PORT_H
#define TEMPERATURE_PORT_H

class TemperaturePort {
public:
    virtual ~TemperaturePort() = default;
    virtual float readTemperature() = 0;
    virtual float readHumidity() = 0;
};

#endif
```

---

## 3. Implement the Use-Case

The service depends only on ports — never on Arduino, HTTP, or MQTT:

```cpp
// core/ThmService.h
#ifndef THM_SERVICE_H
#define THM_SERVICE_H

#include "ports/TemperaturePort.h"

class ThmService {
public:
    ThmService(TemperaturePort& sensor);
    float getTemperature();
    float getHumidity();
private:
    TemperaturePort& _sensor;
};

#endif
```

---

## 4. Write the Adapter

The adapter implements the port using a concrete hardware library:

```cpp
// adapters/Dht22Sensor.h
#ifndef DHT22_SENSOR_H
#define DHT22_SENSOR_H

#include "core/ports/TemperaturePort.h"
#include <DHT.h>  // framework dependency lives here, not in core

class Dht22Sensor : public TemperaturePort {
public:
    Dht22Sensor(uint8_t pin);
    void begin();
    float readTemperature() override;
    float readHumidity() override;
private:
    DHT _dht;
};

#endif
```

---

## 5. Create the Module

```cpp
// ThmModule.h
#ifndef THM_MODULE_H
#define THM_MODULE_H

#include "core/Module.h"
#include "core/ThmService.h"
#include "adapters/Dht22Sensor.h"

class ThmModule : public Module {
public:
    ThmModule(uint8_t sensorPin, MqttClient& mqtt, Log& log, const char* deviceId);

    const char* getName() const override { return "thm"; }
    void setup() override;
    void loop() override;
    void registerRoutes(AsyncWebServer& server) override;
    const char** getSpaRoutes(int& count) const override;

    // Optional: override for MQTT support
    void handleMqttMessage(const String& topic, const String& message) override;
    void publishDeviceInfo() override;

private:
    Dht22Sensor  _sensor;
    ThmService   _service;
    static const char* _spaRoutes[];
};

#endif
```

---

## 6. Create the Entry Point

```
src/devices/thm/
└── main_thm.cpp
```

```cpp
// main_thm.cpp
#include "PpcApplication.h"
#include "ThmModule.h"

#define DHT_PIN D4

PpcApplication app("PPC-THM1", "thm");

void setup() {
    app.init();

    app.addModule(new ThmModule(DHT_PIN,
                                 app.mqtt(), app.logger(),
                                 app.deviceId().c_str()));
    app.start();
}

void loop() {
    app.loop();
}
```

---

## 7. Add the Build Environment

In `platformio.ini`:

```ini
[env:ppc-thm]
board = esp12e
build_src_filter = -<*> +<devices/thm/>
build_flags = -DPPC_DEVICE_THM
extra_scripts = scripts/copy_webapp.py
```

Build:
```bash
pio run -e ppc-thm
```

---

## Checklist

- [ ] Port interface has zero framework `#include`s
- [ ] Use-case depends only on ports and domain classes
- [ ] Adapters depend on core, never the reverse
- [ ] Module implements `Module` base class from ppc-base
- [ ] `main_*.cpp` uses `PpcApplication` (no manual boilerplate)
- [ ] `library.json` declares dependency on `ppc-base`
- [ ] `platformio.ini` has a new `[env:ppc-*]` section
- [ ] `pio run -e ppc-base` still compiles (no regressions)
