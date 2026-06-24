import { Router } from 'express';
import { validate } from '../../shared/middleware/validate';
import { catalogController } from './catalog.controller';
import { createCatalogOrderSchema } from './catalog.validators';

const router = Router();

router.get('/public/products', catalogController.listPublicProducts);
router.get('/public/products/:id', catalogController.getPublicProductById);
router.post('/public/orders', validate(createCatalogOrderSchema), catalogController.createPublicOrder);
router.get('/public/orders/:id', catalogController.getPublicOrderById);

router.get('/orders', catalogController.listOrders);
router.get('/orders/:id', catalogController.getOrderById);
router.post('/orders/:id/report-payment', catalogController.reportPayment);
router.post('/orders/:id/confirm', catalogController.confirmOrder);
router.post('/orders/:id/cancel', catalogController.cancelOrder);
router.post('/orders/:id/reject', catalogController.rejectOrder);

export default router;
