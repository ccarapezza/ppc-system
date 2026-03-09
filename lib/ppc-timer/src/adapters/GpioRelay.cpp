#include "GpioRelay.h"
#include "DigitalOutput.h"

GpioRelay::GpioRelay(DigitalOutput** outputs, int count)
    : _outputs(outputs), _count(count) {}

void GpioRelay::setState(int channel, bool on) {
    if (channel >= 0 && channel < _count) {
        _outputs[channel]->setState(on);
    }
}

bool GpioRelay::getState(int channel) const {
    if (channel >= 0 && channel < _count) {
        return _outputs[channel]->getState();
    }
    return false;
}

int GpioRelay::getPin(int channel) const {
    if (channel >= 0 && channel < _count) {
        return _outputs[channel]->getPin();
    }
    return -1;
}

int GpioRelay::channelCount() const {
    return _count;
}
