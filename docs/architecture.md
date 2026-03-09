# PPC-System Architecture

## Overview

PPC-System is a modular IoT platform built on ESP8266 (Arduino framework, PlatformIO).
It follows a **hexagonal (ports & adapters) architecture** where domain logic has zero
dependencies on frameworks or hardware drivers.

The system is split into two PlatformIO libraries and device-specific entry points:

| Layer | Location | Role |
|-------|----------|------|
| **ppc-base** | `lib/ppc-base/` | Reusable platform runtime: `PpcApplication`, WiFi, MQTT, web server, clock, GPIO, module system |
| **ppc-timer** | `lib/ppc-timer/` | Timer/relay module: scheduling, relay control, HTTP + MQTT adapters |
| **Device firmware** | `src/` | Entry points (`main_base.cpp`, `main_timer.cpp`) — minimal wiring via `PpcApplication` |

```
┌─────────────────────────────────────────────────────────────┐
│  main_timer.cpp                                             │
│                                                             │
│  PpcApplication app("PPC-T1000", "timer");                  │
│  app.init();                                                │
│  app.addModule(new TimerModule(outputs, mqtt, logger, ...));│
│  app.start();                                               │
│                                                             │
│  loop() { app.loop(); }                                     │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  PpcApplication  (lib/ppc-base)                             │
│                                                             │
│  Owns: PpcConnection, Log, MqttClient, Runtime             │
│  init()  → logger, deviceId, MQTT begin                     │
│  start() → MQTT routing, WiFi, module setup, server, clock  │
│  loop()  → connection, clock, server, modules, MQTT         │
│                                                             │
│  MQTT routing: link/unlink (base) | others → modules        │
│  Device info:  modules publish | fallback basic JSON         │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  TimerModule  (lib/ppc-timer)                               │
│                                                             │
│  ┌──────────────────────────────────────────────┐           │
│  │  TimerService  (use-case / core)             │           │
│  │    depends on: RelayPort (port interface)     │           │
│  │                AlarmsManager (domain)         │           │
│  └──────────┬──────────────┬────────────────────┘           │
│             │              │                                │
│     ┌───────▼──────┐ ┌─────▼──────────────┐                │
│     │ GpioRelay    │ │ TimerController     │                │
│     │ (adapter)    │ │ (HTTP adapter)      │                │
│     │ implements   │ │ routes → service    │                │
│     │ RelayPort    │ │                     │                │
│     └──────────────┘ └─────────────────────┘                │
│                      ┌─────────────────────┐                │
│                      │ TimerMqttAdapter    │                │
│                      │ (MQTT adapter)      │                │
│                      │ messages → service  │                │
│                      └─────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rule

```
Adapters  ──depend on──►  Core (use-cases + ports)  ◄──implement──  Adapters
              │                     │
              │              (never depends on)
              │                     │
              ▼                     ▼
         Framework code       Hardware drivers
```

- **Core** (`TimerService`, `RelayPort`, `AlarmsManager`) has zero `#include` of
  ESPAsyncWebServer, PubSubClient, Arduino GPIO, or any adapter.
- **Adapters** (`GpioRelay`, `TimerController`, `TimerMqttAdapter`) depend on core
  interfaces and on framework headers.
- **main.cpp** is the composition root — it creates hardware, modules, and calls `PpcApplication`.

---

## Project Structure

```
ppc-system/
├── platformio.ini                         # Build environments
├── src/
│   ├── main_base.cpp                      # Base device entry (~10 lines)
│   └── devices/timer/
│       └── main_timer.cpp                 # Timer device entry (~30 lines)
│
├── lib/
│   ├── ppc-base/                          # ── Platform runtime library ──
│   │   ├── library.json
│   │   └── src/
│   │       ├── core/
│   │       │   ├── Module.h               # Abstract base class for all modules
│   │       │   ├── Runtime.h              # Module registry + lifecycle runner
│   │       │   └── Runtime.cpp
│   │       ├── PpcApplication.h/.cpp      # Application bootstrap (owns all platform services)
│   │       ├── PpcConnection.h/.cpp       # WiFi state machine (AP + STA)
│   │       ├── ConnectionState.h          # WiFi state interface
│   │       ├── ConcreteConnectionStates.h/.cpp
│   │       ├── WebServer.h/.cpp           # ESPAsyncWebServer: SPA, captive portal, base API
│   │       ├── MqttClient.h/.cpp          # PubSubClient wrapper: presence, link/unlink
│   │       ├── Clock.h/.cpp               # RTC (DS1307) + NTP sync
│   │       ├── DigitalOutput.h/.cpp       # GPIO pin control (inverted logic support)
│   │       ├── Log.h/.cpp                 # Syslog + Serial dual logging
│   │       ├── WifiCredentialStorage.h/.cpp  # LittleFS credential persistence
│   │       └── NetworkInfo.h              # WiFi scan result struct
│   │
│   └── ppc-timer/                         # ── Timer module library ──
│       ├── library.json                   # depends on ppc-base
│       └── src/
│           ├── core/
│           │   ├── ports/
│           │   │   └── RelayPort.h        # PORT: pure relay interface (no framework deps)
│           │   ├── TimerService.h         # USE-CASE: relay control + alarm orchestration
│           │   └── TimerService.cpp
│           ├── adapters/
│           │   ├── GpioRelay.h/.cpp       # ADAPTER: RelayPort → DigitalOutput
│           │   ├── TimerController.h/.cpp # ADAPTER: HTTP routes → TimerService
│           │   └── TimerMqttAdapter.h/.cpp # ADAPTER: MQTT messages → TimerService
│           ├── TimerModule.h/.cpp         # Module impl: wires core + adapters
│           ├── AlarmsManager.h/.cpp       # Domain: linked-list alarm scheduler
│           └── AlarmStorage.h/.cpp        # Persistence: LittleFS JSON storage
│
├── web-vite-preact/                       # Base device SPA (Preact + Vite)
├── web-vite-timer/                        # Timer device SPA (Preact + Vite)
└── docs/
    └── scheme.png                         # Network topology diagram
```

