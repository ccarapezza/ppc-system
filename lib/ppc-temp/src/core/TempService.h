#ifndef TEMP_SERVICE_H
#define TEMP_SERVICE_H

#include <Arduino.h>

class TemperaturePort;  // forward-declare

class TempService {
public:
    TempService(TemperaturePort& sensor, unsigned long readIntervalMs = 5000);

    void tick();

    float temperature() const { return _temperature; }
    bool  sensorOk()    const { return _sensorOk; }

private:
    TemperaturePort& _sensor;
    unsigned long    _readInterval;
    unsigned long    _lastReadTime;
    float            _temperature;
    bool             _sensorOk;
};

#endif
