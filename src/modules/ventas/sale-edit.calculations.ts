import { AppError } from '../../shared/errors/app-error';
import type { EditSaleInput } from './sale-edit.validators';

type PricedItem = { id: string; quantity: number; unitPrice: number };

export function calculateEdit(items: PricedItem[], input: EditSaleInput) {
  let regularization = 0;
  let returnedValue = 0;
  for (const row of input.returns) {
    const item = items.find((entry) => entry.id === row.saleItemId);
    if (!item || row.quantity > item.quantity) throw AppError.badRequest('Cantidad a devolver inválida');
    if (item.unitPrice === 0 && row.originalUnitPrice === undefined) {
      throw AppError.badRequest('Confirmá el precio original de los artículos registrados con precio cero');
    }
    if (item.unitPrice !== 0 && row.originalUnitPrice !== undefined && row.originalUnitPrice !== item.unitPrice) {
      throw AppError.badRequest('Solo se regularizan precios históricos registrados en cero');
    }
    const price = row.originalUnitPrice ?? item.unitPrice;
    regularization += (price - item.unitPrice) * item.quantity;
    returnedValue += price * row.quantity;
  }
  const beforeTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const deliveredValue = input.deliveries.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const difference = deliveredValue - returnedValue;
  const total = beforeTotal + regularization + difference;
  for (const value of [beforeTotal, regularization, returnedValue, deliveredValue, total, Math.abs(difference)]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) {
      throw AppError.badRequest('El importe excede el rango permitido');
    }
  }
  if (difference !== 0 && !input.paymentMethod) throw AppError.badRequest('Indicá el medio de cobro o devolución');
  return { regularization, difference, total, beforeTotal, returnedValue, deliveredValue };
}
