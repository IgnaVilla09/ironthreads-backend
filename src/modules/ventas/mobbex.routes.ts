import { createHmac, timingSafeEqual } from 'crypto';
import { Router } from 'express';
import { env } from '../../config/env';
import { mobbexSalesService } from './mobbex.service';

const router = Router();
router.post('/webhook', async (req, res, next) => {
  try {
    const timestamp = req.header('x-mobbex-timestamp') ?? '';
    const signature = req.header('x-mobbex-signature') ?? '';
    const raw = (req as typeof req & { rawBody?: string }).rawBody ?? '';
    const age = Math.abs(Date.now() - Number(timestamp));
    if (!env.MOBBEX_WEBHOOK_SECRET || !Number.isFinite(age) || age > 5 * 60_000) { res.status(401).json({ success: false }); return; }
    const expected = createHmac('sha256', env.MOBBEX_WEBHOOK_SECRET).update(`${timestamp}.${raw}`).digest('hex');
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) { res.status(401).json({ success: false }); return; }
    const body = req.body as { reference?: unknown; status?: unknown; externalPaymentId?: unknown; payload?: unknown };
    if (typeof body.reference !== 'string' || typeof body.status !== 'string') { res.status(400).json({ success: false }); return; }
    const result = await mobbexSalesService.confirmFromWebhook({ reference: body.reference, status: body.status, externalPaymentId: typeof body.externalPaymentId === 'string' ? body.externalPaymentId : undefined, payload: body.payload ?? body });
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
});
export default router;
