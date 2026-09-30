import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { matchesCatalogAttribute, matchesInventoryLocation, normalizeSearchText, scoreRequestedProduct, searchTermGroups, searchTerms } from './product-search';
import { CommercialAlternatives, ensureProductLinks, findCommercialAlternatives, hasExactStock, isVagueStockRequest } from './commercial-fallback';
import { consultLowStock, consultSalesMetrics } from './chat-analytics';
import { consultLocations, formatLocationResponse } from './chat-locations';
import { formatStockResponse } from './stock-response';
import { formatAvailableProducts, listAvailableProducts } from './chat-catalog';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StockQueryIntent {
  keywords?: string[];
  category?: string;
  color?: string;
  size?: string;
  pointOfSale?: string;
}

const queryTerm = z.string().trim().min(1).max(80);
const stockQuerySchema = z.object({
  keywords: z.array(queryTerm).max(3).optional(),
  category: queryTerm.optional(),
  color: queryTerm.optional(),
  size: queryTerm.optional(),
  pointOfSale: queryTerm.optional(),
});
const lowStockSchema = z.object({
  threshold: z.number().int().min(0).max(10000).default(5),
  pointOfSaleId: queryTerm.optional(),
});
const metricsSchema = z.object({
  type: z.enum(['by_size', 'by_color', 'best_selling_sizes', 'general']),
});
const locationsSchema = z.object({ pointOfSale: queryTerm.optional() });
const catalogListSchema = z.object({ category: queryTerm.optional() });

interface VariantCandidate {
  sku: string;
  color: string;
  size: string;
  locations: { pointOfSale: string; deposito: string | null; stock: number }[];
  totalStock: number;
}

interface ProductCandidate {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string;
  variants: VariantCandidate[];
}

interface StockResult {
  requestedProductId?: string;
  found: boolean;
  summary: string;
  locationFound: boolean;
  exactStockAvailable: boolean;
  products: ProductCandidate[];
  alternatives?: CommercialAlternatives;
}

