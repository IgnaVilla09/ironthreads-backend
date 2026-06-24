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
