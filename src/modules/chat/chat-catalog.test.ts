import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '../../config/database';
import { formatAvailableProducts, listAvailableProducts } from './chat-catalog';

const categories = [
  { id: 'c1', name: 'REMERA', label: 'Remera' },
  { id: 'c2', name: 'BUZO', label: 'Buzo' },
];
const products = [
  { id: 'p1', name: 'BASEBALL AZUL', category: { id: 'c1', label: 'Remera' } },
  { id: 'p2', name: 'BASEBALL NEGRA', category: { id: 'c1', label: 'Remera' } },
  { id: 'p3', name: 'BUZO OVERSIZE', category: { id: 'c2', label: 'Buzo' } },
];

test('remeras en stock consulta categoría completa sin take y exige inventario positivo', async () => {
  let where: unknown;
  let take: unknown;
  const db = {
    category: { findMany: async () => categories },
    product: { findMany: async (args: { where: unknown; take?: number }) => {
      where = args.where;
      take = args.take;
      return products.filter((product) => product.category.id === 'c1');
    } },
  } as unknown as Pick<typeof prisma, 'category' | 'product'>;
  const result = await listAvailableProducts('remeras', db);
  assert.equal(take, undefined);
  assert.deepEqual(where, {
    categoryId: { in: ['c1'] },
    variants: { some: { inventory: { some: { stock: { gt: 0 } } } } },
  });
  assert.equal(result.total, 2);
  const text = formatAvailableProducts(result);
  assert.match(text, /\*\*\[BASEBALL AZUL\]\(\/productos\/p1\)\*\*/);
  assert.match(text, /\*\*\[BASEBALL NEGRA\]\(\/productos\/p2\)\*\*/);
  assert.doesNotMatch(text, /BUZO OVERSIZE|talle|color/);
});

test('sin categoría lista todos los grupos; tipo gorras busca en nombres si no existe como categoría', async () => {
  const db = {
    category: { findMany: async () => categories },
    product: { findMany: async () => products },
  } as unknown as Pick<typeof prisma, 'category' | 'product'>;
  const all = await listAvailableProducts(undefined, db);
  assert.equal(all.total, 3);
  assert.equal(all.categories.length, 2);

  let fallbackWhere: unknown;
  const namesDb = {
    category: { findMany: async () => categories },
    product: { findMany: async (args: { where: unknown }) => { fallbackWhere = args.where; return []; } },
  } as unknown as Pick<typeof prisma, 'category' | 'product'>;
  const missing = await listAvailableProducts('gorras', namesDb);
  assert.equal(missing.total, 0);
  assert.deepEqual((fallbackWhere as { OR: unknown[] }).OR, [{ name: { contains: 'gorr', mode: 'insensitive' } }, { name: { contains: 'sombrer', mode: 'insensitive' } }]);
});
