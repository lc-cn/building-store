// 库存类型定义

export interface Inventory {
  id: number;
  product_id: number;
  product_variant_id?: number;
  sku: string;
  quantity: number;
  reserved_quantity: number;
  warehouse_id?: number;
  location?: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryWithWarehouse extends Inventory {
  warehouse_name?: string;
  warehouse_code?: string;
}

export interface InventoryTransaction {
  id: number;
  inventory_id: number;
  type: TransactionType;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  reference_type?: ReferenceType;
  reference_id?: string;
  note?: string;
  created_by?: number;
  created_at: string;
}

export interface InventoryReservation {
  id: number;
  inventory_id: number;
  order_id: string;
  quantity: number;
  status: ReservationStatus;
  expires_at?: string;
  released_at?: string;
  consumed_at?: string;
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  province?: string;
  country: string;
  postal_code?: string;
  contact_name?: string;
  contact_phone?: string;
  status: WarehouseStatus;
  created_at: string;
  updated_at: string;
}

// 枚举类型
export type TransactionType = 'in' | 'out' | 'reserve' | 'release' | 'adjust';
export type ReferenceType = 'order' | 'purchase' | 'return' | 'adjustment';
export type ReservationStatus = 'reserved' | 'released' | 'consumed';
export type WarehouseStatus = 'active' | 'inactive';

// 请求类型
export interface AdjustInventoryRequest {
  sku: string;
  quantity: number;
  type: 'in' | 'out' | 'adjust';
  warehouse_id?: number;
  reference_type?: ReferenceType;
  reference_id?: string;
  note?: string;
  created_by?: number;
}

export interface ReserveInventoryRequest {
  sku: string;
  quantity: number;
  order_id: string;
  expires_in_minutes?: number; // 过期时间（分钟）
}

export interface ReleaseInventoryRequest {
  order_id: string;
  sku?: string; // 如果不提供则释放该订单的所有预留
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  contact_name?: string;
  contact_phone?: string;
}

export interface UpdateWarehouseRequest {
  name?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  contact_name?: string;
  contact_phone?: string;
  status?: WarehouseStatus;
}

// 响应类型
export interface InventoryResponse {
  inventory: Inventory | InventoryWithWarehouse;
  available_quantity: number; // 可用库存 = quantity - reserved_quantity
  is_low_stock: boolean;
}

export interface InventoryAdjustmentResponse {
  success: boolean;
  inventory: Inventory;
  transaction: InventoryTransaction;
}

export interface ReservationResponse {
  success: boolean;
  reservation: InventoryReservation;
  inventory: Inventory;
}

export interface TransactionListResponse {
  transactions: InventoryTransaction[];
  total: number;
  page: number;
  page_size: number;
}

// 数据库绑定（Cloudflare Workers Bindings）
export type Bindings = {
  DB: D1Database;
};

// Hono Env 类型
export type Env = {
  Bindings: Bindings;
};
