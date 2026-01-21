#!/bin/bash

# Building Store 环境搭建脚本
# 用于快速搭建本地开发环境

set -e

echo "======================================"
echo "Building Store 环境搭建"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 打印成功消息
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# 打印警告消息
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 打印错误消息
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 检查必要的工具
echo "检查必要的工具..."
echo ""

MISSING_TOOLS=0

if command_exists docker; then
    print_success "Docker 已安装: $(docker --version)"
else
    print_error "Docker 未安装"
    MISSING_TOOLS=1
fi

if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    if command_exists docker-compose; then
        print_success "Docker Compose 已安装: $(docker-compose --version)"
    else
        print_success "Docker Compose 已安装: $(docker compose version)"
    fi
else
    print_error "Docker Compose 未安装"
    MISSING_TOOLS=1
fi

if command_exists git; then
    print_success "Git 已安装: $(git --version)"
else
    print_error "Git 未安装"
    MISSING_TOOLS=1
fi

echo ""

if [ $MISSING_TOOLS -eq 1 ]; then
    print_error "请先安装缺失的工具"
    exit 1
fi

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p docker/init-scripts/postgres
mkdir -p config/prometheus
mkdir -p config/grafana/dashboards
mkdir -p config/grafana/datasources
mkdir -p logs
print_success "目录创建完成"
echo ""

# 创建Prometheus配置
echo "创建Prometheus配置..."
cat > config/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:8001']

  - job_name: 'product-service'
    static_configs:
      - targets: ['product-service:8002']

  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:8003']

  - job_name: 'inventory-service'
    static_configs:
      - targets: ['inventory-service:8004']

  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:8005']
EOF
print_success "Prometheus配置创建完成"
echo ""

# 创建Grafana数据源配置
echo "创建Grafana数据源配置..."
cat > config/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
print_success "Grafana数据源配置创建完成"
echo ""

# 创建PostgreSQL初始化脚本
echo "创建PostgreSQL初始化脚本..."
cat > docker/init-scripts/postgres/init-databases.sql << 'EOF'
-- 创建各个服务的数据库
CREATE DATABASE user_service_db;
CREATE DATABASE product_service_db;
CREATE DATABASE order_service_db;
CREATE DATABASE inventory_service_db;
CREATE DATABASE payment_service_db;

-- 为每个数据库创建用户
CREATE USER user_service_user WITH PASSWORD 'user_service_pass';
CREATE USER product_service_user WITH PASSWORD 'product_service_pass';
CREATE USER order_service_user WITH PASSWORD 'order_service_pass';
CREATE USER inventory_service_user WITH PASSWORD 'inventory_service_pass';
CREATE USER payment_service_user WITH PASSWORD 'payment_service_pass';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE user_service_db TO user_service_user;
GRANT ALL PRIVILEGES ON DATABASE product_service_db TO product_service_user;
GRANT ALL PRIVILEGES ON DATABASE order_service_db TO order_service_user;
GRANT ALL PRIVILEGES ON DATABASE inventory_service_db TO inventory_service_user;
GRANT ALL PRIVILEGES ON DATABASE payment_service_db TO payment_service_user;
EOF
print_success "PostgreSQL初始化脚本创建完成"
echo ""

# 创建.env文件
if [ ! -f .env ]; then
    echo "创建.env配置文件..."
    cat > .env << 'EOF'
# Building Store 环境变量配置

# PostgreSQL
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=building_store

# Redis
REDIS_PASSWORD=redis123

# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=admin123

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Environment
NODE_ENV=development
EOF
    print_success ".env文件创建完成"
    print_warning "请根据需要修改.env文件中的配置"
else
    print_warning ".env文件已存在，跳过创建"
fi
echo ""

# 启动基础设施服务
echo "======================================"
echo "启动基础设施服务"
echo "======================================"
echo ""

DOCKER_DIR="${BASH_SOURCE%/*}/../docker"
cd "$DOCKER_DIR" || exit 1

echo "拉取Docker镜像..."
if command_exists docker-compose; then
    docker-compose pull
else
    docker compose pull
fi

echo ""
echo "启动服务..."
if command_exists docker-compose; then
    docker-compose up -d
else
    docker compose up -d
fi

echo ""
echo "等待服务启动..."
sleep 10

echo ""
echo "检查服务状态..."
if command_exists docker-compose; then
    docker-compose ps
else
    docker compose ps
fi

cd - > /dev/null

echo ""
echo "======================================"
echo "环境搭建完成！"
echo "======================================"
echo ""
echo "服务访问地址："
echo "  - PostgreSQL:     localhost:5432 (用户: admin, 密码: admin123)"
echo "  - Redis:          localhost:6379 (密码: redis123)"
echo "  - MongoDB:        localhost:27017 (用户: admin, 密码: admin123)"
echo "  - Elasticsearch:  http://localhost:9200"
echo "  - RabbitMQ Web:   http://localhost:15672 (用户: admin, 密码: admin123)"
echo "  - Consul UI:      http://localhost:8500"
echo "  - Jaeger UI:      http://localhost:16686"
echo "  - Prometheus:     http://localhost:9090"
echo "  - Grafana:        http://localhost:3000 (用户: admin, 密码: admin123)"
echo "  - Kibana:         http://localhost:5601"
echo "  - pgAdmin:        http://localhost:5050 (邮箱: admin@building-store.com, 密码: admin123)"
echo ""
echo "下一步："
echo "  1. 克隆各个微服务仓库"
echo "  2. 配置各服务的环境变量"
echo "  3. 启动各个微服务"
echo ""
if command_exists docker-compose; then
    echo "使用 'docker-compose -f docker/docker-compose.yml logs -f' 查看日志"
    echo "使用 'docker-compose -f docker/docker-compose.yml down' 停止所有服务"
else
    echo "使用 'docker compose -f docker/docker-compose.yml logs -f' 查看日志"
    echo "使用 'docker compose -f docker/docker-compose.yml down' 停止所有服务"
fi
echo ""
