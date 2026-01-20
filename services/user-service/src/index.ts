import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings } from './types';
import { authMiddleware, requirePermission, requireSuperAdmin } from './middleware/auth';

// Handlers
import { 
  createUserHandler, 
  getUserHandler, 
  getUsersHandler, 
  updateUserHandler, 
  deleteUserHandler,
  getUserPermissionsHandler 
} from './handlers/user.handler';
import { 
  createRoleHandler, 
  getRoleHandler, 
  getRolesHandler, 
  updateRoleHandler, 
  deleteRoleHandler,
  getRolePermissionsHandler 
} from './handlers/role.handler';
import { 
  createPermissionHandler, 
  getPermissionHandler, 
  getPermissionsHandler, 
  updatePermissionHandler, 
  deletePermissionHandler 
} from './handlers/permission.handler';
import { 
  loginHandler, 
  assignRoleHandler, 
  removeRoleHandler, 
  assignPermissionHandler, 
  removePermissionHandler 
} from './handlers/auth.handler';
import { membershipTypeHandlers, membershipCardHandlers } from './handlers/membership';

const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'user-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '用户服务',
    version: '1.0.0',
    description: '用户注册、登录、权限管理',
    runtime: 'Cloudflare Workers',
    features: [
      '用户CRUD',
      '角色管理',
      '权限管理',
      'JWT认证',
      'RBAC权限系统',
      '用户角色关联',
      '角色权限关联'
    ]
  });
});

// 认证相关路由 (公开访问)
app.post('/auth/login', loginHandler);

// 用户路由
app.post('/users', createUserHandler); // 公开注册
app.get('/users', authMiddleware, requirePermission('users.read'), getUsersHandler);
app.get('/users/:id', authMiddleware, requirePermission('users.read'), getUserHandler);
app.put('/users/:id', authMiddleware, requirePermission('users.update'), updateUserHandler);
app.delete('/users/:id', authMiddleware, requirePermission('users.delete'), deleteUserHandler);
app.get('/users/:id/permissions', authMiddleware, getUserPermissionsHandler);

// 角色路由
app.post('/roles', authMiddleware, requireSuperAdmin(), createRoleHandler);
app.get('/roles', authMiddleware, requirePermission('roles.read'), getRolesHandler);
app.get('/roles/:id', authMiddleware, requirePermission('roles.read'), getRoleHandler);
app.put('/roles/:id', authMiddleware, requireSuperAdmin(), updateRoleHandler);
app.delete('/roles/:id', authMiddleware, requireSuperAdmin(), deleteRoleHandler);
app.get('/roles/:id/permissions', authMiddleware, requirePermission('roles.read'), getRolePermissionsHandler);

// 权限路由
app.post('/permissions', authMiddleware, requireSuperAdmin(), createPermissionHandler);
app.get('/permissions', authMiddleware, requirePermission('roles.read'), getPermissionsHandler);
app.get('/permissions/:id', authMiddleware, requirePermission('roles.read'), getPermissionHandler);
app.put('/permissions/:id', authMiddleware, requireSuperAdmin(), updatePermissionHandler);
app.delete('/permissions/:id', authMiddleware, requireSuperAdmin(), deletePermissionHandler);

// 用户角色关联路由
app.post('/user-roles', authMiddleware, requireSuperAdmin(), assignRoleHandler);
app.delete('/user-roles', authMiddleware, requireSuperAdmin(), removeRoleHandler);

// 角色权限关联路由
app.post('/role-permissions', authMiddleware, requireSuperAdmin(), assignPermissionHandler);
app.delete('/role-permissions', authMiddleware, requireSuperAdmin(), removePermissionHandler);

// 会员卡类型路由
app.get('/membership-types', membershipTypeHandlers.list);
app.post('/membership-types', authMiddleware, requireSuperAdmin(), membershipTypeHandlers.create);
app.put('/membership-types/:id', authMiddleware, requireSuperAdmin(), membershipTypeHandlers.update);
app.delete('/membership-types/:id', authMiddleware, requireSuperAdmin(), membershipTypeHandlers.delete);

// 会员卡路由
app.get('/users/:userId/membership-cards', authMiddleware, membershipCardHandlers.getUserCards);
app.post('/membership-cards', authMiddleware, membershipCardHandlers.create);
app.post('/membership-cards/:id/renew', authMiddleware, membershipCardHandlers.renew);
app.put('/membership-cards/:id/status', authMiddleware, membershipCardHandlers.updateStatus);

export default app;
