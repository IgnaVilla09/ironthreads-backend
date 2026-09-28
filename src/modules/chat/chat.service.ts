import OpenAI from 'openai';
import { prisma } from '../../config/database';

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
      'Buscar stock de productos en la base de datos. Analizá el mensaje y extraé los datos que el usuario busca. Es importante extraer KEYWORDS cortas y relevantes del producto (sin palabras vacías), porque la base de datos no tiene los nombres exactos que usa el cliente.',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Términos clave del producto mencionado, entre 1 y 3, separados por palabra. Ej: "remera baseball negra" → ["baseball"]. "buzo del mundial" → ["mundial", "buzo"]. NO incluyas frases completas, ni palabras de relleno como "hay", "stock", "de", "la", "del", ni colores ni talles.',
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

function normalizeTerm(term: string): string {
  return term.toLowerCase().trim();
}

function scoreProduct(name: string, categoryLabel: string, keywords: string[]): number {
  if (keywords.length === 0) return 1;

  const haystack = `${name} ${categoryLabel}`.toLowerCase();
  const matched = keywords.filter((k) => haystack.includes(normalizeTerm(k)));

  if (matched.length === 0) return 0;

  return matched.length / keywords.length;
}

async function loadCandidatePool(intent: StockQueryIntent) {
  const keywords = (intent.keywords ?? []).map(normalizeTerm).filter(Boolean);

  const where: Record<string, unknown> = {};

  if (keywords.length > 0) {
    const keywordMatches = keywords.map((k) => ({ name: { contains: k, mode: 'insensitive' as const } }));
    where.OR = keywordMatches;
  }

  if (intent.category) {
    where.category = { name: intent.category.toUpperCase() };
  }

  return prisma.product.findMany({
    where,
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
    orderBy: { name: 'asc' },
    take: 40,
  });
}

function buildProductCandidates(
  pool: Awaited<ReturnType<typeof loadCandidatePool>>,
  intent: StockQueryIntent,
  locationFilter: { depositoIds: string[]; pointOfSaleIds: string[] }
): ProductCandidate[] {
  const keywords = (intent.keywords ?? []).map(normalizeTerm).filter(Boolean);
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
    })
    .map((product) => ({
      product,
      score: scoreProduct(product.name, product.category, keywords),
    }))
    .filter((entry) => (keywords.length > 0 ? entry.score > 0 : true))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 8)
    .map((entry) => entry.product);
}

async function searchStock(intent: StockQueryIntent): Promise<StockResult> {
  const locationFilter = await matchPointOfSale(intent);

  const pool = await loadCandidatePool(intent);

  let candidates = buildProductCandidates(pool, intent, locationFilter);

  // Fallback relajado: si no hubo resultados con las keywords,
  // buscar con un subconjunto de keywords más cortas (tokens sueltos).
  const keywords = (intent.keywords ?? []).map(normalizeTerm).filter(Boolean);
  if (candidates.length === 0 && keywords.length > 1) {
    for (const token of keywords) {
      const relaxedPool = await prisma.product.findMany({
        where: { name: { contains: token, mode: 'insensitive' } },
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
        orderBy: { name: 'asc' },
        take: 5,
      });

      if (relaxedPool.length > 0) {
        candidates = buildProductCandidates(relaxedPool, intent, locationFilter);
        break;
      }
    }
  }

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
          'Analizá el mensaje del cliente y extraé qué producto busca en una tienda de indumentaria. Pensá cuáles son los términos realmente relevantes para buscar en un catálogo, no repitas la frase completa. Si el mensaje actual está incompleto (ej: "y en qué talles?", "en qué colores?"), usá el contexto de conversación previa para deducir de qué se sigue hablando. Respondé solo con la llamada a la herramienta.',
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
      tool_choice: 'auto',
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