---

## PpcApplication

`PpcApplication` (`lib/ppc-base/src/PpcApplication.h`) eliminates all boilerplate
duplication across device entry points. It owns the platform globals and manages the
full device lifecycle:

```cpp
PpcApplication app("PPC-T1000", "timer");

void setup() {
    app.init();    // logger, WiFi credential storage, deviceId, MQTT begin
    // ... create hardware and modules ...
    app.addModule(new TimerModule(outputs, 3, app.mqtt(), app.logger(), app.deviceId().c_str()));
    app.start();   // MQTT routing, WiFi AP+STA, module setup, web server, clock
}

void loop() {
    app.loop();    // connection, clock, server, modules, MQTT
}
```

### Two-Phase Initialization

| Phase | Method | What happens |
|-------|--------|-------------|
| **init()** | `app.init()` | Logger init, compute deviceId from MAC, begin MQTT client |
| *(create modules)* | user code | Create hardware, inject `app.mqtt()`, `app.logger()`, `app.deviceId()` |
| **start()** | `app.start()` | MQTT subscription + routing, WiFi AP + saved credentials, `runtime.setupAll()`, web server, clock |

This two-phase design solves the chicken-and-egg problem: modules need `deviceId`, `mqtt`,
and `logger` at construction time, but those are only available after platform init.

### MQTT Routing

`PpcApplication` handles MQTT routing automatically:

| Action | Handler |
|--------|---------|
| `request_info` | Calls `MqttClient::publishDeviceInfo()` which delegates to modules |
| `link` | Base handling (logs user linkage) |
| `unlink` | Base handling (logs unlinkage) |
| *anything else* | Delegates to `runtime.handleMqttMessage()` → each module's `handleMqttMessage()` |

### Device Info Publish

When `request_info` is received:
- If modules are registered: calls `Module::publishDeviceInfo()` on each module
- If no modules: publishes basic `{"device_type":"...", "device_id":"..."}` JSON

### Accessors

| Method | Returns |
|--------|---------|
| `app.connection()` | `PpcConnection&` (WiFi state machine) |
| `app.logger()` | `Log&` (syslog + serial) |
| `app.mqtt()` | `MqttClient&` (PubSubClient wrapper) |
| `app.deviceId()` | `const String&` (MAC without colons) |

---

## Module System

### Module Interface (`lib/ppc-base/src/core/Module.h`)

Every device feature is packaged as a `Module`:

```cpp
class Module {
public:
    virtual const char* getName() const = 0;
    virtual void setup() = 0;                              // called once
    virtual void loop() = 0;                               // called every tick
    virtual void registerRoutes(AsyncWebServer& server) = 0;
    virtual const char** getSpaRoutes(int& count) const;   // optional
    virtual void handleMqttMessage(const String& topic, const String& message); // optional
    virtual void publishDeviceInfo();                      // optional
};
```

### Runtime (`lib/ppc-base/src/core/Runtime.h`)

The `Runtime` manages up to 4 modules:

```cpp
Runtime runtime;
runtime.addModule(timerModule);           // register
runtime.setupAll();                       // call setup() on each module
runtime.loopAll();                        // call loop() on each module
runtime.registerAllRoutes(server);        // register HTTP routes from all modules
runtime.handleMqttMessage(topic, msg);    // forward MQTT to all modules
runtime.publishDeviceInfo();              // request info from all modules
```

### Registering a New Module

To add a new device type (e.g. `ppc-thm` for a thermometer):

1. Create `lib/ppc-thm/` with `library.json` (depends on `ppc-base`)
2. Define a port interface (e.g. `TemperaturePort.h`)
3. Implement the use-case (e.g. `ThmService`)
4. Write adapters (GPIO sensor, HTTP controller, MQTT adapter)
5. Create `ThmModule` implementing `Module`
6. In `main_thm.cpp`:

```cpp
PpcApplication app("PPC-THM1", "thm");
void setup() {
    app.init();
    app.addModule(new ThmModule(DHT_PIN, app.mqtt(), app.logger(), app.deviceId().c_str()));
    app.start();
}
void loop() { app.loop(); }
```

---

## Hexagonal Layers in ppc-timer

### Ports (interfaces)

