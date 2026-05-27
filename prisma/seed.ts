import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'BLANCO', sizeName: 'S' },
      { colorName: 'BLANCO', sizeName: 'M' },
      { colorName: 'BLANCO', sizeName: 'L' },
      { colorName: 'BLANCO', sizeName: 'XL' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
    ],
  },
  {
    name: 'REMERA OVERSIZE',
    categoryName: 'REMERA',
    description: 'Remera oversized con mangas anchas y drop de 2 talles. Algodón jersey 30/1.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
      { colorName: 'GRIS', sizeName: 'XL' },
      { colorName: 'BLANCO', sizeName: 'M' },
      { colorName: 'BLANCO', sizeName: 'L' },
    ],
  },
  {
    name: 'REMERA MANGA LARGA',
    categoryName: 'REMERA',
    description: 'Remera térmica de manga larga en algodón peinado 24/1.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'BLANCO', sizeName: 'M' },
      { colorName: 'BLANCO', sizeName: 'L' },
    ],
  },
  {
    name: 'PANTALON CARGO',
    categoryName: 'PANTALON',
    description: 'Pantalón cargo recto con 6 bolsillos utilitarios. Tela sarza 280 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'NEGRO', sizeName: 'XXL' },
      { colorName: 'VERDE', sizeName: 'M' },
      { colorName: 'VERDE', sizeName: 'L' },
      { colorName: 'VERDE', sizeName: 'XL' },
    ],
  },
  {
    name: 'PANTALON JOGGER',
    categoryName: 'PANTALON',
    description: 'Jogger urbano con puños elastizados. Tela Oxford 320 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
      { colorName: 'GRIS', sizeName: 'XL' },
    ],
  },
  {
    name: 'BUZO CANGURU',
    categoryName: 'BUZO',
    description: 'Buzo canguru clásico con capucha forrada. Perchado 320 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'NEGRO', sizeName: 'XXL' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
      { colorName: 'GRIS', sizeName: 'XL' },
      { colorName: 'ROJO', sizeName: 'M' },
      { colorName: 'ROJO', sizeName: 'L' },
    ],
  },
  {
    name: 'BUZO OVERSIZE',
    categoryName: 'BUZO',
    description: 'Buzo oversized con drop shoulders. Perchado premium 380 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
      { colorName: 'GRIS', sizeName: 'XL' },
    ],
  },
  {
    name: 'CAMPERA PILOTO',
    categoryName: 'CAMPERA',
    description: 'Campera piloto acolchada. Nylon ripstop 200 gsm, impermeable.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'VERDE', sizeName: 'M' },
      { colorName: 'VERDE', sizeName: 'L' },
    ],
  },
  {
    name: 'CAMPERA JEAN',
    categoryName: 'CAMPERA',
    description: 'Campera de jean clásica. Denim 340 gsm elastizado.',
    variants: [
      { colorName: 'AZUL', sizeName: 'M' },
      { colorName: 'AZUL', sizeName: 'L' },
      { colorName: 'AZUL', sizeName: 'XL' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
    ],
  },
  {
    name: 'CAMISA LINO',
    categoryName: 'CAMISA',
    description: 'Camisa de lino premium 100% natural. Corte regular fit.',
    variants: [
      { colorName: 'BLANCO', sizeName: 'S' },
      { colorName: 'BLANCO', sizeName: 'M' },
      { colorName: 'BLANCO', sizeName: 'L' },
      { colorName: 'BLANCO', sizeName: 'XL' },
      { colorName: 'AZUL', sizeName: 'M' },
      { colorName: 'AZUL', sizeName: 'L' },
      { colorName: 'AZUL', sizeName: 'XL' },
    ],
  },
  {
    name: 'CAMISA OVERSIZE',
    categoryName: 'CAMISA',
    description: 'Camisa oversized con cuello mao. Algodón popelín 120 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
    ],
  },
  {
    name: 'MUSCULOSA BASICA',
    categoryName: 'MUSCULOSA',
    description: 'Musculosa básica de algodón jersey 24/1. Ideal para gimnasio.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'BLANCO', sizeName: 'M' },
      { colorName: 'BLANCO', sizeName: 'L' },
      { colorName: 'GRIS', sizeName: 'M' },
      { colorName: 'GRIS', sizeName: 'L' },
    ],
  },
  {
    name: 'SHORT DEPORTIVO',
    categoryName: 'SHORT',
    description: 'Short deportivo dry-fit. Cintura elastizada con cordón.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'S' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'AZUL', sizeName: 'M' },
      { colorName: 'AZUL', sizeName: 'L' },
      { colorName: 'ROJO', sizeName: 'M' },
      { colorName: 'ROJO', sizeName: 'L' },
    ],
  },
  {
    name: 'SHORT CARGO',
    categoryName: 'SHORT',
    description: 'Short cargo holgado con 4 bolsillos. Sarza 240 gsm.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
      { colorName: 'VERDE', sizeName: 'M' },
      { colorName: 'VERDE', sizeName: 'L' },
    ],
  },
  {
    name: 'BERMUDA DENIM',
    categoryName: 'BERMUDA',
    description: 'Bermuda de denim elastizado 280 gsm. Corte moderno.',
    variants: [
      { colorName: 'AZUL', sizeName: 'S' },
      { colorName: 'AZUL', sizeName: 'M' },
      { colorName: 'AZUL', sizeName: 'L' },
      { colorName: 'AZUL', sizeName: 'XL' },
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'NEGRO', sizeName: 'XL' },
    ],
  },
  {
    name: 'GORRA TRUCKER',
    categoryName: 'ACCESORIO',
    description: 'Gorra trucker 5 paneles. Malla transpirable, cierre clip.',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'ROJO', sizeName: 'M' },
      { colorName: 'ROJO', sizeName: 'L' },
      { colorName: 'AZUL', sizeName: 'M' },
      { colorName: 'AZUL', sizeName: 'L' },
    ],
  },
  {
    name: 'MOCHILA URBANA',
    categoryName: 'ACCESORIO',
    description: 'Mochila urbana 25 L con compartimento para notebook 15".',
    variants: [
      { colorName: 'NEGRO', sizeName: 'M' },
      { colorName: 'NEGRO', sizeName: 'L' },
      { colorName: 'GRIS', sizeName: 'M' },
    ],
  },
];

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR').format(n);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('        IRON STOCK — Database Seed');
  console.log('═══════════════════════════════════════════\n');

  console.log('🧹 Cleaning existing data...');
  await prisma.stockTransfer.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.pointOfSale.deleteMany();
  await prisma.deposito.deleteMany();
  await prisma.category.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  console.log('   ✓ Done\n');

  console.log('📁 Seeding reference data...');

  const deptoPos = await prisma.pointOfSale.create({
    data: { name: 'DEPARTAMENTO', label: 'Departamento' },
  });
  const gymPos = await prisma.pointOfSale.create({
    data: { name: 'GIMNASIO', label: 'Gimnasio' },
  });

  const deptoCaja1 = await prisma.deposito.create({
    data: { name: 'CAJA1', label: 'Caja 1', pointOfSaleId: deptoPos.id },
  });
  const deptoCaja2 = await prisma.deposito.create({
    data: { name: 'CAJA2', label: 'Caja 2', pointOfSaleId: deptoPos.id },
  });
  const gymEstante = await prisma.deposito.create({
    data: { name: 'ESTANTE_A', label: 'Estante A', pointOfSaleId: gymPos.id },
  });

  console.log('   ✓ 2 points of sale, 3 depositos');

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

  // Seed products and variants, then create inventory items
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
      },
    });

    for (const v of productData.variants) {
      const colorId = colorMap.get(v.colorName);
      const sizeId = sizeMap.get(v.sizeName);
      if (!colorId || !sizeId) {
        throw new Error(`Missing color "${v.colorName}" or size "${v.sizeName}" for ${productData.name}`);
      }

      const variant = await prisma.productVariant.create({
        data: {
          sku: generateSku(productData.name, v.colorName, v.sizeName),
          productId: product.id,
          colorId,
          sizeId,
        },
      });

      const stockInDepto = Math.floor(Math.random() * 50) + 5;
      const stockInGym = Math.floor(Math.random() * 20) + 2;

      await prisma.inventoryItem.create({
        data: {
          variantId: variant.id,
          pointOfSaleId: deptoPos.id,
          depositoId: deptoCaja1.id,
          stock: stockInDepto,
        },
      });

      await prisma.inventoryItem.create({
        data: {
          variantId: variant.id,
          pointOfSaleId: gymPos.id,
          depositoId: gymEstante.id,
          stock: stockInGym,
        },
      });

      totalVariants++;
      totalStock += stockInDepto + stockInGym;
    }

    console.log(
      `  📦  ${productData.name.padEnd(24)} ` +
      `│ ${String(productData.variants.length).padStart(2)} vars │ ${fmt(totalStock).padStart(5)} units (total)`
    );
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('                  SUMMARY');
  console.log('═══════════════════════════════════════════\n');

  console.log(`   📦  Products:     ${catalog.length}`);
  console.log(`   🏷️   Variants:    ${totalVariants}`);
  console.log(`   📊  Total Stock:  ${fmt(totalStock)} units`);
  console.log(`   🏪  Points of Sale: Departamento + Gimnasio`);
  console.log(`   📋  Each variant has stock in BOTH locations\n`);

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
