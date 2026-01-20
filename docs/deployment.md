# 部署指南

## 概述

本文档描述如何将 Building Store 微服务系统部署到不同的环境。

## 部署环境

### 1. 开发环境 (Development)
- 本地 Docker Compose
- 单节点部署
- 用于开发和调试

### 2. 测试环境 (Testing)
- Kubernetes 集群
- 小规模部署
- 用于集成测试和UAT

### 3. 生产环境 (Production)
- Kubernetes 集群
- 高可用部署
- 多区域部署（可选）

## 前置要求

### 开发环境
- Docker 20.10+
- Docker Compose 2.0+
- Git

### 生产环境
- Kubernetes 1.25+
- kubectl
- Helm 3.0+
- 负载均衡器
- 域名和SSL证书

## 本地开发环境部署

### 1. 克隆主仓库

```bash
git clone https://github.com/lc-cn/building-store.git
cd building-store
```

### 2. 运行环境搭建脚本

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

此脚本将：
- 创建必要的目录
- 生成配置文件
- 启动基础设施服务（PostgreSQL, Redis, MongoDB等）

### 3. 验证基础设施服务

```bash
docker-compose -f docker/docker-compose.yml ps
```

确保所有服务都在运行状态。

### 4. 克隆和启动微服务

每个微服务都在独立的仓库中，需要分别克隆和启动：

```bash
# 创建服务目录
mkdir -p services
cd services

# 克隆各个服务
git clone https://github.com/lc-cn/building-store-user-service.git
git clone https://github.com/lc-cn/building-store-product-service.git
git clone https://github.com/lc-cn/building-store-order-service.git
git clone https://github.com/lc-cn/building-store-inventory-service.git
git clone https://github.com/lc-cn/building-store-payment-service.git
git clone https://github.com/lc-cn/building-store-api-gateway.git
git clone https://github.com/lc-cn/building-store-auth-service.git

# 启动每个服务（以用户服务为例）
cd building-store-user-service
npm install
cp .env.example .env
# 编辑 .env 文件配置数据库连接等
npm run migrate
npm run dev
```

### 5. 访问服务

- API Gateway: http://localhost:8000
- User Service: http://localhost:8001
- Product Service: http://localhost:8002
- Order Service: http://localhost:8003
- Inventory Service: http://localhost:8004
- Payment Service: http://localhost:8005
- Auth Service: http://localhost:8006

## Docker 容器化部署

### 1. 构建所有服务镜像

为每个服务创建 Dockerfile：

```dockerfile
# 示例: User Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建TypeScript
RUN npm run build

# 暴露端口
EXPOSE 8001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js || exit 1

# 启动服务
CMD ["node", "dist/index.js"]
```

### 2. 构建镜像

```bash
# 为每个服务构建镜像
cd services/building-store-user-service
docker build -t building-store/user-service:latest .

cd ../building-store-product-service
docker build -t building-store/product-service:latest .

# ... 为其他服务重复此过程
```

### 3. 推送到镜像仓库

```bash
# 使用Docker Hub
docker tag building-store/user-service:latest username/building-store-user-service:latest
docker push username/building-store-user-service:latest

# 或使用私有镜像仓库
docker tag building-store/user-service:latest registry.example.com/building-store/user-service:latest
docker push registry.example.com/building-store/user-service:latest
```

## Kubernetes 部署

### 1. 准备 Kubernetes 集群

```bash
# 验证集群连接
kubectl cluster-info

# 创建命名空间
kubectl apply -f kubernetes/namespace.yaml
```

### 2. 创建配置和密钥

```bash
# 创建数据库密钥
kubectl create secret generic database-secret \
  --from-literal=user-service-db-url='postgresql://...' \
  --from-literal=product-service-db-url='postgresql://...' \
  --from-literal=order-service-db-url='postgresql://...' \
  -n building-store-prod

# 创建认证密钥
kubectl create secret generic auth-secret \
  --from-literal=jwt-secret='your-secret-key' \
  -n building-store-prod

# 创建Redis密钥
kubectl create secret generic redis-secret \
  --from-literal=redis-url='redis://...' \
  -n building-store-prod
```

### 3. 部署基础设施服务

```bash
# 部署PostgreSQL（可选，推荐使用托管数据库）
kubectl apply -f kubernetes/infrastructure/postgresql.yaml

# 部署Redis
kubectl apply -f kubernetes/infrastructure/redis.yaml

# 部署RabbitMQ
kubectl apply -f kubernetes/infrastructure/rabbitmq.yaml

# 部署Consul
kubectl apply -f kubernetes/infrastructure/consul.yaml
```

### 4. 部署微服务