| Port | File | Methods |
|------|------|---------|
| `RelayPort` | `core/ports/RelayPort.h` | `setState(ch, on)`, `getState(ch)`, `getPin(ch)`, `channelCount()` |

Ports are pure C++ abstract classes with no framework `#include`s.

### Use-Cases (core logic)

| Class | File | Responsibility |
|-------|------|----------------|
| `TimerService` | `core/TimerService.h/.cpp` | Orchestrates relay control and alarm scheduling via `RelayPort` and `AlarmsManager` |

`TimerService` never touches GPIO, HTTP, or MQTT directly.

### Adapters (infrastructure)

| Adapter | File | Driven by | Calls |
|---------|------|-----------|-------|
| `GpioRelay` | `adapters/GpioRelay.h/.cpp` | `DigitalOutput` (ppc-base) | Implements `RelayPort` |
| `TimerController` | `adapters/TimerController.h/.cpp` | HTTP requests | `TimerService` methods |
| `TimerMqttAdapter` | `adapters/TimerMqttAdapter.h/.cpp` | MQTT messages | `TimerService` methods |

### Domain

| Class | File | Role |
|-------|------|------|
| `AlarmsManager` | `AlarmsManager.h/.cpp` | Linked-list alarm scheduler (singleton). `reassignRelayFunctions(RelayPort&)` restores callbacks after loading from storage. |
| `AlarmStorage` | `AlarmStorage.h/.cpp` | Serializes/deserializes alarms to `/alarms.json` via LittleFS + ArduinoJson |

---

## Build Environments

Defined in `platformio.ini`:

| Environment | Board | Entry Point | Libraries | Purpose |
|-------------|-------|-------------|-----------|---------|
| `ppc-base` | nodemcuv2 | `main_base.cpp` | ppc-base | WiFi + MQTT + captive portal only |
| `ppc-timer` | esp12e | `devices/timer/main_timer.cpp` | ppc-base, ppc-timer | Base + relay control + alarm scheduling |

Build commands:

```bash
pio run -e ppc-base     # build base device
pio run -e ppc-timer    # build timer device
pio run -t upload -e ppc-timer  # flash timer device
```

---

## HTTP API

### Base Endpoints (all devices)

| Route | Method | Description |
|-------|--------|-------------|
| `/wifi-status` | GET | WiFi connection state + AP info |
| `/wifi-scan` | GET | Available networks |
| `/wifi-connect` | POST | Connect to a network (ssid, password) |
| `/wifi-disconnect` | POST | Disconnect from current network |
| `/link-device` | POST | Link device to user via Clerk JWT |
| `/get-time` | GET | Current RTC time |
| `/clock-status` | GET | NTP/RTC sync status |
| `/set-clock` | POST | Set time mode (ntp/manual) |

### Timer Endpoints (ppc-timer module)

| Route | Method | Description |
|-------|--------|-------------|
| `/digital-outputs` | GET | All relay states |
| `/digital-output` | GET | Single relay state (?id=N) |
| `/digital-output` | POST | Set relay state (id, state) |
| `/alarms` | GET | List all alarms |
| `/alarm` | POST | Create single alarm (name, hour, minute, channel, action) |
| `/alarm-on-off` | POST | Create ON/OFF alarm pair |
| `/alarm-enable` | POST | Enable/disable alarm (name, enabled) |
| `/alarm-days` | POST | Set days of week for alarm |

---

## MQTT Topics

Device ID is derived from MAC address (colons removed).

| Topic | Direction | Payload |
|-------|-----------|---------|
| `devices/{id}/presence` | OUT | `{"device_id", "device_name", "device_type", "status": "online/offline"}` |
| `devices/{id}/info` | OUT | Full device state (relays, alarms, time) |
| `devices/{id}/request_info` | IN | Triggers info publish |
| `devices/{id}/control` | IN | `{"type": "digital_output", "output_id": 0, "state": true}` |
| `devices/{id}/control_response` | OUT | `{"success": true, "output_id": 0, "state": true}` |
| `devices/{id}/link` | IN/OUT | Device linking to user account |
| `devices/{id}/unlink` | IN/OUT | Device unlinking |

---

## ESP8266 Resource Usage

Build output (ppc-timer, esp12e):

| Resource | Used | Available | Usage |
|----------|------|-----------|-------|
| **RAM** | 37,300 bytes | 81,920 bytes | 45.5% |
| **Flash** | 441,071 bytes | 1,044,464 bytes | 42.2% |

### Overhead of Hexagonal Architecture

| Concern | Cost | Notes |
|---------|------|-------|
| vtable pointers | ~4 bytes per polymorphic object | `Module`, `RelayPort` — 2 vtables total |
| Virtual dispatch | ~1-2 extra CPU cycles per call | Alarm loop runs 1/sec — negligible at 80 MHz |
| Module array | 16 bytes (4 pointers) | Fixed allocation, no heap fragmentation |
| Extra code | ~2-3 KB flash | PlatformIO LTO strips unused code |

If RAM becomes critical, collapse `TimerService` into `TimerModule` and remove the
`RelayPort` indirection. This loses testability but saves one vtable layer.
