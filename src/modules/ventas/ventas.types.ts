export interface CreateSaleInput {
  items: SaleItemInput[];
  paymentMethod: 'EFECTIVO' | 'MERCADO_PAGO' | 'OTRO';
  pointOfSaleId: string;
  depositoId?: string;
  observaciones?: string;
}

export interface SaleItemInput {
  variantId: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleResponse {
  id: string;
  pointOfSaleId: string | null;
  depositoId: string | null;
  paymentMethod: string;
  total: number;
  observaciones?: string;
  createdAt: Date;
  items: SaleItemResponse[];
}

export interface SaleItemResponse {
  id: string;
  variantId: string | null;
  inventoryItemId: string | null;
  productName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface StockVerificationItem {
  variantId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  available: number;
  requested: number;
  sufficient: boolean;
}
