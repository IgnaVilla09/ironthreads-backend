import { Router } from 'express';
import { productController } from './product.controller';
import { validate } from '../../shared/middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from './product.validators';
import { prisma } from '../../config/database';

const router = Router();

router.get('/offline-snapshot', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true, name: true, description: true, categoryId: true, price: true, createdAt: true, updatedAt: true,
        category: { select: { id: true, name: true, label: true } },
        variants: { select: {
          id: true, productId: true, colorId: true, sizeId: true, sku: true, createdAt: true, updatedAt: true,
          color: { select: { id: true, name: true, label: true, hex: true } },
          size: { select: { id: true, name: true, label: true } },
          inventory: { select: { id: true, variantId: true, pointOfSaleId: true, depositoId: true, stock: true,
            pointOfSale: { select: { id: true, name: true, label: true } },
            deposito: { select: { id: true, name: true, label: true, pointOfSaleId: true } },
          } },
        } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { updatedAt: new Date().toISOString(), products: products.map(({ variants, ...product }) => ({
      ...product, imageUrl: null,
      variants: variants.map(({ inventory, ...variant }) => ({ ...variant,
        stock: inventory.reduce((sum, row) => sum + row.stock, 0), locations: inventory,
      })),
    })) } });
  } catch (error) { next(error); }
});
router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', validate(createProductSchema), productController.create);
router.put('/:id', validate(updateProductSchema), productController.update);
router.delete('/:id', productController.delete);

router.get('/:id/variants', productController.listVariants);
router.get('/:id/variants/:variantId', productController.getVariantById);
router.post('/:id/variants', validate(createVariantSchema), productController.createVariant);
router.put('/:id/variants/:variantId', validate(updateVariantSchema), productController.updateVariant);
router.delete('/:id/variants/:variantId', productController.deleteVariant);

export default router;
