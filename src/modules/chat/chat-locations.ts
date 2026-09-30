import { prisma } from '../../config/database';
import { normalizeSearchText } from './product-search';

export async function consultLocations(pointOfSale?: string, db: Pick<typeof prisma, 'pointOfSale'> = prisma) {
  const locations = await db.pointOfSale.findMany({
    select: {
      id: true, name: true, label: true,
      depositos: { select: { id: true, name: true, label: true }, orderBy: { label: 'asc' } },
    },
    orderBy: { label: 'asc' },
  });

  const term = pointOfSale ? normalizeSearchText(pointOfSale) : null;
  const matches = term
    ? locations.filter((pos) => [pos.id, pos.name, pos.label]
      .some((value) => normalizeSearchText(value) === term))
    : locations;

  if (term && matches.length === 0) {
    return { error: 'Punto de venta no encontrado', pointOfSale, pointOfSaleCount: 0, pointsOfSale: [] };
  }

  return {
    pointOfSaleCount: matches.length,
    pointsOfSale: matches.map((pos) => ({
      id: pos.id,
      name: pos.label,
      depositoCount: pos.depositos.length,
      depositos: pos.depositos.map((dep) => ({ id: dep.id, name: dep.label })),
    })),
  };
}

export function formatLocationResponse(data: Awaited<ReturnType<typeof consultLocations>>, scoped: boolean): string {
  if ('error' in data) return 'No encontré ese punto de venta. ¿Podés confirmar su nombre?';
  if (scoped) {
    const pos = data.pointsOfSale[0];
    return `**${pos.name}** tiene **${pos.depositoCount} depósitos**` +
      (pos.depositos.length ? `: ${pos.depositos.map((dep) => `**${dep.name}**`).join(', ')}.` : '.');
  }
  return `Hay **${data.pointOfSaleCount} puntos de venta**: ` +
    data.pointsOfSale.map((pos) => `**${pos.name}** (**${pos.depositoCount} ${pos.depositoCount === 1 ? 'depósito' : 'depósitos'}**)`).join(', ') + '.';
}
