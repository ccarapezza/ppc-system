#include "Log.h"
#include <stdarg.h>

Log::Log(const char* host, uint16_t port, const char* appName, const char* hostname)
    : syslog(udpClient, host, port, hostname, appName, LOG_KERN) {
    // Constructor para inicializar la conexión syslog
}

void Log::log(uint8_t priority, const char* message) {
    syslog.log(priority, message);
}

// Sobrecarga para manejar cadenas de texto en memoria flash
void Log::log(uint8_t priority, const __FlashStringHelper* message) {
    char buffer[100]; // Ajusta el tamaño según sea necesario
    snprintf_P(buffer, sizeof(buffer), PSTR("%S"), message);
    syslog.log(priority, buffer); // Usando la prioridad
}

void Log::logf(uint8_t priority, const char* format, ...) {
    char buffer[100]; // Asegúrate de que el buffer sea lo suficientemente grande
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    syslog.log(priority, buffer);
}
