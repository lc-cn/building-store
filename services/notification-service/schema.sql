-- 通知服务数据库表结构

-- 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, push, system
  channel VARCHAR(50), -- 具体渠道 wechat, aliyun_sms, etc
  title VARCHAR(200),
  content TEXT NOT NULL,
  data TEXT, -- JSON 额外数据
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, read
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- 接收方信息
  recipient_email VARCHAR(200),
  recipient_phone VARCHAR(20),
  recipient_device_token VARCHAR(500), -- Push 通知的设备token
  
  -- 发送信息
  sent_at DATETIME,
  read_at DATETIME,
  failed_at DATETIME,
  error_message TEXT,
  
  -- 关联信息
  reference_type VARCHAR(50), -- order, payment, system
  reference_id VARCHAR(100),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, push, system
  subject VARCHAR(200), -- 邮件主题或通知标题
  content TEXT NOT NULL, -- 模板内容，支持变量 {{variable}}
  variables TEXT, -- JSON array 可用变量列表 ["order_number", "amount"]
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知订阅设置表
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- order_update, payment_success, marketing, etc
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, notification_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_templates_code ON notification_templates(code);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 初始化默认通知模板
INSERT OR IGNORE INTO notification_templates (code, name, type, subject, content, variables) VALUES
  ('order_created', '订单创建通知', 'system', '订单已创建', '您的订单 {{order_number}} 已成功创建，订单金额：¥{{amount}}', '["order_number", "amount"]'),
  ('order_paid', '订单支付成功', 'system', '支付成功', '您的订单 {{order_number}} 支付成功，金额：¥{{amount}}', '["order_number", "amount"]'),
  ('order_shipped', '订单已发货', 'system', '订单已发货', '您的订单 {{order_number}} 已发货，快递单号：{{tracking_number}}', '["order_number", "tracking_number"]'),
  ('order_delivered', '订单已送达', 'system', '订单已送达', '您的订单 {{order_number}} 已送达，感谢您的购买！', '["order_number"]');
