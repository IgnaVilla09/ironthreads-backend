import { Request, Response, NextFunction } from 'express';
import { ventasService } from './ventas.service';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';
import { prisma } from '../../config/database';
import { editSale } from './sale-edit.service';
import { AppError } from '../../shared/errors/app-error';
import { mobbexSalesService } from './mobbex.service';

export const ventasController = {
  async createMobbexQr(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authSession) throw AppError.unauthorized('Sesión requerida');
      sendSuccess(res, await mobbexSalesService.createQr(req.params.id, req.authSession.adminApiKey), 201);
    } catch (error) { next(error); }
  },

  async resendReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await prisma.salePayment.findFirst({ where: { saleId: req.params.id, status: 'APPROVED' }, orderBy: { paidAt: 'desc' } });
      if (!payment) throw AppError.badRequest('La venta todavía no tiene un pago Mobbex aprobado');
      await prisma.salePayment.update({ where: { id: payment.id }, data: { receiptStatus: 'PENDING' } });
      await mobbexSalesService.sendReceipt(payment.id);
      sendSuccess(res, { ok: true });
    } catch (error) { next(error); }
  },
  async edit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authSession) throw AppError.unauthorized('Sesión requerida');
      sendSuccess(res, await editSale(prisma, req.params.id, req.body, req.authSession));
    } catch (error) { next(error); }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      await ventasService.getSaleById(req.params.id);
      const edits = await prisma.saleEdit.findMany({
        where: { saleId: req.params.id }, orderBy: { revision: 'desc' },
        select: { id: true, revision: true, actorName: true, createdAt: true, reason: true,
          before: true, after: true, movements: true, regularization: true, difference: true, paymentMethod: true },
      });
      sendSuccess(res, edits);
    } catch (error) { next(error); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await ventasService.createSale(req.body);
      sendSuccess(res, sale, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await ventasService.listSales(page, limit);
      sendSuccessWithMeta(res, result.sales, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await ventasService.getSaleById(req.params.id as string);
      sendSuccess(res, sale);
    } catch (error) {
      next(error);
    }
  },

  async verifyStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ventasService.verifyStock(
        req.body.items,
        req.body.pointOfSaleId,
        req.body.depositoId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      const buffer = await ventasService.exportSalesToExcel(
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined
      );
      const filename = `ventas-${from ?? 'all'}-${to ?? 'all'}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },
};
