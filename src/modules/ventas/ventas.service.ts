import ExcelJS from 'exceljs';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/app-error';
import { ventasRepository } from './ventas.repository';
import { CreateSaleInput } from './ventas.types';
import { logger } from '../../shared/utils/logger';

export const ventasService = {
  async createSale(input: CreateSaleInput) {
    logger.info('Creating sale', {
      items: input.items.length,
      paymentMethod: input.paymentMethod,
      pointOfSaleId: input.pointOfSaleId,
      depositoId: input.depositoId,
    });

    const itemsData: Array<{
      variantId: string;
      inventoryItemId: string | null;
      productName: string;
      colorName: string;
      sizeName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const variant = await ventasRepository.findVariantWithDetails(item.variantId);

      if (!variant) {
        throw AppError.notFound(`Variante con ID ${item.variantId} no encontrada`);
      }

      const inventoryItem = await ventasRepository.findInventoryItem(
        item.variantId,
        input.pointOfSaleId,
        input.depositoId ?? null
      );

      if (!inventoryItem) {
        throw AppError.badRequest(
          `No hay inventario de ${variant.product.name} - ${variant.color.label} / ${variant.size.label} en el punto de venta seleccionado`
        );
      }

      if (inventoryItem.stock < item.quantity) {
        throw AppError.badRequest(
          `Stock insuficiente para ${variant.product.name} - ${variant.color.label} / ${variant.size.label} en este punto de venta. Disponible: ${inventoryItem.stock}, solicitado: ${item.quantity}`
        );
      }

      itemsData.push({
        variantId: variant.id,
        inventoryItemId: inventoryItem.id,
        productName: variant.product.name,
        colorName: variant.color.label,
        sizeName: variant.size.label,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      });
    }

    const sale = await ventasRepository.createSaleWithItems(
      input.paymentMethod,
      input.pointOfSaleId,
      input.depositoId ?? null,
      itemsData,
      input.observaciones
    );

    logger.info('Sale created', { saleId: sale.id, total: sale.total });

    return sale;
  },

  async listSales(page: number = 1, limit: number = 20) {
    logger.info('Listing sales', { page, limit });
    return ventasRepository.findAllSales(page, limit);
  },

  async getSaleById(id: string) {
    const sale = await ventasRepository.findSaleById(id);

    if (!sale) {
      throw AppError.notFound(`Venta con ID ${id} no encontrada`);
    }

    return sale;
  },

  async verifyStock(items: Array<{ variantId: string; quantity: number }>, pointOfSaleId?: string, depositoId?: string) {
    const results: Array<{
      variantId: string;
      productName: string;
      colorName: string;
      sizeName: string;
      available: number;
      requested: number;
      sufficient: boolean;
    }> = [];

    for (const item of items) {
      const variant = await ventasRepository.findVariantWithDetails(item.variantId);

      if (!variant) {
        throw AppError.notFound(`Variante con ID ${item.variantId} no encontrada`);
      }

      let available = 0;

      if (pointOfSaleId) {
        const inventoryItem = await ventasRepository.findInventoryItem(
          item.variantId,
          pointOfSaleId,
          depositoId ?? null
        );
        available = inventoryItem?.stock ?? 0;
      } else {
        const items = await prisma.inventoryItem.aggregate({
          where: { variantId: item.variantId },
          _sum: { stock: true },
        });
        available = items._sum.stock ?? 0;
      }

      results.push({
        variantId: variant.id,
        productName: variant.product.name,
        colorName: variant.color.label,
        sizeName: variant.size.label,
        available,
        requested: item.quantity,
        sufficient: available >= item.quantity,
      });
    }

    return results;
  },

  async exportSalesToExcel(from?: Date, to?: Date): Promise<Buffer> {
    logger.info('Exporting sales to Excel', { from, to });
    const result = await ventasRepository.findSalesByDateRange(
      from ?? new Date(0),
      to ?? new Date()
    );

    const dateLabel = `${from ? from.toLocaleDateString('es-AR') : 'inicio'} - ${to ? to.toLocaleDateString('es-AR') : 'hoy'}`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Iron Stock';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ventas');

    sheet.mergeCells(1, 1, 1, 9);
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `Informe de Ventas - ${dateLabel}`;
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleRow.alignment = { horizontal: 'center' };
    titleRow.height = 30;

    sheet.mergeCells(2, 1, 2, 9);
    const summaryRow = sheet.getRow(2);
    summaryRow.getCell(1).value = `Ventas realizadas: ${result.sales.length} | Artículos vendidos: ${result.totalSold}`;
    summaryRow.font = { size: 11, italic: true, color: { argb: 'FF555555' } };
    summaryRow.alignment = { horizontal: 'center' };
    summaryRow.height = 22;

    sheet.mergeCells(3, 1, 3, 9);
    const sizesRow = sheet.getRow(3);
    const topSizes = result.sizes.slice(0, 5).map(s => `${s.sizeName} (${s.quantity})`).join(', ');
    sizesRow.getCell(1).value = `Talles más vendidos: ${topSizes}`;
    sizesRow.font = { size: 11, italic: true, color: { argb: 'FF555555' } };
    sizesRow.alignment = { horizontal: 'center' };
    sizesRow.height = 22;

    const headerRowNum = 5;
    const columns = [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'Color', key: 'color', width: 18 },
      { header: 'Talle', key: 'talle', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Precio Unit.', key: 'precioUnitario', width: 14 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Método de Pago', key: 'metodoPago', width: 20 },
      { header: 'Observaciones', key: 'observaciones', width: 35 },
    ];

    sheet.columns = columns;

    const headerRow = sheet.getRow(headerRowNum);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center' };

    let rowIndex = headerRowNum + 1;
    for (const sale of result.sales) {
      for (const item of sale.items) {
        const row = sheet.getRow(rowIndex);
        row.getCell(1).value = sale.createdAt;
        row.getCell(2).value = item.productName;
        row.getCell(3).value = item.colorName;
        row.getCell(4).value = item.sizeName;
        row.getCell(5).value = item.quantity;
        row.getCell(6).value = item.unitPrice;
        row.getCell(7).value = item.quantity * item.unitPrice;
        row.getCell(8).value = sale.paymentMethod;
        row.getCell(9).value = sale.observaciones ?? '';
        rowIndex++;
      }
    }

    const summarySheet = workbook.addWorksheet('Resumen por Talle');
    summarySheet.mergeCells(1, 1, 1, 2);
    const summaryTitle = summarySheet.getRow(1);
    summaryTitle.getCell(1).value = `Talles más vendidos - ${dateLabel}`;
    summaryTitle.font = { bold: true, size: 13, color: { argb: 'FF1F4E79' } };
    summaryTitle.alignment = { horizontal: 'center' };
    summaryTitle.height = 28;

    summarySheet.mergeCells(2, 1, 2, 2);
    const summaryInfo = summarySheet.getRow(2);
    summaryInfo.getCell(1).value = `Ventas realizadas: ${result.sales.length} | Artículos vendidos: ${result.totalSold}`;
    summaryInfo.font = { size: 11, italic: true, color: { argb: 'FF555555' } };
    summaryInfo.alignment = { horizontal: 'center' };
    summaryInfo.height = 22;

    summarySheet.columns = [
      { header: 'Talle', key: 'talle', width: 25 },
      { header: 'Cantidad Vendida', key: 'cantidad', width: 28 },
    ];

    const summaryHeaderRow = summarySheet.getRow(4);
    summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    summaryHeaderRow.alignment = { horizontal: 'center' };

    result.sizes.forEach((size, index) => {
      const row = summarySheet.getRow(index + 5);
      row.getCell(1).value = size.sizeName;
      row.getCell(2).value = size.quantity;
    });

    const totalRowIndex = result.sizes.length + 5;
    const totalRow = summarySheet.getRow(totalRowIndex);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(2).value = result.totalSold;
    totalRow.getCell(2).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  },
};


