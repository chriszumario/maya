# Refactorización y verificación — 19 de septiembre de 2026

## Auditoría inicial

- Next.js 16.3.4, React/React DOM 19.2.8, App Router y TypeScript estricto ya estaban configurados. Se consultaron las guías instaladas de seguridad, caché privada y Link de esta versión.
- La estructura `app` / `features` / `lib` es proporcional al proyecto y se conserva. Dashboard e insights ya utilizan Server Components; los formularios y temporizadores necesitan interacción cliente.
- Tailwind 4, Base UI, Formisch y Valibot tienen usos reales. No se añadieron dependencias. `next/font` ya gestiona las fuentes; no se encontraron imágenes HTML que requirieran migración a `next/image`.
- Línea base: 108 pruebas aprobadas; lint y typecheck correctos; auditoría sin vulnerabilidades conocidas en 483 paquetes.

## Seguridad

1. **Validación criptográfica:** el descifrado permitía etiquetas GCM truncadas. Ahora exige IV de 12 bytes, etiqueta de 16 bytes, tres segmentos y un tamaño máximo de cookie antes de descifrar.
2. **Caducidad verificada por el servidor:** el contenido cifrado incluye una fecha de vencimiento autenticada. No se depende únicamente de `Max-Age` del navegador. Las cookies antiguas sin este dato se rechazan.
3. **Mutación por GET eliminada:** `/auth/session-expired` muestra una página; el borrado de sesión pasa por la Server Action de logout con POST y las protecciones de origen de Next.js.
4. **Autorización administrativa:** el acceso a operaciones administrativas comprueba el usuario en el servidor antes de llamar a Maya API. La API continúa siendo responsable de comprobar permisos actuales, revocación y propiedad de recursos.
5. **Cliente HTTP:** rechaza protocolos ajenos a HTTP(S), credenciales embebidas, query y fragmento en la URL base; no sigue redirecciones y fuerza `no-store`. Se corrigió la excepción HTTPS para loopback IPv6.
6. **Límites de servidor y cabeceras:** se añadieron marcadores `server-only` a los módulos sensibles y `object-src 'none'` a la CSP existente. Esto no equivale a una CSP estricta de scripts.

## UX/UI y rendimiento

- El menú móvil se cierra al seleccionar un destino, incluido el inicio.
- El enlace para saltar al contenido tiene un destino que puede recibir foco.
- La preparación del área privada muestra skeletons, en lugar de una pantalla vacía.
- Los modales tienen altura limitada al viewport dinámico y desplazamiento vertical; los controles de cierre y carga usan español.
- Las calorías por alimento son visibles también en móvil.
- Guardar el perfil muestra confirmación accesible y la retira al editar de nuevo.
- Tema y temporizador siguen funcionando en memoria si `localStorage` está bloqueado o lleno.
- Un fallo al completar automáticamente una tarea no provoca reintentos en bucle. Se conserva el error visible y el reintento manual con “Finalizar”.
- La navegación reutiliza el enlace existente de prefetch por intención para evitar precargar todos los destinos al mostrar el menú.
- Se separó audio/notificaciones del componente de agenda y se retiró la prop redundante `goalId` del detalle de meta.
- Se eliminó el CLI `shadcn` y su árbol exclusivo de dependencias. Las siete variantes CSS realmente utilizadas se mantienen localmente: la auditoría pasa de 483 a 225 paquetes. Esta cifra no es una medición del tamaño del bundle.
- Se mantiene la caché privada por usuario en el navegador y la invalidación existente; no se añade una segunda caché de respuestas HTTP privadas en el servidor.

## Archivos y motivos

