import { Router } from 'express';
import { ventasController } from './ventas.controller';
import { validate } from '../../shared/middleware/validate';
import { createSaleSchema, verifyStockSchema } from './ventas.validators';

const router = Router();

router.get('/', ventasController.list);
router.get('/export', ventasController.exportExcel);
router.post('/verify-stock', validate(verifyStockSchema), ventasController.verifyStock);
router.get('/:id', ventasController.getById);
router.post('/', validate(createSaleSchema), ventasController.create);

export default router;
