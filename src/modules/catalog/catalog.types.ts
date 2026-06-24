export interface PublicCatalogFilters {
  pointOfSaleId: string;
  categoryId?: string;
  search?: string;
}

export interface CreateCatalogOrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CreateCatalogOrderInput {
  pointOfSaleId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  paymentMethod: 'MERCADO_PAGO';
  notes?: string;
  items: CreateCatalogOrderItemInput[];
}

export interface CatalogOrderFilters {
  status?: string;
  pointOfSaleId?: string;
}
