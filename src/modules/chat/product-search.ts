// Keep catalog matching independent of the language model: it can name an item
// differently from the catalog (plurals, diminutives, accents or punctuation).
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

export function sameCatalogProduct(
  first: { name: string; category: string },
  second: { name: string; category: string }
): boolean {
  const key = (name: string) => normalizeSearchText(name).replace(/\s+/g, '');
  return key(first.name) === key(second.name) &&
    normalizeSearchText(first.category) === normalizeSearchText(second.category);
}

// Color/size are exact catalog attributes: a request for "negro" must not
// include e.g. "negro lavado" unless it is the actual label/name requested.
export function matchesCatalogAttribute(attribute: { name: string; label: string }, requested?: string): boolean {
  if (!requested) return true;
  const term = normalizeSearchText(requested);
  return term.length > 0 && [attribute.name, attribute.label].some((value) => normalizeSearchText(value) === term);
}

export function matchesInventoryLocation(
  item: { pointOfSaleId: string; depositoId: string | null },
  requested: boolean,
  matches: { pointOfSaleIds: string[]; depositoIds: string[] }
): boolean {
  if (!requested) return true;
  return matches.pointOfSaleIds.includes(item.pointOfSaleId) ||
    (item.depositoId !== null && matches.depositoIds.includes(item.depositoId));
}

function root(word: string): string {
  const singular = word.length > 4 ? word.replace(/(?:es|s)$/, '') : word;
  const withoutDiminutive = singular.length > 6
    ? singular.replace(/(?:cit|it)[oa]$/, '')
    : singular;
  return withoutDiminutive.length > 4
    ? withoutDiminutive.replace(/[oa]$/, '')
    : withoutDiminutive;
}

const RELATED_TERMS: Record<string, string[]> = {
  bols: ['mochil'],
  mochil: ['bols'],
  gorr: ['sombrer'],
  sombrer: ['gorr'],
};

export function searchTerms(values: string[]): string[] {
  const terms = values.flatMap((value) =>
    normalizeSearchText(value).split(' ').filter((word) => word.length >= 3)
  );
  return [...new Set(terms.flatMap((word) => {
    const stem = root(word);
    return [stem, ...(RELATED_TERMS[stem] ?? [])];
  }))].filter((term) => term.length >= 3).slice(0, 12);
}

// Every product word is required; related words are alternatives within that word.
// E.g. "remera baseball" requires both the category remera and name baseball,
// while "bolso" can match "bolso" OR "mochila".
export function searchTermGroups(values: string[]): string[][] {
  return values.flatMap((value) => normalizeSearchText(value).split(' ')
    .filter((word) => word.length >= 3)
    .map((word) => searchTerms([word])))
    .filter((group) => group.length > 0);
}

export interface SearchableProduct {
  name: string;
  description: string | null;
  category: { name: string; label: string };
  variants: { sku: string }[];
}

export function scoreCatalogProduct(product: SearchableProduct, terms: string[], categoryTerms: string[]): number {
  const fields = [
    normalizeSearchText(product.name),
    normalizeSearchText(product.description ?? ''),
    normalizeSearchText(`${product.category.name} ${product.category.label}`),
    normalizeSearchText(product.variants.map((variant) => variant.sku).join(' ')),
  ];
  const weights = [8, 4, 3, 5];
  const score = terms.reduce((sum, term) => {
    const index = fields.findIndex((field) => field.includes(term));
    return sum + (index < 0 ? 0 : weights[index]);
  }, 0);
  const categoryBonus = categoryTerms.some((term) => fields[2].includes(term)) ? 2 : 0;
  return score + categoryBonus;
}

export function scoreRequestedProduct(
  product: SearchableProduct,
  terms: string[],
  categoryTerms: string[],
  keywords: string[],
  color?: string
): number {
  const name = normalizeSearchText(product.name);
  const requestedName = normalizeSearchText(keywords.join(' '));
  const requestedColor = color ? normalizeSearchText(color) : '';
  const searchable = [
    name,
    normalizeSearchText(product.description ?? ''),
    normalizeSearchText(`${product.category.name} ${product.category.label}`),
    normalizeSearchText(product.variants.map((variant) => variant.sku).join(' ')),
  ];
  const allTermsMatched = terms.length > 0 && terms.every((term) => searchable.some((field) => field.includes(term)));
  return scoreCatalogProduct(product, terms, categoryTerms)
    + (allTermsMatched ? 8 : 0)
    + (requestedName && name === requestedName ? 15 : 0)
    + (allTermsMatched && requestedColor && name.split(' ').includes(requestedColor) ? 12 : 0);
}
