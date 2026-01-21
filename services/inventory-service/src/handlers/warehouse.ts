import { Context } from 'hono';

/**
 * 仓库管理
 */
export const warehouseHandlers = {
  // 获取所有仓库
  async list(c: Context) {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT * FROM warehouses ORDER BY created_at DESC
    `).all();
    return c.json({ success: true, data: results });
  },

  // 获取仓库详情
  async get(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    const warehouse = await db.prepare(`SELECT * FROM warehouses WHERE id = ?`).bind(id).first();
    if (!warehouse) {
      return c.json({ success: false, error: '仓库不存在' }, 404);
    }

    return c.json({ success: true, data: warehouse });
  },

  // 创建仓库
  async create(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { name, code, address, contact_person, contact_phone, type, status } = body;

    const result = await db.prepare(`
      INSERT INTO warehouses (name, code, address, contact_person, contact_phone, type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(name, code, address, contact_person, contact_phone, type, status || 'active').run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body }
    }, 201);
  },

  // 更新仓库
  async update(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, code, address, contact_person, contact_phone, type, status } = body;

    await db.prepare(`
      UPDATE warehouses 
      SET name = ?, code = ?, address = ?, contact_person = ?, contact_phone = ?, type = ?, status = ?
      WHERE id = ?
    `).bind(name, code, address, contact_person, contact_phone, type, status, id).run();

    return c.json({ success: true, data: { id, ...body } });
  },

  // 删除仓库
  async delete(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    // 检查是否有库存
    const { results } = await db.prepare(`
      SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = ?
    `).bind(id).all();

    if (results[0].count > 0) {
      return c.json({ success: false, error: '仓库中还有库存，无法删除' }, 400);
    }

    await db.prepare(`DELETE FROM warehouses WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  },

  // 获取仓库库存统计
  async getInventoryStats(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    const { results } = await db.prepare(`
      SELECT 
        COUNT(DISTINCT product_id) as product_count,
        SUM(quantity) as total_quantity,
        SUM(quantity * (SELECT price FROM products WHERE id = inventory.product_id)) as total_value
      FROM inventory
      WHERE warehouse_id = ?
    `).bind(id).all();

    return c.json({ success: true, data: results[0] });
  }
};
