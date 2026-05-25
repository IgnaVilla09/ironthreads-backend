import { Router } from 'express';
import { settingsController } from './settings.controller';
import { validate } from '../../shared/middleware/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  createColorSchema,
  updateColorSchema,
  createSizeSchema,
  updateSizeSchema,
  createPointOfSaleSchema,
  updatePointOfSaleSchema,
} from './settings.validators';

const router = Router();

// ── Categories ────────────────────────────────────────
router.get('/categories', settingsController.listCategories);
router.get('/categories/:id', settingsController.getCategoryById);
router.post('/categories', validate(createCategorySchema), settingsController.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), settingsController.updateCategory);
router.delete('/categories/:id', settingsController.deleteCategory);

// ── Colors ────────────────────────────────────────────
router.get('/colors', settingsController.listColors);
router.get('/colors/:id', settingsController.getColorById);
router.post('/colors', validate(createColorSchema), settingsController.createColor);
router.put('/colors/:id', validate(updateColorSchema), settingsController.updateColor);
router.delete('/colors/:id', settingsController.deleteColor);

// ── Points of Sale ───────────────────────────────────
router.get('/points-of-sale', settingsController.listPointsOfSale);
router.get('/points-of-sale/:id', settingsController.getPointOfSaleById);
router.post('/points-of-sale', validate(createPointOfSaleSchema), settingsController.createPointOfSale);
router.put('/points-of-sale/:id', validate(updatePointOfSaleSchema), settingsController.updatePointOfSale);
router.delete('/points-of-sale/:id', settingsController.deletePointOfSale);

// ── Sizes ─────────────────────────────────────────────
router.get('/sizes', settingsController.listSizes);
router.get('/sizes/:id', settingsController.getSizeById);
router.post('/sizes', validate(createSizeSchema), settingsController.createSize);
router.put('/sizes/:id', validate(updateSizeSchema), settingsController.updateSize);
router.delete('/sizes/:id', settingsController.deleteSize);

export default router;
