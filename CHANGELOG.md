# Historial de versiones — Iron Stock (backend)

## 2.5.0 — 2026-10-19 — Pagos QR con Mobbex

- Medio de pago opcional `MOBBEX` en ventas nuevas, con la venta en estado `PENDING` mientras se espera la confirmación.
- Generación y reintento de QR sin duplicar ventas ni descuentos de stock.
- Reserva de stock al crear la venta y devolución única ante rechazo, cancelación o expiración.
- Webhook firmado con HMAC SHA-256, validación de timestamp, ventana anti-replay de cinco minutos y comparación en tiempo constante.
- Comprobante no fiscal mediante Resend al aprobarse el pago, con idempotencia de eventos para no duplicar recibos ni movimientos de stock.

Cambios posteriores a `8785752`. Requiere aplicar la migración `prisma/migrations/20261018000000_add_mobbex_payments/migration.sql` antes de habilitar el medio de pago.

## 2.4.0 — 2026-10-12 — Ofertas, descuentos y catálogo público

- Campo `isOnSale` para marcar productos que deben mostrar una oferta en el catálogo.
- Modelo y endpoints autenticados para administrar códigos de descuento desde Configuración.
- Validación pública de descuentos para el checkout y revalidación al crear el pedido.
- Registro del código y del importe descontado en cada pedido de catálogo.
- Validación de vigencia, compra mínima, tipo de descuento y límite de usos; el uso se contabiliza al generar el pedido.
- CORS actualizado para permitir al catálogo local en `http://localhost:3002`.

Cambios posteriores a `14ec9b3`.

## 2.3.0 — 2026-10-10 — Emails y campañas

- Envío de correos y supresiones persistentes con registro de actividad.
- Gestión de campañas y sincronización de clientes de Tienda Nube.

Commits: `7e3c343` → `14ec9b3`.

## 2.2.0 — 2026-10-08 — Ventas y operación offline

- Edición e historial de ventas, control de inventario y protección contra duplicados.
- Soporte de operación offline y solicitudes de venta idempotentes.

Commits: `96f8d27` → `a9c6cde`.

## 2.0.0 — 2026-09-30 — Agent Iron

- Integración de consultas de stock e inventario asistidas por IA.

Commits: `43bf5c4` → `d8064bd`.
