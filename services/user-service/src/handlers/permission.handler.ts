// 权限路由处理器

import { Context } from 'hono';
import { Bindings, Permission } from '../types';
import { PermissionService } from '../services/permission.service';

export async function createPermissionHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const input = await c.req.json<{ name: string, display_name: string, resource: string, action: string, description?: string }>();
    
    if (!input.name || !input.display_name || !input.resource || !input.action) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const permissionService = new PermissionService(c.env.DB);
    const permission = await permissionService.createPermission(input);
    
    return c.json({ permission }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create permission' }, 500);
  }
}

export async function getPermissionHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid permission ID' }, 400);
    }

    const permissionService = new PermissionService(c.env.DB);
    const permission = await permissionService.getPermissionById(id);
    
    if (!permission) {
      return c.json({ error: 'Permission not found' }, 404);
    }

    return c.json({ permission });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get permission' }, 500);
  }
}

export async function getPermissionsHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '100');

    const permissionService = new PermissionService(c.env.DB);
    const result = await permissionService.getPermissions(page, limit);

    return c.json({
      permissions: result.permissions,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get permissions' }, 500);
  }
}

export async function updatePermissionHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid permission ID' }, 400);
    }

    const input = await c.req.json<Partial<Permission>>();
    const permissionService = new PermissionService(c.env.DB);
    const permission = await permissionService.updatePermission(id, input);
    
    return c.json({ permission });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update permission' }, 500);
  }
}

export async function deletePermissionHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid permission ID' }, 400);
    }

    const permissionService = new PermissionService(c.env.DB);
    const success = await permissionService.deletePermission(id);
    
    if (!success) {
      return c.json({ error: 'Failed to delete permission' }, 500);
    }

    return c.json({ message: 'Permission deleted successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete permission' }, 500);
  }
}
