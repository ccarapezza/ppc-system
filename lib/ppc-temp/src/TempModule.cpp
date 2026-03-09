#include "TempModule.h"
#include "adapters/TempController.h"
#include "MqttClient.h"
#include "Log.h"

static const unsigned long SENSOR_LOG_INTERVAL = 30000;

const char* TempModule::_spaRoutes[] = { "/temp" };

TempModule::TempModule(uint8_t sensorPin, MqttClient& mqtt, Log& log,
                       const char* deviceId)
    : _sensor(sensorPin)
    , _service(_sensor)
    , _mqttAdapter(_service, mqtt, log, deviceId)
    , _log(log)
    , _lastSensorOk(false)
    , _pinLogged(false)
    , _lastLogTime(0)
{}

void TempModule::setup() {
    _sensor.begin();
    _log.logf(LOG_INFO, "[TEMP] DS18B20 sensor initialized on GPIO%d", _sensor.getPin());

    delay(1000); // DS18B20 needs time after init
    if (_sensor.read() && _sensor.isValid()) {
        _log.logf(LOG_INFO, "[TEMP] Initial read OK: %.1f C", _sensor.getTemperature());
        _lastSensorOk = true;
    } else {
        _log.log(LOG_ERR, "[TEMP] Initial read FAILED - check wiring (DATA->Dx, VCC->3.3V, GND)");
        _lastSensorOk = false;
    }
}

void TempModule::loop() {
    _service.tick();

    bool ok = _service.sensorOk();
    unsigned long now = millis();

    if (!_pinLogged) {
        _log.logf(LOG_INFO, "[TEMP] Using DS18B20 on GPIO%d", _sensor.getPin());
        _pinLogged = true;
    }

    if (ok && !_lastSensorOk) {
        _log.logf(LOG_INFO, "[TEMP] Sensor recovered: %.1f C", _service.temperature());
        _lastLogTime = now;
    } else if (ok && (now - _lastLogTime >= SENSOR_LOG_INTERVAL)) {
        _log.logf(LOG_INFO, "[TEMP][GPIO%d] %.1f C",
                  _sensor.getPin(), _service.temperature());
        _lastLogTime = now;
    } else if (!ok && (_lastSensorOk || (now - _lastLogTime >= SENSOR_LOG_INTERVAL))) {
        _log.logf(LOG_ERR, "[TEMP] Sensor read failed (GPIO%d) - check wiring or sensor",
                  _sensor.getPin());
        _lastLogTime = now;
    }

    _lastSensorOk = ok;
}

void TempModule::registerRoutes(AsyncWebServer& server) {
    registerTempControllerRoutes(server, _service);
}

const char** TempModule::getSpaRoutes(int& count) const {
    count = 1;
    return const_cast<const char**>(_spaRoutes);
}

void TempModule::handleMqttMessage(const String& topic, const String& message) {
    _mqttAdapter.handleMessage(topic, message);
}

void TempModule::publishDeviceInfo() {
    _mqttAdapter.publishDeviceInfo();
}
