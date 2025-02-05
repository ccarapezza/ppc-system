#ifndef LOG_H
#define LOG_H

#include <Arduino.h>
#include <WiFiUdp.h>
#include <Syslog.h>

class Log {
public:
    Log(const char* host, uint16_t port, const char* appName, const char* hostname, unsigned long baudRate);
    void init(); // Método para inicializar la conexión
    void log(uint8_t priority, const char* message); // Para mensajes de char*
    void log(uint8_t priority, const __FlashStringHelper* message); // Para mensajes de memoria flash
    void logf(uint8_t priority, const char* format, ...);
private:
    WiFiUDP udpClient;
    Syslog syslog;
    bool initialized;
    unsigned long baudRate;
};

#endif
