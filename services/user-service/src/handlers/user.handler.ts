// 用户路由处理器

import { Context } from 'hono';
import { Bindings, CreateUserInput, UpdateUserInput } from '../types';
import { UserService } from '../services/user.service';

export async function createUserHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const input = await c.req.json<CreateUserInput>();
    
    // 验证输入
    if (!input.username || !input.email || !input.password) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // 验证密码强度
    if (input.password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const userService = new UserService(c.env.DB);
    
    // 检查用户名是否已存在
    const existingUsername = await userService.getUserByUsername(input.username);
    if (existingUsername) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // 检查邮箱是否已存在
    const existingEmail = await userService.getUserByEmail(input.email);
    if (existingEmail) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    const user = await userService.createUser(input);
    
    // 移除密码哈希
    const { password_hash, ...userWithoutPassword } = user;
    
    return c.json({ user: userWithoutPassword }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create user' }, 500);
  }
}

export async function getUserHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    const userService = new UserService(c.env.DB);
    const user = await userService.getUserById(id);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get user' }, 500);
  }
}

export async function getUsersHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');

    const userService = new UserService(c.env.DB);
    const result = await userService.getUsers(page, limit);

    return c.json({
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get users' }, 500);
  }
}

export async function updateUserHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    const input = await c.req.json<UpdateUserInput>();
    
    // 验证邮箱格式（如果提供）
    if (input.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }
    }

    // 验证密码强度（如果提供）
    if (input.password && input.password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const userService = new UserService(c.env.DB);
    const user = await userService.updateUser(id, input);
    
    return c.json({ user });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update user' }, 500);
  }
}

export async function deleteUserHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    const userService = new UserService(c.env.DB);
    const success = await userService.deleteUser(id);
    
    if (!success) {
      return c.json({ error: 'Failed to delete user' }, 500);
    }

    return c.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete user' }, 500);
  }
}

export async function getUserPermissionsHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    const userService = new UserService(c.env.DB);
    const roles = await userService.getUserRoles(id);
    const permissions = await userService.getUserPermissions(id);

    return c.json({ 
      user_id: id,
      roles, 
      permissions 
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get user permissions' }, 500);
  }
}
