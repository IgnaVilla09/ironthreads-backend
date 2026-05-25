import { Request, Response, NextFunction } from 'express';
import { ventasService } from './ventas.service';
import { ventasRepository } from './ventas.repository';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';
import { getPaginationMeta, getPaginationParams } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';

export const ventasController = {
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
      const { page, limit } = getPaginationParams(req.query as { page?: string; limit?: string });
      const { sales, total } = await ventasService.listSales(page, limit);
      const meta = getPaginationMeta(total, { page, limit });
      sendSuccessWithMeta(res, sales, meta);
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
      const result = await ventasService.verifyStock(req.body.items);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;

      if (!from || !to) {
        res.status(400).json({
          success: false,
          error: { message: 'Los parámetros "from" y "to" son requeridos (YYYY-MM-DD)' },
        });
        return;
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      logger.info('Export - fetching sales data', { from, to });

      const { sales, sizes, totalSold } = await ventasRepository.findSalesByDateRange(fromDate, toDate);

      logger.info('Export - generating excel', { saleCount: sales.length, sizeCount: sizes.length, totalSold });

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Informe de Ventas');

      const fmt = (d: Date) =>
        d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const paymentLabel = (m: string) =>
        m === 'EFECTIVO' ? 'Efectivo' : m === 'MERCADO_PAGO' ? 'Mercado Pago' : 'Otro';

      // ── Columns ──
      sheet.getColumn(1).width = 22;
      sheet.getColumn(2).width = 28;
      sheet.getColumn(3).width = 20;
      sheet.getColumn(4).width = 14;
      sheet.getColumn(5).width = 10;
      sheet.getColumn(6).width = 18;
      sheet.getColumn(7).width = 30;
      sheet.getColumn(8).width = 14;

      // ── Section 1: Summary ──
      sheet.mergeCells('A1:B1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'Informe de Ventas';
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center' };
      sheet.addRow([]);

      sheet.addRow(['Período:', `${fmt(fromDate)} - ${fmt(toDate)}`]);
      sheet.addRow(['Total productos vendidos:', totalSold]);
      sheet.addRow([]);

      sheet.addRow(['Talles Más Vendidos']);
      sheet.getCell(`A${sheet.rowCount}`).font = { bold: true, size: 12 };
      sheet.addRow([]);

      const sizeHeaderRow = sheet.addRow(['Talle', 'Cantidad Vendida']);
      sizeHeaderRow.font = { bold: true };
      sizeHeaderRow.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      for (const size of sizes) {
        const row = sheet.addRow([size.sizeName, size.quantity]);
        row.eachCell((cell: any) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      }

      // ── Section 2: Sales detail ──
      sheet.addRow([]);
      sheet.addRow(['Detalle de Ventas']);
      sheet.getCell(`A${sheet.rowCount}`).font = { bold: true, size: 12 };
      sheet.addRow([]);

      const detailHeaderRow = sheet.addRow([
        'Fecha', 'Producto', 'Unidad', 'Talle', 'Cant.', 'Método de pago', 'Observaciones', 'Total items',
      ]);
      detailHeaderRow.font = { bold: true };
      detailHeaderRow.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center' };
      });

      for (const sale of sales) {
        const saleTotal = sale.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
        for (let idx = 0; idx < sale.items.length; idx++) {
          const item = sale.items[idx];
          const row = sheet.addRow([
            idx === 0 ? fmt(sale.createdAt) : '',
            item.productName,
            item.colorName,
            item.sizeName,
            item.quantity,
            idx === 0 ? paymentLabel(sale.paymentMethod) : '',
            idx === 0 ? (sale.observaciones || '-') : '',
            idx === 0 ? saleTotal : '',
          ]);
          row.eachCell((cell: any) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();

      logger.info('Export - sending file', { size: buffer.byteLength });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ventas-${from}-${to}.xlsx"`
      );
      res.setHeader('Content-Length', buffer.byteLength);

      res.send(buffer);
    } catch (error) {
      logger.error('Export error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '',
        name: error instanceof Error ? error.constructor.name : typeof error,
      });
      next(error);
    }
  },
};
