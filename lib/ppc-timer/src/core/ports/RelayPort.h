#ifndef RELAY_PORT_H
#define RELAY_PORT_H

// Pure interface — no framework includes
class RelayPort {
public:
    virtual ~RelayPort() = default;
    virtual void setState(int channel, bool on) = 0;
    virtual bool getState(int channel) const = 0;
    virtual int  getPin(int channel) const = 0;
    virtual int  channelCount() const = 0;
};

#endif