const AGENT_SYSTEM_PROMPT = `# Rol y tono
Sos Agent Iron, el copiloto comercial y de inventario del panel interno de Iron Stock. Respondé de forma profesional, ágil y servicial para resolver ventas y logística. Elegí una herramienta según la pregunta: listar_productos_en_stock para enumerar TODOS los productos disponibles de una categoría («¿qué remeras/buzos hay en stock?»), buscar_stock_producto para comprobar la disponibilidad de un producto concreto («¿hay remera baseball azul?»); consultar_ubicaciones para contar puntos de venta/sucursales o depósitos; consultar_stock_bajo para variantes con stock crítico; consultar_metricas_ventas para métricas generales. Para «¿qué talles tienen menos stock?» elegí consultar_metricas_ventas con by_size y compará de menor a mayor. Para «¿qué es lo que más se vende?» solo está disponible el ranking de talles vendidos (best_selling_sizes), NO el de productos. Para stock por color/talle usá by_color/by_size, que miden INVENTARIO, no ventas. Usá el historial solo si la nueva pregunta es un seguimiento explícito («¿y en GYM?»), nunca para arrastrar filtros a una consulta independiente ni como fuente de cifras actuales.

# Precisión y formato
- La respuesta de la herramienta es la única fuente de verdad. No inventes productos, stock, colores, talles, ubicaciones, cantidades ni enlaces. Los ejemplos siguientes son ficticios: nunca reutilices sus nombres, cifras ni IDs en respuestas reales.
- No atribuyas ventas a métricas de inventario. Si un resultado está truncado, indicá que es parcial; si una ubicación no existe, pedí precisión. Para métricas o alertas solo mencioná productos si constan en la herramienta.
- Resaltá SIEMPRE en negrita Markdown (**texto**) los nombres de productos, colores, talles, puntos de venta, depósitos y cantidades de stock mencionados en el texto. Para cada producto que menciones como candidato o recomendado, incluí SIEMPRE [Nombre del Producto](/productos/{id}) usando el ID real de ese producto en la respuesta de la herramienta. Podés poner el enlace en negrita como **[Nombre del Producto](/productos/{id})**.
- No generes URLs externas. Mostrá solo enlaces internos /productos/{id} de productos encontrados en los datos actuales.
- Una pregunta de stock sin talle ni ubicación pide cualquier talle/ubicación con stock: NO respondas «sin stock exacto» si existe una variante disponible. Si locationFound es falso, pedí aclaración de la ubicación antes de ofrecer alternativas o afirmar stock allí.

# Secuencia comercial obligatoria cuando no hay stock exacto
Si exactStockAvailable es falso, consultá exclusivamente el objeto alternatives de la herramienta y presentá SOLO opciones con stock positivo, en este orden:
1. Variante alternativa: otras variantes del MISMO producto en el MISMO punto de venta/depósito solicitado (sameProductOtherVariants).
2. Ubicación alternativa: la variante exacta en OTRO punto de venta o depósito (sameVariantOtherLocations). Podés sugerir consultar una transferencia, nunca prometerla ni ejecutarla.
3. Producto similar: producto distinto de la MISMA categoría (similarProducts), únicamente si no hay opciones en 1 ni 2.
Si no hay alternativas, informá que no hay opciones verificadas y pedí al usuario otra preferencia. No uses existencias del historial ni recomiendes variantes fuera de alternatives. Si hay stock exacto, respondé usando solo products; no inventes alternativas.

# Aclaraciones
Solo si falta por completo el producto o intención identificable (por ejemplo «talles» sin contexto), pedí una precisión. «Gorras» y «remeras» son consultas válidas. Ante un saludo, respondé con una invitación corta a consultar.

# Ejemplos de estilo (datos ilustrativos, no pertenecen al catálogo real)
Ejemplo 1 — stock exacto:
Consulta: «¿Hay remera baseball negra en L en Centro?»
Si la herramienta confirma 3 unidades, producto cm123abc y esa ubicación:
«¡Sí! Hay **3 unidades** de la **Remera Baseball** en **negro**, talle **L**, en el **Punto de Venta Centro**. Ficha: **[Remera Baseball](/productos/cm123abc)**.»

Ejemplo 2 — sin stock exacto, alternativas en orden 1 y 2:
Consulta: «¿Tienen buzo oversize negro en M en el punto de venta Centro?»
Si la herramienta indica 0 en Centro, 2 grises M en Centro y 5 negros M en Depósito Central, producto cm456def:
«No queda **Buzo Oversize** **negro** talle **M** en **Centro**. Opciones verificadas:
1. **Otra variante en Centro:** **2 unidades** del **Buzo Oversize** **gris**, talle **M**, en **Centro**. **[Buzo Oversize](/productos/cm456def)**.
2. **Otra ubicación:** **5 unidades** del **Buzo Oversize** **negro**, talle **M**, en el **Depósito Central**. Podés consultar una transferencia. **[Buzo Oversize](/productos/cm456def)**.»`;

const CLARIFICATION = '¿Qué modelo, talle, color o sucursal te interesa? Así puedo comprobar la disponibilidad exacta.';

const ROUTING_PROMPT = `Sos Agent Iron, copiloto de inventario. Elegí SIEMPRE la herramienta apropiada:
- listar_productos_en_stock para "qué remeras/buzos/pantalones hay en stock", "listame los productos de la categoría X", o "qué productos hay en stock por categoría". Indicá category solo si se nombra; listar significa TODOS los productos con stock, sin variantes.
- buscar_stock_producto para "¿hay stock de gorras?" o de un modelo/color/talle concreto. Conservá TODOS los términos del modelo ("remera clásica negra" -> keywords ["remera", "clasica"], color "negro"); no pierdas "clásica" aunque "remera" sea la categoría. Extraé el color pero NO inventes talle ni punto de venta si no se mencionan.
- consultar_ubicaciones para contar puntos de venta/sucursales o depósitos; para depósitos en una sucursal indicá su nombre en pointOfSale.
- consultar_stock_bajo para alertas y stock crítico.
- consultar_metricas_ventas para talles/colores por stock (by_size/by_color), talles más vendidos (best_selling_sizes) o estadísticas generales (general).
Usá el historial SOLO si la pregunta actual hace referencia explícita a lo anterior ("¿y en GYM?"); nunca arrastres filtros a otra consulta. No respondas cifras sin consultar una herramienta.`;

