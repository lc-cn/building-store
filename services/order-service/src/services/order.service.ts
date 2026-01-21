import {
  Order,
  OrderStatus,
  OrderStatusFlow,
  OrderStatusHistory,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest
} from '../types';
import { generateOrderNumber } from '../utils/order-number';
import { OrderItemService } from './order-item.service';

export class OrderService {
  private orderItemService: OrderItemService;

  constructor(private db: D1Database) {
    this.orderItemService = new OrderItemService(db);
  }

  /**
   * 获取订单列表
   */
  async getOrders(params: {
    user_id?: number;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const { user_id, status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const bindings: any[] = [];

    if (user_id) {
      whereClause += ' AND user_id = ?';
      bindings.push(user_id);
    }

    if (status) {
      whereClause += ' AND status = ?';
      bindings.push(status);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM orders ${whereClause}`;
    const { results: countResults } = await this.db
      .prepare(countQuery)
      .bind(...bindings)
      .all<{ count: number }>();
    
    const total = countResults?.[0]?.count || 0;

    // 获取订单列表
    const query = `
      SELECT * FROM orders 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const { results } = await this.db
      .prepare(query)
      .bind(...bindings, limit, offset)
      .all<Order>();

    return {
      orders: results || [],
      total
    };
  }

  /**
   * 根据ID获取订单
   */
  async getOrderById(id: number): Promise<Order | null> {
    const { results } = await this.db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .all<Order>();
    
    return results && results.length > 0 ? results[0] : null;
  }

  /**
   * 根据订单号获取订单
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { results } = await this.db
      .prepare('SELECT * FROM orders WHERE order_number = ?')
      .bind(orderNumber)
      .all<Order>();
    
    return results && results.length > 0 ? results[0] : null;
  }

  /**
   * 创建订单
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    // 生成订单号（确保唯一）
    let orderNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      orderNumber = generateOrderNumber();
      const existing = await this.getOrderByNumber(orderNumber);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique order number');
    }

    // 计算价格
    const subtotal = this.orderItemService.calculateSubtotal(data.items);
    const shipping_fee = data.shipping_fee || 0;
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const total = subtotal + shipping_fee + tax - discount;

    // 创建订单
    const { success } = await this.db
      .prepare(`
        INSERT INTO orders (
          order_number, user_id, status, payment_status, shipping_status,
          subtotal, shipping_fee, tax, discount, total,
          shipping_name, shipping_phone, shipping_address,
          shipping_city, shipping_province, shipping_country, shipping_postal_code,
          notes, customer_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        orderNumber,
        data.user_id,
        'pending',
        'unpaid',
        'unshipped',
        subtotal,
        shipping_fee,
        tax,
        discount,
        total,
        data.shipping_name,
        data.shipping_phone,
        data.shipping_address,
        data.shipping_city,
        data.shipping_province,
        data.shipping_country || 'CN',
        data.shipping_postal_code || null,
        data.notes || null,
        data.customer_note || null
      )
      .run();

    if (!success) {
      throw new Error('Failed to create order');
    }

    const order = await this.getOrderByNumber(orderNumber);
    if (!order) {
      throw new Error('Order created but not found');
    }

    // 创建订单项
    await this.orderItemService.createOrderItems(order.id, data.items);

    // 记录状态历史
    await this.addStatusHistory(order.id, 'pending', 'Order created', data.user_id);

    return order;
  }

  /**
   * 更新订单
   */
  async updateOrder(id: number, data: UpdateOrderRequest): Promise<Order> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // 构建更新语句
    const updates: string[] = [];
    const bindings: any[] = [];

    if (data.shipping_name !== undefined) {
      updates.push('shipping_name = ?');
      bindings.push(data.shipping_name);
    }
    if (data.shipping_phone !== undefined) {
      updates.push('shipping_phone = ?');
      bindings.push(data.shipping_phone);
    }
    if (data.shipping_address !== undefined) {
      updates.push('shipping_address = ?');
      bindings.push(data.shipping_address);
    }
    if (data.shipping_city !== undefined) {
      updates.push('shipping_city = ?');
      bindings.push(data.shipping_city);
    }
    if (data.shipping_province !== undefined) {
      updates.push('shipping_province = ?');
      bindings.push(data.shipping_province);
    }
    if (data.shipping_country !== undefined) {
      updates.push('shipping_country = ?');
      bindings.push(data.shipping_country);
    }
    if (data.shipping_postal_code !== undefined) {
      updates.push('shipping_postal_code = ?');
      bindings.push(data.shipping_postal_code);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      bindings.push(data.notes);
    }
    if (data.customer_note !== undefined) {
      updates.push('customer_note = ?');
      bindings.push(data.customer_note);
    }
    if (data.tracking_number !== undefined) {
      updates.push('tracking_number = ?');
      bindings.push(data.tracking_number);
    }
    if (data.tracking_company !== undefined) {
      updates.push('tracking_company = ?');
      bindings.push(data.tracking_company);
    }

    if (updates.length === 0) {
      return order;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(id);

    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
    await this.db.prepare(query).bind(...bindings).run();

    const updatedOrder = await this.getOrderById(id);
    if (!updatedOrder) {
      throw new Error('Order not found after update');
    }

    return updatedOrder;
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(id: number, data: UpdateOrderStatusRequest): Promise<Order> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // 验证状态流转
    const allowedStatuses = OrderStatusFlow[order.status];
    if (!allowedStatuses.includes(data.status)) {
      throw new Error(
        `Cannot change order status from ${order.status} to ${data.status}`
      );
    }

    // 更新订单状态和相关时间戳
    const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const bindings: any[] = [data.status];

    // 根据状态更新相应的时间戳
    if (data.status === 'confirmed' && !order.confirmed_at) {
      updates.push('confirmed_at = CURRENT_TIMESTAMP');
    } else if (data.status === 'shipped' && !order.shipped_at) {
      updates.push('shipped_at = CURRENT_TIMESTAMP');
      updates.push('shipping_status = ?');
      bindings.push('shipped');
    } else if (data.status === 'delivered' && !order.delivered_at) {
      updates.push('delivered_at = CURRENT_TIMESTAMP');
      updates.push('shipping_status = ?');
      bindings.push('delivered');
    } else if (data.status === 'cancelled' && !order.cancelled_at) {
      updates.push('cancelled_at = CURRENT_TIMESTAMP');
    }

    bindings.push(id);
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
    await this.db.prepare(query).bind(...bindings).run();

    // 记录状态历史
    await this.addStatusHistory(id, data.status, data.note, data.created_by);

    const updatedOrder = await this.getOrderById(id);
    if (!updatedOrder) {
      throw new Error('Order not found after status update');
    }

    return updatedOrder;
  }

  /**
   * 删除订单
   */
  async deleteOrder(id: number): Promise<void> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // 只允许删除待处理或已取消的订单
    if (order.status !== 'pending' && order.status !== 'cancelled') {
      throw new Error('Can only delete pending or cancelled orders');
    }

    await this.db
      .prepare('DELETE FROM orders WHERE id = ?')
      .bind(id)
      .run();
  }

  /**
   * 添加状态历史记录
   */
  private async addStatusHistory(
    orderId: number,
    status: OrderStatus,
    note?: string,
    createdBy?: number
  ): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO order_status_history (order_id, status, note, created_by)
        VALUES (?, ?, ?, ?)
      `)
      .bind(orderId, status, note || null, createdBy || null)
      .run();
  }

  /**
   * 获取订单状态历史
   */
  async getOrderStatusHistory(orderId: number): Promise<OrderStatusHistory[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC')
      .bind(orderId)
      .all<OrderStatusHistory>();
    
    return results || [];
  }
}
