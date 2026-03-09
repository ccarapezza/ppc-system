#include "TempService.h"
#include "ports/TemperaturePort.h"

TempService::TempService(TemperaturePort& sensor, unsigned long readIntervalMs)
    : _sensor(sensor)
    , _readInterval(readIntervalMs)
    , _lastReadTime(0)
    , _temperature(0.0f)
    , _sensorOk(false)
{}

void TempService::tick() {
    unsigned long now = millis();
    if (now - _lastReadTime < _readInterval) return;
    _lastReadTime = now;

    if (_sensor.read() && _sensor.isValid()) {
        _temperature = _sensor.getTemperature();
        _sensorOk    = true;
    } else {
        _sensorOk = false;
    }
}
