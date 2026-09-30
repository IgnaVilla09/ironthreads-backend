import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ensureProductLinks, findCommercialAlternatives, hasExactStock, isVagueStockRequest, StockPoolProduct } from './commercial-fallback';

const product: StockPoolProduct = {
  id: 'cm456def', name: 'Buzo Oversize', categoryId: 'buzos',
  variants: [
    {
      color: { name: 'NEGRO', label: 'Negro' }, size: { name: 'M', label: 'M' },
      inventory: [
        { stock: 0, pointOfSale: { id: 'centro', label: 'Centro' }, deposito: null },
        { stock: 5, pointOfSale: { id: 'norte', label: 'Norte' }, deposito: { id: 'central', label: 'Depósito Central' } },
      ],
    },
    {
      color: { name: 'GRIS', label: 'Gris' }, size: { name: 'M', label: 'M' },
      inventory: [{ stock: 2, pointOfSale: { id: 'centro', label: 'Centro' }, deposito: null }],
    },
  ],
};

const location = { pointOfSaleIds: ['centro'], depositoIds: [] as string[] };

test('consulta exacta en Centro: el stock 0 no se interpreta como disponible', () => {
  assert.equal(hasExactStock([{ variants: [{ totalStock: 0 }] }]), false);
  assert.equal(hasExactStock([{ variants: [{ totalStock: 3 }] }]), true);
});

test('sin stock exacto: ofrece primero otra variante local y luego la variante exacta en otra ubicación', () => {
  const options = findCommercialAlternatives(product, [], { color: 'Negro', size: 'M', pointOfSale: 'Centro' }, location);
  assert.deepEqual(options.sameProductOtherVariants, [{
    productId: 'cm456def', productName: 'Buzo Oversize', color: 'Gris', size: 'M',
    pointOfSale: 'Centro', deposito: null, stock: 2,
  }]);
  assert.deepEqual(options.sameVariantOtherLocations, [{
    productId: 'cm456def', productName: 'Buzo Oversize', color: 'Negro', size: 'M',
    pointOfSale: 'Norte', deposito: 'Depósito Central', stock: 5,
  }]);
  assert.deepEqual(options.similarProducts, []);
});

test('sin stock del solicitado: sugiere solo otro producto de la misma categoría con stock verificado', () => {
  const exhausted: StockPoolProduct = { ...product, variants: product.variants.map((variant) => ({ ...variant, inventory: [] })) };
  const similar: StockPoolProduct = {
    ...product, id: 'cm789abc', name: 'Buzo Clásico',
    variants: [{ ...product.variants[0], inventory: [{
      stock: 4, pointOfSale: { id: 'centro', label: 'Centro' }, deposito: null,
    }] }],
  };
  const otherCategory = { ...similar, id: 'no-buzo', categoryId: 'remeras' };
  const options = findCommercialAlternatives(exhausted, [otherCategory, similar],
    { color: 'Negro', size: 'M', pointOfSale: 'Centro' }, location);
  assert.deepEqual(options.sameProductOtherVariants, []);
  assert.deepEqual(options.sameVariantOtherLocations, []);
  assert.equal(options.similarProducts.length, 1);
  assert.equal(options.similarProducts[0].productId, 'cm789abc');
  assert.equal(options.similarProducts[0].stock, 4);
});

test('una familia de productos se consulta; solo preguntas sin producto piden aclaración', () => {
  assert.equal(isVagueStockRequest({ keywords: ['remeras'] }), false);
  assert.equal(isVagueStockRequest({ keywords: ['gorras'] }), false);
  assert.equal(isVagueStockRequest({ keywords: ['talles'] }), true);
  assert.equal(isVagueStockRequest({ keywords: ['remera', 'baseball'] }), false);
  assert.equal(isVagueStockRequest({ keywords: ['remeras'], size: 'L' }), false);
});

test('la respuesta incluye enlaces reales y elimina enlaces externos o IDs inexistentes', () => {
  const text = ensureProductLinks(
    'Hay **3 unidades** de la **Remera Baseball** en **Centro**. [Foto](https://ejemplo.com/img) [otra](/productos/falso)',
    [{ id: 'cm123abc', name: 'Remera Baseball' }]
  );
  assert.match(text, /\*\*3 unidades\*\*/);
  assert.match(text, /\*\*\[Remera Baseball\]\(\/productos\/cm123abc\)\*\*/);
  assert.doesNotMatch(text, /https?:\/\/|\/productos\/falso/);
});
