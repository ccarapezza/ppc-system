# Gestor de Dispositivos PPC

Este proyecto proporciona una solución completa para gestionar dispositivos IoT conectados a través de MQTT, con una interfaz web para visualizar y administrar estos dispositivos.

## Características

- **Broker MQTT integrado**: Gestiona la comunicación entre dispositivos y el servidor
- **Interfaz web**: Panel de control para visualizar todos los dispositivos conectados
- **Gestión de estado**: Seguimiento en tiempo real del estado de conexión de dispositivos
- **Vinculación de dispositivos**: Asociación de dispositivos a usuarios específicos
- **Autenticación**: Integración con Clerk para autenticación segura (opcional)

## Instalación

1. Clona este repositorio:
```bash
git clone <url-del-repositorio>
cd mqtt-device-linker
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor:
```bash
npm start
```

## Versión con autenticación Clerk

Este proyecto ahora incluye una versión con autenticación de usuarios utilizando [Clerk](https://clerk.dev). Para más información sobre cómo configurar y usar esta funcionalidad, consulta [README-CLERK.md](./README-CLERK.md).

Para ejecutar la versión con autenticación:
```bash
npm run start:clerk
```

## Estructura del proyecto

- `server.mjs`: Servidor principal sin autenticación
- `server-clerk.mjs`: Versión del servidor con autenticación Clerk
- `public/`: Archivos estáticos y frontend
- `devices.db`: Base de datos SQLite para almacenar información de dispositivos

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para cualquier mejora o corrección.

## Licencia

MIT
