import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { WorkerEnv } from './types';
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderItems,
  addOrderItem,
  getOrderHistory
} from './handlers/order.handler';

const app = new Hono<{ Bindings: WorkerEnv }>();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'order-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '订单服务',
    version: '0.1.0',
    description: '订单创建、订单状态管理、订单查询、订单历史',
    runtime: 'Cloudflare Workers',
    endpoints: {
      'GET /orders': '获取订单列表',
      'POST /orders': '创建订单',
      'GET /orders/:id': '获取订单详情',
      'PUT /orders/:id': '更新订单',
      'DELETE /orders/:id': '删除订单',
      'PUT /orders/:id/status': '更新订单状态',
      'GET /orders/:id/items': '获取订单项列表',
      'POST /orders/:id/items': '添加订单项',
      'GET /orders/:id/history': '获取订单状态历史'
    }
  });
});

// 订单路由
app.get('/orders', getOrders);
app.post('/orders', createOrder);
app.get('/orders/:id', getOrderById);
app.put('/orders/:id', updateOrder);
app.delete('/orders/:id', deleteOrder);

// 订单状态路由
app.put('/orders/:id/status', updateOrderStatus);

// 订单项路由
app.get('/orders/:id/items', getOrderItems);
app.post('/orders/:id/items', addOrderItem);

// 订单历史路由
app.get('/orders/:id/history', getOrderHistory);

export default app;
