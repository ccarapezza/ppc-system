#ifndef TEMPERATURE_PORT_H
#define TEMPERATURE_PORT_H

// Pure interface — no framework includes
class TemperaturePort {
public:
    virtual ~TemperaturePort() = default;
    virtual bool  read() = 0;
    virtual float getTemperature() const = 0;
    virtual bool  isValid() const = 0;
};

#endif
