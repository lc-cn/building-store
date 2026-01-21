# product-service

## 服务说明

product-service - 基于 Cloudflare Workers 的 Serverless 微服务，提供产品目录管理、分类管理、产品搜索、价格管理等功能。

## 技术栈

- **运行时**: Cloudflare Workers Runtime
- **框架**: Hono (轻量级Web框架)
- **数据库**: Cloudflare D1 (SQL数据库) / KV (键值存储)
- **开发语言**: TypeScript

## 特点

- ✅ 全球边缘部署
- ✅ 零冷启动
- ✅ 自动扩展
- ✅ 按请求计费
- ✅ 高可用性

## API 接口

### 分类管理

#### 获取分类列表
```http
GET /categories
GET /categories?parent_id=1  # 获取指定父分类下的子分类
GET /categories?tree=true    # 获取树形结构
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "电子产品",
      "slug": "electronics",
      "parent_id": null,
      "description": "各类电子产品",
      "image_url": "https://...",
      "sort_order": 0,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 创建分类
```http
POST /categories
Content-Type: application/json

{
  "name": "智能手机",
  "slug": "smartphones",
  "parent_id": 1,
  "description": "各品牌智能手机",
  "image_url": "https://...",
  "sort_order": 0
}
```

#### 获取分类详情
```http
GET /categories/:id
```

#### 更新分类
```http
PUT /categories/:id
Content-Type: application/json

{
  "name": "智能手机（更新）",
  "status": "inactive"
}
```

#### 删除分类
```http
DELETE /categories/:id
```

### 产品管理

#### 搜索/筛选产品
```http
GET /products
GET /products?category_id=1
GET /products?status=active
GET /products?featured=true
GET /products?search=iPhone
GET /products?min_price=100&max_price=1000
GET /products?page=1&limit=20
GET /products?sort=price&order=asc
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "description": "最新款 iPhone",
      "short_description": "A17 Pro 芯片",
      "price": 7999.00,
      "compare_price": 8999.00,
      "cost_price": 6000.00,
      "sku": "IP15PRO-256-BLK",
      "barcode": "1234567890123",
      "images": ["https://...", "https://..."],
      "status": "active",
      "featured": true,
      "weight": 0.187,
      "dimensions": {"length": 14.67, "width": 7.18, "height": 0.83},
      "meta_title": "iPhone 15 Pro - Apple",
      "meta_description": "...",
      "meta_keywords": "iPhone,Apple,智能手机",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "total_pages": 5
}
```

#### 获取推荐产品
```http
GET /products/featured
GET /products/featured?limit=10
```

#### 创建产品
```http
POST /products
Content-Type: application/json

{
  "category_id": 1,
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "最新款 iPhone",
  "short_description": "A17 Pro 芯片",
  "price": 7999.00,
  "compare_price": 8999.00,
  "sku": "IP15PRO-256-BLK",
  "images": ["https://..."],
  "status": "active",
  "featured": true
}
```

#### 获取产品详情
```http
GET /products/:id
```

#### 更新产品
```http
PUT /products/:id
Content-Type: application/json

{
  "price": 7499.00,
  "status": "active"
}
```

#### 删除产品
```http
DELETE /products/:id
```

### 产品变体管理

#### 获取产品的所有变体
```http
GET /products/:id/variants
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "sku": "IP15PRO-256-BLK",
      "name": "iPhone 15 Pro - 256GB 黑色",
      "price": 7999.00,
      "compare_price": 8999.00,
      "cost_price": 6000.00,
      "barcode": "1234567890123",
      "image_url": "https://...",
      "attributes": {
        "color": "黑色",
        "storage": "256GB"
      },
      "weight": 0.187,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 创建产品变体
```http
POST /products/:id/variants
Content-Type: application/json

{
  "sku": "IP15PRO-512-WHT",
  "name": "iPhone 15 Pro - 512GB 白色",
  "price": 9999.00,
  "attributes": {
    "color": "白色",
    "storage": "512GB"
  }
}
```

#### 获取变体详情
```http
GET /variants/:id
```

#### 更新变体
```http
PUT /variants/:id
Content-Type: application/json

{
  "price": 9499.00,
  "status": "active"
}
```

#### 删除变体
```http
DELETE /variants/:id
```

## 错误响应

所有错误响应格式统一：
```json
{
  "success": false,
  "error": "错误信息"
}
```

常见 HTTP 状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器错误

## 数据库 Schema

数据库表结构详见 `schema.sql` 文件。

## 开发与部署

### 本地开发

```bash
cd services/product-service
npm install
npm run dev
```

访问: http://localhost:8787

### 部署到 Cloudflare

```bash
npm run deploy
```

### 查看实时日志

```bash
npm run tail
```

## 配置

- `wrangler.toml`: Cloudflare Workers 配置
- `.dev.vars`: 本地开发环境变量
- 生产环境变量在 Cloudflare Dashboard 中配置

## 文档

详见主仓库的 [开发指南](../../docs/development.md)
