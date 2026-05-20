import { Router } from 'express';
import { analyticsController } from './analytics.controller';

const router = Router();

router.get('/by-size', analyticsController.getBySize);
router.get('/by-color', analyticsController.getByColor);
router.get('/low-stock', analyticsController.getLowStock);
router.get('/general-stats', analyticsController.getGeneralStats);

export default router;
