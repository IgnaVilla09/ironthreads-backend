export interface CreateSaleInput {
  items: SaleItemInput[];
  paymentMethod: 'EFECTIVO' | 'MERCADO_PAGO' | 'OTRO';
  observaciones?: string;
}

export interface SaleItemInput {
  variantId: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleResponse {
  id: string;
  paymentMethod: string;
  total: number;
  observaciones?: string;
  createdAt: Date;
  items: SaleItemResponse[];
}

export interface SaleItemResponse {
  id: string;
  variantId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
