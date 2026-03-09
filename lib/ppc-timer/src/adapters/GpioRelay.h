#ifndef GPIO_RELAY_H
#define GPIO_RELAY_H

#include "core/ports/RelayPort.h"

class DigitalOutput;  // from ppc-base

class GpioRelay : public RelayPort {
public:
    GpioRelay(DigitalOutput** outputs, int count);

    void setState(int channel, bool on) override;
    bool getState(int channel) const override;
    int  getPin(int channel) const override;
    int  channelCount() const override;

private:
    DigitalOutput** _outputs;
    int _count;
};

#endif
