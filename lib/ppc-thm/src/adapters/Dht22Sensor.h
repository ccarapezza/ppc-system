#ifndef DHT22_SENSOR_H
#define DHT22_SENSOR_H

#include "core/ports/SensorPort.h"
#include <DHT.h>

class Dht22Sensor : public SensorPort {
public:
    explicit Dht22Sensor(uint8_t pin);

    void    begin();
    uint8_t getPin() const { return _pin; }

    bool  read() override;
    float getTemperature() const override;
    float getHumidity() const override;
    bool  isValid() const override;

private:
    DHT     _dht;
    uint8_t _pin;
    float _temperature;
    float _humidity;
    bool  _valid;
};

#endif
