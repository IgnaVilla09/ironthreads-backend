-- ════════════════════════════════════════════════════════════════
-- RECUPERACIÓN COMPLETA
-- ════════════════════════════════════════════════════════════════

-- 1. Ver estado actual
SELECT 'sales' as tabla, count(*) FROM sales
UNION ALL
SELECT 'sale_items', count(*) FROM sale_items
UNION ALL
SELECT 'inventory_items', count(*) FROM inventory_items
UNION ALL
SELECT 'product_variants', count(*) FROM product_variants;

-- 2. Ver si ya existe la columna pointOfSaleId en sales
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sales' AND column_name IN ('pointOfSaleId', 'depositoId');

-- 3. Ver si ya existe la columna inventoryItemId en sale_items
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sale_items' AND column_name IN ('variantId', 'inventoryItemId');

-- 4. Ver la estructura actual de ambas tablas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sale_items'
ORDER BY ordinal_position;
