#!/bin/bash

# 配置中心服务测试脚本
# 用法: ./test.sh [base_url]

set -e

# 配置
BASE_URL="${1:-http://localhost:8787}"
ADMIN_TOKEN="admin-token"
USER_TOKEN="user-token"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_test() {
    echo -e "${YELLOW}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    echo -e "\n${YELLOW}测试: $description${NC}"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "数据: $data"
    fi
    
    local headers=()
    if [ -n "$token" ]; then
        headers+=("-H" "Authorization: Bearer $token")
    fi
    headers+=("-H" "Content-Type: application/json")
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" "$BASE_URL$endpoint")
    elif [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${headers[@]}" -d "$data" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${headers[@]}" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "状态码: $http_code"
    echo "响应: $body" | jq '.' 2>/dev/null || echo "$body"
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        print_success "成功"
    else
        print_error "失败"
        return 1
    fi
}

# 开始测试
echo -e "${GREEN}"
echo "========================================"
echo "  配置中心服务功能测试"
echo "========================================"
echo -e "${NC}"
echo "基础 URL: $BASE_URL"
echo ""

# 1. 健康检查
print_test "1. 健康检查"
test_endpoint "GET" "/health" "" "" "检查服务健康状态"

# 2. 环境管理测试
print_test "2. 环境管理测试"
test_endpoint "GET" "/environments" "" "" "获取所有环境"
test_endpoint "GET" "/environments/dev" "" "" "获取开发环境信息"

# 3. 配置管理测试
print_test "3. 配置管理测试"

# 创建普通配置
test_endpoint "POST" "/config/dev/test-service" \
    '{"key":"app.name","value":"Test App","description":"应用名称"}' \
    "$ADMIN_TOKEN" \
    "创建普通配置"

# 创建加密配置
test_endpoint "POST" "/config/dev/test-service" \
    '{"key":"app.secret","value":"super-secret-key","description":"应用密钥","encrypt":true}' \
    "$ADMIN_TOKEN" \
    "创建加密配置"

# 创建更多配置用于测试
test_endpoint "POST" "/config/dev/test-service" \
    '{"key":"database.host","value":"localhost","description":"数据库主机"}' \
    "$ADMIN_TOKEN" \
    "创建数据库配置"

test_endpoint "POST" "/config/dev/test-service" \
    '{"key":"database.port","value":"5432"}' \
    "$ADMIN_TOKEN" \
    "创建端口配置"

# 获取单个配置
test_endpoint "GET" "/config/dev/test-service/app.name" "" "" "获取单个配置"

# 获取服务的所有配置
test_endpoint "GET" "/config/dev/test-service" "" "" "获取服务所有配置"

# 更新配置
test_endpoint "PUT" "/config/dev/test-service/app.name" \
    '{"value":"Updated Test App","description":"更新后的应用名称"}' \
    "$ADMIN_TOKEN" \
    "更新配置"

# 再次更新配置以创建版本历史
test_endpoint "PUT" "/config/dev/test-service/app.name" \
    '{"value":"Final Test App"}' \
    "$ADMIN_TOKEN" \
    "再次更新配置"

# 4. 版本管理测试
print_test "4. 版本管理测试"

# 获取版本历史
test_endpoint "GET" "/versions/dev/test-service/app.name" "" "" "获取版本历史"

# 获取特定版本
test_endpoint "GET" "/versions/dev/test-service/app.name/1" "" "" "获取版本1详情"

# 比较版本
test_endpoint "GET" "/versions/dev/test-service/app.name/compare?v1=1&v2=2" "" "" "比较版本1和2"

# 回滚到版本1
test_endpoint "POST" "/versions/dev/test-service/app.name/rollback/1" "" "$ADMIN_TOKEN" "回滚到版本1"

# 验证回滚结果
test_endpoint "GET" "/config/dev/test-service/app.name" "" "" "验证回滚后的配置"

# 5. 审计日志测试
print_test "5. 审计日志测试"
test_endpoint "GET" "/audit/dev/test-service?limit=10" "" "$ADMIN_TOKEN" "获取审计日志"

# 6. 环境服务列表测试
print_test "6. 环境服务列表测试"
test_endpoint "GET" "/environments/dev/services" "" "" "获取开发环境的所有服务"

# 7. 删除配置测试
print_test "7. 删除配置测试"
test_endpoint "DELETE" "/config/dev/test-service/database.port" "" "$ADMIN_TOKEN" "删除配置"

# 验证删除
echo -e "\n${YELLOW}验证配置已删除${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/config/dev/test-service/database.port")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" == "404" ]; then
    print_success "配置已成功删除（返回404）"
else
    print_error "配置删除验证失败（应该返回404）"
fi

# 8. 认证测试
print_test "8. 认证测试"

# 无认证访问受保护的端点（应该失败）
echo -e "\n${YELLOW}测试无认证访问（应该失败）${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"key":"test","value":"value"}' \
    "$BASE_URL/config/dev/test-service")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" == "401" ]; then
    print_success "正确拒绝无认证访问（返回401）"
else
    print_error "认证检查失败（应该返回401）"
fi

# 使用错误的 token（应该失败或通过但权限不足）
echo -e "\n${YELLOW}测试错误的认证 token${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer wrong-token" \
    -H "Content-Type: application/json" \
    -d '{"key":"test","value":"value"}' \
    "$BASE_URL/config/dev/test-service")
http_code=$(echo "$response" | tail -n1)
echo "状态码: $http_code"

# 9. 输入验证测试
print_test "9. 输入验证测试"

# 无效的环境名称
echo -e "\n${YELLOW}测试无效环境名称（应该失败）${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/config/invalid-env/test-service/test")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" == "400" ]; then
    print_success "正确拒绝无效环境名称（返回400）"
else
    print_error "验证失败（应该返回400）"
fi

# 无效的配置键
echo -e "\n${YELLOW}测试无效配置键（应该失败）${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key":"invalid key with spaces","value":"value"}' \
    "$BASE_URL/config/dev/test-service")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" == "400" ]; then
    print_success "正确拒绝无效配置键（返回400）"
else
    print_error "验证失败（应该返回400）"
fi

# 10. 总结
echo -e "\n${GREEN}"
echo "========================================"
echo "  测试完成"
echo "========================================"
echo -e "${NC}"
echo "所有主要功能测试已完成！"
echo ""
echo "查看测试服务的配置："
echo "  curl $BASE_URL/config/dev/test-service"
echo ""
echo "清理测试数据："
echo "  curl -X DELETE -H 'Authorization: Bearer $ADMIN_TOKEN' $BASE_URL/config/dev/test-service/app.name"
echo "  curl -X DELETE -H 'Authorization: Bearer $ADMIN_TOKEN' $BASE_URL/config/dev/test-service/app.secret"
echo "  curl -X DELETE -H 'Authorization: Bearer $ADMIN_TOKEN' $BASE_URL/config/dev/test-service/database.host"
