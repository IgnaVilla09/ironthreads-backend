import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { validate } from '../../shared/middleware/validate';
import { transferStockSchema, setInventorySchema } from './inventory.validators';

const router = Router();

router.get('/', inventoryController.list);
router.get('/export', inventoryController.exportExcel);
router.get('/variants/:variantId', inventoryController.getByVariant);
router.put('/variants/:variantId', validate(setInventorySchema), inventoryController.setVariantInventory);
router.post('/transfer', validate(transferStockSchema), inventoryController.transfer);
router.get('/transfers', inventoryController.listTransfers);

export default router;
