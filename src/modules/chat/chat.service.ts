import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { scoreCatalogProduct, searchTerms } from './product-search';

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
  found: boolean;
  summary: string;
  products: ProductCandidate[];
}

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
            'Palabras del producto solicitado, entre 1 y 3. Conservá el tipo de producto incluso si también informás la categoría: "gorritos" → ["gorritos"], "bolsos" → ["bolsos"], "remera baseball negra" → ["remera", "baseball"]. No incluyas colores, talles ni palabras de relleno.',
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

async function matchPointOfSale(intent: StockQueryIntent) {
  if (!intent.pointOfSale) {
    return { depositoIds: [] as string[], pointOfSaleIds: [] as string[] };
  }
  const term = intent.pointOfSale.toLowerCase();

  const depositos = await prisma.deposito.findMany();
  const depositoIds = depositos
    .filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.label.toLowerCase().includes(term)
    )
    .map((d) => d.id);

  const pos = await prisma.pointOfSale.findMany();
  const pointOfSaleIds = pos
    .filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.label.toLowerCase().includes(term)
    )
    .map((p) => p.id);

  return { depositoIds, pointOfSaleIds };
}

function catalogWhere(terms: string[]) {
  return {
    OR: terms.flatMap((term) => [
      { name: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
      { category: { is: { name: { contains: term, mode: 'insensitive' as const } } } },
      { category: { is: { label: { contains: term, mode: 'insensitive' as const } } } },
      { variants: { some: { sku: { contains: term, mode: 'insensitive' as const } } } },
    ]),
  };
}

async function findCatalogMatches(terms: string[], categoryTerms: string[]) {
  if (terms.length === 0) return [];

  const select = {
    id: true,
    name: true,
    description: true,
    category: { select: { name: true, label: true } },
    variants: { select: { sku: true } },
  } as const;
  const products = await prisma.product.findMany({
    where: catalogWhere(terms),
    select,
    // Only lightweight fields at this stage; stock is loaded for the best matches below.
    take: 300,
  });

  const matches = new Map(products.map((product) => [product.id, product]));
  // A broad word (e.g. "remera") must not crowd out a more specific one
  // (e.g. "baseball") when the catalog has more than 300 matches.
  if (products.length === 300 && terms.length > 1) {
    for (const term of terms) {
      const specific = await prisma.product.findMany({
        where: catalogWhere([term]), select, take: 100,
      });
      for (const product of specific) matches.set(product.id, product);
    }
  }

  return [...matches.values()].map((product) => ({
    id: product.id,
    score: scoreCatalogProduct(product, terms, categoryTerms),
  })).filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8).map((product) => product.id);
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

function buildProductCandidates(
  pool: Awaited<ReturnType<typeof loadCandidatePool>>,
  locationFilter: { depositoIds: string[]; pointOfSaleIds: string[] }
): ProductCandidate[] {
  const hasStockLocation =
    locationFilter.pointOfSaleIds.length > 0 || locationFilter.depositoIds.length > 0;

  return pool
    .map((product): ProductCandidate => {
      const variants = product.variants.map((variant): VariantCandidate => {
        const locations = variant.inventory
          .filter((item) => {
            if (!hasStockLocation) return true;
            const byDeposito = item.deposito && locationFilter.depositoIds.includes(item.deposito.id);
            const byPos = locationFilter.pointOfSaleIds.includes(item.pointOfSale.id);
            return Boolean(byDeposito || byPos);
          })
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
    });
}

async function searchStock(intent: StockQueryIntent): Promise<StockResult> {
  const terms = searchTerms(intent.keywords ?? []);
  const categoryTerms = searchTerms(intent.category ? [intent.category] : []);
  const ids = await findCatalogMatches(terms.length > 0 ? terms : categoryTerms, categoryTerms);
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
    locationFilter
  );

  const summary =
    candidates.length === 0
      ? 'No se encontraron productos que coincidan con la consulta.'
      : `Se encontraron ${candidates.length} producto(s) posibles con sus variantes y stock por ubicación.`;

  return { found: candidates.length > 0, summary, products: candidates };
}

const conversationMemory = new Map<string, ChatTurn[]>();
const MAX_TURNS = 5;
const MAX_CONVERSATIONS = 200;

interface ChatTurn {
  user: string;
  intent: StockQueryIntent | null;
  result: StockResult | null;
  response: string;
}

function pushTurn(conversationId: string, turn: ChatTurn) {
  let turns = conversationMemory.get(conversationId);
  if (!turns) {
    if (conversationMemory.size >= MAX_CONVERSATIONS) {
      const oldest = conversationMemory.keys().next().value;
      if (oldest !== undefined) conversationMemory.delete(oldest);
    }
    turns = [];
    conversationMemory.set(conversationId, turns);
  }
  turns.push(turn);
  if (turns.length > MAX_TURNS) turns.shift();
}

function buildConversationContext(pastTurns: ChatTurn[]): string | null {
  if (pastTurns.length === 0) return null;
  return JSON.stringify(
    pastTurns.map((t) => ({
      user: t.user,
      intent: t.intent,
      response: t.response,
      products: (t.result?.products ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        variants: p.variants.map((v) => ({
          color: v.color,
          size: v.size,
          locations: v.locations,
          totalStock: v.totalStock,
        })),
      })),
    }))
  );
}

