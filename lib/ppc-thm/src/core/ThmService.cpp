#include "ThmService.h"
#include "ports/SensorPort.h"

ThmService::ThmService(SensorPort& sensor, unsigned long readIntervalMs)
    : _sensor(sensor)
    , _readInterval(readIntervalMs)
    , _lastReadTime(0)
    , _temperature(0.0f)
    , _humidity(0.0f)
    , _vpdResult{0.0f, VpdStage::DangerLow}
    , _sensorOk(false)
{}

void ThmService::tick() {
    unsigned long now = millis();
    if (now - _lastReadTime < _readInterval) return;
    _lastReadTime = now;

    if (_sensor.read() && _sensor.isValid()) {
        _temperature = _sensor.getTemperature();
        _humidity    = _sensor.getHumidity();
        _vpdResult   = VpdCalculator::evaluate(_temperature, _humidity);
        _sensorOk    = true;
    } else {
        _sensorOk = false;
    }
}
