# user-service

## 服务说明

user-service - 基于 Cloudflare Workers 的 Serverless 微服务

## 技术栈

- **运行时**: Cloudflare Workers Runtime
- **框架**: Hono (轻量级Web框架)
- **数据库**: Cloudflare D1 (SQL数据库) / KV (键值存储)
- **开发语言**: TypeScript

## 特点

- ✅ 全球边缘部署
- ✅ 零冷启动
- ✅ 自动扩展
- ✅ 按请求计费
- ✅ 高可用性

## 开发与部署

### 本地开发

```bash
cd services/user-service
npm install
npm run dev
```

访问: http://localhost:8787

### 部署到 Cloudflare

```bash
npm run deploy
```

### 查看实时日志

```bash
npm run tail
```

## 配置

- `wrangler.toml`: Cloudflare Workers 配置
- `.dev.vars`: 本地开发环境变量
- 生产环境变量在 Cloudflare Dashboard 中配置

## 文档

详见主仓库的 [开发指南](../../docs/development.md)
