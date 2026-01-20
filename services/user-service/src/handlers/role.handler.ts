// 角色路由处理器

import { Context } from 'hono';
import { Bindings, CreateRoleInput, UpdateRoleInput } from '../types';
import { RoleService } from '../services/role.service';

export async function createRoleHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const input = await c.req.json<CreateRoleInput>();
    
    if (!input.name || !input.display_name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const roleService = new RoleService(c.env.DB);
    const role = await roleService.createRole(input);
    
    return c.json({ role }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create role' }, 500);
  }
}

export async function getRoleHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid role ID' }, 400);
    }

    const roleService = new RoleService(c.env.DB);
    const role = await roleService.getRoleById(id);
    
    if (!role) {
      return c.json({ error: 'Role not found' }, 404);
    }

    return c.json({ role });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get role' }, 500);
  }
}

export async function getRolesHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    const roleService = new RoleService(c.env.DB);
    const result = await roleService.getRoles(page, limit);

    return c.json({
      roles: result.roles,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get roles' }, 500);
  }
}

export async function updateRoleHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid role ID' }, 400);
    }

    const input = await c.req.json<UpdateRoleInput>();
    const roleService = new RoleService(c.env.DB);
    const role = await roleService.updateRole(id, input);
    
    return c.json({ role });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update role' }, 500);
  }
}

export async function deleteRoleHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid role ID' }, 400);
    }

    const roleService = new RoleService(c.env.DB);
    const success = await roleService.deleteRole(id);
    
    if (!success) {
      return c.json({ error: 'Failed to delete role' }, 500);
    }

    return c.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete role' }, 500);
  }
}

export async function getRolePermissionsHandler(c: Context<{ Bindings: Bindings }>) {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid role ID' }, 400);
    }

    const roleService = new RoleService(c.env.DB);
    const permissionIds = await roleService.getRolePermissions(id);

    return c.json({ 
      role_id: id,
      permission_ids: permissionIds 
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get role permissions' }, 500);
  }
}
