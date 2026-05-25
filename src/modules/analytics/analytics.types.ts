export interface SizeDistribution {
  sizeId: string;
  sizeName: string;
  totalStock: number;
  productCount: number;
}

export interface ColorDistribution {
  colorId: string;
  colorName: string;
  totalStock: number;
  productCount: number;
}

export interface LowStockVariant {
  id: string;
  sku: string;
  stock: number;
  color: {
    id: string;
    name: string;
    label: string;
    hex: string | null;
  };
  size: {
    id: string;
    name: string;
    label: string;
  };
  product: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
      label: string;
    };
  };
}

export interface BestSellingSize {
  sizeName: string;
  totalSold: number;
  saleCount: number;
}

export interface GeneralStats {
  totalProducts: number;
  totalStock: number;
  categoriesCount: number;
  lowStockCount: number;
  lowStockSum: number;
  lowStockPercentage: number;
}
