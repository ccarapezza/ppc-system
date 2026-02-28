#include "Log.h"
#include <stdarg.h>

// Constructor actualizado para recibir los baudios
Log::Log(const char* host, uint16_t port, const char* appName, const char* hostname, unsigned long baudRate)
    : syslog(udpClient, host, port, hostname, appName, LOG_KERN), initialized(false), baudRate(baudRate) {
    // Constructor para inicializar la conexión syslog
}

// Método init actualizado para inicializar Serial
void Log::init() {
    udpClient.begin(0); // Comienza UDP en un puerto cualquiera
    Serial.begin(baudRate); // Inicializa Serial con los baudios proporcionados
    initialized = true;
}

void Log::log(uint8_t priority, const char* message) {
    if (!initialized) return; // No hacer nada si no está inicializado
    syslog.log(priority, message);
    Serial.println(message); // Envía el mensaje por Serial
}

// Sobrecarga para manejar cadenas de texto en memoria flash
void Log::log(uint8_t priority, const __FlashStringHelper* message) {
    if (!initialized) return; // No hacer nada si no está inicializado
    char buffer[100]; // Ajusta el tamaño según sea necesario
    snprintf_P(buffer, sizeof(buffer), PSTR("%S"), message);
    syslog.log(priority, buffer); // Usando la prioridad
    Serial.println(buffer); // Envía el mensaje por Serial
}

void Log::logf(uint8_t priority, const char* format, ...) {
    if (!initialized) return; // No hacer nada si no está inicializado
    char buffer[100]; // Asegúrate de que el buffer sea lo suficientemente grande
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    syslog.log(priority, buffer);
    Serial.println(buffer); // Envía el mensaje por Serial
}