const SEARCH_PRODUCT_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'buscar_stock_producto',
    description:
      'Buscar productos y stock en el catálogo por nombre, descripción, categoría y SKU. Extraé las palabras que el cliente usa para describir el producto, aunque sean plurales o diminutivos.',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Palabras del tipo Y modelo de producto, entre 1 y 3: "gorritos" → ["gorritos"], "remera clásica negra" → ["remera", "clasica"], "remera baseball negra" → ["remera", "baseball"]. Nunca omitas el modelo (clasica, baseball). No incluyas colores, talles ni relleno.',
        },
        category: {
          type: 'string',
          description: 'Categoría del producto si se menciona, ej: "REMERA", "BUZO", "PANTALON", "MUSCULOSA".',
        },
        color: {
          type: 'string',
          description: 'Color mencionado, ej: "azul", "negro", "blanco".',
        },
        size: {
          type: 'string',
          description: 'Talle mencionado, ej: "S", "M", "L", "XL".',
        },
        pointOfSale: {
          type: 'string',
          description: 'Punto de venta o depósito mencionado, ej: "gimnasio", "GYM", "departamento", "caja 1".',
        },
      },
      required: [],
    },
  },
};

const CATALOG_LIST_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'listar_productos_en_stock',
    description: 'Listar TODOS los productos con stock positivo de una categoría o tipo, sin variantes ni límite de resultados. Para «¿qué remeras hay en stock?» usar category «remeras»; si no se nombra categoría, listar por todas las categorías.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Categoría o tipo mencionado (ej. remeras, buzos, gorras). Omitir si pide todas las categorías.' },
      },
      required: [],
    },
  },
};

const LOW_STOCK_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'consultar_stock_bajo',
    description: 'Consultar variantes con existencias menores o iguales al umbral; opcionalmente en un punto de venta. Incluye variantes con stock cero. Para alertas, stock crítico o faltantes.',
    parameters: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: 'Umbral inclusivo de stock; omitir para usar 5.' },
        pointOfSaleId: { type: 'string', description: 'ID UUID del punto de venta o nombre/etiqueta si el usuario lo indica.' },
      },
      required: [],
    },
  },
};

const SALES_METRICS_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'consultar_metricas_ventas',
    description: 'Consultar métricas existentes. by_size/by_color son existencias por talle/color; best_selling_sizes son talles vendidos; general es resumen de productos y stock. No existe ranking de productos vendidos.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['by_size', 'by_color', 'best_selling_sizes', 'general'], description: 'Tipo de métrica solicitada.' },
      },
      required: ['type'],
    },
  },
};

const LOCATIONS_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'consultar_ubicaciones',
    description: 'Contar puntos de venta o sucursales y sus depósitos. Si preguntan por depósitos de una ubicación (ej: Departamento), pasá su nombre en pointOfSale.',
    parameters: {
      type: 'object',
      properties: {
        pointOfSale: { type: 'string', description: 'Nombre o etiqueta del punto de venta solicitado; omitir para listar y contar todos.' },
      },
      required: [],
    },
  },
};

async function matchPointOfSale(intent: StockQueryIntent) {
  if (!intent.pointOfSale) {
    return { depositoIds: [] as string[], pointOfSaleIds: [] as string[] };
  }
  const term = normalizeSearchText(intent.pointOfSale);

  const depositos = await prisma.deposito.findMany();
  const depositoIds = depositos
    .filter(
      (d) =>
        normalizeSearchText(d.name).includes(term) ||
        normalizeSearchText(d.label).includes(term)
    )
    .map((d) => d.id);

  const pos = await prisma.pointOfSale.findMany();
  const pointOfSaleIds = pos
    .filter(
      (p) =>
        normalizeSearchText(p.name).includes(term) ||
        normalizeSearchText(p.label).includes(term)
    )
    .map((p) => p.id);

  return { depositoIds, pointOfSaleIds };
}

function catalogWhere(groups: string[][]) {
  return {
    AND: groups.map((group) => ({
      OR: group.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { category: { is: { name: { contains: term, mode: 'insensitive' as const } } } },
        { category: { is: { label: { contains: term, mode: 'insensitive' as const } } } },
        { variants: { some: { sku: { contains: term, mode: 'insensitive' as const } } } },
      ]),
    })),
  };
}

