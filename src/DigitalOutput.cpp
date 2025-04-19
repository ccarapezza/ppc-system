#include "DigitalOutput.h"
#include "Log.h"

// Referencia al logger global
extern Log logger;

DigitalOutput::DigitalOutput(uint8_t pin, bool invertLogic) 
    : _pin(pin), _state(false), _invertLogic(invertLogic) {
}

void DigitalOutput::begin() {
    pinMode(_pin, OUTPUT);
    turnOff(); // Iniciar apagado por seguridad
    logger.logf(LOG_INFO, "Digital output on pin %d initialized", _pin);
}

void DigitalOutput::turnOn() {
    _state = true;
    digitalWrite(_pin, _invertLogic ? LOW : HIGH);
    logger.logf(LOG_INFO, "Digital output on pin %d turned ON", _pin);
}

void DigitalOutput::turnOff() {
    _state = false;
    digitalWrite(_pin, _invertLogic ? HIGH : LOW);
    logger.logf(LOG_INFO, "Digital output on pin %d turned OFF", _pin);
}

void DigitalOutput::toggle() {
    if (_state) {
        turnOff();
    } else {
        turnOn();
    }
}

void DigitalOutput::setState(bool state) {
    if (state) {
        turnOn();
    } else {
        turnOff();
    }
}

bool DigitalOutput::getState() const {
    return _state;
}

uint8_t DigitalOutput::getPin() const {
    return _pin;
}
