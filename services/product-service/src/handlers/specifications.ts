import { Context } from 'hono';

/**
 * 商品规格管理
 */
export const specificationHandlers = {
  // 获取所有规格
  async list(c: Context) {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT * FROM product_specifications ORDER BY sort_order ASC
    `).all();
    return c.json({ success: true, data: results });
  },

  // 创建规格
  async create(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { name, type, values, sort_order } = body;

    const result = await db.prepare(`
      INSERT INTO product_specifications (name, type, values, sort_order)
      VALUES (?, ?, ?, ?)
    `).bind(name, type, JSON.stringify(values), sort_order || 0).run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body }
    }, 201);
  },

  // 更新规格
  async update(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, type, values, sort_order } = body;

    await db.prepare(`
      UPDATE product_specifications 
      SET name = ?, type = ?, values = ?, sort_order = ?
      WHERE id = ?
    `).bind(name, type, JSON.stringify(values), sort_order || 0, id).run();

    return c.json({ success: true, data: { id, ...body } });
  },

  // 删除规格
  async delete(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare(`DELETE FROM product_specifications WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  }
};

/**
 * 商品单位管理
 */
export const unitHandlers = {
  // 获取所有单位
  async list(c: Context) {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT * FROM product_units ORDER BY name ASC
    `).all();
    return c.json({ success: true, data: results });
  },

  // 创建单位
  async create(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { name, symbol, type } = body;

    const result = await db.prepare(`
      INSERT INTO product_units (name, symbol, type)
      VALUES (?, ?, ?)
    `).bind(name, symbol, type).run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body }
    }, 201);
  },

  // 更新单位
  async update(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, symbol, type } = body;

    await db.prepare(`
      UPDATE product_units SET name = ?, symbol = ?, type = ? WHERE id = ?
    `).bind(name, symbol, type, id).run();

    return c.json({ success: true, data: { id, ...body } });
  },

  // 删除单位
  async delete(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare(`DELETE FROM product_units WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  }
};
