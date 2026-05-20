import { Router } from 'express';
import { productController } from './product.controller';
import { validate } from '../../shared/middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from './product.validators';

const router = Router();

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
