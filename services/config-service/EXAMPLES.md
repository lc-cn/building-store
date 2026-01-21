# 配置中心服务使用示例

本文档提供配置中心服务的完整使用示例。

## 前提条件

确保配置中心服务已启动：

```bash
cd services/config-service
npm run dev
```

服务将在 `http://localhost:8787` 运行。

## 环境变量

```bash
BASE_URL=http://localhost:8787
ADMIN_TOKEN=admin-token
USER_TOKEN=user-token
```

## 1. 环境管理示例

### 获取所有环境

```bash
curl http://localhost:8787/environments
```

响应：
```json
{
  "environments": [
    {
      "name": "dev",
      "displayName": "开发环境",
      "description": "用于开发和测试",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isActive": true
    }
  ],
  "count": 3
}
```

### 获取环境下的所有服务

```bash
curl http://localhost:8787/environments/dev/services
```

## 2. 配置管理示例

### 创建配置

```bash
# 创建普通配置
curl -X POST http://localhost:8787/config/dev/user-service \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "database.host",
    "value": "localhost",
    "description": "数据库主机地址"
  }'

# 创建加密配置
curl -X POST http://localhost:8787/config/dev/user-service \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "database.password",
    "value": "secret123",
    "description": "数据库密码",
    "encrypt": true
  }'

# 创建多个配置
curl -X POST http://localhost:8787/config/dev/user-service \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "database.port", "value": "5432"}'

curl -X POST http://localhost:8787/config/dev/user-service \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "database.name", "value": "users_db"}'

curl -X POST http://localhost:8787/config/dev/user-service \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "cache.ttl", "value": "3600"}'
```

### 获取配置

```bash
# 获取单个配置
curl http://localhost:8787/config/dev/user-service/database.host

# 获取服务的所有配置
curl http://localhost:8787/config/dev/user-service
```

### 更新配置

```bash
# 更新配置值
curl -X PUT http://localhost:8787/config/dev/user-service/database.host \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "db.example.com",
    "description": "生产数据库地址"
  }'

# 多次更新以创建版本历史
curl -X PUT http://localhost:8787/config/dev/user-service/database.host \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"value": "db2.example.com"}'

curl -X PUT http://localhost:8787/config/dev/user-service/database.host \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"value": "db3.example.com"}'
```

### 删除配置

```bash
curl -X DELETE http://localhost:8787/config/dev/user-service/cache.ttl \
  -H "Authorization: Bearer admin-token"
```

## 3. 版本管理示例

### 查看版本历史

```bash
# 获取最近10个版本
curl http://localhost:8787/versions/dev/user-service/database.host

# 获取最近5个版本
curl http://localhost:8787/versions/dev/user-service/database.host?limit=5
```

### 查看特定版本

```bash
# 查看版本1的内容
curl http://localhost:8787/versions/dev/user-service/database.host/1

# 查看版本2的内容
curl http://localhost:8787/versions/dev/user-service/database.host/2
```

### 版本回滚

```bash
# 回滚到版本1
curl -X POST http://localhost:8787/versions/dev/user-service/database.host/rollback/1 \
  -H "Authorization: Bearer admin-token"

# 验证回滚结果
curl http://localhost:8787/config/dev/user-service/database.host
```

### 版本比较

```bash
# 比较版本1和版本3的差异
curl "http://localhost:8787/versions/dev/user-service/database.host/compare?v1=1&v2=3"
```

## 4. 审计日志示例

### 查看审计日志

```bash
# 获取最近100条审计日志
curl http://localhost:8787/audit/dev/user-service \
  -H "Authorization: Bearer admin-token"

# 获取最近10条审计日志
curl "http://localhost:8787/audit/dev/user-service?limit=10" \
  -H "Authorization: Bearer admin-token"
```

## 5. 实时订阅示例（SSE）

### 订阅配置变更

```bash
# 订阅 user-service 的配置变更
curl -N http://localhost:8787/subscribe/dev/user-service
```

订阅后会持续接收事件：
```
data: {"type":"connected","environment":"dev","service":"user-service","timestamp":"..."}

data: {"type":"heartbeat","timestamp":"..."}

data: {"type":"config-changed","key":"database.host","value":"new-value","action":"update","timestamp":"..."}
```

## 6. 完整工作流示例

### 场景：管理用户服务的数据库配置

```bash
#!/bin/bash

BASE_URL="http://localhost:8787"
TOKEN="admin-token"

echo "=== 1. 创建初始配置 ==="
curl -X POST "$BASE_URL/config/dev/user-service" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "database.url",
    "value": "postgresql://localhost:5432/users",
    "description": "数据库连接URL"
  }'

echo -e "\n\n=== 2. 读取配置 ==="
curl "$BASE_URL/config/dev/user-service/database.url"

echo -e "\n\n=== 3. 更新配置（模拟生产地址） ==="
curl -X PUT "$BASE_URL/config/dev/user-service/database.url" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "postgresql://prod-db:5432/users",
    "description": "生产数据库连接URL"
  }'

echo -e "\n\n=== 4. 查看版本历史 ==="
curl "$BASE_URL/versions/dev/user-service/database.url"

echo -e "\n\n=== 5. 发现配置错误，回滚到版本1 ==="
curl -X POST "$BASE_URL/versions/dev/user-service/database.url/rollback/1" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== 6. 查看审计日志 ==="
curl "$BASE_URL/audit/dev/user-service" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== 完成 ==="
```

