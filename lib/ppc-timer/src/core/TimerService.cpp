#include "TimerService.h"
#include "AlarmsManager.h"

TimerService::TimerService(RelayPort& relay, AlarmsManager& alarms)
    : _relay(relay), _alarms(alarms) {}

bool TimerService::setRelay(int channel, bool state) {
    if (channel < 0 || channel >= _relay.channelCount()) return false;
    _relay.setState(channel, state);
    return true;
}

bool TimerService::getRelayState(int channel) const {
    if (channel < 0 || channel >= _relay.channelCount()) return false;
    return _relay.getState(channel);
}

int TimerService::getRelayPin(int channel) const {
    return _relay.getPin(channel);
}

int TimerService::relayCount() const {
    return _relay.channelCount();
}

int TimerService::addAlarm(const char* name, int hour, int minute,
                           int channel, bool state) {
    std::function<void(int)> exec = [this, channel, state](int) {
        _relay.setState(channel, state);
    };
    std::vector<int> extra = {channel + 1, state ? 1 : 0}; // 1-based for storage compat
    return _alarms.addAlarm(String(name), hour, minute, exec, extra);
}

int TimerService::addAlarmPair(const char* name, int onH, int onM,
                               int offH, int offM, int channel,
                               const bool days[7]) {
    String base(name);
    addAlarm((base + "_ON").c_str(), onH, onM, channel, true);
    int count = addAlarm((base + "_OFF").c_str(), offH, offM, channel, false);
    if (days) {
        _alarms.setAlarmDays(base + "_ON", const_cast<bool*>(days));
        _alarms.setAlarmDays(base + "_OFF", const_cast<bool*>(days));
    }
    return count;
}

bool TimerService::enableAlarm(const char* name, bool enabled) {
    return _alarms.enableAlarm(String(name), enabled);
}

bool TimerService::setAlarmDays(const char* name, const bool days[7]) {
    return _alarms.setAlarmDays(String(name), const_cast<bool*>(days));
}

String TimerService::getAlarmsJson() const {
    return _alarms.getAlarms();
}

void TimerService::tick() {
    _alarms.alarmLoop();
}
