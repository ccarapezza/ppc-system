#include "Dht22Sensor.h"

Dht22Sensor::Dht22Sensor(uint8_t pin)
    : _dht(pin, DHT22)
    , _pin(pin)
    , _temperature(0.0f)
    , _humidity(0.0f)
    , _valid(false)
{}

void Dht22Sensor::begin() {
    _dht.begin();
}

bool Dht22Sensor::read() {
    float t = _dht.readTemperature();
    float h = _dht.readHumidity();
    if (isnan(t) || isnan(h)) {
        _valid = false;
        return false;
    }
    _temperature = t;
    _humidity    = h;
    _valid       = true;
    return true;
}

float Dht22Sensor::getTemperature() const { return _temperature; }
float Dht22Sensor::getHumidity()    const { return _humidity; }
bool  Dht22Sensor::isValid()        const { return _valid; }
