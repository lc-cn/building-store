import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { InventoryHandler } from './handlers/inventory.handler';
import { WarehouseHandler } from './handlers/warehouse.handler';
import type { Env } from './types';

const app = new Hono<Env>();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'inventory-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '库存服务',
    version: '0.1.0',
    description: '库存管理、库存预留、库存释放、库存同步',
    runtime: 'Cloudflare Workers',
    endpoints: {
      inventory: {
        'GET /inventory/:sku': '查询SKU库存',
        'POST /inventory/adjust': '库存调整',
        'POST /inventory/reserve': '库存预留',
        'POST /inventory/release': '库存释放',
        'GET /inventory/transactions': '库存变动记录',
        'POST /inventory/cleanup-expired': '清理过期预留',
      },
      warehouses: {
        'GET /warehouses': '仓库列表',
        'POST /warehouses': '创建仓库',
        'GET /warehouses/:id': '仓库详情',
        'PUT /warehouses/:id': '更新仓库',
        'DELETE /warehouses/:id': '删除仓库',
        'GET /warehouses/:id/stats': '仓库库存统计',
      },
    },
  });
});

// ============ 库存路由 ============

// 查询SKU库存
app.get('/inventory/:sku', InventoryHandler.getInventory);

// 库存调整
app.post('/inventory/adjust', InventoryHandler.adjustInventory);

// 库存预留
app.post('/inventory/reserve', InventoryHandler.reserveInventory);

// 库存释放
app.post('/inventory/release', InventoryHandler.releaseInventory);

// 库存变动记录
app.get('/inventory/transactions', InventoryHandler.getTransactions);

// 清理过期的预留（可由定时任务调用）
app.post('/inventory/cleanup-expired', InventoryHandler.cleanupExpired);

// ============ 仓库路由 ============

// 获取仓库列表
app.get('/warehouses', WarehouseHandler.getWarehouses);

// 创建仓库
app.post('/warehouses', WarehouseHandler.createWarehouse);

// 获取仓库详情
app.get('/warehouses/:id', WarehouseHandler.getWarehouse);

// 更新仓库
app.put('/warehouses/:id', WarehouseHandler.updateWarehouse);

// 删除仓库
app.delete('/warehouses/:id', WarehouseHandler.deleteWarehouse);

// 获取仓库库存统计
app.get('/warehouses/:id/stats', WarehouseHandler.getWarehouseStats);

export default app;
