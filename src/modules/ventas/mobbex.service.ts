import { randomUUID } from 'crypto';
import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { sendDirectEmail } from '../../shared/email';
import { tiendaNubeService } from '../tiendanube/tiendanube.service';

function asJson(value: unknown): Prisma.InputJsonValue {
  // Serializar elimina valores no JSON que nunca deben persistirse desde un proveedor externo.
  return JSON.parse(JSON.stringify(value && typeof value === 'object' ? value : { response: value ?? null })) as Prisma.InputJsonValue;
}

function receiptHtml(sale: { id: string; customerName: string | null; total: number; createdAt: Date; items: Array<{ productName: string; colorName: string; sizeName: string; quantity: number; unitPrice: number }> }) {
  const escape = (text: string) => text.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
  const rows = sale.items.map((item) => `<tr><td>${escape(item.productName)} · ${escape(item.colorName)} / ${escape(item.sizeName)}</td><td>${item.quantity}</td><td>$${item.unitPrice.toLocaleString('es-AR')}</td><td>$${(item.quantity * item.unitPrice).toLocaleString('es-AR')}</td></tr>`).join('');
  return `<main style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111"><h1>Comprobante de pago</h1><p>Hola ${escape(sale.customerName || '')},</p><p>Confirmamos el pago de la venta <strong>#${sale.id.slice(0, 8).toUpperCase()}</strong> del ${sale.createdAt.toLocaleDateString('es-AR')}.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Artículo</th><th>Cant.</th><th>Unit.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p style="font-size:20px"><strong>Total: $${sale.total.toLocaleString('es-AR')}</strong></p><p style="color:#666;font-size:12px">Comprobante de pago no fiscal. No válido como factura.</p></main>`;
}

export const mobbexSalesService = {
  async createQr(saleId: string, adminApiKey: string) {
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) throw AppError.notFound('Venta no encontrada');
    if (sale.paymentMethod !== 'MOBBEX') throw AppError.badRequest('Esta venta no fue creada para cobrar con Mobbex');
    if (sale.paymentStatus === 'PAID') throw AppError.badRequest('La venta ya fue pagada');
    if (!sale.customerEmail) throw AppError.badRequest('La venta no tiene un email para el comprobante');

    const payment = await prisma.salePayment.create({ data: { saleId, provider: 'mobbex', status: 'CREATED', reference: `sale_${sale.id}_${randomUUID().slice(0, 8)}` } });
    try {
      const payload = await tiendaNubeService.createMobbexQr(adminApiKey, { total: sale.total, reference: payment.reference, email: sale.customerEmail });
      await prisma.salePayment.update({ where: { id: payment.id }, data: { status: 'PENDING', qrPayload: asJson(payload) } });
      return { paymentId: payment.id, reference: payment.reference, status: 'PENDING', qr: payload };
    } catch (error) {
      await prisma.salePayment.update({ where: { id: payment.id }, data: { status: 'FAILED', providerPayload: { error: error instanceof Error ? error.message : 'Unknown upstream error' } } });
      throw error;
    }
  },

  async confirmFromWebhook(input: { reference: string; status: string; externalPaymentId?: string; payload: unknown }) {
    const payment = await prisma.salePayment.findUnique({ where: { reference: input.reference }, include: { sale: { include: { items: true } } } });
    if (!payment) return { accepted: false };
    const status = input.status.toUpperCase();
    const approved = ['APPROVED', 'PAID', 'SUCCESS', 'COMPLETED'].some((value) => status === value || status.endsWith(`.${value}`) || status.endsWith(`_${value}`));
    const failed = ['REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED'].some((value) => status === value || status.endsWith(`.${value}`) || status.endsWith(`_${value}`));
    if (!approved && !failed) return { accepted: true, changed: false };
    if (approved && payment.status === 'APPROVED') return { accepted: true, changed: false };
    if (!['CREATED', 'PENDING'].includes(payment.status)) return { accepted: true, changed: false };

    await prisma.$transaction(async (tx) => {
      await tx.salePayment.update({ where: { id: payment.id }, data: { status: approved ? 'APPROVED' : status, externalPaymentId: input.externalPaymentId, providerPayload: asJson(input.payload), ...(approved ? { paidAt: new Date() } : {}) } });
      await tx.sale.update({ where: { id: payment.saleId }, data: { paymentStatus: approved ? 'PAID' : status } });
      // El stock se reserva al crear el QR; un resultado final fallido lo devuelve exactamente una vez.
      if (failed) {
        for (const item of payment.sale.items) {
          if (item.inventoryItemId) await tx.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { stock: { increment: item.quantity } } });
        }
      }
    });
    if (approved) await this.sendReceipt(payment.id);
    return { accepted: true, changed: true };
  },

  async sendReceipt(paymentId: string) {
    const claimed = await prisma.salePayment.updateMany({ where: { id: paymentId, status: 'APPROVED', receiptStatus: { in: ['PENDING', 'FAILED'] } }, data: { receiptStatus: 'SENDING', receiptError: null } });
    if (claimed.count !== 1) return;
    const payment = await prisma.salePayment.findUnique({ where: { id: paymentId }, include: { sale: { include: { items: true } } } });
    if (!payment?.sale.customerEmail) return;
    try {
      const result = await sendDirectEmail({ to: payment.sale.customerEmail, subject: `Comprobante de pago · Venta #${payment.sale.id.slice(0, 8).toUpperCase()}`, html: receiptHtml(payment.sale) });
      await prisma.salePayment.update({ where: { id: paymentId }, data: { receiptStatus: 'SENT', receiptProviderId: result.id, receiptSentAt: new Date() } });
    } catch (error) {
      await prisma.salePayment.update({ where: { id: paymentId }, data: { receiptStatus: 'FAILED', receiptError: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown email error' } });
    }
  },
};
