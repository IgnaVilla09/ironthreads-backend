# Iron Backend

API de `Iron Stock` y del catalogo publico `iron-catalog`.

Versión actual: **2.1.0**. Ver [historial de versiones](CHANGELOG.md).

## Instrucción para OpenCode: revisión de versiones

Cuando analices este proyecto, revisá `CHANGELOG.md`, los commits posteriores al
último hito documentado y los cambios pendientes. Determiná si una corrección
importante, una mejora significativa o un cambio incompatible justifican aumentar
la versión; no des por hecho que el número de `package.json` ya refleja el código.

Si corresponde subirla, usá versionado semántico: **patch** para correcciones
compatibles, **minor** para funcionalidades o mejoras compatibles y **major** para
cambios incompatibles. Actualizá `package.json`, los campos `version` de la raíz
y de `packages[""]` en `package-lock.json`, el `CHANGELOG.md` con los commits
relacionados y la versión indicada en este README. Si el cambio forma parte de un
hito conjunto con el frontend, coordiná la versión en ambos repositorios. Si todavía
no corresponde subirla, explicá brevemente el motivo en el análisis.

## Stack

- Express
- Prisma
- PostgreSQL

## Variables de entorno

Crear `iron/backend/.env` con las variables necesarias para:

- `DATABASE_URL`
- `CORS_ORIGIN`
- `ABANDONED_API_URL`
- `APP_CREDENTIALS_SECRET`
- `SESSION_TTL_DAYS`
- `RESEND_API_KEY` (API key de Resend para envio de emails)
- `NOTIFICATION_EMAIL` (email destino para notificaciones de ordenes)
- `OPENAI_API_KEY` (Agent Iron)

Para desarrollo local con admin y catalogo:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Desarrollo

```bash
npm install
npm run dev
```

## Scripts utiles

```bash
npm run prisma:generate
npm run prisma:studio
npm run typecheck
```

## Catalogo publico

Expone endpoints bajo `/api/v1/catalog` para:

- listado de productos por punto de venta
- detalle de producto
- creacion de pedidos
- administracion y confirmacion de pedidos desde `Iron Stock`

## Base de datos

El esquema actual incluye:

- `products.image_url`
- `products.price`
- `catalog_orders`
- `catalog_order_items`

La migracion aplicada en este workspace es aditiva y esta guardada en:

`prisma/manual-migrations/20260623_add_catalog_orders.sql`

## Notificaciones por email

El sistema envia notificaciones automaticas por email cuando se crea una nueva orden en el catalogo publico.

### Servicio utilizado

- **Resend** ([resend.com](https://resend.com)) - Servicio de email transaccional
- Dominio verificado: `ironthreads.com.ar`

### Configuracion

1. Crear cuenta en Resend
2. Verificar el dominio en Resend
3. Obtener API key
4. Agregar variables de entorno en Render:
   ```
   RESEND_API_KEY=re_tu_api_key
   NOTIFICATION_EMAIL=irontrheadsstore@gmail.com
   ```

### Flujo

1. Cliente crea orden desde iron-catalog (`POST /api/v1/catalog/public/orders`)
2. Backend crea la orden en la base de datos
3. Backend envia email de notificacion en background (no bloquea la respuesta)
4. Admin recibe email con detalles: cliente, items, total, punto de venta, link al panel

### Archivos relacionados

- `src/shared/email.ts` - Servicio de email con Resend
- `src/config/env.ts` - Variables de entorno (RESEND_API_KEY, NOTIFICATION_EMAIL)
- `src/modules/catalog/catalog.service.ts` - Metodo `createCatalogOrderWithNotification`
- `src/modules/catalog/catalog.controller.ts` - Endpoint que invoca la notificacion

## Agent Iron (chat)

El chat autenticado ofrece busqueda de productos concretos y listado completo de
productos con stock por categoria (sin detallar variantes), consultas de puntos de venta
y depositos, alertas de stock bajo por variante y metricas de inventario/ventas.
El historial se guarda en PostgreSQL por usuario e ID
de conversacion del navegador; al limpiar una conversacion se eliminan sus mensajes.

Antes de usar esta version en una base existente, aplicar la migracion aditiva
`prisma/manual-migrations/20260930_add_chat_history.sql` **una sola vez** y generar
el cliente Prisma con `npm run prisma:generate`. Si la base registra migraciones
previas como pendientes pese a tener las tablas existentes, no ejecutar
`prisma migrate deploy` indiscriminadamente: aplicar solo este SQL con el
procedimiento habitual de migraciones manuales, por ejemplo:

```bash
npx prisma db execute --file prisma/manual-migrations/20260930_add_chat_history.sql --schema prisma/schema.prisma
npm run prisma:generate
```

No contiene datos historicos de
conversaciones anteriores, que se mantenian solo en memoria.

## Ventas pendientes y acceso offline

Antes de iniciar la versión nueva del backend contra una base existente, aplicar
**una sola vez por base** `prisma/manual-migrations/20260930_offline_sales.sql`.
Comprobar primero el destino de `DATABASE_URL`. Desde `backend/`:

```bash
npx prisma db execute --file prisma/manual-migrations/20260930_offline_sales.sql --schema prisma/schema.prisma
npm run prisma:generate
```

`Sale.clientRequestId` evita duplicar ventas cuando se reintenta sincronizar. La API
administrativa requiere sesión Bearer; el panel la transmite por el proxy
`/api/backend/*`. Las rutas del catálogo bajo `/api/v1/catalog/public/*` siguen
siendo públicas.

El endpoint autenticado `GET /api/v1/products/offline-snapshot` entrega en una
respuesta productos, variantes y existencias por ubicación sin URLs de imágenes;
el navegador guarda el respaldo. `POST /api/v1/ventas` admite un `clientRequestId`
UUID opcional: al recibir el mismo ID otra vez devuelve la venta existente. El
descuento de stock se comprueba y ejecuta dentro de la transacción para evitar
ventas por encima del stock disponible. Si una venta pendiente no puede confirmarse,
el frontend la conserva en el dispositivo para revisión.
