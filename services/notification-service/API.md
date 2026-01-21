# Notification Service API 文档

通知服务提供邮件、短信、推送和站内消息等多种通知功能。

## 基础信息

- **基础 URL**: `https://notification-service.your-domain.com`
- **数据格式**: JSON

## API 端点

### 通知 (Notifications)

#### 1. 发送通知

发送一条新通知，支持直接内容或使用模板。

```http
POST /notifications/send
```

**请求体**:
```json
{
  "user_id": 1,
  "type": "system",
  "title": "订单已创建",
  "content": "您的订单已成功创建",
  "priority": "normal",
  "reference_type": "order",
  "reference_id": "ORD-001",
  "data": {
    "order_id": "ORD-001"
  }
}
```

**使用模板发送**:
```json
{
  "user_id": 1,
  "type": "email",
  "template_code": "order_created",
  "template_variables": {
    "order_number": "ORD-001",
    "amount": "299.99"
  },
  "recipient_email": "user@example.com",
  "priority": "high"
}
```

**参数说明**:
- `user_id` (必填): 用户ID
- `type` (必填): 通知类型 - `email`, `sms`, `push`, `system`
- `title`: 通知标题
- `content`: 通知内容 (当不使用模板时必填)
- `template_code`: 模板代码 (使用模板时必填)
- `template_variables`: 模板变量 (使用模板时)
- `priority`: 优先级 - `low`, `normal`, `high`, `urgent` (默认: `normal`)
- `recipient_email`: 接收邮箱 (email 类型时)
- `recipient_phone`: 接收手机 (sms 类型时)
- `recipient_device_token`: 设备Token (push 类型时)
- `reference_type`: 关联类型 (如: order, payment)
- `reference_id`: 关联ID
- `data`: 额外数据 (JSON对象)

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "type": "system",
    "title": "订单已创建",
    "content": "您的订单已成功创建",
    "status": "sent",
    "priority": "normal",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 2. 获取通知列表

查询通知历史记录。

```http
GET /notifications?user_id=1&type=system&status=sent&page=1&limit=20
```

**查询参数**:
- `user_id`: 用户ID (过滤)
- `type`: 通知类型 (过滤)
- `status`: 状态 - `pending`, `sent`, `failed`, `read` (过滤)
- `priority`: 优先级 (过滤)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "type": "system",
      "title": "订单已创建",
      "content": "您的订单已成功创建",
      "status": "sent",
      "priority": "normal",
      "sent_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

#### 3. 获取通知详情

查询单条通知的详细信息。

```http
GET /notifications/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "type": "system",
    "title": "订单已创建",
    "content": "您的订单已成功创建",
    "status": "sent",
    "priority": "normal",
    "data": "{\"order_id\":\"ORD-001\"}",
    "reference_type": "order",
    "reference_id": "ORD-001",
    "sent_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 4. 标记为已读

将通知标记为已读状态。

```http
PUT /notifications/:id/read
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "read",
    "read_at": "2024-01-01T00:05:00Z"
  }
}
```

---

### 模板 (Templates)

#### 1. 获取模板列表

查询通知模板。

```http
GET /templates?type=email&status=active&page=1&limit=20
```

**查询参数**:
- `type`: 模板类型 (过滤)
- `status`: 状态 - `active`, `inactive` (过滤)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "order_created",
      "name": "订单创建通知",
      "type": "system",
      "subject": "订单已创建",
      "content": "您的订单 {{order_number}} 已成功创建，订单金额：¥{{amount}}",
      "variables": "[\"order_number\",\"amount\"]",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

#### 2. 创建模板

创建新的通知模板。

```http
POST /templates
```

**请求体**:
```json
{
  "code": "password_reset",
  "name": "密码重置通知",
  "type": "email",
  "subject": "重置密码",
  "content": "您好 {{username}}，您的密码重置链接是：{{reset_link}}",
  "variables": ["username", "reset_link"],
  "status": "active"
}
```

**参数说明**:
- `code` (必填): 模板唯一代码
- `name` (必填): 模板名称
- `type` (必填): 通知类型
- `subject`: 标题/主题
- `content` (必填): 模板内容，使用 `{{variable}}` 语法
- `variables`: 可用变量列表
- `status`: 状态 (默认: `active`)

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "code": "password_reset",
    "name": "密码重置通知",
    "type": "email",
    "subject": "重置密码",
    "content": "您好 {{username}}，您的密码重置链接是：{{reset_link}}",
    "variables": "[\"username\",\"reset_link\"]",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. 获取模板详情

查询单个模板的详细信息。

```http
GET /templates/:id
```

#### 4. 更新模板

更新现有模板。

```http
PUT /templates/:id
```

**请求体**:
```json
{
  "content": "新的模板内容 {{variable}}",
  "status": "inactive"
}
```

#### 5. 删除模板

删除指定模板。

```http
DELETE /templates/:id
```

**响应**:
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

### 用户偏好 (Preferences)

#### 1. 获取用户通知偏好

查询用户的通知偏好设置。

```http
GET /preferences/:user_id
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "notification_type": "order_update",
      "email_enabled": true,
      "sms_enabled": false,
      "push_enabled": true,
      "system_enabled": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "notification_type": "marketing",
      "email_enabled": false,
      "sms_enabled": false,
      "push_enabled": false,
      "system_enabled": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. 更新用户通知偏好

