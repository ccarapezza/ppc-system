#ifndef SENSOR_PORT_H
#define SENSOR_PORT_H

// Pure interface — no framework includes
class SensorPort {
public:
    virtual ~SensorPort() = default;
    virtual bool  read() = 0;
    virtual float getTemperature() const = 0;
    virtual float getHumidity() const = 0;
    virtual bool  isValid() const = 0;
};

#endif
