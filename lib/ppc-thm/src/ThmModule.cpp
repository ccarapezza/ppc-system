#include "ThmModule.h"
#include "adapters/ThmController.h"
#include "core/VpdCalculator.h"
#include "MqttClient.h"
#include "Log.h"

static const unsigned long SENSOR_LOG_INTERVAL = 30000; // log errors every 30s max

const char* ThmModule::_spaRoutes[] = { "/thm" };

ThmModule::ThmModule(uint8_t dhtPin, MqttClient& mqtt, Log& log,
                     const char* deviceId)
    : _sensor(dhtPin)
    , _service(_sensor)
    , _mqttAdapter(_service, mqtt, log, deviceId)
    , _log(log)
    , _lastSensorOk(false)
    , _pinLogged(false)
    , _lastLogTime(0)
{}

void ThmModule::setup() {
    _sensor.begin();
    _log.logf(LOG_INFO, "[THM] DHT22 sensor initialized on pin %d", _sensor.getPin());

    // Try an initial read to verify the sensor is connected
    delay(2000); // DHT22 needs 2s after power-on
    if (_sensor.read() && _sensor.isValid()) {
        _log.logf(LOG_INFO, "[THM] Initial read OK: %.1f C, %.1f %%",
                  _sensor.getTemperature(), _sensor.getHumidity());
        _lastSensorOk = true;
    } else {
        _log.log(LOG_ERR, "[THM] Initial read FAILED - check wiring (DATA->D2, VCC->3.3V, GND)");
        _lastSensorOk = false;
    }
}

void ThmModule::loop() {
    _service.tick();

    bool ok = _service.sensorOk();
    unsigned long now = millis();

    // Log pin info once (deferred to loop so WiFi/syslog is ready)
    if (!_pinLogged) {
        _log.logf(LOG_INFO, "[THM] Using DHT22 on GPIO%d", _sensor.getPin());
        _pinLogged = true;
    }

    // Log on state transitions or periodically
    if (ok && !_lastSensorOk) {
        _log.logf(LOG_INFO, "[THM] Sensor recovered: %.1f C, %.1f %%, VPD %.2f kPa",
                  _service.temperature(), _service.humidity(), _service.vpd());
        _lastLogTime = now;
    } else if (ok && (now - _lastLogTime >= SENSOR_LOG_INTERVAL)) {
        _log.logf(LOG_INFO, "[THM][GPIO%d] %.1f C, %.1f %%, VPD %.2f kPa (%s)",
                  _sensor.getPin(),
                  _service.temperature(), _service.humidity(), _service.vpd(),
                  VpdCalculator::stageName(_service.vpdStage()));
        _lastLogTime = now;
    } else if (!ok && (_lastSensorOk || (now - _lastLogTime >= SENSOR_LOG_INTERVAL))) {
        _log.logf(LOG_ERR, "[THM] Sensor read failed (pin GPIO%d) - check wiring or sensor",
                  _sensor.getPin());
        _lastLogTime = now;
    }

    _lastSensorOk = ok;
}

void ThmModule::registerRoutes(AsyncWebServer& server) {
    registerThmControllerRoutes(server, _service);
}

const char** ThmModule::getSpaRoutes(int& count) const {
    count = 1;
    return const_cast<const char**>(_spaRoutes);
}

void ThmModule::handleMqttMessage(const String& topic, const String& message) {
    _mqttAdapter.handleMessage(topic, message);
}

void ThmModule::publishDeviceInfo() {
    _mqttAdapter.publishDeviceInfo();
}
