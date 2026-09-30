import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatStockResponse } from './stock-response';

const product = {
  id: 'real-azul', name: 'BASEBALL AZUL', variants: [
    { color: 'Azul', size: 'S', locations: [{ pointOfSale: 'Departamento', deposito: 'Caja 6', stock: 1 }] },
    { color: 'Azul', size: 'M', locations: [{ pointOfSale: 'GYM', deposito: 'Perchero', stock: 2 }] },
  ],
};

test('color solicitado sin talle ni sucursal: anuncia stock y enumera talles disponibles', () => {
  const text = formatStockResponse({ requestedProductId: product.id, locationFound: true, products: [product] });
  assert.match(text, /^Sí, hay stock/);
  assert.match(text, /\*\*\[BASEBALL AZUL\]\(\/productos\/real-azul\)\*\*/);
  assert.match(text, /\*\*S\*\*: \*\*1 unidad\*\*/);
  assert.match(text, /\*\*M\*\*: \*\*2 unidades\*\*/);
  assert.doesNotMatch(text, /No hay stock|No encontré stock/);
});

test('sin stock exacto: solo ofrece opciones verificadas en orden comercial', () => {
  const text = formatStockResponse({
    requestedProductId: product.id, locationFound: true,
    products: [{ ...product, variants: [{ color: 'Azul', size: 'S', locations: [] }] }],
    alternatives: {
      sameProductOtherVariants: [{ productId: product.id, productName: product.name, color: 'Blanco', size: 'S', pointOfSale: 'GYM', deposito: null, stock: 2 }],
      sameVariantOtherLocations: [{ productId: product.id, productName: product.name, color: 'Azul', size: 'S', pointOfSale: 'Departamento', deposito: 'Caja 6', stock: 1 }],
      similarProducts: [],
    },
  });
  assert.ok(text.indexOf('Otra variante') < text.indexOf('La variante en otra ubicación'));
  assert.match(text, /\*\*2 unidades\*\*/);
  assert.match(text, /\*\*1 unidad\*\*/);
});

test('incluye todas las fichas homónimas con stock y diferencia sus variantes por SKU', () => {
  const text = formatStockResponse({
    requestedProductId: 'rosa', locationFound: true,
    products: [
      { id: 'rosa', name: 'IRON CLASICA', category: 'Remera', variants: [
        { sku: 'IRON-ROSA-M', color: 'Rosa', size: 'M', locations: [{ pointOfSale: 'GYM', deposito: null, stock: 1 }] },
      ] },
      { id: 'negra', name: 'IRON CLASICA', category: 'Remera', variants: [
        { sku: 'IRON-NEGRA-S', color: 'Negro', size: 'S', locations: [{ pointOfSale: 'GYM', deposito: null, stock: 2 }] },
      ] },
      { id: 'azul', name: 'IRONCLASICA', category: 'Remera', variants: [
        { sku: 'IRON-AZUL-L', color: 'Azul', size: 'L', locations: [{ pointOfSale: 'Departamento', deposito: null, stock: 3 }] },
      ] },
    ],
  });
  assert.match(text, /\*\*3 productos coincidentes\*\*/);
  for (const id of ['rosa', 'negra', 'azul']) assert.match(text, new RegExp(`/productos/${id}`));
  for (const sku of ['IRON-ROSA-M', 'IRON-NEGRA-S', 'IRON-AZUL-L']) assert.match(text, new RegExp(sku));
});

test('consulta de baseball incluye todos los modelos coincidentes y señala los que no tienen stock', () => {
  const makeProduct = (id: string, name: string, stock: number) => ({
    id, name, category: 'Remera', variants: [{ color: 'Azul', size: 'L', sku: `${id}-L`,
      locations: [{ pointOfSale: 'GYM', deposito: null, stock }] }],
  });
  const result = formatStockResponse({
    requestedProductId: 'azul', locationFound: true,
    products: [makeProduct('azul', 'BASEBALL AZUL', 2), makeProduct('negra', 'BASEBALL NEGRA', 1),
      makeProduct('blanca', 'BASEBALL BLANCA', 3), makeProduct('boxy', 'BOXY BASEBALL BLANCA', 0)],
  });
  for (const id of ['azul', 'negra', 'blanca', 'boxy']) assert.match(result, new RegExp(`/productos/${id}`));
  assert.match(result, /\*\*3 productos coincidentes\*\*/);
  assert.match(result, /Otras coincidencias sin stock/);
});

test('una búsqueda amplia conserva todas las fichas aunque supere ocho resultados', () => {
  const products = Array.from({ length: 11 }, (_, index) => ({
    id: `p${index}`, name: `REMERA MODELO ${index}`, variants: [
      { color: 'Negro', size: 'M', locations: [{ pointOfSale: 'GYM', deposito: null, stock: 1 }] },
    ],
  }));
  const response = formatStockResponse({ requestedProductId: 'p0', locationFound: true, products });
  assert.match(response, /\*\*11 productos coincidentes\*\*/);
  for (const product of products) assert.match(response, new RegExp(`/productos/${product.id}\\)`));
});
