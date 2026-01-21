import type { D1Database } from '@cloudflare/workers-types';
import type { ProductVariant, CreateVariantInput, UpdateVariantInput } from '../types';

export class VariantService {
  constructor(private db: D1Database) {}

  async getVariantsByProductId(productId: number): Promise<ProductVariant[]> {
    const result = await this.db
      .prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at ASC')
      .bind(productId)
      .all();

    return ((result.results || []) as unknown as ProductVariant[]).map(v => ({
      ...v,
      attributes: v.attributes ? JSON.parse(v.attributes as string) : {},
    }));
  }

  async getVariantById(id: number): Promise<ProductVariant | null> {
    const result = await this.db
      .prepare('SELECT * FROM product_variants WHERE id = ?')
      .bind(id)
      .first();

    if (!result) return null;

    return {
      ...result,
      attributes: result.attributes ? JSON.parse(result.attributes as string) : {},
    } as ProductVariant;
  }

  async getVariantBySku(sku: string): Promise<ProductVariant | null> {
    const result = await this.db
      .prepare('SELECT * FROM product_variants WHERE sku = ?')
      .bind(sku)
      .first();

    if (!result) return null;

    return {
      ...result,
      attributes: result.attributes ? JSON.parse(result.attributes as string) : {},
    } as ProductVariant;
  }

  async createVariant(input: CreateVariantInput): Promise<ProductVariant> {
    // 验证产品存在
    const product = await this.db
      .prepare('SELECT id FROM products WHERE id = ?')
      .bind(input.product_id)
      .first();

    if (!product) {
      throw new Error('产品不存在');
    }

    // 检查 SKU 唯一性
    const skuExists = await this.getVariantBySku(input.sku);
    if (skuExists) {
      throw new Error('SKU 已存在');
    }

    const attributesJson = input.attributes ? JSON.stringify(input.attributes) : null;

    const result = await this.db
      .prepare(`
        INSERT INTO product_variants (
          product_id, sku, name, price, compare_price, cost_price,
          barcode, image_url, attributes, weight
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.product_id,
        input.sku,
        input.name,
        input.price,
        input.compare_price || null,
        input.cost_price || null,
        input.barcode || null,
        input.image_url || null,
        attributesJson,
        input.weight || null
      )
      .run();

    const variant = await this.getVariantById(result.meta.last_row_id as number);
    if (!variant) {
      throw new Error('创建变体失败');
    }

    return variant;
  }

  async updateVariant(id: number, input: UpdateVariantInput): Promise<ProductVariant> {
    const existing = await this.getVariantById(id);
    if (!existing) {
      throw new Error('变体不存在');
    }

    if (input.sku && input.sku !== existing.sku) {
      const skuExists = await this.getVariantBySku(input.sku);
      if (skuExists) {
        throw new Error('SKU 已存在');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.sku !== undefined) {
      updates.push('sku = ?');
      params.push(input.sku);
    }
    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
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
    if (input.barcode !== undefined) {
      updates.push('barcode = ?');
      params.push(input.barcode || null);
    }
    if (input.image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(input.image_url || null);
    }
    if (input.attributes !== undefined) {
      updates.push('attributes = ?');
      params.push(input.attributes ? JSON.stringify(input.attributes) : null);
    }
    if (input.weight !== undefined) {
      updates.push('weight = ?');
      params.push(input.weight || null);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await this.db
      .prepare(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updated = await this.getVariantById(id);
    if (!updated) {
      throw new Error('更新变体失败');
    }

    return updated;
  }

  async deleteVariant(id: number): Promise<void> {
    const existing = await this.getVariantById(id);
    if (!existing) {
      throw new Error('变体不存在');
    }

    await this.db
      .prepare('DELETE FROM product_variants WHERE id = ?')
      .bind(id)
      .run();
  }
}
