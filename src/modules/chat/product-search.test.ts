import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scoreCatalogProduct, searchTerms } from './product-search';

test('gorritos y gorro comparten raíz de búsqueda', () => {
  assert.deepEqual(searchTerms(['Gorro o gorritos']), ['gorr', 'sombrer']);
  const terms = searchTerms(['gorritos']);
  assert.ok(scoreCatalogProduct({
    name: 'GORRO DE LANA', description: null,
    category: { name: 'ACCESORIOS', label: 'Accesorios' }, variants: [],
  }, terms, []) > 0);
});

test('bolsos recupera el nombre BOLSO/MOCHILA y también mochilas', () => {
  const product = {
    name: 'BOLSO/MOCHILA', description: 'Ideal para llevar tus cosas',
    category: { name: 'ACCESORIOS', label: 'Accesorios' }, variants: [],
  };
  assert.ok(scoreCatalogProduct(product, searchTerms(['bolsos']), []) > 0);
  assert.ok(scoreCatalogProduct(product, searchTerms(['mochilas']), []) > 0);
});

test('la descripción y el SKU son recuperables; el título tiene prioridad', () => {
  const terms = searchTerms(['camufladas']);
  const base = { category: { name: 'ACCESORIOS', label: 'Accesorios' } };
  const description = scoreCatalogProduct({
    ...base, name: 'Bolso', description: 'Estampa camuflada', variants: [],
  }, terms, []);
  const sku = scoreCatalogProduct({
    ...base, name: 'Bolso', description: null, variants: [{ sku: 'CAMUFLADO-L' }],
  }, terms, []);
  const title = scoreCatalogProduct({
    ...base, name: 'Bolso camuflado', description: null, variants: [],
  }, terms, []);
  assert.ok(description > 0);
  assert.ok(sku > description);
  assert.ok(title > sku);
});