更新单个或多个通知偏好。

**单个更新**:
```http
PUT /preferences/:user_id
```

```json
{
  "notification_type": "order_update",
  "email_enabled": true,
  "sms_enabled": true,
  "push_enabled": true,
  "system_enabled": true
}
```

**批量更新**:
```json
[
  {
    "notification_type": "order_update",
    "email_enabled": true,
    "push_enabled": true
  },
  {
    "notification_type": "marketing",
    "email_enabled": false,
    "sms_enabled": false
  }
]
```

**响应 (单个)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "notification_type": "order_update",
    "email_enabled": true,
    "sms_enabled": true,
    "push_enabled": true,
    "system_enabled": true,
    "updated_at": "2024-01-01T00:05:00Z"
  }
}
```

**响应 (批量)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "notification_type": "order_update",
      "email_enabled": true,
      "push_enabled": true
    },
    {
      "id": 2,
      "user_id": 1,
      "notification_type": "marketing",
      "email_enabled": false,
      "sms_enabled": false
    }
  ]
}
```

---

## 通知类型

- `email` - 邮件通知
- `sms` - 短信通知
- `push` - 推送通知
- `system` - 站内消息

## 通知状态

- `pending` - 等待发送
- `sent` - 已发送
- `failed` - 发送失败
- `read` - 已读

## 优先级

- `low` - 低优先级
- `normal` - 普通优先级 (默认)
- `high` - 高优先级
- `urgent` - 紧急

## 错误响应

所有 API 在出错时返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见 HTTP 状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `409` - 资源冲突 (如模板代码重复)
- `500` - 服务器内部错误

## 使用示例

### 示例 1: 使用模板发送订单通知

```bash
curl -X POST https://notification-service.your-domain.com/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "type": "email",
    "template_code": "order_created",
    "template_variables": {
      "order_number": "ORD-20240101-001",
      "amount": "299.99"
    },
    "recipient_email": "user@example.com",
    "priority": "high",
    "reference_type": "order",
    "reference_id": "ORD-20240101-001"
  }'
```

### 示例 2: 查询用户的系统通知

```bash
curl "https://notification-service.your-domain.com/notifications?user_id=123&type=system&status=sent&limit=10"
```

### 示例 3: 设置用户通知偏好

```bash
curl -X PUT https://notification-service.your-domain.com/preferences/123 \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "marketing",
    "email_enabled": false,
    "sms_enabled": false,
    "push_enabled": false,
    "system_enabled": false
  }'
```

## 模板变量语法

模板中使用 `{{variable_name}}` 语法定义变量，例如：

```
您好 {{username}}，

您的订单 {{order_number}} 已成功创建。
订单金额：¥{{amount}}
预计送达时间：{{delivery_time}}

感谢您的购买！
```

发送时提供对应的变量值：

```json
{
  "username": "张三",
  "order_number": "ORD-001",
  "amount": "299.99",
  "delivery_time": "2024-01-05"
}
```

最终生成的内容：

```
您好 张三，

您的订单 ORD-001 已成功创建。
订单金额：¥299.99
预计送达时间：2024-01-05

感谢您的购买！
```
