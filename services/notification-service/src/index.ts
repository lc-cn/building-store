import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { NotificationHandler } from './handlers/notification.handler';
import { TemplateHandler } from './handlers/template.handler';
import { PreferenceHandler } from './handlers/preference.handler';
import { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'notification-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '通知服务',
    version: '0.1.0',
    description: '邮件通知、短信通知、站内消息、推送通知',
    runtime: 'Cloudflare Workers',
    endpoints: {
      notifications: {
        send: 'POST /notifications/send',
        list: 'GET /notifications',
        get: 'GET /notifications/:id',
        markAsRead: 'PUT /notifications/:id/read',
      },
      templates: {
        list: 'GET /templates',
        create: 'POST /templates',
        get: 'GET /templates/:id',
        update: 'PUT /templates/:id',
        delete: 'DELETE /templates/:id',
      },
      preferences: {
        get: 'GET /preferences/:user_id',
        update: 'PUT /preferences/:user_id',
      },
    },
  });
});

// ============================================
// 通知路由
// ============================================

// 发送通知
app.post('/notifications/send', NotificationHandler.send);

// 获取通知列表
app.get('/notifications', NotificationHandler.list);

// 获取通知详情
app.get('/notifications/:id', NotificationHandler.get);

// 标记为已读
app.put('/notifications/:id/read', NotificationHandler.markAsRead);

// ============================================
// 模板路由
// ============================================

// 获取模板列表
app.get('/templates', TemplateHandler.list);

// 创建模板
app.post('/templates', TemplateHandler.create);

// 获取模板详情
app.get('/templates/:id', TemplateHandler.get);

// 更新模板
app.put('/templates/:id', TemplateHandler.update);

// 删除模板
app.delete('/templates/:id', TemplateHandler.delete);

// ============================================
// 用户偏好路由
// ============================================

// 获取用户通知偏好
app.get('/preferences/:user_id', PreferenceHandler.get);

// 更新用户通知偏好
app.put('/preferences/:user_id', PreferenceHandler.update);

export default app;
