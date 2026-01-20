import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PaymentHandler } from './handlers/payment.handler';
import { RefundHandler } from './handlers/refund.handler';
import { BalanceHandler } from './handlers/balance.handler';
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'payment-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '支付服务',
    version: '0.1.0',
    description: '支付处理、退款处理、支付回调、账单管理',
    runtime: 'Cloudflare Workers'
  });
});

// ==================== 支付路由 ====================
// 支付记录列表
app.get('/payments', PaymentHandler.list);

// 创建支付记录
app.post('/payments', PaymentHandler.create);

// 支付记录详情
app.get('/payments/:id', PaymentHandler.getById);

// 更新支付记录
app.put('/payments/:id', PaymentHandler.update);

// 完成支付
app.post('/payments/:id/complete', PaymentHandler.complete);

// 支付失败
app.post('/payments/:id/fail', PaymentHandler.fail);

// ==================== 退款路由 ====================
// 退款记录列表
app.get('/refunds', RefundHandler.list);

// 创建退款记录
app.post('/refunds', RefundHandler.create);

// 退款记录详情
app.get('/refunds/:id', RefundHandler.getById);

// 更新退款记录
app.put('/refunds/:id', RefundHandler.update);

// 批准退款
app.post('/refunds/:id/approve', RefundHandler.approve);

// 拒绝退款
app.post('/refunds/:id/reject', RefundHandler.reject);

// ==================== 余额路由 ====================
// 查询用户余额
app.get('/balance/:user_id', BalanceHandler.getBalance);

// 充值
app.post('/balance/recharge', BalanceHandler.recharge);

// 余额变动记录
app.get('/balance/:user_id/transactions', BalanceHandler.getTransactions);

// 冻结余额
app.post('/balance/:user_id/freeze', BalanceHandler.freeze);

// 解冻余额
app.post('/balance/:user_id/unfreeze', BalanceHandler.unfreeze);

export default app;
