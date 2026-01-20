import type { D1Database } from '@cloudflare/workers-types';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types';

export class CategoryService {
  constructor(private db: D1Database) {}

  async getAllCategories(parentId?: number): Promise<Category[]> {
    let query = 'SELECT * FROM categories';
    const params: any[] = [];
    
    if (parentId !== undefined) {
      query += ' WHERE parent_id = ?';
      params.push(parentId);
    }
    
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const result = await this.db.prepare(query).bind(...params).all();
    return (result.results || []) as unknown as Category[];
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const result = await this.db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .bind(id)
      .first();
    return result as Category | null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const result = await this.db
      .prepare('SELECT * FROM categories WHERE slug = ?')
      .bind(slug)
      .first();
    return result as Category | null;
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.getCategoryBySlug(input.slug);
    if (existing) {
      throw new Error('分类 slug 已存在');
    }

    if (input.parent_id) {
      const parent = await this.getCategoryById(input.parent_id);
      if (!parent) {
        throw new Error('父分类不存在');
      }
    }

    const result = await this.db
      .prepare(`
        INSERT INTO categories (name, slug, parent_id, description, image_url, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.name,
        input.slug,
        input.parent_id || null,
        input.description || null,
        input.image_url || null,
        input.sort_order || 0
      )
      .run();

    const category = await this.getCategoryById(result.meta.last_row_id as number);
    if (!category) {
      throw new Error('创建分类失败');
    }

    return category;
  }

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('分类不存在');
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await this.getCategoryBySlug(input.slug);
      if (slugExists) {
        throw new Error('分类 slug 已存在');
      }
    }

    if (input.parent_id) {
      if (input.parent_id === id) {
        throw new Error('不能将分类设为自己的父分类');
      }
      const parent = await this.getCategoryById(input.parent_id);
      if (!parent) {
        throw new Error('父分类不存在');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.slug !== undefined) {
      updates.push('slug = ?');
      params.push(input.slug);
    }
    if (input.parent_id !== undefined) {
      updates.push('parent_id = ?');
      params.push(input.parent_id || null);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description || null);
    }
    if (input.image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(input.image_url || null);
    }
    if (input.sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(input.sort_order);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await this.db
      .prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    const updated = await this.getCategoryById(id);
    if (!updated) {
      throw new Error('更新分类失败');
    }

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('分类不存在');
    }

    // 检查是否有子分类
    const children = await this.db
      .prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?')
      .bind(id)
      .first();
    
    if (children && (children as any).count > 0) {
      throw new Error('该分类下存在子分类，无法删除');
    }

    // 检查是否有产品使用此分类
    const products = await this.db
      .prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?')
      .bind(id)
      .first();
    
    if (products && (products as any).count > 0) {
      throw new Error('该分类下存在产品，无法删除');
    }

    await this.db
      .prepare('DELETE FROM categories WHERE id = ?')
      .bind(id)
      .run();
  }

  async getCategoryTree(): Promise<any[]> {
    const categories = await this.getAllCategories();
    const tree: any[] = [];
    const map = new Map<number, any>();

    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const node = map.get(cat.id);
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id).children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