```bash
# 部署所有服务
kubectl apply -f kubernetes/services/

# 或逐个部署
kubectl apply -f kubernetes/services/user-service.yaml
kubectl apply -f kubernetes/services/product-service.yaml
kubectl apply -f kubernetes/services/order-service.yaml
kubectl apply -f kubernetes/services/inventory-service.yaml
kubectl apply -f kubernetes/services/payment-service.yaml
kubectl apply -f kubernetes/services/api-gateway.yaml
kubectl apply -f kubernetes/services/auth-service.yaml
```

### 5. 配置 Ingress

```bash
# 安装 Nginx Ingress Controller（如果还没有）
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# 部署 Ingress 资源
kubectl apply -f kubernetes/ingress.yaml
```

### 6. 配置 SSL/TLS

```bash
# 安装 cert-manager（如果还没有）
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 创建 ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@building-store.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 7. 验证部署

```bash
# 检查所有Pod状态
kubectl get pods -n building-store-prod

# 检查服务
kubectl get services -n building-store-prod

# 检查Ingress
kubectl get ingress -n building-store-prod

# 查看Pod日志
kubectl logs -f <pod-name> -n building-store-prod
```

## CI/CD 配置

### GitHub Actions 示例

在每个微服务仓库中创建 `.github/workflows/deploy.yml`：

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Log in to the Container registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/user-service \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:main \
            -n building-store-prod
          kubectl rollout status deployment/user-service -n building-store-prod
```

## 数据库迁移

### 生产环境迁移策略

```bash
# 1. 备份数据库
kubectl exec -n building-store-prod postgres-0 -- \
  pg_dump -U admin building_store > backup.sql

# 2. 运行迁移（使用专用Job）
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: user-service-migration
  namespace: building-store-prod
spec:
  template:
    spec:
      containers:
      - name: migration
        image: building-store/user-service:latest
        command: ["npm", "run", "migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: user-service-db-url
      restartPolicy: Never
  backoffLimit: 3
EOF
```

## 监控和日志

### 1. 部署Prometheus和Grafana

```bash
# 使用Helm安装
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### 2. 配置日志收集

```bash
# 安装ELK Stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
helm install kibana elastic/kibana -n logging
```

## 扩展和自动伸缩

### 手动扩展

```bash
# 扩展User Service到5个副本
kubectl scale deployment user-service --replicas=5 -n building-store-prod
```

### 自动伸缩（HPA）

HPA配置已包含在服务的YAML文件中，基于CPU和内存使用率自动伸缩。

```bash
# 查看HPA状态
kubectl get hpa -n building-store-prod
```

## 备份和恢复

### 数据库备份

```bash
# 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
kubectl exec -n building-store-prod postgres-0 -- \
  pg_dump -U admin building_store | \
  gzip > backup_$DATE.sql.gz

# 上传到S3或其他存储
aws s3 cp backup_$DATE.sql.gz s3://building-store-backups/
```

### 恢复数据库

```bash
# 从备份恢复
gunzip < backup_20260120_080000.sql.gz | \
  kubectl exec -i -n building-store-prod postgres-0 -- \
  psql -U admin building_store
```

## 故障排查

### 查看Pod日志

```bash
kubectl logs -f <pod-name> -n building-store-prod
kubectl logs --previous <pod-name> -n building-store-prod  # 查看崩溃前的日志
```

### 进入容器调试

```bash
kubectl exec -it <pod-name> -n building-store-prod -- /bin/sh
```

### 查看事件

```bash
kubectl get events -n building-store-prod --sort-by='.lastTimestamp'
```

## 回滚部署

```bash
# 查看部署历史
kubectl rollout history deployment/user-service -n building-store-prod

# 回滚到上一个版本
kubectl rollout undo deployment/user-service -n building-store-prod

# 回滚到特定版本
kubectl rollout undo deployment/user-service --to-revision=2 -n building-store-prod
```

## 安全最佳实践

1. 使用私有镜像仓库
2. 定期更新依赖和基础镜像
3. 扫描镜像漏洞
4. 使用非root用户运行容器
5. 限制容器资源
6. 使用网络策略隔离服务
7. 定期轮换密钥和证书
8. 启用RBAC
9. 审计日志

## 性能优化

1. 启用HTTP/2
2. 配置合适的资源限制
3. 使用CDN加速静态资源
4. 数据库连接池优化
5. 启用gRPC服务间通信
6. 使用缓存减少数据库压力
7. 异步处理耗时任务

## 总结

本部署指南涵盖了从本地开发到生产环境的完整部署流程。根据实际需求选择合适的部署方式，并遵循最佳实践确保系统的稳定性和安全性。
