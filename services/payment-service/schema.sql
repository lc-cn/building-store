-- 支付服务数据库表结构

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'CNY',
  payment_method VARCHAR(50) NOT NULL, -- wechat, alipay, card, cash, balance
  payment_provider VARCHAR(50), -- stripe, paypal, wechat_pay, alipay
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled, refunded
  
  -- 第三方支付信息
  provider_transaction_id VARCHAR(200), -- 第三方交易号
  provider_response TEXT, -- JSON 第三方响应
  
  -- 时间信息
  paid_at DATETIME,
  failed_at DATETIME,
  cancelled_at DATETIME,
  
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 退款记录表
CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  refund_number VARCHAR(50) UNIQUE NOT NULL,
  payment_id INTEGER NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, rejected
  
  -- 第三方退款信息
  provider_refund_id VARCHAR(200), -- 第三方退款号
  provider_response TEXT, -- JSON 第三方响应
  
  -- 时间信息
  approved_at DATETIME,
  rejected_at DATETIME,
  completed_at DATETIME,
  
  note TEXT,
  created_by INTEGER, -- 操作人
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- 支付账户余额表
CREATE TABLE IF NOT EXISTS balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  available_balance DECIMAL(10, 2) DEFAULT 0, -- 可用余额
  frozen_balance DECIMAL(10, 2) DEFAULT 0, -- 冻结余额
  total_recharged DECIMAL(10, 2) DEFAULT 0, -- 累计充值
  total_spent DECIMAL(10, 2) DEFAULT 0, -- 累计消费
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 余额变动记录表
CREATE TABLE IF NOT EXISTS balance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- recharge, payment, refund, freeze, unfreeze, withdraw
  amount DECIMAL(10, 2) NOT NULL, -- 变动金额
  before_balance DECIMAL(10, 2) NOT NULL,
  after_balance DECIMAL(10, 2) NOT NULL,
  reference_type VARCHAR(50), -- payment, refund, order
  reference_id VARCHAR(100),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_number ON refunds(refund_number);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(type);
