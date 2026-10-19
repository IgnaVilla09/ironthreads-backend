import { Router } from 'express';
import { ventasController } from './ventas.controller';
import { validate } from '../../shared/middleware/validate';
import { createSaleSchema, verifyStockSchema } from './ventas.validators';
import { editSaleSchema } from './sale-edit.validators';

const router = Router();

router.get('/', ventasController.list);
router.get('/export', ventasController.exportExcel);
router.post('/verify-stock', validate(verifyStockSchema), ventasController.verifyStock);
router.post('/:id/mobbex/qr', ventasController.createMobbexQr);
router.post('/:id/receipt/resend', ventasController.resendReceipt);
router.get('/:id', ventasController.getById);
router.get('/:id/edits', ventasController.history);
router.post('/:id/edits', validate(editSaleSchema), ventasController.edit);
router.post('/', validate(createSaleSchema), ventasController.create);

export default router;
