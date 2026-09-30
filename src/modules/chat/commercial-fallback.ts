import { matchesCatalogAttribute, matchesInventoryLocation, normalizeSearchText } from './product-search';

export interface StockOption {
  productId: string;
  productName: string;
  color: string;
  size: string;
  pointOfSale: string;
  deposito: string | null;
  stock: number;
}

export interface CommercialAlternatives {
  // Present these in this order. Similar products are a last resort.
  sameProductOtherVariants: StockOption[];
  sameVariantOtherLocations: StockOption[];
  similarProducts: StockOption[];
}

export interface StockPoolProduct {
  id: string;
  name: string;
  categoryId: string;
  variants: {
    color: { name: string; label: string };
    size: { name: string; label: string };
    inventory: {
      stock: number;
      pointOfSale: { id: string; label: string };
      deposito: { id: string; label: string } | null;
    }[];
  }[];
}

export interface StockFilters {
  color?: string;
  size?: string;
  pointOfSale?: string;
}

export interface LocationIds {
  pointOfSaleIds: string[];
  depositoIds: string[];
}

export function isVagueStockRequest(filters: StockFilters & { keywords?: string[]; category?: string }): boolean {
  const words = [...(filters.keywords ?? []), filters.category ?? '']
    .flatMap((word) => normalizeSearchText(word).split(' '))
    .filter(Boolean);
  if (words.length === 0) return true;
  // An entire product family ("gorras", "remeras") is a valid stock question.
  const withoutProduct = new Set(['stock', 'talle', 'talles', 'color', 'colores', 'producto', 'productos']);
  return words.every((word) => withoutProduct.has(word));
}

export function hasExactStock(products: { variants: { totalStock: number }[] }[]): boolean {
  return products.some((product) => product.variants.some((variant) => variant.totalStock > 0));
}

export function ensureProductLinks(
  response: string,
  products: { id: string; name: string }[]
): string {
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  const allowed = new Set(uniqueProducts.map((product) => `/productos/${product.id}`));
  let text = response.replace(/\[([^\]]+)\]\(([^)]*)\)/g, (_match, label: string, href: string) =>
    allowed.has(href) ? `[${label}](${href})` : label
  ).replace(/https?:\/\/\S+/gi, '');

  const links: string[] = [];
  for (const product of uniqueProducts) {
    if (normalizeSearchText(text).includes(normalizeSearchText(product.name)) &&
        !text.includes(`](/productos/${product.id})`)) {
      links.push(`**[${product.name}](/productos/${product.id})**`);
    }
  }
  if (links.length > 0) text += `\nFichas: ${links.join(' · ')}`;
  return text;
}

export function findCommercialAlternatives(
  target: StockPoolProduct,
  similarProducts: StockPoolProduct[],
  filters: StockFilters,
  locationIds: LocationIds
): CommercialAlternatives {
  const hasLocation = Boolean(filters.pointOfSale);
  const inLocation = (pointOfSaleId: string, depositoId: string | null) =>
    matchesInventoryLocation({ pointOfSaleId, depositoId }, hasLocation, locationIds);
  const exactVariant = (variant: StockPoolProduct['variants'][number]) =>
    matchesCatalogAttribute(variant.color, filters.color) && matchesCatalogAttribute(variant.size, filters.size);

  function availableOptions(product: StockPoolProduct, include: (variant: StockPoolProduct['variants'][number], pointOfSaleId: string, depositoId: string | null) => boolean) {
    const options: StockOption[] = [];
    for (const variant of product.variants) {
      for (const item of variant.inventory) {
        if (item.stock <= 0 || !include(variant, item.pointOfSale.id, item.deposito?.id ?? null)) continue;
        options.push({
          productId: product.id,
          productName: product.name,
          color: variant.color.label,
          size: variant.size.label,
          pointOfSale: item.pointOfSale.label,
          deposito: item.deposito?.label ?? null,
          stock: item.stock,
        });
        if (options.length === 3) return options;
      }
    }
    return options;
  }

  const sameProductOtherVariants = filters.color || filters.size
    ? availableOptions(target, (variant, posId, depId) => !exactVariant(variant) && inLocation(posId, depId))
    : [];
  const sameVariantOtherLocations = hasLocation
    ? availableOptions(target, (variant, posId, depId) => exactVariant(variant) && !inLocation(posId, depId))
    : [];

  const similar: StockOption[] = [];
  if (sameProductOtherVariants.length === 0 && sameVariantOtherLocations.length === 0) {
    for (const product of similarProducts) {
      if (product.id === target.id || product.categoryId !== target.categoryId) continue;
      similar.push(...availableOptions(product, (_variant, posId, depId) => inLocation(posId, depId)));
      if (similar.length >= 3) break;
    }
  }

  return {
    sameProductOtherVariants,
    sameVariantOtherLocations,
    similarProducts: similar.slice(0, 3),
  };
}
