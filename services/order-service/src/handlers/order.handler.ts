import { Context } from 'hono';
import { OrderService } from '../services/order.service';
import { OrderItemService } from '../services/order-item.service';
import {
  WorkerEnv,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  CreateOrderItemRequest
} from '../types';

/**
 * 获取订单列表
 * GET /orders?user_id=1&status=pending&page=1&limit=20
 */
export async function getOrders(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);

    const user_id = c.req.query('user_id');
    const status = c.req.query('status');
    const page = c.req.query('page');
    const limit = c.req.query('limit');

    const result = await orderService.getOrders({
      user_id: user_id ? parseInt(user_id) : undefined,
      status: status as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });

    return c.json({
      success: true,
      data: result.orders,
      pagination: {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        total: result.total
      }
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 创建订单
 * POST /orders
 */
export async function createOrder(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);

    const data: CreateOrderRequest = await c.req.json();

    // 验证必填字段
    if (!data.user_id) {
      return c.json({ success: false, error: 'user_id is required' }, 400);
    }
    if (!data.items || data.items.length === 0) {
      return c.json({ success: false, error: 'items are required' }, 400);
    }
    if (!data.shipping_name || !data.shipping_phone || !data.shipping_address) {
      return c.json({ success: false, error: 'Shipping information is required' }, 400);
    }

    // 验证订单项
    for (const item of data.items) {
      if (!item.product_id || !item.sku || !item.name || !item.price || !item.quantity) {
        return c.json({ success: false, error: 'Invalid order item' }, 400);
      }
      if (item.quantity <= 0) {
        return c.json({ success: false, error: 'Quantity must be greater than 0' }, 400);
      }
      if (item.price < 0) {
        return c.json({ success: false, error: 'Price cannot be negative' }, 400);
      }
    }

    const order = await orderService.createOrder(data);

    return c.json({
      success: true,
      data: order
    }, 201);
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 获取订单详情
 * GET /orders/:id
 */
export async function getOrderById(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    const order = await orderService.getOrderById(id);

    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    return c.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 更新订单
 * PUT /orders/:id
 */
export async function updateOrder(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    const data: UpdateOrderRequest = await c.req.json();
    const order = await orderService.updateOrder(id, data);

    return c.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    if (error.message === 'Order not found') {
      return c.json({ success: false, error: error.message }, 404);
    }
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 删除订单
 * DELETE /orders/:id
 */
export async function deleteOrder(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    await orderService.deleteOrder(id);

    return c.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Order not found') {
      return c.json({ success: false, error: error.message }, 404);
    }
    if (error.message.includes('Can only delete')) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 更新订单状态
 * PUT /orders/:id/status
 */
export async function updateOrderStatus(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    const data: UpdateOrderStatusRequest = await c.req.json();

    if (!data.status) {
      return c.json({ success: false, error: 'status is required' }, 400);
    }

    const order = await orderService.updateOrderStatus(id, data);

    return c.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    if (error.message === 'Order not found') {
      return c.json({ success: false, error: error.message }, 404);
    }
    if (error.message.includes('Cannot change order status')) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 获取订单项列表
 * GET /orders/:id/items
 */
export async function getOrderItems(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const orderItemService = new OrderItemService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    // 验证订单存在
    const order = await orderService.getOrderById(id);
    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    const items = await orderItemService.getOrderItems(id);

    return c.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 添加订单项
 * POST /orders/:id/items
 */
export async function addOrderItem(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const orderItemService = new OrderItemService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    // 验证订单存在
    const order = await orderService.getOrderById(id);
    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    // 只允许为待处理订单添加订单项
    if (order.status !== 'pending') {
      return c.json({ 
        success: false, 
        error: 'Can only add items to pending orders' 
      }, 400);
    }

    const data: CreateOrderItemRequest = await c.req.json();

    // 验证必填字段
    if (!data.product_id || !data.sku || !data.name || !data.price || !data.quantity) {
      return c.json({ success: false, error: 'Invalid order item data' }, 400);
    }
    if (data.quantity <= 0) {
      return c.json({ success: false, error: 'Quantity must be greater than 0' }, 400);
    }
    if (data.price < 0) {
      return c.json({ success: false, error: 'Price cannot be negative' }, 400);
    }

    const item = await orderItemService.createOrderItem(id, data);

    // 重新计算订单总额
    const items = await orderItemService.getOrderItems(id);
    const subtotal = orderItemService.calculateSubtotal(
      items.map(i => ({
        product_id: i.product_id,
        sku: i.sku,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      }))
    );
    const total = subtotal + (order.shipping_fee || 0) + (order.tax || 0) - (order.discount || 0);

    await db
      .prepare('UPDATE orders SET subtotal = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(subtotal, total, id)
      .run();

    return c.json({
      success: true,
      data: item
    }, 201);
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * 获取订单状态历史
 * GET /orders/:id/history
 */
export async function getOrderHistory(c: any) {
  try {
    const db = c.env.DB;
    const orderService = new OrderService(db);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid order ID' }, 400);
    }

    // 验证订单存在
    const order = await orderService.getOrderById(id);
    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    const history = await orderService.getOrderStatusHistory(id);

    return c.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
}
