import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Seed data ────────────────────────────────────────

interface CategorySeed {
  name: string;
  label: string;
}

interface ColorSeed {
  name: string;
  label: string;
  hex: string;
}

interface SizeSeed {
  name: string;
  label: string;
}

interface VariantSeed {
  colorName: string;
  sizeName: string;
  stock: number;
}

interface ProductSeed {
  name: string;
  description: string;
  categoryName: string;
  variants: VariantSeed[];
}

const categories: CategorySeed[] = [
  { name: 'REMERA', label: 'Remera' },
  { name: 'PANTALON', label: 'Pantalón' },
  { name: 'BUZO', label: 'Buzo' },
  { name: 'CAMPERA', label: 'Campera' },
  { name: 'CAMISA', label: 'Camisa' },
  { name: 'MUSCULOSA', label: 'Musculosa' },
  { name: 'SHORT', label: 'Short' },
  { name: 'BERMUDA', label: 'Bermuda' },
  { name: 'ACCESORIO', label: 'Accesorio' },
];

const colors: ColorSeed[] = [
  { name: 'NEGRO', label: 'Negro', hex: '#000000' },
  { name: 'BLANCO', label: 'Blanco', hex: '#FFFFFF' },
  { name: 'GRIS', label: 'Gris', hex: '#808080' },
  { name: 'AZUL', label: 'Azul', hex: '#0066CC' },
  { name: 'ROJO', label: 'Rojo', hex: '#CC0000' },
  { name: 'VERDE', label: 'Verde', hex: '#009933' },
  { name: 'AMARILLO', label: 'Amarillo', hex: '#FFCC00' },
  { name: 'ROSA', label: 'Rosa', hex: '#FF66B2' },
  { name: 'VIOLETA', label: 'Violeta', hex: '#6600CC' },
  { name: 'NARANJA', label: 'Naranja', hex: '#FF6600' },
  { name: 'MARRON', label: 'Marrón', hex: '#663300' },
];

const sizes: SizeSeed[] = [
  { name: 'XS', label: 'XS' },
  { name: 'S', label: 'S' },
  { name: 'M', label: 'M' },
  { name: 'L', label: 'L' },
  { name: 'XL', label: 'XL' },
  { name: 'XXL', label: 'XXL' },
  { name: 'XXXL', label: 'XXXL' },
];

function generateSku(name: string, colorName: string, sizeName: string): string {
  const namePart = name
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  return `${namePart}-${colorName}-${sizeName}`;
}