| Archivo | Motivo |
| --- | --- |
| `package.json` | Retirar shadcn, declarar Node mínimo y arrancar producción explícitamente con Node. |
| `bun.lock` | Actualizar el árbol al eliminar la dependencia. |
| `next.config.ts` | Bloquear objetos embebidos con CSP. |
| `README.md` | Documentar versiones, seguridad, migración de sesión, runtime, caché y E2E aislados; corregir la referencia a un contrato API ausente. |
| `REFACTOR.md` | Registrar auditoría, cambios, archivos y alcance de la verificación. |
| `src/lib/api-client.server.ts` | Validar URL, bloquear redirects, proteger datos privados y fijar límite de servidor. |
| `src/lib/browser-storage.ts` | Centralizar lectura/escritura tolerante a fallos, reutilizada por tema y agenda. |
| `src/features/auth/server/session-codec.ts` | Validar cifrado y caducidad de cookies. |
| `src/features/auth/server/auth.ts` | Marcar operaciones de autenticación como exclusivas del servidor. |
| `src/features/auth/server/authenticated-api.server.ts` | Marcar el cliente autenticado como exclusivo del servidor. |
| `src/features/admin/server.ts` | Comprobar rol en todas las operaciones administrativas. |
| `src/app/auth/session-expired/route.ts` | Eliminado: borraba cookies mediante GET. |
| `src/app/auth/session-expired/page.tsx` | Recuperación de sesión mediante una acción explícita con POST. |
| `src/app/(workspace)/layout.tsx` | Estado de carga visible y accesible. |
| `src/app/(workspace)/goals/[goalId]/page.tsx` | Dejar de pasar una ID ya incluida en la meta. |
| `src/app/globals.css` | Cargar variantes locales en lugar del paquete shadcn. |
| `src/app/ui-variants.css` | Conservar sólo las variantes utilizadas por Base UI. |
| `src/components/layout/app-shell.tsx` | Cierre del menú móvil, prefetch por intención y foco del contenido. |
| `src/components/theme-provider.tsx` | Tolerar almacenamiento no disponible. |
| `src/components/ui/dialog.tsx` | Limitar altura, permitir scroll y traducir cierre. |
| `src/components/ui/sheet.tsx` | Traducir la etiqueta de cierre. |
| `src/components/ui/spinner.tsx` | Traducir el estado anunciado por lectores de pantalla. |
| `src/features/goals/components/goal-detail-view.tsx` | Eliminar prop duplicada y anunciar errores. |
| `src/features/nutrition/components/nutrition-view.tsx` | Mostrar calorías por alimento en móvil. |
| `src/features/settings/components/settings-view.tsx` | Confirmación accesible de guardado del perfil. |
| `src/features/today/components/today-view.tsx` | Evitar reintentos automáticos en bucle, tolerar fallos de almacenamiento y quitar efectos de los actualizadores de estado. |
| `src/features/today/timer-feedback.ts` | Separar integración con audio y notificaciones del JSX de agenda. |
| `playwright.config.ts` | Ejecutar escritorio/móvil/tablet contra Next de producción y una API aislada. |
| `tests/support/api-server.mjs` | Servidor local de fixtures para autenticación, colecciones vacías y fallos de servicio. |
| `tests/e2e/auth.spec.ts` | Validar viewport y recuperación de sesión por acción explícita. |
| `tests/e2e/routing.spec.ts` | Comprobar que GET no elimina cookies. |
| `tests/e2e/workspace.spec.ts` | Cubrir login, navegación autenticada, menú móvil, modales bajos, confirmación y error de API. |
| `tests/integration/features/auth/server/session-codec.test.ts` | Regresiones de etiquetas truncadas, manipulación y caducidad. |
| `tests/integration/features/admin/server.test.ts` | Verificar bloqueo de operaciones directas sin rol y autorización final de la API. |
| `tests/integration/features/today/today-view.test.tsx` | Verificar que un fallo automático no repite solicitudes y admite reintento manual. |
| `tests/integration/lib/api-client.server.test.ts` | Verificar políticas HTTP y rechazo de configuración insegura. |
| `tests/unit/lib/browser-storage.test.ts` | Cubrir almacenamiento bloqueado y cuota agotada. |

## Resultado final

| Comprobación | Resultado |
| --- | --- |
| `bun install --frozen-lockfile` | Correcto. |
| `bun audit` | Sin vulnerabilidades conocidas en 225 paquetes. |
| `bun run lint` | Correcto. |
| `bun run typecheck` | Correcto, incluida generación de tipos de rutas. |
| `bun run test` | 120 pruebas aprobadas en 38 archivos. |
| `bun run build` | Correcto con Next.js 16.3.4; 19 páginas generadas. |
| `bun run test:e2e` | Build y 33 pruebas aprobadas en Chromium de escritorio, móvil y tablet. |
| `git diff --check` | Sin errores de whitespace. |

Se utilizó Node.js 22.23.2, instalado temporalmente fuera del repositorio, para build y servidor E2E. El entorno sólo disponía de Bun; el arranque implícito con Bun produjo rechazos `AbortError` que no se reprodujeron con Node. `bun run start` ahora requiere Node explícitamente.

Los mensajes 503 de los E2E corresponden a la API de fixtures, que provoca errores intencionales para probar la recuperación. Las pruebas no validan el backend real ni todos sus flujos de escritura. No se ejecutó una auditoría Lighthouse ni se midieron Core Web Vitals de usuarios reales.

## Despliegue

- Instalar Node.js compatible en el entorno de ejecución y ponerlo en `PATH`.
- El cambio de formato de cookie requiere volver a iniciar sesión una vez.
- Verificar los flujos completos con la instancia real de Maya API antes de publicar; las pruebas aisladas no sustituyen sus controles de autorización y revocación.
