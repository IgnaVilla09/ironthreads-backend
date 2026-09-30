import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '../../config/database';
import { consultLocations, formatLocationResponse } from './chat-locations';

const db = {
  pointOfSale: { findMany: async () => [
    { id: '1', name: 'DEPARTAMENTO', label: 'Departamento', depositos: [
      { id: 'a', name: 'CAJA1', label: 'Caja 1' }, { id: 'b', name: 'CAJA2', label: 'Caja 2' },
    ] },
    { id: '2', name: 'GYM', label: 'GYM', depositos: [] },
  ] },
} as unknown as Pick<typeof prisma, 'pointOfSale'>;

test('cuenta sucursales y depósitos a partir de la base, sin inferirlos del mensaje', async () => {
  const all = await consultLocations(undefined, db);
  assert.equal(all.pointOfSaleCount, 2);
  assert.match(formatLocationResponse(all, false), /\*\*2 puntos de venta\*\*/);

  const department = await consultLocations('departamento', db);
  assert.equal(department.pointOfSaleCount, 1);
  assert.match(formatLocationResponse(department, true), /\*\*2 depósitos\*\*/);
  assert.match(formatLocationResponse(department, true), /Caja 1/);
});

test('ubicación inexistente pide precisión en vez de contar otra sucursal', async () => {
  const result = await consultLocations('Centro', db);
  assert.ok('error' in result);
  assert.match(formatLocationResponse(result, true), /No encontré/);
});
