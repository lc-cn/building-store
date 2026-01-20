import { OrderItem, CreateOrderItemRequest } from '../types';

export class OrderItemService {
  constructor(private db: D1Database) {}

  /**
   * 获取订单的所有订单项
   */
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
      .bind(orderId)
      .all<OrderItem>();
    
    return results || [];
  }

  /**
   * 创建订单项
   */
  async createOrderItem(orderId: number, item: CreateOrderItemRequest): Promise<OrderItem> {
    const subtotal = item.price * item.quantity;
    const attributes = item.attributes ? JSON.stringify(item.attributes) : null;

    const { success } = await this.db
      .prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_variant_id, sku, name, 
          image_url, price, quantity, subtotal, attributes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        orderId,
        item.product_id,
        item.product_variant_id || null,
        item.sku,
        item.name,
        item.image_url || null,
        item.price,
        item.quantity,
        subtotal,
        attributes
      )
      .run();

    if (!success) {
      throw new Error('Failed to create order item');
    }

    // 获取刚创建的订单项
    const { results } = await this.db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id DESC LIMIT 1')
      .bind(orderId)
      .all<OrderItem>();

    if (!results || results.length === 0) {
      throw new Error('Order item created but not found');
    }

    return results[0];
  }

  /**
   * 批量创建订单项
   */
  async createOrderItems(orderId: number, items: CreateOrderItemRequest[]): Promise<OrderItem[]> {
    const createdItems: OrderItem[] = [];

    for (const item of items) {
      const createdItem = await this.createOrderItem(orderId, item);
      createdItems.push(createdItem);
    }

    return createdItems;
  }

  /**
   * 计算订单项总额
   */
  calculateSubtotal(items: CreateOrderItemRequest[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * 删除订单的所有订单项
   */
  async deleteOrderItems(orderId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM order_items WHERE order_id = ?')
      .bind(orderId)
      .run();
  }

  /**
   * 获取单个订单项
   */
  async getOrderItem(id: number): Promise<OrderItem | null> {
    const { results } = await this.db
      .prepare('SELECT * FROM order_items WHERE id = ?')
      .bind(id)
      .all<OrderItem>();
    
    return results && results.length > 0 ? results[0] : null;
  }
}
