// 用户服务类型定义

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  created_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  avatar_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CreateRoleInput {
  name: string;
  display_name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  display_name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface AssignRoleInput {
  user_id: number;
  role_id: number;
}

export interface AssignPermissionInput {
  role_id: number;
  permission_id: number;
}

export interface Bindings {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
}

export interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}
