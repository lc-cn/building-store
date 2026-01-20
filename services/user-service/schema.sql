-- 用户服务数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL, -- 资源名称，如 users, products, orders
  action VARCHAR(20) NOT NULL, -- 操作类型：create, read, update, delete, manage
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 初始化默认角色
INSERT OR IGNORE INTO roles (name, display_name, description) VALUES
  ('super_admin', '超级管理员', '系统最高权限管理员'),
  ('admin', '管理员', '普通管理员'),
  ('merchant', '商家', '商家账号'),
  ('customer', '客户', '普通客户');

-- 初始化默认权限
INSERT OR IGNORE INTO permissions (name, display_name, resource, action, description) VALUES
  -- 用户管理权限
  ('users.create', '创建用户', 'users', 'create', '创建新用户'),
  ('users.read', '查看用户', 'users', 'read', '查看用户信息'),
  ('users.update', '更新用户', 'users', 'update', '更新用户信息'),
  ('users.delete', '删除用户', 'users', 'delete', '删除用户'),
  ('users.manage', '管理用户', 'users', 'manage', '完全管理用户'),
  
  -- 角色管理权限
  ('roles.create', '创建角色', 'roles', 'create', '创建新角色'),
  ('roles.read', '查看角色', 'roles', 'read', '查看角色信息'),
  ('roles.update', '更新角色', 'roles', 'update', '更新角色信息'),
  ('roles.delete', '删除角色', 'roles', 'delete', '删除角色'),
  ('roles.manage', '管理角色', 'roles', 'manage', '完全管理角色'),
  
  -- 产品管理权限
  ('products.create', '创建产品', 'products', 'create', '创建新产品'),
  ('products.read', '查看产品', 'products', 'read', '查看产品信息'),
  ('products.update', '更新产品', 'products', 'update', '更新产品信息'),
  ('products.delete', '删除产品', 'products', 'delete', '删除产品'),
  ('products.manage', '管理产品', 'products', 'manage', '完全管理产品'),
  
  -- 订单管理权限
  ('orders.create', '创建订单', 'orders', 'create', '创建新订单'),
  ('orders.read', '查看订单', 'orders', 'read', '查看订单信息'),
  ('orders.update', '更新订单', 'orders', 'update', '更新订单信息'),
  ('orders.delete', '删除订单', 'orders', 'delete', '删除订单'),
  ('orders.manage', '管理订单', 'orders', 'manage', '完全管理订单');
