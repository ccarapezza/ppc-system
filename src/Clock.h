#ifndef CLOCK_H
#define CLOCK_H

#include <Wire.h>
#include <RtcDS1307.h>

class Clock {
public:
    // Método estático que controla el acceso a la instancia Clock.
    static Clock& getInstance();

    // Ejemplo de método que se puede llamar en la instancia Clock.
    void start();
    void run(PpcConnection *ppcConn);
    String getCurrentDate();

    // Eliminar el constructor, el operador de asignación y el constructor de copia para prevenir la creación de múltiples instancias.
    Clock(const Clock&) = delete;
    Clock& operator=(const Clock&) = delete;

private:
    // Constructor privado para evitar la creación de instancias.
    Clock();

    // Destructor privado.
    ~Clock();

    // Puntero a la instancia singleton.
    static Clock* instance;

    void withInternet();
    void withoutInternet();

    TwoWire tWire;
    RtcDS1307<TwoWire> Rtc;
};

#endif // CLOCK_H