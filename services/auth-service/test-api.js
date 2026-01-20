#!/usr/bin/env node

/**
 * 认证服务测试脚本
 * 用于测试各个 API 端点
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';

// 辅助函数：发送 HTTP 请求
async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// 测试函数
async function testHealthCheck() {
  console.log('\n=== 测试健康检查 ===');
  const result = await request('GET', '/health');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testServiceInfo() {
  console.log('\n=== 测试服务信息 ===');
  const result = await request('GET', '/');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testTokenGeneration() {
  console.log('\n=== 测试令牌生成（密码模式）===');
  const result = await request('POST', '/token', {
    grantType: 'password',
    username: 'test@example.com',
    password: 'Test123456'
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data.success && result.data.data) {
    return result.data.data.accessToken;
  }
  return null;
}

async function testTokenVerification(token) {
  console.log('\n=== 测试令牌验证 ===');
  const result = await request('POST', '/token/verify', {
    token
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testTokenRefresh(refreshToken) {
  console.log('\n=== 测试令牌刷新 ===');
  const result = await request('POST', '/token/refresh', {
    refreshToken
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testPasswordReset() {
  console.log('\n=== 测试密码重置请求 ===');
  const result = await request('POST', '/password/reset', {
    email: 'test@example.com'
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  // 如果在开发环境，返回的数据可能包含令牌
  if (result.data.success && result.data.data && result.data.data.token) {
    return result.data.data.token;
  }
  return null;
}

async function testPasswordResetVerify(token) {
  console.log('\n=== 测试密码重置令牌验证 ===');
  const result = await request('POST', '/password/reset/verify', {
    token
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testOAuthAuthorize() {
  console.log('\n=== 测试 OAuth 授权 ===');
  const result = await request('POST', '/oauth/authorize', {
    responseType: 'code',
    clientId: 'test-client',
    redirectUri: 'http://localhost:3000/callback',
    userId: 'user-123',
    scope: 'read write'
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data.success && result.data.data) {
    return result.data.data.code;
  }
  return null;
}

async function testClientCredentials() {
  console.log('\n=== 测试客户端凭证模式 ===');
  const result = await request('POST', '/oauth/token', {
    grantType: 'client_credentials',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    scope: 'read'
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始测试认证服务');
  console.log('BASE_URL:', BASE_URL);

  try {
    // 基础测试
    await testHealthCheck();
    await testServiceInfo();

    // 令牌管理测试
    const accessToken = await testTokenGeneration();
    if (accessToken) {
      await testTokenVerification(accessToken);
    }

    // 密码重置测试
    const resetToken = await testPasswordReset();
    if (resetToken) {
      await testPasswordResetVerify(resetToken);
    }

    // OAuth 测试
    // 注意：这些测试可能失败，因为需要先创建 OAuth 客户端
    await testOAuthAuthorize();
    await testClientCredentials();

    console.log('\n✅ 测试完成');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