const catalog: ProductSeed[] = [
  {
    name: 'REMERA CLASSIC',
    categoryName: 'REMERA',
    description: 'Remera clásica de algodón peinado 24/1. Corte recto, costuras reforzadas y cuello ribeteado.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 85 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 120 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 95 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 60 },
      { colorName: 'BLANCO', sizeName: 'S', stock: 70 },
      { colorName: 'BLANCO', sizeName: 'M', stock: 110 },
      { colorName: 'BLANCO', sizeName: 'L', stock: 80 },
      { colorName: 'BLANCO', sizeName: 'XL', stock: 45 },
      { colorName: 'GRIS', sizeName: 'M', stock: 65 },
      { colorName: 'GRIS', sizeName: 'L', stock: 50 },
    ],
  },
  {
    name: 'REMERA OVERSIZE',
    categoryName: 'REMERA',
    description: 'Remera oversized con mangas anchas y drop de 2 talles. Algodón jersey 30/1.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M', stock: 55 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 70 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 40 },
      { colorName: 'GRIS', sizeName: 'M', stock: 35 },
      { colorName: 'GRIS', sizeName: 'L', stock: 45 },
      { colorName: 'GRIS', sizeName: 'XL', stock: 25 },
      { colorName: 'BLANCO', sizeName: 'M', stock: 30 },
      { colorName: 'BLANCO', sizeName: 'L', stock: 40 },
    ],
  },
  {
    name: 'REMERA MANGA LARGA',
    categoryName: 'REMERA',
    description: 'Remera térmica de manga larga en algodón peinado 24/1.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 40 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 65 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 50 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 30 },
      { colorName: 'BLANCO', sizeName: 'M', stock: 45 },
      { colorName: 'BLANCO', sizeName: 'L', stock: 35 },
    ],
  },
  {
    name: 'PANTALON CARGO',
    categoryName: 'PANTALON',
    description: 'Pantalón cargo recto con 6 bolsillos utilitarios. Tela sarza 280 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 30 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 55 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 45 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 25 },
      { colorName: 'NEGRO', sizeName: 'XXL', stock: 10 },
      { colorName: 'VERDE', sizeName: 'M', stock: 20 },
      { colorName: 'VERDE', sizeName: 'L', stock: 15 },
      { colorName: 'VERDE', sizeName: 'XL', stock: 8 },
    ],
  },
  {
    name: 'PANTALON JOGGER',
    categoryName: 'PANTALON',
    description: 'Jogger urbano con puños elastizados. Tela Oxford 320 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 35 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 60 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 50 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 30 },
      { colorName: 'GRIS', sizeName: 'M', stock: 25 },
      { colorName: 'GRIS', sizeName: 'L', stock: 20 },
      { colorName: 'GRIS', sizeName: 'XL', stock: 12 },
    ],
  },
  {
    name: 'BUZO CANGURU',
    categoryName: 'BUZO',
    description: 'Buzo canguru clásico con capucha forrada. Perchado 320 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 20 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 45 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 35 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 18 },
      { colorName: 'NEGRO', sizeName: 'XXL', stock: 8 },
      { colorName: 'GRIS', sizeName: 'M', stock: 30 },
      { colorName: 'GRIS', sizeName: 'L', stock: 22 },
      { colorName: 'GRIS', sizeName: 'XL', stock: 10 },
      { colorName: 'ROJO', sizeName: 'M', stock: 15 },
      { colorName: 'ROJO', sizeName: 'L', stock: 10 },
    ],
  },
  {
    name: 'BUZO OVERSIZE',
    categoryName: 'BUZO',
    description: 'Buzo oversized con drop shoulders. Perchado premium 380 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M', stock: 25 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 35 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 20 },
      { colorName: 'GRIS', sizeName: 'M', stock: 18 },
      { colorName: 'GRIS', sizeName: 'L', stock: 28 },
      { colorName: 'GRIS', sizeName: 'XL', stock: 15 },
    ],
  },
  {
    name: 'CAMPERA PILOTO',
    categoryName: 'CAMPERA',
    description: 'Campera piloto acolchada. Nylon ripstop 200 gsm, impermeable.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 10 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 22 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 18 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 8 },
      { colorName: 'VERDE', sizeName: 'M', stock: 12 },
      { colorName: 'VERDE', sizeName: 'L', stock: 7 },
    ],
  },
  {
    name: 'CAMPERA JEAN',
    categoryName: 'CAMPERA',
    description: 'Campera de jean clásica. Denim 340 gsm elastizado.',
    variants: [
      { colorName: 'AZUL', sizeName: 'M', stock: 15 },
      { colorName: 'AZUL', sizeName: 'L', stock: 12 },
      { colorName: 'AZUL', sizeName: 'XL', stock: 5 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 10 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 8 },
    ],
  },
  {
    name: 'CAMISA LINO',
    categoryName: 'CAMISA',
    description: 'Camisa de lino premium 100% natural. Corte regular fit.',
    variants: [
      { colorName: 'BLANCO', sizeName: 'S', stock: 20 },
      { colorName: 'BLANCO', sizeName: 'M', stock: 35 },
      { colorName: 'BLANCO', sizeName: 'L', stock: 28 },
      { colorName: 'BLANCO', sizeName: 'XL', stock: 15 },
      { colorName: 'AZUL', sizeName: 'M', stock: 22 },
      { colorName: 'AZUL', sizeName: 'L', stock: 18 },
      { colorName: 'AZUL', sizeName: 'XL', stock: 10 },
    ],
  },
  {
    name: 'CAMISA OVERSIZE',
    categoryName: 'CAMISA',
    description: 'Camisa oversized con cuello mao. Algodón popelín 120 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M', stock: 12 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 18 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 10 },
      { colorName: 'GRIS', sizeName: 'M', stock: 8 },
      { colorName: 'GRIS', sizeName: 'L', stock: 14 },
    ],
  },
  {
    name: 'MUSCULOSA BASICA',
    categoryName: 'MUSCULOSA',
    description: 'Musculosa básica de algodón jersey 24/1. Ideal para gimnasio.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 100 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 150 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 120 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 80 },
      { colorName: 'BLANCO', sizeName: 'M', stock: 90 },
      { colorName: 'BLANCO', sizeName: 'L', stock: 70 },
      { colorName: 'GRIS', sizeName: 'M', stock: 60 },
      { colorName: 'GRIS', sizeName: 'L', stock: 45 },
    ],
  },
  {
    name: 'SHORT DEPORTIVO',
    categoryName: 'SHORT',
    description: 'Short deportivo dry-fit. Cintura elastizada con cordón.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S', stock: 40 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 65 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 50 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 30 },
      { colorName: 'AZUL', sizeName: 'M', stock: 35 },
      { colorName: 'AZUL', sizeName: 'L', stock: 25 },
      { colorName: 'ROJO', sizeName: 'M', stock: 20 },
      { colorName: 'ROJO', sizeName: 'L', stock: 15 },
    ],
  },
  {
    name: 'SHORT CARGO',
    categoryName: 'SHORT',
    description: 'Short cargo holgado con 4 bolsillos. Sarza 240 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M', stock: 30 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 25 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 15 },
      { colorName: 'VERDE', sizeName: 'M', stock: 18 },
      { colorName: 'VERDE', sizeName: 'L', stock: 12 },
    ],
  },
  {
    name: 'BERMUDA DENIM',
    categoryName: 'BERMUDA',
    description: 'Bermuda de denim elastizado 280 gsm. Corte moderno.',
    variants: [
      { colorName: 'AZUL', sizeName: 'S', stock: 15 },
      { colorName: 'AZUL', sizeName: 'M', stock: 30 },
      { colorName: 'AZUL', sizeName: 'L', stock: 22 },
      { colorName: 'AZUL', sizeName: 'XL', stock: 10 },
      { colorName: 'NEGRO', sizeName: 'M', stock: 20 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 16 },
      { colorName: 'NEGRO', sizeName: 'XL', stock: 8 },
    ],
  },
  {
    name: 'GORRA TRUCKER',
    categoryName: 'ACCESORIO',
    description: 'Gorra trucker 5 paneles. Malla transpirable, cierre clip.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M', stock: 12 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 8 },
      { colorName: 'ROJO', sizeName: 'M', stock: 5 },
      { colorName: 'ROJO', sizeName: 'L', stock: 3 },
      { colorName: 'AZUL', sizeName: 'M', stock: 7 },
      { colorName: 'AZUL', sizeName: 'L', stock: 4 },
    ],
  },
  {
    name: 'MOCHILA URBANA',
    categoryName: 'ACCESORIO',
    description: 'Mochila urbana 25 L con compartimento para notebook 15".',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M', stock: 18 },
      { colorName: 'NEGRO', sizeName: 'L', stock: 10 },
      { colorName: 'GRIS', sizeName: 'M', stock: 8 },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR').format(n);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('        IRON STOCK — Database Seed');
  console.log('═══════════════════════════════════════════\n');

  // ── 1. Clean ──────────────────────────────────────
  console.log('🧹 Cleaning existing data...');
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.pointOfSale.deleteMany();
  await prisma.category.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  console.log('   ✓ Done\n');

  // ── 2. Seed reference tables ──────────────────────
  console.log('📁 Seeding reference data...');

  const pointOfSale = await prisma.pointOfSale.create({
    data: { name: 'DEPARTAMENTO', label: 'Departamento' },
  });
  console.log('   ✓ 1 point of sale');

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    categoryMap.set(created.name, created.id);
  }
  console.log(`   ✓ ${categories.length} categories`);

  const colorMap = new Map<string, string>();
  for (const col of colors) {
    const created = await prisma.color.create({ data: col });
    colorMap.set(created.name, created.id);
  }
  console.log(`   ✓ ${colors.length} colors`);

  const sizeMap = new Map<string, string>();
  for (const sz of sizes) {
    const created = await prisma.size.create({ data: sz });
    sizeMap.set(created.name, created.id);
  }
  console.log(`   ✓ ${sizes.length} sizes\n`);

  // ── 3. Seed products with variants ────────────────
  let totalVariants = 0;
  let totalStock = 0;

  for (const productData of catalog) {
    const categoryId = categoryMap.get(productData.categoryName);
    if (!categoryId) {
      console.error(`   ❌ Category "${productData.categoryName}" not found`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        categoryId,
        pointOfSaleId: pointOfSale.id,
        variants: {
          create: productData.variants.map((v) => {
            const colorId = colorMap.get(v.colorName);
            const sizeId = sizeMap.get(v.sizeName);
            if (!colorId || !sizeId) {
              throw new Error(
                `Missing color "${v.colorName}" or size "${v.sizeName}" for ${productData.name}`
              );
            }
            return {
              colorId,
              sizeId,
              stock: v.stock,
              sku: generateSku(productData.name, v.colorName, v.sizeName),
            };
          }),
        },
      },
      include: { variants: true },
    });

    const variantCount = product.variants.length;
    const productStock = product.variants.reduce((s, v) => s + v.stock, 0);
    totalVariants += variantCount;
    totalStock += productStock;

    const stockLabel =
      productStock < 30
        ? '⚠️ Low'
        : productStock < 100
          ? '📦 Med'
          : '✅ High';

    console.log(
      `  ${stockLabel}  ${productData.name.padEnd(24)} ` +
      `│ ${String(variantCount).padStart(2)} vars │ ${fmt(productStock).padStart(5)} units`
    );
  }

  // ── 4. Summary ────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('                  SUMMARY');
  console.log('═══════════════════════════════════════════\n');

  console.log(`   📦  Products:     ${catalog.length}`);
  console.log(`   🏷️   Variants:    ${totalVariants}`);
  console.log(`   📊  Total Stock:  ${fmt(totalStock)} units`);

  console.log('\n═══════════════════════════════════════════');
  console.log('   ✅  Seeding completed successfully!');
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
