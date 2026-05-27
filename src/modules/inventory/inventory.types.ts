export interface InventoryItem {
  id: string;
  variantId: string;
  pointOfSaleId: string;
  depositoId: string | null;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemWithDetails extends InventoryItem {
  variant: {
    id: string;
    sku: string;
    product: { id: string; name: string };
    color: { id: string; name: string; label: string; hex: string | null };
    size: { id: string; name: string; label: string };
  };
  pointOfSale: { id: string; name: string; label: string };
  deposito: { id: string; name: string; label: string } | null;
}

export interface CreateTransferInput {
  variantId: string;
  fromPointOfSaleId: string;
  fromDepositoId?: string;
  toPointOfSaleId: string;
  toDepositoId?: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  variantId: string;
  fromPointOfSaleId: string;
  fromDepositoId: string | null;
  toPointOfSaleId: string;
  toDepositoId: string | null;
  quantity: number;
  createdAt: Date;
}

export interface StockTransferWithDetails extends StockTransfer {
  variant: {
    id: string;
    sku: string;
    product: { id: string; name: string };
    color: { id: string; name: string; label: string };
    size: { id: string; name: string; label: string };
  };
  fromPointOfSale: { id: string; name: string; label: string };
  fromDeposito: { id: string; name: string; label: string } | null;
  toPointOfSale: { id: string; name: string; label: string };
  toDeposito: { id: string; name: string; label: string } | null;
}

export interface InventoryFilters {
  variantId?: string;
  pointOfSaleId?: string;
  depositoId?: string;
  minStock?: number;
  maxStock?: number;
}

export interface TransferFilters {
  variantId?: string;
  fromPointOfSaleId?: string;
  toPointOfSaleId?: string;
  page?: number;
  limit?: number;
}

export interface SetInventoryInput {
  pointOfSaleId: string;
  depositoId?: string;
  stock: number;
}
