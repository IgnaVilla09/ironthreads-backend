import type { CommercialAlternatives, StockOption } from './commercial-fallback';

type Product = {
  id: string;
  name: string;
  category?: string;
  variants: {
    sku?: string;
    color: string;
    size: string;
    locations: { pointOfSale: string; deposito: string | null; stock: number }[];
  }[];
};

export type StockResponseData = {
  requestedProductId?: string;
  locationFound: boolean;
  products: Product[];
  alternatives?: CommercialAlternatives;
};

function units(stock: number) {
  return `**${stock} ${stock === 1 ? 'unidad' : 'unidades'}**`;
}

function location(pointOfSale: string, deposito: string | null) {
  return `**${pointOfSale}**${deposito ? ` (depósito **${deposito}**)` : ''}`;
}

function optionLine(option: StockOption) {
  return `${units(option.stock)} de **[${option.productName}](/productos/${option.productId})** ` +
    `en **${option.color}**, talle **${option.size}**, en ${location(option.pointOfSale, option.deposito)}`;
}

export function formatStockResponse(result: StockResponseData): string {
  if (!result.locationFound) {
    return 'No pude identificar la sucursal o depósito solicitado. ¿Podés indicarme el nombre exacto?';
  }

  const product = result.products.find((candidate) => candidate.id === result.requestedProductId);
  const withStock = result.products.map((candidate) => ({
    product: candidate,
    available: candidate.variants.flatMap((variant) => variant.locations
      .filter((row) => row.stock > 0)
      .map((row) => ({ ...row, color: variant.color, size: variant.size, sku: variant.sku }))),
  })).filter((item) => item.available.length > 0);
  const outOfStock = result.products.filter((candidate) =>
    !withStock.some((item) => item.product.id === candidate.id));
  const unavailable = outOfStock.length > 0
    ? `\n\n**Otras coincidencias sin stock:** ${outOfStock.map((item) =>
        `**[${item.name}](/productos/${item.id})**`).join(', ')}.`
    : '';

  if (withStock.length > 0) {
    if (withStock.length > 8) {
      const lines = withStock.map(({ product: current, available }) =>
        `- **[${current.name}](/productos/${current.id})**: ${units(available.reduce((sum, row) => sum + row.stock, 0))}.`);
      return `Sí, hay stock en **${withStock.length} productos coincidentes**:\n${lines.join('\n')}${unavailable}`;
    }
    const multiple = result.products.length > 1;
    const sections = withStock.map(({ product: current, available }) => {
      const lines = available.slice(0, 12).map((row) =>
        `- **${row.color}**, talle **${row.size}**: ${units(row.stock)} en ${location(row.pointOfSale, row.deposito)}` +
        (multiple && row.sku ? ` · SKU **${row.sku}**` : '') + '.');
      return `**[${current.name}](/productos/${current.id})**:\n${lines.join('\n')}` +
        (available.length > 12 ? '\nHay más ubicaciones disponibles para esta ficha.' : '');
    });
    return withStock.length > 1
      ? `Sí, hay stock en **${withStock.length} productos coincidentes**:\n\n${sections.join('\n\n')}${unavailable}`
      : `Sí, hay stock de ${sections[0]}${unavailable}`;
  }

  const alternatives = result.alternatives;
  const groups: { title: string; options: StockOption[] }[] = [
    { title: 'Otra variante en la ubicación solicitada', options: alternatives?.sameProductOtherVariants ?? [] },
    { title: 'La variante en otra ubicación (podés consultar una transferencia)', options: alternatives?.sameVariantOtherLocations ?? [] },
    { title: 'Otro producto de la misma categoría', options: alternatives?.similarProducts ?? [] },
  ];
  const availableGroups = groups.filter((group) => group.options.length > 0);

  if (availableGroups.length === 0) {
    return product
      ? `No hay stock verificado de **[${product.name}](/productos/${product.id})** para la variante o ubicación consultada, ni alternativas disponibles.${unavailable} ¿Querés buscar otro color, talle o sucursal?`
      : 'No encontré stock verificado para esa búsqueda ni alternativas disponibles. ¿Querés probar con otro modelo, color, talle o sucursal?';
  }

  const subject = product
    ? `**[${product.name}](/productos/${product.id})**`
    : 'la variante consultada';
  return `No encontré stock de ${subject} con las características y ubicación pedidas. Opciones verificadas:\n` +
    availableGroups.map((group, index) =>
      `${index + 1}. **${group.title}:** ${group.options.map(optionLine).join('; ')}.`).join('\n') + unavailable;
}