## 7. JavaScript/Node.js 集成示例

### 配置客户端封装

```javascript
// config-client.js
class ConfigClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getConfig(env, service, key) {
    const response = await fetch(
      `${this.baseUrl}/config/${env}/${service}/${key}`,
      {
        headers: this.token ? {
          'Authorization': `Bearer ${this.token}`
        } : {}
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get config: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getAllConfigs(env, service) {
    const response = await fetch(
      `${this.baseUrl}/config/${env}/${service}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get configs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.configs;
  }

  async setConfig(env, service, key, value, options = {}) {
    const response = await fetch(
      `${this.baseUrl}/config/${env}/${service}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value,
          ...options
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to set config: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async subscribe(env, service, callback) {
    const response = await fetch(
      `${this.baseUrl}/subscribe/${env}/${service}`
    );
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));
          callback(data);
        }
      }
    }
  }
}

// 使用示例
const client = new ConfigClient('http://localhost:8787', 'admin-token');

// 获取配置
const config = await client.getConfig('dev', 'user-service', 'database.host');
console.log('Database host:', config.value);

// 设置配置
await client.setConfig('dev', 'user-service', 'api.timeout', '30000', {
  description: 'API请求超时时间（毫秒）'
});

// 获取所有配置
const allConfigs = await client.getAllConfigs('dev', 'user-service');
console.log('All configs:', allConfigs);

// 订阅配置变更
client.subscribe('dev', 'user-service', (event) => {
  console.log('Config event:', event);
  if (event.type === 'config-changed') {
    console.log(`Config ${event.key} changed to ${event.value}`);
  }
});
```

## 8. Python 集成示例

```python
# config_client.py
import requests
from typing import Dict, Any, Optional

class ConfigClient:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.token = token
    
    def _headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers
    
    def get_config(self, env: str, service: str, key: str) -> Dict[str, Any]:
        """获取单个配置"""
        url = f'{self.base_url}/config/{env}/{service}/{key}'
        response = requests.get(url, headers=self._headers())
        response.raise_for_status()
        return response.json()
    
    def get_all_configs(self, env: str, service: str) -> Dict[str, Any]:
        """获取服务的所有配置"""
        url = f'{self.base_url}/config/{env}/{service}'
        response = requests.get(url, headers=self._headers())
        response.raise_for_status()
        return response.json()['configs']
    
    def set_config(self, env: str, service: str, key: str, value: str, 
                   description: str = '', encrypt: bool = False) -> Dict[str, Any]:
        """创建或更新配置"""
        url = f'{self.base_url}/config/{env}/{service}'
        data = {
            'key': key,
            'value': value,
            'description': description,
            'encrypt': encrypt
        }
        response = requests.post(url, json=data, headers=self._headers())
        response.raise_for_status()
        return response.json()

# 使用示例
client = ConfigClient('http://localhost:8787', 'admin-token')

# 获取配置
config = client.get_config('dev', 'user-service', 'database.host')
print(f"Database host: {config['value']}")

# 设置配置
client.set_config('dev', 'user-service', 'api.timeout', '30000',
                  description='API请求超时时间（毫秒）')

# 获取所有配置
configs = client.get_all_configs('dev', 'user-service')
for key, config in configs.items():
    print(f"{key}: {config['value']}")
```

## 9. 最佳实践

### 配置命名规范

```bash
# 使用点号分隔的层级结构
database.primary.host
database.primary.port
database.replica.host

# 模块化配置
api.timeout.default
api.timeout.upload
api.retry.max_attempts

# 功能性配置
feature.user_registration.enabled
feature.email_verification.required
```

### 环境配置策略

```bash
# 开发环境 - 使用本地服务
curl -X POST http://localhost:8787/config/dev/app \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "api.base_url", "value": "http://localhost:3000"}'

# 测试环境 - 使用测试服务器
curl -X POST http://localhost:8787/config/test/app \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "api.base_url", "value": "https://test-api.example.com"}'

# 生产环境 - 使用生产服务器
curl -X POST http://localhost:8787/config/prod/app \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "api.base_url", "value": "https://api.example.com"}'
```

## 10. 故障排查

### 检查服务健康状态

```bash
curl http://localhost:8787/health
```

### 验证认证

```bash
# 使用错误的 token（应该返回 401）
curl -X POST http://localhost:8787/config/dev/test \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "value": "value"}'

# 使用正确的 token（应该成功）
curl -X POST http://localhost:8787/config/dev/test \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "value": "value"}'
```

### 查看服务信息

```bash
# 获取服务元信息
curl http://localhost:8787/
```
