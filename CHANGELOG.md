# Historial de versiones — Iron Stock (backend)

La versión actual es **2.1.0**. Los hitos anteriores se reconstruyeron a partir del
historial de commits del backend y se alinearon con los del frontend. Hasta ahora
`package.json` permanecía en `1.0.0` y **no se crearon etiquetas ni releases** para
estas versiones: las fechas y los hashes indican cuándo se incorporaron los cambios,
no cuándo se publicó formalmente cada versión.

## 2.1.0 — 2026-10-01 · API para operación offline

- Respaldo autenticado de productos, variantes y existencias por ubicación.
- Identificador de solicitud para reintentos de ventas sin duplicados y descuento
  de stock verificado dentro de una transacción.
- Autenticación de rutas administrativas y migración manual aditiva para el ID de
  venta (`prisma/manual-migrations/20260930_offline_sales.sql`).

Commit: `96f8d27`.

## 2.0.0 — 2026-09-28 a 2026-09-30 · Agent Iron

- Integración con OpenAI para consultar productos, existencias, ubicaciones,
  alertas de stock bajo y métricas disponibles.
- Búsqueda de productos y respuestas verificadas con funciones específicas;
  conversaciones autenticadas y persistidas por usuario en PostgreSQL.
- Migración manual del historial del chat y pruebas de búsqueda y respuestas.

Commits: `43bf5c4` → `d8064bd`.

## 1.3.0 — 2026-09-10 a 2026-09-20 · Correcciones y avisos

- Correcciones a la eliminación de variantes y sus relaciones.
- Notificación por correo con Resend al crear un pedido de catálogo, corrección
  del enlace del mensaje y documentación de configuración.

Commits: `a480820` → `0372d6a`.

## 1.2.0 — 2026-06-22 a 2026-08-21 · Acceso y catálogo

- Usuarios y sesiones del panel, autenticación para Tienda Nube y proxy al servicio
  externo de checkouts y registros.
- Catálogo público y gestión de pedidos: registro, estados y confirmación de ventas.
- Consulta de stock bajo, filtros por punto de venta y health check con verificación
  de PostgreSQL.

Commits: `d61108b` → `dca2d1a`.

## 1.1.0 — 2026-05-21 a 2026-05-30 · Ventas e inventario

- Registro e historial de ventas, puntos de venta, depósitos e inventario por
  variante y ubicación.
- Transferencias y exportaciones a Excel de ventas, stock y movimientos.

Commits: `7436476` → `7308065`.

## 1.0.0 — 2026-05-20 a 2026-05-21 · Base de la API

- Estructura inicial de Express y Prisma con productos, variantes, configuración,
  analytics, PostgreSQL y ajustes iniciales de dependencias y CORS.

Commits: `8a803d9` → `479e3bd`.
