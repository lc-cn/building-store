-- 库存服务数据库表结构

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_variant_id INTEGER, -- 如果是变体商品
  sku VARCHAR(100) UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0, -- 可用库存
  reserved_quantity INTEGER DEFAULT 0, -- 已预留库存
  warehouse_id INTEGER, -- 仓库ID
  location VARCHAR(100), -- 库位
  low_stock_threshold INTEGER DEFAULT 10, -- 低库存警戒线
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 库存变动记录表
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- in, out, reserve, release, adjust
  quantity INTEGER NOT NULL, -- 变动数量 (正数为增加，负数为减少)
  before_quantity INTEGER NOT NULL, -- 变动前数量
  after_quantity INTEGER NOT NULL, -- 变动后数量
  reference_type VARCHAR(50), -- order, purchase, return, adjustment
  reference_id VARCHAR(100), -- 关联单据ID
  note TEXT,
  created_by INTEGER, -- 操作人
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- 库存预留记录表
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'reserved', -- reserved, released, consumed
  expires_at DATETIME, -- 预留过期时间
  released_at DATETIME,
  consumed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'CN',
  postal_code VARCHAR(20),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_inventory_id ON inventory_reservations(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_id ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status ON inventory_reservations(status);

-- 初始化默认仓库
INSERT OR IGNORE INTO warehouses (name, code, city, province) VALUES
  ('主仓库', 'WH001', '北京', '北京市'),
  ('华南仓', 'WH002', '广州', '广东省');
