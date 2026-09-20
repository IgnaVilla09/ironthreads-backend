# Iron Backend

API de `Iron Stock` y del catalogo publico `iron-catalog`.

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
