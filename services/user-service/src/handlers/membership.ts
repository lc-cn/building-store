import { Context } from 'hono';

/**
 * 会员卡类型管理
 */
export const membershipTypeHandlers = {
  // 获取所有会员卡类型
  async list(c: Context) {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT * FROM membership_types ORDER BY level ASC
    `).all();
    return c.json({ success: true, data: results });
  },

  // 创建会员卡类型
  async create(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { name, level, discount, benefits, price, validity_days } = body;

    const result = await db.prepare(`
      INSERT INTO membership_types (name, level, discount, benefits, price, validity_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, level, discount, benefits, price, validity_days).run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body }
    }, 201);
  },

  // 更新会员卡类型
  async update(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, level, discount, benefits, price, validity_days } = body;

    await db.prepare(`
      UPDATE membership_types 
      SET name = ?, level = ?, discount = ?, benefits = ?, price = ?, validity_days = ?
      WHERE id = ?
    `).bind(name, level, discount, benefits, price, validity_days, id).run();

    return c.json({ success: true, data: { id, ...body } });
  },

  // 删除会员卡类型
  async delete(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare(`DELETE FROM membership_types WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  }
};

/**
 * 会员卡管理
 */
export const membershipCardHandlers = {
  // 获取用户的会员卡
  async getUserCards(c: Context) {
    const db = c.env.DB;
    const userId = c.req.param('userId');

    const { results } = await db.prepare(`
      SELECT mc.*, mt.name as type_name, mt.level, mt.discount, mt.benefits
      FROM membership_cards mc
      JOIN membership_types mt ON mc.type_id = mt.id
      WHERE mc.user_id = ?
      ORDER BY mc.created_at DESC
    `).bind(userId).all();

    return c.json({ success: true, data: results });
  },

  // 开通会员卡
  async create(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { user_id, type_id } = body;

    // 获取会员类型信息
    const type = await db.prepare(`SELECT * FROM membership_types WHERE id = ?`).bind(type_id).first();
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (type.validity_days * 24 * 60 * 60 * 1000));
    
    const result = await db.prepare(`
      INSERT INTO membership_cards (user_id, type_id, card_number, status, expires_at)
      VALUES (?, ?, ?, 'active', ?)
    `).bind(user_id, type_id, `MC${Date.now()}${user_id}`, expiresAt.toISOString()).run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body, status: 'active', expires_at: expiresAt }
    }, 201);
  },

  // 续费会员卡
  async renew(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    const card = await db.prepare(`
      SELECT mc.*, mt.validity_days 
      FROM membership_cards mc
      JOIN membership_types mt ON mc.type_id = mt.id
      WHERE mc.id = ?
    `).bind(id).first();

    const currentExpires = new Date(card.expires_at);
    const now = new Date();
    const baseDate = currentExpires > now ? currentExpires : now;
    const newExpires = new Date(baseDate.getTime() + (card.validity_days * 24 * 60 * 60 * 1000));

    await db.prepare(`
      UPDATE membership_cards SET expires_at = ?, status = 'active' WHERE id = ?
    `).bind(newExpires.toISOString(), id).run();

    return c.json({ success: true, data: { id, expires_at: newExpires } });
  },

  // 冻结/激活会员卡
  async updateStatus(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const { status } = await c.req.json();

    await db.prepare(`UPDATE membership_cards SET status = ? WHERE id = ?`).bind(status, id).run();
    return c.json({ success: true, data: { id, status } });
  },

  // 查询会员卡余额
  async getBalance(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    const card = await db.prepare(`
      SELECT id, user_id, card_number, balance, status, expires_at
      FROM membership_cards WHERE id = ?
    `).bind(id).first();

    if (!card) {
      return c.json({ success: false, error: '会员卡不存在' }, 404);
    }

    return c.json({ success: true, data: card });
  },

  // 增加余额（后台充值/手动增加）
  async addBalance(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { amount, operator_id, remark } = body;

    if (amount <= 0) {
      return c.json({ success: false, error: '充值金额必须大于0' }, 400);
    }

    // 获取当前余额
    const card = await db.prepare(`SELECT * FROM membership_cards WHERE id = ?`).bind(id).first();
    if (!card) {
      return c.json({ success: false, error: '会员卡不存在' }, 404);
    }

    const newBalance = (card.balance || 0) + amount;

    // 更新余额
    await db.prepare(`
      UPDATE membership_cards SET balance = ? WHERE id = ?
    `).bind(newBalance, id).run();

    // 记录余额变动
    await db.prepare(`
      INSERT INTO membership_balance_logs (
        card_id, user_id, type, amount, balance_before, balance_after, 
        operator_id, remark, created_at
      ) VALUES (?, ?, 'recharge', ?, ?, ?, ?, ?, ?)
    `).bind(
      id, card.user_id, amount, card.balance || 0, newBalance,
      operator_id, remark || '后台充值', new Date().toISOString()
    ).run();

    return c.json({ 
      success: true, 
      data: { 
        id, 
        balance_before: card.balance || 0, 
        balance_after: newBalance,
        amount
      } 
    });
  },

  // 扣减余额（消费）
  async deductBalance(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { amount, order_id, remark } = body;

    if (amount <= 0) {
      return c.json({ success: false, error: '扣减金额必须大于0' }, 400);
    }

    // 获取当前余额
    const card = await db.prepare(`SELECT * FROM membership_cards WHERE id = ?`).bind(id).first();
    if (!card) {
      return c.json({ success: false, error: '会员卡不存在' }, 404);
    }

    if (card.status !== 'active') {
      return c.json({ success: false, error: '会员卡状态异常' }, 400);
    }

    const currentBalance = card.balance || 0;
    if (currentBalance < amount) {
      return c.json({ success: false, error: '余额不足' }, 400);
    }

    const newBalance = currentBalance - amount;

    // 更新余额
    await db.prepare(`
      UPDATE membership_cards SET balance = ? WHERE id = ?
    `).bind(newBalance, id).run();

    // 记录余额变动
    await db.prepare(`
      INSERT INTO membership_balance_logs (
        card_id, user_id, type, amount, balance_before, balance_after,
        order_id, remark, created_at
      ) VALUES (?, ?, 'consume', ?, ?, ?, ?, ?, ?)
    `).bind(
      id, card.user_id, amount, currentBalance, newBalance,
      order_id, remark || '消费扣款', new Date().toISOString()
    ).run();

    return c.json({ 
      success: true, 
      data: { 
        id, 
        balance_before: currentBalance, 
        balance_after: newBalance,
        amount
      } 
    });
  },

  // 查询余额变动记录
  async getBalanceLogs(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const { type, page = 1, limit = 20 } = c.req.query();

    let query = `SELECT * FROM membership_balance_logs WHERE card_id = ?`;
    const params = [id];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const { results } = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: results });
  }
};
