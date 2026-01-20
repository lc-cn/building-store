import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CategoryHandler } from './handlers/category.handler';
import { ProductHandler } from './handlers/product.handler';
import { VariantHandler } from './handlers/variant.handler';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('/*', cors());

// 错误处理中间件
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    { 
      success: false, 
      error: err.message || '服务器内部错误' 
    },
    500
  );
});

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'product-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '产品服务',
    version: '0.1.0',
    description: '产品目录管理、分类管理、产品搜索、价格管理',
    runtime: 'Cloudflare Workers',
    endpoints: {
      categories: {
        list: 'GET /categories',
        tree: 'GET /categories?tree=true',
        create: 'POST /categories',
        get: 'GET /categories/:id',
        update: 'PUT /categories/:id',
        delete: 'DELETE /categories/:id',
      },
      products: {
        search: 'GET /products',
        featured: 'GET /products/featured',
        create: 'POST /products',
        get: 'GET /products/:id',
        update: 'PUT /products/:id',
        delete: 'DELETE /products/:id',
      },
      variants: {
        list: 'GET /products/:id/variants',
        create: 'POST /products/:id/variants',
        get: 'GET /variants/:id',
        update: 'PUT /variants/:id',
        delete: 'DELETE /variants/:id',
      }
    }
  });
});

// ==================== 分类路由 ====================

// 获取分类列表（支持树形结构和父分类筛选）
app.get('/categories', CategoryHandler.getCategories);

// 创建分类
app.post('/categories', CategoryHandler.createCategory);

// 获取分类详情
app.get('/categories/:id', CategoryHandler.getCategoryById);

// 更新分类
app.put('/categories/:id', CategoryHandler.updateCategory);

// 删除分类
app.delete('/categories/:id', CategoryHandler.deleteCategory);

// ==================== 产品路由 ====================

// 获取推荐产品
app.get('/products/featured', ProductHandler.getFeaturedProducts);

// 搜索/筛选产品列表（支持分页、排序、筛选）
app.get('/products', ProductHandler.searchProducts);

// 创建产品
app.post('/products', ProductHandler.createProduct);

// 获取产品详情
app.get('/products/:id', ProductHandler.getProductById);

// 更新产品
app.put('/products/:id', ProductHandler.updateProduct);

// 删除产品
app.delete('/products/:id', ProductHandler.deleteProduct);

// ==================== 变体路由 ====================

// 获取产品的所有变体
app.get('/products/:id/variants', VariantHandler.getVariantsByProductId);

// 创建产品变体
app.post('/products/:id/variants', VariantHandler.createVariant);

// 获取变体详情
app.get('/variants/:id', VariantHandler.getVariantById);

// 更新变体
app.put('/variants/:id', VariantHandler.updateVariant);

// 删除变体
app.delete('/variants/:id', VariantHandler.deleteVariant);

export default app;
