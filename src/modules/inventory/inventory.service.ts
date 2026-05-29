import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { inventoryRepository } from './inventory.repository';
import { productRepository } from '../products/product.repository';
import { settingsRepository } from '../settings/settings.repository';
import { AppError } from '../../shared/errors/app-error';
import { CreateTransferInput } from './inventory.types';
import { getPaginationMeta, getPaginationParams } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';

export const inventoryService = {
  async listInventory(rawQuery: Record<string, unknown>) {
    const filters = {
      variantId: rawQuery.variantId as string | undefined,
      pointOfSaleId: rawQuery.pointOfSaleId as string | undefined,
      depositoId: rawQuery.depositoId as string | undefined,
      minStock: rawQuery.minStock ? Number(rawQuery.minStock) : undefined,
      maxStock: rawQuery.maxStock ? Number(rawQuery.maxStock) : undefined,
    };

    return inventoryRepository.findInventory(filters);
  },

  async getInventoryByVariant(variantId: string) {
    return inventoryRepository.findInventoryByVariant(variantId);
  },

  async transferStock(input: CreateTransferInput) {
    const variant = await productRepository.findVariantById(input.variantId);
    if (!variant) {
      throw AppError.notFound(`Variante con ID ${input.variantId} no encontrada`);
    }

    const fromPos = await settingsRepository.findPointOfSaleById(input.fromPointOfSaleId);
    if (!fromPos) {
      throw AppError.notFound(`Punto de venta origen con ID ${input.fromPointOfSaleId} no encontrado`);
    }

    const toPos = await settingsRepository.findPointOfSaleById(input.toPointOfSaleId);
    if (!toPos) {
      throw AppError.notFound(`Punto de venta destino con ID ${input.toPointOfSaleId} no encontrado`);
    }

    if (input.fromPointOfSaleId === input.toPointOfSaleId &&
        input.fromDepositoId === input.toDepositoId) {
      throw AppError.badRequest('El origen y destino deben ser diferentes');
    }

    logger.info('Transferring stock', {
      variantId: input.variantId,
      from: input.fromPointOfSaleId,
      to: input.toPointOfSaleId,
      quantity: input.quantity,
    });

    try {
      return await inventoryRepository.createTransfer({
        variantId: input.variantId,
        fromPointOfSaleId: input.fromPointOfSaleId,
        fromDepositoId: input.fromDepositoId ?? null,
        toPointOfSaleId: input.toPointOfSaleId,
        toDepositoId: input.toDepositoId ?? null,
        quantity: input.quantity,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Stock insuficiente')) {
        throw AppError.badRequest(error.message);
      }
      throw error;
    }
  },

  async listTransfers(rawQuery: Record<string, unknown>) {
    const pagination = getPaginationParams(rawQuery as { page?: string; limit?: string });

    const filters = {
      variantId: rawQuery.variantId as string | undefined,
      fromPointOfSaleId: rawQuery.fromPointOfSaleId as string | undefined,
      toPointOfSaleId: rawQuery.toPointOfSaleId as string | undefined,
    };

    const { transfers, total } = await inventoryRepository.findTransfers(filters, pagination);
    const meta = getPaginationMeta(total, pagination);

    return { transfers, meta };
  },

  async setVariantInventory(variantId: string, items: { pointOfSaleId: string; depositoId: string | null; stock: number }[]) {
    const variant = await productRepository.findVariantById(variantId);
    if (!variant) {
      throw AppError.notFound(`Variante con ID ${variantId} no encontrada`);
    }

    logger.info('Setting variant inventory', { variantId, items: items.length });

    return inventoryRepository.setVariantInventory(variantId, items);
  },

  async exportInventoryToExcel(): Promise<Buffer> {
    logger.info('Exporting inventory to Excel');

    const inventory = await inventoryRepository.findInventory({});

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Iron Stock';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Inventario');

    sheet.mergeCells(1, 1, 1, 7);
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `Inventario Completo - ${new Date().toLocaleDateString('es-AR')}`;
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleRow.alignment = { horizontal: 'center' };
    titleRow.height = 30;

    const columns = [
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Color', key: 'color', width: 18 },
      { header: 'Talle', key: 'talle', width: 12 },
      { header: 'Punto de Venta', key: 'pos', width: 25 },
      { header: 'Depósito', key: 'deposito', width: 20 },
      { header: 'Stock', key: 'stock', width: 12 },
    ];

    sheet.columns = columns;

    const headerRow = sheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center' };

    let rowIndex = 4;
    for (const item of inventory) {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = item.variant.product.name;
      row.getCell(2).value = item.variant.sku;
      row.getCell(3).value = item.variant.color.label;
      row.getCell(4).value = item.variant.size.label;
      row.getCell(5).value = item.pointOfSale.label;
      row.getCell(6).value = item.deposito?.label ?? '—';
      row.getCell(7).value = item.stock;
      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  },

  async exportTransfersToExcel(): Promise<Buffer> {
    logger.info('Exporting transfers to Excel');

    const { transfers } = await inventoryRepository.findTransfers({}, { page: 1, limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Iron Stock';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Transferencias');

    sheet.mergeCells(1, 1, 1, 7);
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `Historial de Transferencias - ${new Date().toLocaleDateString('es-AR')}`;
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleRow.alignment = { horizontal: 'center' };
    titleRow.height = 30;

    const columns = [
      { header: 'Fecha', key: 'fecha', width: 22 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Variante', key: 'variante', width: 25 },
      { header: 'Origen', key: 'origen', width: 30 },
      { header: 'Destino', key: 'destino', width: 30 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
    ];

    sheet.columns = columns;

    const headerRow = sheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center' };

    let rowIndex = 4;
    for (const t of transfers) {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = new Date(t.createdAt).toLocaleString('es-AR');
      row.getCell(2).value = t.variant.product.name;
      row.getCell(3).value = t.variant.sku;
      row.getCell(4).value = `${t.variant.color.label} / ${t.variant.size.label}`;
      row.getCell(5).value = t.fromPointOfSale.label + (t.fromDeposito ? ` / ${t.fromDeposito.label}` : '');
      row.getCell(6).value = t.toPointOfSale.label + (t.toDeposito ? ` / ${t.toDeposito.label}` : '');
      row.getCell(7).value = t.quantity;
      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  },

  async exportInventoryByPosToZip(): Promise<Buffer> {
    logger.info('Exporting inventory by POS to ZIP');

    const allPos = await settingsRepository.findAllPointsOfSale();
    const zip = new JSZip();

    for (const pos of allPos) {
      const inventory = await inventoryRepository.findInventory({ pointOfSaleId: pos.id });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Iron Stock';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Inventario');

      sheet.mergeCells(1, 1, 1, 6);
      const titleRow = sheet.getRow(1);
      titleRow.getCell(1).value = `${pos.label} - ${new Date().toLocaleDateString('es-AR')}`;
      titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
      titleRow.alignment = { horizontal: 'center' };
      titleRow.height = 30;

      const columns = [
        { header: 'Producto', key: 'producto', width: 35 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Color', key: 'color', width: 18 },
        { header: 'Talle', key: 'talle', width: 12 },
        { header: 'Depósito', key: 'deposito', width: 20 },
        { header: 'Stock', key: 'stock', width: 12 },
      ];

      sheet.columns = columns;

      const headerRow = sheet.getRow(3);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.alignment = { horizontal: 'center' };

      let rowIndex = 4;
      for (const item of inventory) {
        const row = sheet.getRow(rowIndex);
        row.getCell(1).value = item.variant.product.name;
        row.getCell(2).value = item.variant.sku;
        row.getCell(3).value = item.variant.color.label;
        row.getCell(4).value = item.variant.size.label;
        row.getCell(5).value = item.deposito?.label ?? '—';
        row.getCell(6).value = item.stock;
        rowIndex++;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const sanitizedName = pos.label.replace(/[^a-zA-Z0-9_-]/g, '_');
      zip.file(`${sanitizedName}-inventario.xlsx`, buffer as unknown as Buffer);
    }

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }) as unknown as Promise<Buffer>;
  },
};
