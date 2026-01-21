// 认证路由处理器

import { Context } from 'hono';
import { Bindings } from '../types';
import { AuthService } from '../services/auth.service';

export async function loginHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const { email, password } = await c.req.json<{ email: string, password: string }>();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return c.json({ error: '服务器配置错误' }, 500);
    }

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);
    
    const result = await authService.login(email, password);
    
    return c.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials' || error.message === 'User account is not active') {
      return c.json({ error: error.message }, 401);
    }
    return c.json({ error: 'Login failed' }, 500);
  }
}

export async function assignRoleHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const { user_id, role_id } = await c.req.json<{ user_id: number, role_id: number }>();
    
    if (!user_id || !role_id) {
      return c.json({ error: 'user_id and role_id are required' }, 400);
    }

    if (!c.env.JWT_SECRET) {
      return c.json({ error: '服务器配置错误' }, 500);
    }

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);
    
    const success = await authService.assignRoleToUser(user_id, role_id);
    
    if (!success) {
      return c.json({ error: 'Failed to assign role' }, 500);
    }

    return c.json({ message: 'Role assigned successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to assign role' }, 500);
  }
}

export async function removeRoleHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const { user_id, role_id } = await c.req.json<{ user_id: number, role_id: number }>();
    
    if (!user_id || !role_id) {
      return c.json({ error: 'user_id and role_id are required' }, 400);
    }

    if (!c.env.JWT_SECRET) {
      return c.json({ error: '服务器配置错误' }, 500);
    }

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);
    
    const success = await authService.removeRoleFromUser(user_id, role_id);
    
    if (!success) {
      return c.json({ error: 'Failed to remove role' }, 500);
    }

    return c.json({ message: 'Role removed successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to remove role' }, 500);
  }
}

export async function assignPermissionHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const { role_id, permission_id } = await c.req.json<{ role_id: number, permission_id: number }>();
    
    if (!role_id || !permission_id) {
      return c.json({ error: 'role_id and permission_id are required' }, 400);
    }

    if (!c.env.JWT_SECRET) {
      return c.json({ error: '服务器配置错误' }, 500);
    }

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);
    
    const success = await authService.assignPermissionToRole(role_id, permission_id);
    
    if (!success) {
      return c.json({ error: 'Failed to assign permission' }, 500);
    }

    return c.json({ message: 'Permission assigned successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to assign permission' }, 500);
  }
}

export async function removePermissionHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const { role_id, permission_id } = await c.req.json<{ role_id: number, permission_id: number }>();
    
    if (!role_id || !permission_id) {
      return c.json({ error: 'role_id and permission_id are required' }, 400);
    }

    if (!c.env.JWT_SECRET) {
      return c.json({ error: '服务器配置错误' }, 500);
    }

    const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);
    
    const success = await authService.removePermissionFromRole(role_id, permission_id);
    
    if (!success) {
      return c.json({ error: 'Failed to remove permission' }, 500);
    }

    return c.json({ message: 'Permission removed successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to remove permission' }, 500);
  }
}
