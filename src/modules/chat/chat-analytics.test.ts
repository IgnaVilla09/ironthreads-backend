import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '../../config/database';
import { analyticsService } from '../analytics/analytics.service';
import { consultLowStock, consultSalesMetrics } from './chat-analytics';

test('stock bajo suma filas por variante, incluye stock cero y aplica el punto de venta indicado', async () => {
  let selectedPointOfSale: string | undefined;
  const db = {
    pointOfSale: { findFirst: async () => ({ id: 'pos-1', label: 'Centro' }) },
    productVariant: { findMany: async (args: { select?: { inventory?: { where?: { pointOfSaleId?: string } } } }) => {
    selectedPointOfSale = (args as { select?: { inventory?: { where?: { pointOfSaleId?: string } } } })?.select?.inventory?.where?.pointOfSaleId;
    return ([
    { id: 'a', sku: 'A', product: { id: 'p1', name: 'Remera' }, color: { label: 'Negro' }, size: { label: 'M' }, inventory: [{ stock: 2 }, { stock: 3 }] },
    { id: 'b', sku: 'B', product: { id: 'p1', name: 'Remera' }, color: { label: 'Blanco' }, size: { label: 'L' }, inventory: [] },
    { id: 'c', sku: 'C', product: { id: 'p2', name: 'Buzo' }, color: { label: 'Gris' }, size: { label: 'XL' }, inventory: [{ stock: 6 }] },
    ]);
    } },
  } as unknown as Pick<typeof prisma, 'pointOfSale' | 'productVariant'>;

  const result = await consultLowStock(5, 'Centro', db);
  assert.equal(result.total, 2);
  assert.equal(result.pointOfSale?.name, 'Centro');
  assert.deepEqual(result.variants.map((item) => [item.sku, item.stock]), [['B', 0], ['A', 5]]);
  assert.equal(selectedPointOfSale, 'pos-1');
});

test('un punto de venta inexistente no consulta inventario global', async () => {
  const db = {
    pointOfSale: { findFirst: async () => null },
    productVariant: { findMany: async () => { throw new Error('no debe consultar variantes'); } },
  } as unknown as Pick<typeof prisma, 'pointOfSale' | 'productVariant'>;
  const result = await consultLowStock(5, 'Inexistente', db);
  assert.ok('error' in result);
});

test('umbral cero conserva únicamente variantes sin existencias', async () => {
  const db = {
    productVariant: { findMany: async () => [
      { id: 'a', sku: 'A', product: { id: 'p1', name: 'Remera' }, color: { label: 'Negro' }, size: { label: 'M' }, inventory: [] },
      { id: 'b', sku: 'B', product: { id: 'p2', name: 'Buzo' }, color: { label: 'Gris' }, size: { label: 'L' }, inventory: [{ stock: 1 }] },
    ] },
  } as unknown as Pick<typeof prisma, 'pointOfSale' | 'productVariant'>;
  const result = await consultLowStock(0, undefined, db);
  assert.deepEqual(result.variants.map((item) => item.sku), ['A']);
});

test('las métricas distinguen ventas por talle de inventario por talle', async (t) => {
  t.mock.method(analyticsService, 'getBySize', async () => [{ sizeId: 'm', sizeName: 'M', totalStock: 2, productCount: 1 }]);
  t.mock.method(analyticsService, 'getBestSellingSizes', async () => [{ sizeName: 'L', totalSold: 10, saleCount: 3 }]);
  const stock = await consultSalesMetrics('by_size');
  const sales = await consultSalesMetrics('best_selling_sizes');
  assert.match(stock.meaning, /no ventas/);
  assert.match(sales.meaning, /talles más vendidos/);
  assert.deepEqual(sales.data, [{ sizeName: 'L', totalSold: 10, saleCount: 3 }]);
});
