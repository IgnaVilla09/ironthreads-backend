export interface ProductVariant {
  id: string;
  productId: string;
  colorId: string;
  sizeId: string;
  sku: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  pointOfSaleId: string;
  createdAt: Date;
  updatedAt: Date;
  variants: ProductVariant[];
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId: string;
  pointOfSaleId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  pointOfSaleId?: string;
}

export interface CreateVariantInput {
  colorId: string;
  sizeId: string;
  stock: number;
}

export interface UpdateVariantInput {
  colorId?: string;
  sizeId?: string;
  stock?: number;
}

export interface ProductFilters {
  categoryId?: string;
  pointOfSaleId?: string;
  search?: string;
  minStock?: number;
  maxStock?: number;
}

export interface VariantFilters {
  colorId?: string;
  sizeId?: string;
  minStock?: number;
  maxStock?: number;
}
