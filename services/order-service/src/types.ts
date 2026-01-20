// 订单状态枚举
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

// 支付状态枚举
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

// 物流状态枚举
export type ShippingStatus = 'unshipped' | 'shipped' | 'in_transit' | 'delivered';

// 订单状态流转验证
export const OrderStatusFlow: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: []
};

// 订单接口
export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  
  // 价格信息
  subtotal: number;
  shipping_fee: number;
  tax: number;
  discount: number;
  total: number;
  
  // 收货地址
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  
  // 其他信息
  notes?: string;
  customer_note?: string;
  tracking_number?: string;
  tracking_company?: string;
  
  cancelled_at?: string;
  confirmed_at?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  
  created_at: string;
  updated_at: string;
}

// 订单项接口
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_variant_id?: number;
  sku: string;
  name: string;
  image_url?: string;
  price: number;
  quantity: number;
  subtotal: number;
  attributes?: string; // JSON 字符串
  created_at: string;
}

// 订单状态历史接口
export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: OrderStatus;
  note?: string;
  created_by?: number;
  created_at: string;
}

// 创建订单请求
export interface CreateOrderRequest {
  user_id: number;
  items: CreateOrderItemRequest[];
  
  // 价格信息
  shipping_fee?: number;
  tax?: number;
  discount?: number;
  
  // 收货地址
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  
  // 其他信息
  notes?: string;
  customer_note?: string;
}

// 创建订单项请求
export interface CreateOrderItemRequest {
  product_id: number;
  product_variant_id?: number;
  sku: string;
  name: string;
  image_url?: string;
  price: number;
  quantity: number;
  attributes?: Record<string, any>;
}

// 更新订单请求
export interface UpdateOrderRequest {
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  notes?: string;
  customer_note?: string;
  tracking_number?: string;
  tracking_company?: string;
}

// 更新订单状态请求
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
  created_by?: number;
}

// Cloudflare D1 环境
export interface WorkerEnv {
  DB: D1Database;
  [key: string]: any;
}
