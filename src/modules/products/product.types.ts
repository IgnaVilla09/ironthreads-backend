export interface ProductVariant {
  id: string;
  productId: string;
  colorId: string;
  sizeId: string;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  variants: ProductVariant[];
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
}

export interface InventoryAllocation {
  pointOfSaleId: string;
  depositoId?: string;
  stock: number;
}

export interface CreateVariantInput {
  colorId: string;
  sizeId: string;
  inventory?: InventoryAllocation[];
}

export interface UpdateVariantInput {
  colorId?: string;
  sizeId?: string;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
}
