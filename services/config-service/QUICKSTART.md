# 配置中心服务快速入门

## 1. 准备工作

### 安装依赖

```bash
cd services/config-service
npm install
```

### 配置 KV 命名空间

1. 创建 KV 命名空间：

```bash
wrangler kv:namespace create "CONFIG_KV"
```

2. 复制返回的 ID 并更新 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "CONFIG_KV"
id = "your-actual-kv-id"  # 替换为实际的 ID
```

### 配置加密密钥

生产环境使用 Wrangler Secrets：

```bash
# 生成 32 字符的密钥
openssl rand -base64 32

# 设置 Secret
wrangler secret put ENCRYPTION_KEY
# 粘贴上面生成的密钥
```

开发环境可以使用 wrangler.toml 中的默认值。

## 2. 本地开发

启动开发服务器：

```bash
npm run dev
```

服务将运行在 `http://localhost:8787`

## 3. 快速测试

### 测试服务健康状态

```bash
curl http://localhost:8787/health
```

### 创建第一个配置

```bash
curl -X POST http://localhost:8787/config/dev/my-app \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "app.name",
    "value": "My Application",
    "description": "应用名称"
  }'
```

### 读取配置

```bash
curl http://localhost:8787/config/dev/my-app/app.name
```

### 更新配置

```bash
curl -X PUT http://localhost:8787/config/dev/my-app/app.name \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "My Updated Application",
    "description": "更新后的应用名称"
  }'
```

### 查看版本历史

```bash
curl http://localhost:8787/versions/dev/my-app/app.name
```

### 回滚到版本 1

```bash
curl -X POST http://localhost:8787/versions/dev/my-app/app.name/rollback/1 \
  -H "Authorization: Bearer admin-token"
```

## 4. 运行测试脚本

完整的功能测试：

```bash
chmod +x test.sh
./test.sh
```

## 5. 部署到 Cloudflare

部署到生产环境：

```bash
npm run deploy
```

## 6. 常见问题

### Q: KV 命名空间 ID 在哪里找？

A: 运行 `wrangler kv:namespace list` 查看所有命名空间。

### Q: 如何重置所有配置？

A: 删除 KV 命名空间并重新创建，或使用 Cloudflare Dashboard 清空数据。

### Q: 认证 Token 是什么？

A: 开发环境默认使用简单的 Bearer Token：
- 管理员：`admin-token`
- 普通用户：任意其他 token

生产环境请集成真实的 JWT/OAuth 认证系统。

### Q: 配置为什么自动加密？

A: 包含敏感关键词的配置键会自动加密：
- password
- secret
- token
- apikey
- private
- credential

也可以通过 `"encrypt": true` 强制加密任何配置。

### Q: 如何查看所有服务？

```bash
curl http://localhost:8787/environments/dev/services
```

### Q: 如何获取服务的所有配置？

```bash
curl http://localhost:8787/config/dev/my-app
```

## 7. 下一步

1. 阅读 [完整文档](README.md)
2. 查看 [使用示例](EXAMPLES.md)
3. 集成到你的应用中
4. 配置生产环境的认证系统
5. 设置监控和告警

## 8. 目录结构

```
config-service/
├── src/
│   ├── index.ts              # 主入口，定义所有路由
│   ├── types.ts              # TypeScript 类型定义
│   ├── handlers/             # HTTP 请求处理器
│   │   ├── config.ts         # 配置 CRUD 操作
│   │   ├── environment.ts    # 环境管理
│   │   └── version.ts        # 版本控制和审计
│   ├── services/             # 核心业务逻辑
│   │   ├── storage.ts        # KV 存储封装
│   │   ├── version.ts        # 版本控制服务
│   │   └── encryption.ts     # 加密/解密服务
│   ├── middleware/           # HTTP 中间件
│   │   └── auth.ts           # 认证中间件
│   └── utils/                # 工具函数
│       ├── validation.ts     # 输入验证
│       └── crypto.ts         # 加密工具
├── test.sh                   # 自动化测试脚本
├── EXAMPLES.md               # 详细使用示例
├── QUICKSTART.md             # 本文档
├── README.md                 # 完整文档
├── package.json
├── tsconfig.json
└── wrangler.toml             # Cloudflare 配置
```

## 9. API 端点概览

### 配置管理
- `GET /config/:env/:service/:key` - 获取配置
- `GET /config/:env/:service` - 获取服务所有配置
- `POST /config/:env/:service` - 创建配置
- `PUT /config/:env/:service/:key` - 更新配置
- `DELETE /config/:env/:service/:key` - 删除配置

### 环境管理
- `GET /environments` - 获取所有环境
- `GET /environments/:env` - 获取单个环境
- `POST /environments` - 创建环境
- `PUT /environments/:env` - 更新环境
- `GET /environments/:env/services` - 获取环境的所有服务

### 版本管理
- `GET /versions/:env/:service/:key` - 获取版本历史
- `GET /versions/:env/:service/:key/:version` - 获取版本详情
- `POST /versions/:env/:service/:key/rollback/:version` - 回滚版本
- `GET /versions/:env/:service/:key/compare?v1=1&v2=2` - 比较版本

### 审计和订阅
- `GET /audit/:env/:service` - 获取审计日志
- `GET /subscribe/:env/:service` - SSE 实时订阅

## 10. 开发提示

### 调试日志

在开发模式下，查看实时日志：

```bash
npm run tail
```

### 本地测试不同环境

```bash
# 开发环境
curl http://localhost:8787/config/dev/app/key

# 测试环境
curl http://localhost:8787/config/test/app/key

# 生产环境
curl http://localhost:8787/config/prod/app/key
```

### 使用 jq 格式化输出

```bash
curl http://localhost:8787/config/dev/my-app | jq '.'
```

### 监控配置变更

```bash
# 订阅配置变更
curl -N http://localhost:8787/subscribe/dev/my-app
```

## 11. 性能优化建议

1. **批量读取**：使用 `GET /config/:env/:service` 一次获取所有配置
2. **缓存策略**：在客户端缓存配置，定期刷新或通过 SSE 更新
3. **减少加密**：只加密真正敏感的配置
4. **版本清理**：定期清理旧版本以节省存储空间

## 12. 安全建议

1. **生产环境**必须使用真实的认证系统
2. **加密密钥**必须使用 Secrets 存储，不要硬编码
3. **审计日志**定期检查异常操作
4. **访问控制**根据角色限制配置访问权限
5. **HTTPS 强制**：Cloudflare Workers 自动提供 HTTPS

Happy Coding! 🚀
