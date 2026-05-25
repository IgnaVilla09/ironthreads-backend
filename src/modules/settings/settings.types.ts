export interface CategoryResponse {
  id: string;
  name: string;
  label: string;
}

export interface ColorResponse {
  id: string;
  name: string;
  label: string;
  hex: string | null;
}

export interface SizeResponse {
  id: string;
  name: string;
  label: string;
}

export interface CreateCategoryInput {
  name: string;
  label: string;
}

export interface UpdateCategoryInput {
  name?: string;
  label?: string;
}

export interface CreateColorInput {
  name: string;
  label: string;
  hex?: string;
}

export interface UpdateColorInput {
  name?: string;
  label?: string;
  hex?: string;
}

export interface PointOfSaleResponse {
  id: string;
  name: string;
  label: string;
}

export interface CreatePointOfSaleInput {
  name: string;
  label: string;
}

export interface UpdatePointOfSaleInput {
  name?: string;
  label?: string;
}

export interface CreateSizeInput {
  name: string;
  label: string;
}

export interface UpdateSizeInput {
  name?: string;
  label?: string;
}
