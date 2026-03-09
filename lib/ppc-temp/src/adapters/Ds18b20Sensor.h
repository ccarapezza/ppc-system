#ifndef DS18B20_SENSOR_H
#define DS18B20_SENSOR_H

#include "core/ports/TemperaturePort.h"
#include <OneWire.h>
#include <DallasTemperature.h>

class Ds18b20Sensor : public TemperaturePort {
public:
    explicit Ds18b20Sensor(uint8_t pin);

    void    begin();
    uint8_t getPin() const { return _pin; }

    bool  read() override;
    float getTemperature() const override;
    bool  isValid() const override;

private:
    uint8_t          _pin;
    OneWire          _oneWire;
    DallasTemperature _dallas;
    float            _temperature;
    bool             _valid;
};

#endif
