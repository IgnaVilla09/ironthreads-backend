import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { normalizeSearchText, searchTerms } from './product-search';

type CatalogDb = Pick<typeof prisma, 'category' | 'product'>;

export async function listAvailableProducts(category?: string, db: CatalogDb = prisma) {
  const categories = await db.category.findMany({ select: { id: true, name: true, label: true } });
  const terms = category ? searchTerms([category]) : [];
  const matchedCategories = category
    ? categories.filter((item) => terms.some((term) =>
        normalizeSearchText(`${item.name} ${item.label}`).includes(term)))
    : categories;

  // A type such as "gorras" may appear in product names while the category is "Accesorio".
  const where: Prisma.ProductWhereInput = {
    variants: { some: { inventory: { some: { stock: { gt: 0 } } } } },
  };
  if (category) {
    if (matchedCategories.length > 0) {
      where.categoryId = { in: matchedCategories.map((item) => item.id) };
    } else if (terms.length > 0) {
      where.OR = terms.map((term) => ({ name: { contains: term, mode: 'insensitive' } }));
    } else {
      return { total: 0, categories: [] };
    }
  }

  // No take/pagination: this tool answers "qué productos hay", not a top-N search.
  const products = await db.product.findMany({
    where,
    select: { id: true, name: true, category: { select: { id: true, label: true } } },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  });
  const grouped = new Map<string, { name: string; products: { id: string; name: string }[] }>();
  for (const product of products) {
    const group = grouped.get(product.category.id) ?? { name: product.category.label, products: [] };
    group.products.push({ id: product.id, name: product.name });
    grouped.set(product.category.id, group);
  }
  return {
    total: products.length,
    categories: [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function formatAvailableProducts(result: Awaited<ReturnType<typeof listAvailableProducts>>): string {
  if (result.total === 0) return 'No encontré productos con stock en esa categoría o tipo de producto.';
  const header = `Hay **${result.total} ${result.total === 1 ? 'producto' : 'productos'} con stock**:`;
  return [header, ...result.categories.map((group) =>
    `**${group.name}** (${group.products.length}):\n` +
    group.products.map((product) => `- **[${product.name}](/productos/${product.id})**`).join('\n')
  )].join('\n\n');
}
