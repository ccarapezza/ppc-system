#ifndef DIGITAL_OUTPUT_H
#define DIGITAL_OUTPUT_H

#include <Arduino.h>

class DigitalOutput {
private:
    uint8_t _pin;        // El pin que controla esta salida
    bool _state;         // El estado actual de la salida
    bool _invertLogic;   // Si true, HIGH=apagado, LOW=encendido

public:
    /**
     * Constructor
     * @param pin El número de pin para controlar
     * @param invertLogic Si es true, la lógica se invierte (HIGH=apagado, LOW=encendido)
     */
    DigitalOutput(uint8_t pin, bool invertLogic = false);
    
    /**
     * Inicializa el pin como salida
     */
    void begin();
    
    /**
     * Enciende la salida
     */
    void turnOn();
    
    /**
     * Apaga la salida
     */
    void turnOff();
    
    /**
     * Cambia el estado de la salida (de encendido a apagado o viceversa)
     */
    void toggle();
    
    /**
     * Establece el estado de la salida
     * @param state true para encendido, false para apagado
     */
    void setState(bool state);
    
    /**
     * Obtiene el estado actual de la salida
     * @return true si está encendido, false si está apagado
     */
    bool getState() const;
    
    /**
     * Obtiene el número de pin
     * @return el número de pin
     */
    uint8_t getPin() const;
};

#endif // DIGITAL_OUTPUT_H