async function findCatalogMatches(categoryTerms: string[], intent: StockQueryIntent) {
  const groups = searchTermGroups(intent.keywords?.length ? intent.keywords : intent.category ? [intent.category] : []);
  if (groups.length === 0) return [];
  const terms = groups.flat();

  const select = {
    id: true,
    name: true,
    description: true,
    category: { select: { name: true, label: true } },
    variants: { select: { sku: true } },
  } as const;
  const products = await prisma.product.findMany({
    where: catalogWhere(groups),
    select,
    // The query uses lightweight fields; every matching product must be kept.
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    score: scoreRequestedProduct(product, terms, categoryTerms, intent.keywords ?? [], intent.color),
  })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .map((product) => product.id);
}

async function loadCandidatePool(ids: string[]) {
  return prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      category: { select: { id: true, name: true, label: true } },
      variants: {
        include: {
          color: { select: { id: true, name: true, label: true, hex: true } },
          size: { select: { id: true, name: true, label: true } },
          inventory: {
            select: {
              stock: true,
              pointOfSale: { select: { id: true, name: true, label: true } },
              deposito: { select: { id: true, name: true, label: true } },
            },
          },
        },
      },
    },
  });
}

async function findSimilarProducts(categoryId: string, excludedIds: string[]) {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      id: { notIn: excludedIds },
      variants: { some: { inventory: { some: { stock: { gt: 0 } } } } },
    },
    select: { id: true },
    orderBy: { name: 'asc' },
    take: 20,
  });
  return products.length ? loadCandidatePool(products.map((product) => product.id)) : [];
}

function buildProductCandidates(
  pool: Awaited<ReturnType<typeof loadCandidatePool>>,
  locationFilter: { depositoIds: string[]; pointOfSaleIds: string[] },
  intent: StockQueryIntent
): ProductCandidate[] {
  const hasStockLocation = Boolean(intent.pointOfSale);

  return pool
    .map((product): ProductCandidate => {
      const variants = product.variants
        .filter((variant) =>
          matchesCatalogAttribute(variant.color, intent.color) &&
          matchesCatalogAttribute(variant.size, intent.size)
        )
        .map((variant): VariantCandidate => {
          const locations = variant.inventory
            .filter((item) => matchesInventoryLocation({
              pointOfSaleId: item.pointOfSale.id,
              depositoId: item.deposito?.id ?? null,
            }, hasStockLocation, locationFilter))
            .map((item) => ({
              pointOfSale: item.pointOfSale.label,
              deposito: item.deposito?.label ?? null,
              stock: item.stock,
            }));

          return {
            sku: variant.sku,
            color: variant.color.label,
            size: variant.size.label,
            locations,
            totalStock: locations.reduce((sum, l) => sum + l.stock, 0),
          };
        });

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.label,
        variants,
      };
    })
    .filter((product) => product.variants.length > 0);
}

async function searchStock(intent: StockQueryIntent): Promise<StockResult> {
  const categoryTerms = searchTerms(intent.category ? [intent.category] : []);
  const ids = await findCatalogMatches(categoryTerms, intent);
  // Category is an optional hint, not a hard constraint inferred by the model.
  const [locationFilter, pool] = await Promise.all([
    matchPointOfSale(intent),
    ids.length > 0 ? loadCandidatePool(ids) : Promise.resolve([]),
  ]);
  const byId = new Map(pool.map((product) => [product.id, product]));
  const candidates = buildProductCandidates(
    ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    }),
    locationFilter,
    intent
  );

  const locationFound = !intent.pointOfSale || locationFilter.pointOfSaleIds.length > 0 || locationFilter.depositoIds.length > 0;
  // When talle/ubicación aren't constrained, a positive candidate is a valid
  // answer even if the highest-ranked name has no inventory at all.
  const bestAvailable = candidates.find((product) => hasExactStock([product]));
  const primary = candidates.find((product) => product.id === ids[0]);
  const requestedProductId = (!primary || (!intent.size && !intent.pointOfSale && !hasExactStock([primary])))
    ? (bestAvailable?.id ?? ids[0]) : ids[0];
  const exactStockAvailable = hasExactStock(candidates);
  let alternatives: CommercialAlternatives | undefined;
  if (!exactStockAvailable && locationFound && ids.length > 0) {
    const target = byId.get(requestedProductId);
    if (target) {
      alternatives = findCommercialAlternatives(target, pool, intent, locationFilter);
      if (!alternatives.sameProductOtherVariants.length && !alternatives.sameVariantOtherLocations.length &&
          !alternatives.similarProducts.length) {
        const additional = await findSimilarProducts(target.categoryId, ids);
        alternatives = findCommercialAlternatives(target, additional, intent, locationFilter);
      }
    }
  }
  const summary = !locationFound
    ? 'No se encontró el punto de venta o depósito solicitado; no se incluyó stock de otras ubicaciones.'
    : candidates.length === 0
      ? 'No se encontraron productos o variantes que coincidan con la consulta.'
      : `Se encontraron ${candidates.length} producto(s) posibles con sus variantes y stock por ubicación.`;

  return { requestedProductId, found: candidates.length > 0, summary, locationFound, exactStockAvailable, products: candidates, alternatives };
}

