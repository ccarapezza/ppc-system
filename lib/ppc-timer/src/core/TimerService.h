#ifndef TIMER_SERVICE_H
#define TIMER_SERVICE_H

#include <Arduino.h>
#include "ports/RelayPort.h"

class AlarmsManager;  // forward-declare

// Use-case: orchestrates relay control and alarm scheduling.
// Depends ONLY on ports (RelayPort) and domain classes (AlarmsManager).
class TimerService {
public:
    TimerService(RelayPort& relay, AlarmsManager& alarms);

    // Relay control
    bool setRelay(int channel, bool state);
    bool getRelayState(int channel) const;
    int  getRelayPin(int channel) const;
    int  relayCount() const;

    // Alarm delegation
    int  addAlarm(const char* name, int hour, int minute, int channel, bool state);
    int  addAlarmPair(const char* name, int onH, int onM, int offH, int offM,
                      int channel, const bool days[7]);
    bool enableAlarm(const char* name, bool enabled);
    bool setAlarmDays(const char* name, const bool days[7]);
    String getAlarmsJson() const;

    // Called from loop — ticks the alarm scheduler
    void tick();

private:
    RelayPort& _relay;
    AlarmsManager& _alarms;
};

#endif
