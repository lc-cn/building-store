import { Context } from 'hono';

/**
 * 优惠券管理
 */
export const couponHandlers = {
  // 获取所有优惠券
  async list(c: Context) {
    const db = c.env.DB;
    const { status, type } = c.req.query();

    let query = `SELECT * FROM coupons WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC`;

    const { results } = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: results });
  },

  // 获取优惠券详情
  async get(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    const coupon = await db.prepare(`SELECT * FROM coupons WHERE id = ?`).bind(id).first();
    if (!coupon) {
      return c.json({ success: false, error: '优惠券不存在' }, 404);
    }

    return c.json({ success: true, data: coupon });
  },

  // 创建优惠券
  async create(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { 
      name, code, type, discount_type, discount_value, 
      min_amount, max_discount, total_count, per_user_limit,
      start_date, end_date, description, conditions
    } = body;

    const result = await db.prepare(`
      INSERT INTO coupons (
        name, code, type, discount_type, discount_value,
        min_amount, max_discount, total_count, used_count, per_user_limit,
        start_date, end_date, description, conditions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'active')
    `).bind(
      name, code, type, discount_type, discount_value,
      min_amount || 0, max_discount || 0, total_count, per_user_limit || 1,
      start_date, end_date, description, JSON.stringify(conditions || {})
    ).run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body, status: 'active', used_count: 0 }
    }, 201);
  },

  // 更新优惠券
  async update(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { 
      name, type, discount_type, discount_value,
      min_amount, max_discount, total_count, per_user_limit,
      start_date, end_date, description, conditions, status
    } = body;

    await db.prepare(`
      UPDATE coupons 
      SET name = ?, type = ?, discount_type = ?, discount_value = ?,
          min_amount = ?, max_discount = ?, total_count = ?, per_user_limit = ?,
          start_date = ?, end_date = ?, description = ?, conditions = ?, status = ?
      WHERE id = ?
    `).bind(
      name, type, discount_type, discount_value,
      min_amount, max_discount, total_count, per_user_limit,
      start_date, end_date, description, JSON.stringify(conditions || {}), status, id
    ).run();

    return c.json({ success: true, data: { id, ...body } });
  },

  // 删除优惠券
  async delete(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare(`DELETE FROM coupons WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  },

  // 领取优惠券
  async claim(c: Context) {
    const db = c.env.DB;
    const id = c.req.param('id');
    const { user_id } = await c.req.json();

    // 检查优惠券是否存在且可用
    const coupon = await db.prepare(`SELECT * FROM coupons WHERE id = ?`).bind(id).first();
    
    if (!coupon) {
      return c.json({ success: false, error: '优惠券不存在' }, 404);
    }

    if (coupon.status !== 'active') {
      return c.json({ success: false, error: '优惠券已失效' }, 400);
    }

    if (coupon.used_count >= coupon.total_count) {
      return c.json({ success: false, error: '优惠券已抢完' }, 400);
    }

    const now = new Date();
    if (new Date(coupon.start_date) > now || new Date(coupon.end_date) < now) {
      return c.json({ success: false, error: '不在优惠券使用时间内' }, 400);
    }

    // 检查用户领取次数
    const { results } = await db.prepare(`
      SELECT COUNT(*) as count FROM user_coupons 
      WHERE user_id = ? AND coupon_id = ?
    `).bind(user_id, id).all();

    if (results[0].count >= coupon.per_user_limit) {
      return c.json({ success: false, error: '已达到领取上限' }, 400);
    }

    // 领取优惠券
    const result = await db.prepare(`
      INSERT INTO user_coupons (user_id, coupon_id, status, expires_at)
      VALUES (?, ?, 'unused', ?)
    `).bind(user_id, id, coupon.end_date).run();

    // 更新已领取数量
    await db.prepare(`
      UPDATE coupons SET used_count = used_count + 1 WHERE id = ?
    `).bind(id).run();

    return c.json({ 
      success: true, 
      data: { 
        id: result.meta.last_row_id, 
        user_id, 
        coupon_id: id,
        status: 'unused',
        expires_at: coupon.end_date
      }
    }, 201);
  },

  // 使用优惠券
  async use(c: Context) {
    const db = c.env.DB;
    const userCouponId = c.req.param('userCouponId');
    const { order_id } = await c.req.json();

    const userCoupon = await db.prepare(`
      SELECT * FROM user_coupons WHERE id = ?
    `).bind(userCouponId).first();

    if (!userCoupon) {
      return c.json({ success: false, error: '用户优惠券不存在' }, 404);
    }

    if (userCoupon.status !== 'unused') {
      return c.json({ success: false, error: '优惠券已使用或已过期' }, 400);
    }

    await db.prepare(`
      UPDATE user_coupons 
      SET status = 'used', used_at = ?, order_id = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), order_id, userCouponId).run();

    return c.json({ success: true, data: { id: userCouponId, status: 'used' } });
  },

  // 获取用户的优惠券
  async getUserCoupons(c: Context) {
    const db = c.env.DB;
    const userId = c.req.param('userId');
    const { status } = c.req.query();

    let query = `
      SELECT uc.*, c.name, c.code, c.type, c.discount_type, c.discount_value,
             c.min_amount, c.max_discount, c.description
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ` AND uc.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY uc.created_at DESC`;

    const { results } = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: results });
  }
};