const MAX_TURNS = 5;

interface ChatTurn {
  user: string;
  intent: StockQueryIntent | null;
  result: StockResult | null;
  response: string;
  toolName: string | null;
}

async function loadTurns(userId: string, clientId: string): Promise<ChatTurn[]> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { userId_clientId: { userId, clientId } },
    select: { messages: { orderBy: { sequence: 'desc' }, take: MAX_TURNS * 4 } },
  });
  const turns = new Map<string, Partial<ChatTurn>>();
  for (const row of (conversation?.messages ?? []).reverse()) {
    const turn = turns.get(row.turnId) ?? {};
    if (row.role === 'user') turn.user = row.content;
    if (row.role === 'assistant') {
      turn.response = row.content;
      try {
        const context = JSON.parse(row.toolContext ?? '{}') as Partial<ChatTurn>;
        turn.intent = context.intent ?? null;
        turn.result = context.result ?? null;
        turn.toolName = context.toolName ?? null;
      } catch {
        turn.intent = null;
        turn.result = null;
        turn.toolName = null;
      }
    }
    turns.set(row.turnId, turn);
  }
  return [...turns.values()].filter((turn): turn is ChatTurn =>
    typeof turn.user === 'string' && typeof turn.response === 'string'
  ).slice(-MAX_TURNS);
}

async function saveTurn(userId: string, clientId: string, turn: ChatTurn) {
  await prisma.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.upsert({
      where: { userId_clientId: { userId, clientId } },
      create: { userId, clientId },
      update: { updatedAt: new Date() },
    });
    const turnId = randomUUID();
    await tx.chatMessage.create({ data: {
      conversationId: conversation.id, turnId, role: 'user', content: turn.user,
    } });
    await tx.chatMessage.create({ data: {
      conversationId: conversation.id, turnId, role: 'assistant', content: turn.response,
      toolContext: JSON.stringify({ intent: turn.intent, result: turn.result, toolName: turn.toolName }),
    } });
  });
}

