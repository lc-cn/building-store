import type { D1Database } from '@cloudflare/workers-types';
import type { Product, CreateProductInput, UpdateProductInput } from '../types';

interface ProductSearchParams {
  category_id?: number;
  status?: string;
  featured?: boolean;
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export class ProductService {
  constructor(private db: D1Database) {}

  async searchProducts(params: ProductSearchParams): Promise<PaginatedResult<Product>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const bindings: any[] = [];

    if (params.category_id) {
      whereClause += ' AND category_id = ?';
      bindings.push(params.category_id);
    }

    if (params.status) {
      whereClause += ' AND status = ?';
      bindings.push(params.status);
    }

    if (params.featured !== undefined) {
      whereClause += ' AND featured = ?';
      bindings.push(params.featured ? 1 : 0);
    }

    if (params.search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
      const searchTerm = `%${params.search}%`;
      bindings.push(searchTerm, searchTerm, searchTerm);
    }

    if (params.min_price !== undefined) {
      whereClause += ' AND price >= ?';
      bindings.push(params.min_price);
    }

    if (params.max_price !== undefined) {
      whereClause += ' AND price <= ?';
      bindings.push(params.max_price);
    }

    // 获取总数
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM products WHERE ${whereClause}`)
      .bind(...bindings)
      .first();

    const total = (countResult as any)?.total || 0;

    // 排序
    const sortField = params.sort || 'created_at';
    const order = params.order || 'desc';
    const orderByClause = `ORDER BY ${sortField} ${order.toUpperCase()}`;

    // 获取数据
    const result = await this.db
      .prepare(`
        SELECT * FROM products 
        WHERE ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();

    const products = ((result.results || []) as unknown as Product[]).map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images as string) : [],
      dimensions: p.dimensions ? JSON.parse(p.dimensions as string) : null,
    }));

    return {
      data: products,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: number): Promise<Product | null> {
    const result = await this.db
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first();

    if (!result) return null;

    return {
      ...result,
      images: result.images ? JSON.parse(result.images as string) : [],
      dimensions: result.dimensions ? JSON.parse(result.dimensions as string) : null,
    } as Product;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const result = await this.db
      .prepare('SELECT * FROM products WHERE slug = ?')
      .bind(slug)
      .first();

    if (!result) return null;

    return {
      ...result,
      images: result.images ? JSON.parse(result.images as string) : [],
      dimensions: result.dimensions ? JSON.parse(result.dimensions as string) : null,
    } as Product;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    // 验证分类存在
    const category = await this.db
      .prepare('SELECT id FROM categories WHERE id = ?')
      .bind(input.category_id)
      .first();

    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查 slug 唯一性
    const slugExists = await this.getProductBySlug(input.slug);
    if (slugExists) {
      throw new Error('产品 slug 已存在');
    }

    // 检查 SKU 唯一性
    const skuExists = await this.db
      .prepare('SELECT id FROM products WHERE sku = ?')
      .bind(input.sku)
      .first();

    if (skuExists) {
      throw new Error('产品 SKU 已存在');
    }

    const imagesJson = input.images ? JSON.stringify(input.images) : null;
    const dimensionsJson = input.dimensions ? JSON.stringify(input.dimensions) : null;

    const result = await this.db
      .prepare(`
        INSERT INTO products (
          category_id, name, slug, description, short_description,
          price, compare_price, cost_price, sku, barcode, images,
          status, featured, weight, dimensions, meta_title, meta_description, meta_keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.category_id,
        input.name,
        input.slug,
        input.description || null,
        input.short_description || null,
        input.price,
        input.compare_price || null,
        input.cost_price || null,
        input.sku,
        input.barcode || null,
        imagesJson,
        input.status || 'draft',
        input.featured ? 1 : 0,
        input.weight || null,
        dimensionsJson,
        input.meta_title || null,
        input.meta_description || null,
        input.meta_keywords || null
      )
      .run();

    const product = await this.getProductById(result.meta.last_row_id as number);
    if (!product) {
      throw new Error('创建产品失败');
    }

    return product;
  }

  async updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new Error('产品不存在');
    }

    if (input.category_id) {
      const category = await this.db
        .prepare('SELECT id FROM categories WHERE id = ?')
        .bind(input.category_id)
        .first();

      if (!category) {
        throw new Error('分类不存在');
      }
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await this.getProductBySlug(input.slug);
      if (slugExists) {
        throw new Error('产品 slug 已存在');
      }
    }

    if (input.sku && input.sku !== existing.sku) {
      const skuExists = await this.db
        .prepare('SELECT id FROM products WHERE sku = ?')
        .bind(input.sku)
        .first();

      if (skuExists) {
        throw new Error('产品 SKU 已存在');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(input.category_id);
    }
    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.slug !== undefined) {
      updates.push('slug = ?');
      params.push(input.slug);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description || null);
    }
    if (input.short_description !== undefined) {
      updates.push('short_description = ?');
      params.push(input.short_description || null);
    }
    if (input.price !== undefined) {
      updates.push('price = ?');
      params.push(input.price);
    }
    if (input.compare_price !== undefined) {
      updates.push('compare_price = ?');
      params.push(input.compare_price || null);
    }
    if (input.cost_price !== undefined) {
      updates.push('cost_price = ?');
      params.push(input.cost_price || null);
    }
    if (input.sku !== undefined) {
      updates.push('sku = ?');
      params.push(input.sku);
    }
    if (input.barcode !== undefined) {
      updates.push('barcode = ?');
      params.push(input.barcode || null);
    }
    if (input.images !== undefined) {
      updates.push('images = ?');
      params.push(input.images ? JSON.stringify(input.images) : null);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.featured !== undefined) {
      updates.push('featured = ?');
      params.push(input.featured ? 1 : 0);
    }
    if (input.weight !== undefined) {
      updates.push('weight = ?');
      params.push(input.weight || null);
    }
    if (input.dimensions !== undefined) {
      updates.push('dimensions = ?');
      params.push(input.dimensions ? JSON.stringify(input.dimensions) : null);
    }
    if (input.meta_title !== undefined) {
      updates.push('meta_title = ?');
      params.push(input.meta_title || null);
    }
    if (input.meta_description !== undefined) {
      updates.push('meta_description = ?');
      params.push(input.meta_description || null);
    }
    if (input.meta_keywords !== undefined) {
      updates.push('meta_keywords = ?');
      params.push(input.meta_keywords || null);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await this.db
      .prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updated = await this.getProductById(id);
    if (!updated) {
      throw new Error('更新产品失败');
    }

    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new Error('产品不存在');
    }

    await this.db
      .prepare('DELETE FROM products WHERE id = ?')
      .bind(id)
      .run();
  }

  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM products 
        WHERE featured = 1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all();

    return ((result.results || []) as unknown as Product[]).map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images as string) : [],
      dimensions: p.dimensions ? JSON.parse(p.dimensions as string) : null,
    }));
  }
}
