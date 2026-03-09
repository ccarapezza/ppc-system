#include <Arduino.h>
#include <Wire.h>
#include <RtcDS1307.h>
#include <PpcConnection.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "Clock.h"
#include "Log.h"

extern Log logger;

WiFiUDP ntpUDP;

#define NTP_SERVER "2.ar.pool.ntp.org"

NTPClient timeClient(ntpUDP, NTP_SERVER, 0, 60000); // offset applied dynamically

Clock *Clock::instance = nullptr;

Clock::Clock() : Rtc(tWire),
    _ntpEnabled(true),
    _ntpSynced(false),
    _lastNtpSyncEpoch(0),
    _timeZoneOffset(-3)
{
    tWire.begin();
    Rtc.Begin();
}

Clock::~Clock() {}

Clock &Clock::getInstance()
{
    if (instance == nullptr) {
        instance = new Clock();
    }
    return *instance;
}

void Clock::start()
{
    logger.logf(LOG_INFO, "Starting clock...");
    if (!Rtc.IsDateTimeValid()) {
        logger.logf(LOG_ERR, "RTC lost confidence in the DateTime! Resetting to compile time.");
        Rtc.SetIsRunning(true);
        RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
        Rtc.SetDateTime(compiled);
    }
    logger.logf(LOG_INFO, "Clock started!");
}

void Clock::run(PpcConnection *ppcConn)
{
    if (_ntpEnabled && ppcConn != NULL && ppcConn->getCurrentState()->getType() == CONNECTED) {
        withInternet();
    } else {
        withoutInternet();
    }
}

String Clock::getCurrentDate()
{
    if (!Rtc.IsDateTimeValid()) {
        logger.logf(LOG_ERR, "RTC lost confidence in the DateTime! Clock::getCurrentDate");
        return "RTC error";
    }
    RtcDateTime now = Rtc.GetDateTime();
    char datestring[20];
    snprintf_P(datestring,
               countof(datestring),
               PSTR("%02u/%02u/%04u %02u:%02u:%02u"),
               now.Month(),
               now.Day(),
               now.Year(),
               now.Hour(),
               now.Minute(),
               now.Second());
    logger.logf(LOG_INFO, "Current time: %s", datestring);
    return String(datestring);
}

RtcDateTime Clock::getCurrentDateTime()
{
    if (!Rtc.IsDateTimeValid()) {
        logger.logf(LOG_ERR, "RTC lost confidence in the DateTime! Clock::getCurrentDateTime");
        return RtcDateTime(0, 0, 0, 0, 0, 0);
    }
    return Rtc.GetDateTime();
}

void Clock::setNtpEnabled(bool enabled)
{
    _ntpEnabled = enabled;
    if (!enabled) {
        _ntpSynced = false;
    }
}

bool Clock::isNtpEnabled() const { return _ntpEnabled; }

void Clock::setTimeZoneOffset(int8_t offsetHours)
{
    _timeZoneOffset = offsetHours;
    // Force re-sync on next run() call
    _ntpSynced = false;
}

int8_t Clock::getTimeZoneOffset() const { return _timeZoneOffset; }

bool Clock::isNtpSynced() const { return _ntpSynced; }

uint32_t Clock::getLastNtpSyncEpoch() const { return _lastNtpSyncEpoch; }

void Clock::setManualTime(uint16_t year, uint8_t month, uint8_t day,
                          uint8_t hour, uint8_t minute, uint8_t second)
{
    _ntpEnabled = false;
    _ntpSynced = false;
    RtcDateTime dt(year, month, day, hour, minute, second);
    Rtc.SetDateTime(dt);
    logger.logf(LOG_INFO, "Manual time set: %02u/%02u/%04u %02u:%02u:%02u",
                month, day, year, hour, minute, second);
}

void Clock::withInternet()
{
    timeClient.setTimeOffset((long)_timeZoneOffset * 3600L);
    bool timeUpdated = timeClient.update();
    if (timeUpdated) {
        uint32_t epoch = timeClient.getEpochTime();
        RtcDateTime time;
        time.InitWithUnix32Time(epoch);
        Rtc.SetDateTime(time);
        _ntpSynced = true;
        _lastNtpSyncEpoch = epoch;
        logger.logf(LOG_INFO, "NTP sync OK, epoch: %lu", (unsigned long)epoch);
    }
}

void Clock::withoutInternet() {}
