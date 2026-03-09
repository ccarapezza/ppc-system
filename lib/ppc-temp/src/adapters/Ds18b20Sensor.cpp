#include "Ds18b20Sensor.h"

Ds18b20Sensor::Ds18b20Sensor(uint8_t pin)
    : _pin(pin)
    , _oneWire(pin)
    , _dallas(&_oneWire)
    , _temperature(0.0f)
    , _valid(false)
{}

void Ds18b20Sensor::begin() {
    _dallas.begin();
    _dallas.setResolution(12);       // 12-bit = 0.0625 C precision
    _dallas.setWaitForConversion(true);
}

bool Ds18b20Sensor::read() {
    _dallas.requestTemperatures();
    float t = _dallas.getTempCByIndex(0);

    if (t == DEVICE_DISCONNECTED_C || t == -127.0f) {
        _valid = false;
        return false;
    }

    _temperature = t;
    _valid       = true;
    return true;
}

float Ds18b20Sensor::getTemperature() const { return _temperature; }
bool  Ds18b20Sensor::isValid()        const { return _valid; }
