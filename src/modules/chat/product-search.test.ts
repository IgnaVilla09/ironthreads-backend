import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchesCatalogAttribute, matchesInventoryLocation, sameCatalogProduct, scoreCatalogProduct, scoreRequestedProduct, searchTermGroups, searchTerms } from './product-search';

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

test('color y talle se comparan con nombre o etiqueta exactos, ignorando tildes y mayúsculas', () => {
  assert.equal(matchesCatalogAttribute({ name: 'NEGRO', label: 'Negro' }, 'negro'), true);
  assert.equal(matchesCatalogAttribute({ name: 'AZUL_MARINO', label: 'Azul marino' }, 'AZÚL MARINO'), true);
  assert.equal(matchesCatalogAttribute({ name: 'XL', label: 'Extra grande' }, 'xl'), true);
  assert.equal(matchesCatalogAttribute({ name: 'NEGRO_LAVADO', label: 'Negro lavado' }, 'negro'), false);
  assert.equal(matchesCatalogAttribute({ name: 'L', label: 'L' }, 'XL'), false);
});

test('ubicación solicitada nunca incluye inventario global si no se encuentra', () => {
  const item = { pointOfSaleId: 'gym', depositoId: 'caja' };
  assert.equal(matchesInventoryLocation(item, false, { pointOfSaleIds: [], depositoIds: [] }), true);
  assert.equal(matchesInventoryLocation(item, true, { pointOfSaleIds: [], depositoIds: [] }), false);
  assert.equal(matchesInventoryLocation(item, true, { pointOfSaleIds: ['gym'], depositoIds: [] }), true);
  assert.equal(matchesInventoryLocation(item, true, { pointOfSaleIds: [], depositoIds: ['caja'] }), true);
  assert.equal(matchesInventoryLocation(item, true, { pointOfSaleIds: ['otra'], depositoIds: [] }), false);
});

test('una coincidencia exacta de gorras y el color azul del nombre pesan más en el ranking', () => {
  const base = { description: null, category: { name: 'REMERA', label: 'Remera' }, variants: [] };
  const terms = searchTerms(['remera', 'baseball']);
  const blanca = scoreRequestedProduct({ ...base, name: 'BASEBALL BLANCA' }, terms, [], ['remera', 'baseball'], 'azul');
  const azul = scoreRequestedProduct({ ...base, name: 'BASEBALL AZUL' }, terms, [], ['remera', 'baseball'], 'azul');
  assert.ok(azul > blanca);
  const gorras = scoreRequestedProduct({ ...base, name: 'GORRAS' }, searchTerms(['gorras']), [], ['gorras']);
  const gorro = scoreRequestedProduct({ ...base, name: 'GORRO ROOKIE' }, searchTerms(['gorras']), [], ['gorras']);
  assert.ok(gorras > gorro);
});

test('fichas de igual nombre o sin espacios comparten producto; otras categorías no', () => {
  const clasica = { name: 'IRON CLASICA', category: 'Remera' };
  assert.equal(sameCatalogProduct(clasica, { name: 'IRON CLASICA', category: 'Remera' }), true);
  assert.equal(sameCatalogProduct(clasica, { name: 'IRONCLASICA', category: 'Remera' }), true);
  assert.equal(sameCatalogProduct(clasica, { name: 'IRON CLASICA NIÑO', category: 'Remera' }), false);
  assert.equal(sameCatalogProduct(clasica, { name: 'IRON CLASICA', category: 'NIÑOS' }), false);
});

test('el color del título no supera un modelo explícito como clásica', () => {
  const category = { name: 'REMERA', label: 'Remera' };
  const terms = searchTerms(['remera', 'clasica']);
  const classical = scoreRequestedProduct({ name: 'IRON CLASICA', description: null, category, variants: [] }, terms, [], ['remera', 'clasica'], 'negro');
  const unrelated = scoreRequestedProduct({ name: 'REMERA MUNDIAL NEGRO', description: null, category, variants: [] }, terms, [], ['remera', 'clasica'], 'negro');
  assert.ok(classical > unrelated);
});

test('remera baseball exige ambos términos, manteniendo sinónimos dentro del mismo término', () => {
  assert.deepEqual(searchTermGroups(['remera', 'baseball']), [['remer'], ['baseball']]);
  assert.deepEqual(searchTermGroups(['bolsos']), [['bols', 'mochil']]);
});
