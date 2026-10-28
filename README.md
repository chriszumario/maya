# Maya

Aplicación web de seguimiento de metas, agenda, diario y nutrición. Usa Next.js 16.4.2 y React 19.3.1 con App Router como BFF para Maya API; las credenciales y la obtención de datos privados permanecen en el servidor.

## Requisitos

- Bun 1.4.1 para instalar dependencias y ejecutar herramientas.
- Node.js 22.12+, 24.x o 26+ (recomendado: Node 24 LTS) para Next.js y las herramientas de pruebas. El rango de `engines` incluye los requisitos de Vitest 5; Cache Components requiere el runtime de Node.js.
- Una instancia accesible de Maya API.

## Configuración

Crea `.env` a partir de `.env.example` y configura:
- `API_URL`: origen de Maya API, sin `/api`, `/v1` ni otros prefijos de ruta (por defecto `http://localhost:4000`). En producción debe usar HTTPS, salvo loopback.
- `SESSION_SECRET`: secreto aleatorio por entorno de al menos 32 caracteres. Los valores de ejemplo son rechazados en producción.

La sesión se guarda en una cookie cifrada, `HttpOnly`, `SameSite=Lax` y `Secure` en producción. Cambiar `SESSION_SECRET` invalida las sesiones existentes.

El servidor exige IV de 96 bits, etiqueta AES-GCM de 128 bits y caducidad autenticada de 30 días desde la emisión de la cookie. El formato anterior sin caducidad ya no se acepta: tras desplegar esta actualización, los usuarios deberán volver a iniciar sesión. La expiración y revocación de los tokens siguen siendo responsabilidad de Maya API.

Las operaciones administrativas comprueban la sesión antes de llamar a la API; esta última debe verificar los permisos actuales y la propiedad de cada recurso. El cliente HTTP no sigue redirecciones ni almacena respuestas privadas en la caché de fetch. La pantalla de sesión finalizada sólo borra la cookie tras un POST mediante Server Action, nunca durante una navegación GET.

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

`bun run start` exige Node.js en el `PATH`, evitando ejecutar accidentalmente el servidor de producción con Bun. Las pruebas E2E arrancan el build con Node y una API de fixtures aislada en `127.0.0.1:4012`, con credenciales exclusivas de prueba. Cubren escritorio, móvil y tablet; no usan ni modifican la API configurada en `.env`.

## Arquitectura

- `src/app`: rutas, layouts y límites de carga/error.
- `src/features`: componentes, esquemas, operaciones de servidor y Server Actions por dominio.
- `src/lib`: infraestructura compartida pequeña, como cliente HTTP, validación y paginación.
- `tests/unit`: lógica de dominio, esquemas y utilidades puras.
- `tests/integration`: componentes, contratos HTTP y límites de servidor con dependencias externas simuladas.
- `tests/e2e`: rutas públicas y protegidas en un navegador contra el build de producción.

Dentro de `unit` e `integration`, las carpetas reflejan `src` para que cada prueba sea fácil de ubicar.

Server Components son el valor predeterminado. Los módulos con `"use client"` se limitan a formularios, navegación interactiva y APIs del navegador. Las lecturas privadas usan `use cache: private`: en producción deduplican dentro de una petición y el router conserva el resultado renderizado en memoria del navegador, sin caché de servidor entre peticiones. En desarrollo Next mantiene una caché en memoria por cookies y cabeceras. Las etiquetas son invalidadas por las mutaciones; la lectura del usuario usa un stale de 30 segundos. El menú precarga destinos al recibir foco o hover.

Las colecciones grandes usan paginación por cursor en la URL y nunca se serializan completas al cliente. Los conteos y filtros locales se identifican como pertenecientes a la página actual.

El contrato de integración está documentado en [`maya-api.md`](maya-api.md). Proxy valida `/auth/me` antes de continuar, incluso con un JWT no caducado, y renueva una sola vez si recibe `401 UNAUTHORIZED` o `INVALID_TOKEN`. La renovación ocurre exclusivamente allí para persistir ambos tokens y el perfil en la cookie. Cada renovación envía `base64url(SHA-256(refreshToken))` como `Idempotency-Key`; Maya API conserva el replay durante 10 segundos. Los fallos temporales no borran la sesión. Al volver al primer plano se revalida la pantalla.

El perfil envía únicamente campos modificados; cambiar el correo exige la contraseña actual. La zona IANA es editable y determina las fechas de agenda y registros. Las ejecuciones rechazadas por cambio de día deben reconciliarse, no reproducirse como actividad del día nuevo. El diario permite varias entradas por fecha. Tareas y revisiones disponen de paginación sin depender de los límites del detalle de meta.

Las sugerencias de IA se previsualizan antes de aplicarse y guardar; una edición descarta la respuesta pendiente. Su timeout HTTP es de 20 segundos, con margen sobre los 15 del proveedor. Las calorías son el total de la cantidad enviada, nunca un valor a multiplicar de nuevo.

Las invalidaciones del cliente no eliminan la caché interna de Maya API: las tendencias pueden tardar hasta 60 segundos y las estadísticas administrativas hasta 30 segundos en reflejar cambios. No se usa polling para forzar esos agregados. Los errores conservan `requestId` y `retryAfter` (segundos) cuando están disponibles, sin mostrar mensajes internos de la API.

Si una renovación queda incierta tras el reintento acotado, la cookie se marca para impedir reproducciones posteriores del token consumido y se solicita iniciar sesión; no se afirma que el servidor la haya revocado. Si la rotación sí se confirma pero falla la consulta posterior del perfil, el par sucesor se conserva para no perder la sesión.

React Compiler está habilitado mediante la opción estable `reactCompiler: true` y `babel-plugin-react-compiler`. No se requiere memoización manual por defecto.

La auditoría actual, las decisiones de dependencias y las verificaciones están en [`AUDIT.md`](AUDIT.md). `REFACTOR.md` conserva el informe histórico de septiembre.
