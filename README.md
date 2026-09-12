# Maya

Aplicación web de seguimiento de metas, agenda, diario y nutrición. Usa Next.js 16 App Router como BFF para Maya API; las credenciales y la obtención de datos privados permanecen en el servidor.

## Requisitos

- Bun 1.4.1 para instalar dependencias y ejecutar herramientas.
- Node.js 20.19 o superior para el runtime de producción de Next.js. Cache Components requiere el runtime de Node.js.
- Una instancia accesible de Maya API.

## Configuración

Crea `.env` a partir de `.env.example` y configura:

- `API_URL`: URL base de Maya API. En producción debe usar HTTPS, salvo loopback.
- `SESSION_SECRET`: secreto aleatorio por entorno de al menos 32 caracteres. Los valores de ejemplo son rechazados en producción.

La sesión se guarda en una cookie cifrada, `HttpOnly`, `SameSite=Lax` y `Secure` en producción. Cambiar `SESSION_SECRET` invalida las sesiones existentes.

## Comandos

```bash
bun install --frozen-lockfile
bun run dev
bun run lint
bun run typecheck
bun run test
bun run test:unit
bun run test:integration
bun run test:coverage
bunx playwright install --with-deps chromium
bun run test:e2e
bun run build
```

`bun run check` ejecuta lint, generación y comprobación de tipos, y todos los tests.

## Arquitectura

- `src/app`: rutas, layouts y límites de carga/error.
- `src/features`: componentes, esquemas, operaciones de servidor y Server Actions por dominio.
- `src/lib`: infraestructura compartida pequeña, como cliente HTTP, validación y paginación.
- `tests/unit`: lógica de dominio, esquemas y utilidades puras.
- `tests/integration`: componentes, contratos HTTP y límites de servidor con dependencias externas simuladas.
- `tests/e2e`: rutas públicas y protegidas en un navegador contra el build de producción.

Dentro de `unit` e `integration`, las carpetas reflejan `src` para que cada prueba sea fácil de ubicar.

Server Components son el valor predeterminado. Los módulos con `"use client"` se limitan a formularios, navegación interactiva y APIs del navegador. Las lecturas privadas usan Cache Components y etiquetas invalidadas por sus mutaciones.

Las colecciones grandes usan paginación por cursor en la URL y nunca se serializan completas al cliente. Los conteos y filtros locales se identifican como pertenecientes a la página actual.

La renovación de sesión ocurre exclusivamente en Proxy para que la nueva cookie pueda persistirse. Cada renovación envía `base64url(SHA-256(refreshToken))` como `Idempotency-Key`; Maya API aplica la ventana idempotente transaccional descrita en `maya-api.md` para garantizar concurrencia entre múltiples instancias.

React Compiler está habilitado mediante la opción estable `reactCompiler: true` y `babel-plugin-react-compiler`. No se requiere memoización manual por defecto.
