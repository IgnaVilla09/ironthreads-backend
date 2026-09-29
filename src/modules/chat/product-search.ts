// Keep catalog matching independent of the language model: it can name an item
// differently from the catalog (plurals, diminutives, accents or punctuation).
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
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
