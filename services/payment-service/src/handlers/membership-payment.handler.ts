import { Context } from 'hono';

/**
 * 会员卡余额支付处理器
 */
export const membershipPaymentHandlers = {
  // 使用会员卡余额支付
  async payWithMembership(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { order_id, card_id, amount, user_id } = body;

    // 验证金额
    if (!amount || amount <= 0) {
      return c.json({ success: false, error: '支付金额必须大于0' }, 400);
    }

    // 检查会员卡状态和余额（需要调用user-service API）
    // 这里简化处理，实际应该调用user-service
    const card = await db.prepare(`
      SELECT * FROM membership_cards WHERE id = ? AND user_id = ?
    `).bind(card_id, user_id).first();

    if (!card) {
      return c.json({ success: false, error: '会员卡不存在' }, 404);
    }

    if (card.status !== 'active') {
      return c.json({ success: false, error: '会员卡状态异常' }, 400);
    }

    const currentBalance = card.balance || 0;
    if (currentBalance < amount) {
      return c.json({ success: false, error: '会员卡余额不足' }, 400);
    }

    // 创建支付记录
    const paymentNo = `MP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.prepare(`
      INSERT INTO payments (
        payment_no, order_id, user_id, payment_method, amount,
        status, paid_at, created_at
      ) VALUES (?, ?, ?, 'membership', ?, 'completed', ?, ?)
    `).bind(
      paymentNo, order_id, user_id, amount,
      new Date().toISOString(), new Date().toISOString()
    ).run();

    // 扣减会员卡余额
    const newBalance = currentBalance - amount;
    await db.prepare(`
      UPDATE membership_cards SET balance = ? WHERE id = ?
    `).bind(newBalance, card_id).run();

    // 记录余额变动
    await db.prepare(`
      INSERT INTO membership_balance_logs (
        card_id, user_id, type, amount, balance_before, balance_after,
        order_id, remark, created_at
      ) VALUES (?, ?, 'consume', ?, ?, ?, ?, '会员卡支付', ?)
    `).bind(
      card_id, user_id, amount, currentBalance, newBalance,
      order_id, new Date().toISOString()
    ).run();

    return c.json({ 
      success: true, 
      data: { 
        payment_id: result.meta.last_row_id,
        payment_no: paymentNo,
        amount,
        payment_method: 'membership',
        status: 'completed',
        balance_before: currentBalance,
        balance_after: newBalance
      } 
    }, 201);
  },

  // 查询会员卡余额是否足够支付
  async checkBalance(c: Context) {
    const db = c.env.DB;
    const { card_id, amount } = c.req.query();

    if (!card_id || !amount) {
      return c.json({ success: false, error: '参数错误' }, 400);
    }

    const card = await db.prepare(`
      SELECT id, card_number, balance, status FROM membership_cards WHERE id = ?
    `).bind(card_id).first();

    if (!card) {
      return c.json({ success: false, error: '会员卡不存在' }, 404);
    }

    const currentBalance = card.balance || 0;
    const canPay = card.status === 'active' && currentBalance >= parseFloat(amount);

    return c.json({ 
      success: true, 
      data: {
        card_id,
        balance: currentBalance,
        required_amount: parseFloat(amount),
        can_pay: canPay,
        status: card.status
      }
    });
  },

  // 会员卡支付退款
  async refundMembership(c: Context) {
    const db = c.env.DB;
    const body = await c.req.json();
    const { payment_id, refund_amount, reason } = body;

    // 获取原支付记录
    const payment = await db.prepare(`
      SELECT * FROM payments WHERE id = ? AND payment_method = 'membership'
    `).bind(payment_id).first();

    if (!payment) {
      return c.json({ success: false, error: '支付记录不存在' }, 404);
    }

    if (payment.status !== 'completed') {
      return c.json({ success: false, error: '只能退款已完成的支付' }, 400);
    }

    const actualRefundAmount = refund_amount || payment.amount;
    if (actualRefundAmount > payment.amount) {
      return c.json({ success: false, error: '退款金额不能超过支付金额' }, 400);
    }

    // 创建退款记录
    const refundNo = `MR${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.prepare(`
      INSERT INTO refunds (
        refund_no, payment_id, order_id, user_id, amount,
        reason, status, refunded_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    `).bind(
      refundNo, payment_id, payment.order_id, payment.user_id, actualRefundAmount,
      reason || '订单退款', new Date().toISOString(), new Date().toISOString()
    ).run();

    // 获取会员卡信息（需要从支付记录关联）
    // 简化处理：假设可以从payment表关联到card_id
    // 实际应该在payments表添加card_id字段
    // 这里通过user_id查找会员卡
    const card = await db.prepare(`
      SELECT * FROM membership_cards WHERE user_id = ? AND status = 'active' LIMIT 1
    `).bind(payment.user_id).first();

    if (card) {
      // 退款到会员卡余额
      const currentBalance = card.balance || 0;
      const newBalance = currentBalance + actualRefundAmount;
      
      await db.prepare(`
        UPDATE membership_cards SET balance = ? WHERE id = ?
      `).bind(newBalance, card.id).run();

      // 记录余额变动
      await db.prepare(`
        INSERT INTO membership_balance_logs (
          card_id, user_id, type, amount, balance_before, balance_after,
          order_id, remark, created_at
        ) VALUES (?, ?, 'refund', ?, ?, ?, ?, '订单退款', ?)
      `).bind(
        card.id, payment.user_id, actualRefundAmount, currentBalance, newBalance,
        payment.order_id, new Date().toISOString()
      ).run();
    }

    return c.json({ 
      success: true, 
      data: { 
        refund_id: result.meta.last_row_id,
        refund_no: refundNo,
        amount: actualRefundAmount,
        status: 'completed'
      } 
    }, 201);
  }
};
