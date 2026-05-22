import { Router } from 'express';
import { ventasController } from './ventas.controller';
import { validate } from '../../shared/middleware/validate';
import { createSaleSchema } from './ventas.validators';
import { z } from 'zod';

const router = Router();

const verifyStockSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string().uuid('Variante inválida'),
      quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
    })
  ).min(1, 'Debe haber al menos un item'),
});

router.get('/', ventasController.list);
router.get('/:id', ventasController.getById);
router.post('/', validate(createSaleSchema), ventasController.create);
router.post('/verify-stock', validate(verifyStockSchema), ventasController.verifyStock);

export default router;