export const chatService = {
  async handleMessage(message: string, conversationId?: string) {
    const id = conversationId || 'default';
    const pastTurns = conversationMemory.get(id) ?? [];

    const intent = await extractQueryIntent(message, pastTurns);

    if (!intent || Object.keys(intent).length === 0) {
      const response = await generateFallbackResponse(message, pastTurns);
      pushTurn(id, { user: message, intent: null, result: null, response });
      return response;
    }

    const stock = await searchStock(intent);

    const response = await generateAssistantResponse(message, intent, stock, pastTurns);
    pushTurn(id, { user: message, intent, result: stock, response });
    return response;
  },

  forgetConversation(conversationId: string) {
    conversationMemory.delete(conversationId);
  },
};

async function extractQueryIntent(message: string, pastTurns: ChatTurn[]): Promise<StockQueryIntent | null> {
  try {
    const context = buildConversationContext(pastTurns);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'Analizá el mensaje del cliente y extraé qué producto busca en una tienda de indumentaria. Conservá el nombre del tipo de producto aunque sea plural o diminutivo ("gorritos", "bolsos"); no lo reemplaces por una categoría inventada. Si el mensaje actual está incompleto (ej: "y en qué talles?", "en qué colores?"), usá el contexto de conversación previa para deducir de qué se sigue hablando. Respondé solo con la llamada a la herramienta.',
      },
    ];

    if (context) {
      messages.push({
        role: 'user',
        content: `Historial de conversación previa (JSON):\n${context}`,
      });
    }

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: [SEARCH_PRODUCT_TOOL],
      tool_choice: { type: 'function', function: { name: 'buscar_stock_producto' } },
      temperature: 0,
    });

    const raw = JSON.parse(
      (completion.choices[0]?.message?.tool_calls?.[0] as unknown as {
        function?: { arguments?: string };
      })?.function?.arguments ?? '{}'
    ) as StockQueryIntent;

    return raw;
  } catch (error) {
    console.error('[chat:extract] Error extrayendo intención', error);
    return null;
  }
}

async function generateAssistantResponse(
  message: string,
  intent: StockQueryIntent,
  results: StockResult,
  pastTurns: ChatTurn[]
) {
  const context = buildConversationContext(pastTurns);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'Sos un asistente de ventas de una tienda de remeras e indumentaria. Tenés acceso a los datos REALES de stock en JSON.\n' +
        'Analizá el mensaje del cliente y comparalo con los productos de la base de datos: el nombre que el cliente usa puede NO coincidir literalmente con el del catálogo. Elegí el producto que mejor coincida con lo que pidió.\n' +
        'Usá el historial de conversación previa para mantener el hilo: si el cliente pregunta "y en qué talles?", "en qué colores?", "y dónde está?", referite a lo ya hablado. Si no hay historial, ignoralo.\n' +
        'Respondé de forma coloquial y cercana indicando:\n' +
        '1) Si hay stock del color/talle pedido: dónde (punto de venta / depósito) y cuántas unidades.\n' +
        '2) Si NO hay stock del color/talle exacto, decí qué alternativas quedan (colores y talles con stock, con ubicación y cantidad).\n' +
        'Incluí por cada producto recomendado un enlace markdown: [Nombre del producto](/productos/{id}).\n' +
        'El ÚNICO tipo de enlace permitido es el interno de producto /productos/{id}. NO incluyas NUNCA URLs externas (http/https) como rutas de imágenes, de almacenamiento ni de ningún tipo.\n' +
        'Usá emojis con moderación. NO inventes stock, colores, talles ni productos que no estén en los JSON provistos.',
    },
    { role: 'user', content: message },
    {
      role: 'user',
      content:
        `Contexto de búsqueda que usó el sistema (intención detectada): ${JSON.stringify(intent)}\n` +
        `Resultados de la búsqueda en base de datos (JSON):\n${JSON.stringify(results)}` +
        (context ? `\n\nHistorial de conversación previa (JSON):\n${context}` : ''),
    },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
}

async function generateFallbackResponse(message: string, pastTurns: ChatTurn[]) {
  const context = buildConversationContext(pastTurns);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'Sos un asistente de ventas de una tienda de remeras. Respondé de forma coloquial, preguntando qué está buscando el cliente (producto, color, talle) y mencioná que tenés remeras, buzos, pantalones y accesorios.',
    },
  ];

  if (context) {
    messages.push({ role: 'user', content: `Historial de conversación previa (JSON):\n${context}` });
  }

  messages.push({ role: 'user', content: message });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
}
