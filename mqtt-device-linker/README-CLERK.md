# Autenticación con Clerk en el Gestor de Dispositivos PPC

Este documento describe cómo configurar y utilizar la autenticación con Clerk en la aplicación de Gestor de Dispositivos PPC.

## Configuración de Clerk

### 1. Crear una cuenta en Clerk

1. Visita [clerk.dev](https://clerk.dev) y crea una cuenta
2. Crea una nueva aplicación en el dashboard de Clerk
3. Configura el dominio de tu aplicación y los métodos de autenticación deseados (email, Google, GitHub, etc.)

### 2. Obtener las claves de API

En el dashboard de Clerk:
1. Ve a "API Keys"
2. Copia tu `Publishable Key` y `Secret Key`

### 3. Actualizar la configuración en el servidor

Edita el archivo `server-clerk.mjs` para actualizar las siguientes variables:

```javascript
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || "TU_CLERK_PUBLISHABLE_KEY";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "TU_CLERK_SECRET_KEY";
const CLERK_JWKS_URL = "https://TU_DOMINIO.clerk.accounts.dev/.well-known/jwks.json";
```

Reemplaza:
- `TU_CLERK_PUBLISHABLE_KEY` con tu Publishable Key de Clerk
- `TU_CLERK_SECRET_KEY` con tu Secret Key de Clerk
- `TU_DOMINIO` con el dominio de tu aplicación en Clerk (por ejemplo, "capable-otter-123")

### 4. Actualizar el frontend

Edita el archivo `public/index.html` para actualizar la clave pública:

```javascript
const CLERK_PUBLISHABLE_KEY = "TU_CLERK_PUBLISHABLE_KEY";
```

## Ejecutar la aplicación con autenticación

Para ejecutar la aplicación con Clerk habilitado:

```bash
node server-clerk.mjs
```

O puedes configurar las variables de entorno para mayor seguridad:

```bash
CLERK_PUBLISHABLE_KEY=pk_test_... CLERK_SECRET_KEY=sk_test_... node server-clerk.mjs
```

## Características implementadas

1. **Autenticación de usuarios**: Los usuarios deben iniciar sesión antes de poder acceder a la aplicación
2. **WebSocket seguro**: Las conexiones WebSocket requieren un token JWT válido
3. **API REST securizada**: Todas las rutas API están protegidas con autenticación
4. **Interfaz de usuario adaptada**: Pantalla de inicio de sesión antes de mostrar la aplicación
5. **Vinculación de dispositivos a usuarios**: Los dispositivos solo pueden ser vinculados por usuarios autenticados

## Diagrama de flujo de autenticación

```
+---------------+    1. Inicia sesión    +---------------+
|  Usuario      +------------------------>  Clerk Auth    |
+---------------+                        +---------------+
       |                                       |
       | 2. Obtiene token JWT                  |
       v                                       |
+---------------+    3. Validación     +---------------+
|  Cliente Web  +<----------------------+ Clerk API     |
+---------------+                       +---------------+
       |
       | 4. Conecta WS con token
       v
+---------------+    5. Verifica token  +---------------+
|  WebSocket    +----------------------->  JWKS Endpoint |
|  Servidor     |                       +---------------+
+---------------+
       |
       | 6. Acceso al sistema
       v
+---------------+
|  Lista de     |
|  Dispositivos |
+---------------+
```

## Notas de seguridad

- Los tokens JWT de Clerk tienen un tiempo de expiración predeterminado
- La verificación del token se realiza en cada conexión WebSocket
- Las claves API nunca deben ser expuestas en el frontend
- Se recomienda configurar las variables de entorno para las claves en lugar de incluirlas directamente en el código

## Solución de problemas

### El WebSocket no se conecta

- Verifica que el token de autenticación sea válido
- Verifica que la URL de JWKS sea correcta
- Comprueba los registros del servidor para más detalles

### Error de validación de token

- Verifica que las claves API sean correctas
- Asegúrate de que el reloj del servidor esté sincronizado (los tokens JWT dependen de las marcas de tiempo)