function buildConversationContext(pastTurns: ChatTurn[]): string | null {
  if (pastTurns.length === 0) return null;
  return JSON.stringify(
    pastTurns.map((t) => ({
      user: t.user,
      intent: t.intent,
      toolName: t.toolName,
      response: t.response.slice(0, 300),
      products: (t.result?.products ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    }))
  );
}

export const chatService = {
  async handleMessage(message: string, userId: string, clientId: string) {
    const pastTurns = await loadTurns(userId, clientId);
    const { response, intent, result, toolName = null } = await respondWithTools(message, pastTurns);
    await saveTurn(userId, clientId, { user: message, intent, result, response, toolName });
    return response;
  },

  async forgetConversation(userId: string, clientId: string) {
    await prisma.chatConversation.deleteMany({ where: { userId, clientId } });
  },
};

async function respondWithTools(message: string, pastTurns: ChatTurn[]) {
  if (/^\s*(hola|buenas|buenos días|buen dia|buen día)[!.\s]*$/i.test(message)) {
    return { response: '¡Hola! Soy Agent Iron. ¿Qué producto, talle, color o sucursal te interesa?', intent: null, result: null };
  }
  const context = buildConversationContext(pastTurns);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: ROUTING_PROMPT },
  ];

  if (context) {
    messages.push({ role: 'user', content: `Historial de conversación previa (JSON):\n${context}` });
  }
  messages.push({ role: 'user', content: message });

  const first = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: [SEARCH_PRODUCT_TOOL, CATALOG_LIST_TOOL, LOW_STOCK_TOOL, SALES_METRICS_TOOL, LOCATIONS_TOOL],
    tool_choice: 'required',
    parallel_tool_calls: false,
    temperature: 0,
  });
  const assistant = first.choices[0]?.message;
  if (!assistant?.tool_calls?.length) {
    return { response: CLARIFICATION, intent: null, result: null };
  }

  // Keep the assistant's original tool call and reply with matching tool_call_id.
  messages.push(assistant);
  let intent: StockQueryIntent | null = null;
  let result: StockResult | null = null;
  let toolName: string | null = null;
  let toolError = false;
  let allowedProducts: { id: string; name: string }[] = [];
  let locationAnswer: string | null = null;
  let catalogAnswer: string | null = null;
  for (const call of assistant.tool_calls) {
    if (call.type !== 'function' || !['buscar_stock_producto', 'listar_productos_en_stock', 'consultar_stock_bajo', 'consultar_metricas_ventas', 'consultar_ubicaciones'].includes(call.function.name)) {
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: 'Herramienta no disponible' }) });
      continue;
    }
    const args = (() => {
      try { return JSON.parse(call.function.arguments); } catch { return null; }
    })();
    const schema = call.function.name === 'buscar_stock_producto' ? stockQuerySchema
      : call.function.name === 'consultar_stock_bajo' ? lowStockSchema
        : call.function.name === 'consultar_ubicaciones' ? locationsSchema
          : call.function.name === 'listar_productos_en_stock' ? catalogListSchema : metricsSchema;
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: 'Argumentos de herramienta inválidos' }) });
      continue;
    }
    toolName = call.function.name;
    if (toolName === 'buscar_stock_producto') {
      intent = stockQuerySchema.parse(args);
      if (isVagueStockRequest(intent)) {
        return { response: CLARIFICATION, intent, result: null, toolName };
      }
      result = await searchStock(intent);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ intent, ...result }) });
    } else if (toolName === 'consultar_stock_bajo') {
      const { threshold, pointOfSaleId } = lowStockSchema.parse(args);
      const data = await consultLowStock(threshold, pointOfSaleId);
      toolError = 'error' in data;
      allowedProducts = data.variants.map((variant) => ({ id: variant.productId, name: variant.productName }));
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(data) });
    } else if (toolName === 'consultar_ubicaciones') {
      const { pointOfSale } = locationsSchema.parse(args);
      const data = await consultLocations(pointOfSale);
      locationAnswer = formatLocationResponse(data, Boolean(pointOfSale));
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(data) });
    } else if (toolName === 'listar_productos_en_stock') {
      const { category } = catalogListSchema.parse(args);
      const data = await listAvailableProducts(category);
      catalogAnswer = formatAvailableProducts(data);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(data) });
    } else {
      const { type } = metricsSchema.parse(args);
      const data = await consultSalesMetrics(type);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(data) });
    }
  }

  if (!toolName) {
    return { response: CLARIFICATION, intent, result, toolName };
  }
  if (toolError) {
    return { response: 'No encontré el punto de venta indicado. ¿Podés confirmar su nombre?', intent, result, toolName };
  }
  if (locationAnswer) {
    return { response: locationAnswer, intent, result, toolName };
  }
  if (catalogAnswer) {
    return { response: catalogAnswer, intent, result, toolName };
  }

  if (result) {
    return { response: formatStockResponse(result), intent, result, toolName };
  }

  messages[0] = { role: 'system', content: AGENT_SYSTEM_PROMPT };
  const final = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages, temperature: 0.5 });
  const response = ensureProductLinks(final.choices[0]?.message?.content || 'No pude generar una respuesta.', allowedProducts);
  return { response, intent, result, toolName };
}
