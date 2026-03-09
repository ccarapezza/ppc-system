#ifndef THM_SERVICE_H
#define THM_SERVICE_H

#include <Arduino.h>
#include "VpdCalculator.h"

class SensorPort;  // forward-declare

// Use-case: orchestrates sensor reads and VPD calculation.
// Depends ONLY on ports (SensorPort) and domain (VpdCalculator).
class ThmService {
public:
    ThmService(SensorPort& sensor, unsigned long readIntervalMs = 5000);

    // Called from loop — reads sensor if interval elapsed
    void tick();

    // Current readings
    float    temperature() const { return _temperature; }
    float    humidity()    const { return _humidity; }
    float    vpd()         const { return _vpdResult.vpd; }
    VpdStage vpdStage()    const { return _vpdResult.stage; }
    bool     sensorOk()    const { return _sensorOk; }

private:
    SensorPort&   _sensor;
    unsigned long _readInterval;
    unsigned long _lastReadTime;
    float         _temperature;
    float         _humidity;
    VpdResult     _vpdResult;
    bool          _sensorOk;
};

#endif
