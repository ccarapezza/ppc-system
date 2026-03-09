#ifndef CLOCK_H
#define CLOCK_H

#include <Wire.h>
#include <RtcDS1307.h>
#include <PpcConnection.h>

class Clock {
public:
    static Clock& getInstance();

    void start();
    void run(PpcConnection *ppcConn);
    String getCurrentDate();
    RtcDateTime getCurrentDateTime();

    // NTP / timezone configuration
    void setNtpEnabled(bool enabled);
    bool isNtpEnabled() const;
    void setTimeZoneOffset(int8_t offsetHours);
    int8_t getTimeZoneOffset() const;

    // NTP sync status
    bool isNtpSynced() const;
    uint32_t getLastNtpSyncEpoch() const;

    // Manual time setting (disables NTP)
    void setManualTime(uint16_t year, uint8_t month, uint8_t day,
                       uint8_t hour, uint8_t minute, uint8_t second);

    Clock(const Clock&) = delete;
    Clock& operator=(const Clock&) = delete;

private:
    Clock();
    ~Clock();

    static Clock* instance;

    void withInternet();
    void withoutInternet();

    TwoWire tWire;
    RtcDS1307<TwoWire> Rtc;

    bool _ntpEnabled;
    bool _ntpSynced;
    uint32_t _lastNtpSyncEpoch;
    int8_t _timeZoneOffset;
};

#endif // CLOCK_H
