// OAuth 2.0 服务

import type { 
  OAuthClient, 
  AuthorizationCode, 
  Env,
  TokenResponse 
} from '../types';
import { generateSecureToken, generateUUID } from '../utils/crypto';
import { generateAccessToken, generateRefreshToken } from './jwt';

/**
 * 获取 OAuth 客户端
 */
export async function getOAuthClient(
  clientId: string,
  env: Env
): Promise<OAuthClient | null> {
  const clientData = await env.AUTH_KV.get(`oauth:client:${clientId}`);
  
  if (!clientData) {
    return null;
  }
  
  return JSON.parse(clientData);
}

/**
 * 验证 OAuth 客户端凭证
 */
export async function validateClientCredentials(
  clientId: string,
  clientSecret: string,
  env: Env
): Promise<OAuthClient | null> {
  const client = await getOAuthClient(clientId, env);
  
  if (!client || client.clientSecret !== clientSecret) {
    return null;
  }
  
  return client;
}

/**
 * 创建 OAuth 客户端（管理功能）
 */
export async function createOAuthClient(
  clientName: string,
  redirectUris: string[],
  grantTypes: string[],
  scope: string[],
  env: Env
): Promise<OAuthClient> {
  const clientId = generateUUID();
  const clientSecret = generateSecureToken(32);
  
  const client: OAuthClient = {
    clientId,
    clientSecret,
    clientName,
    redirectUris,
    grantTypes,
    scope,
    createdAt: Date.now()
  };
  
  await env.AUTH_KV.put(
    `oauth:client:${clientId}`,
    JSON.stringify(client)
  );
  
  return client;
}

/**
 * 生成授权码
 */
export async function generateAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scope: string[],
  env: Env
): Promise<string> {
  const code = generateSecureToken(32);
  const expiresAt = Date.now() + 600000; // 10分钟有效期
  
  const authCode: AuthorizationCode = {
    code,
    clientId,
    userId,
    redirectUri,
    scope,
    expiresAt,
    createdAt: Date.now()
  };
  
  // 存储授权码，10分钟后自动过期
  await env.AUTH_KV.put(
    `oauth:code:${code}`,
    JSON.stringify(authCode),
    { expirationTtl: 600 }
  );
  
  return code;
}

/**
 * 验证并使用授权码
 */
export async function validateAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  env: Env
): Promise<{ valid: boolean; userId?: string; scope?: string[]; error?: string }> {
  const codeData = await env.AUTH_KV.get(`oauth:code:${code}`);
  
  if (!codeData) {
    return { valid: false, error: 'Invalid or expired authorization code' };
  }
  
  const authCode: AuthorizationCode = JSON.parse(codeData);
  
  // 验证客户端ID
  if (authCode.clientId !== clientId) {
    return { valid: false, error: 'Client ID mismatch' };
  }
  
  // 验证重定向URI
  if (authCode.redirectUri !== redirectUri) {
    return { valid: false, error: 'Redirect URI mismatch' };
  }
  
  // 验证是否过期
  if (authCode.expiresAt < Date.now()) {
    await env.AUTH_KV.delete(`oauth:code:${code}`);
    return { valid: false, error: 'Authorization code expired' };
  }
  
  // 使用后删除授权码（一次性使用）
  await env.AUTH_KV.delete(`oauth:code:${code}`);
  
  return {
    valid: true,
    userId: authCode.userId,
    scope: authCode.scope
  };
}

/**
 * 授权码模式 - 交换令牌
 */
export async function exchangeAuthorizationCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  env: Env
): Promise<{ success: boolean; token?: TokenResponse; error?: string }> {
  // 验证客户端凭证
  const client = await validateClientCredentials(clientId, clientSecret, env);
  if (!client) {
    return { success: false, error: 'Invalid client credentials' };
  }
  
  // 验证授权码
  const codeValidation = await validateAuthorizationCode(code, clientId, redirectUri, env);
  if (!codeValidation.valid || !codeValidation.userId) {
    return { success: false, error: codeValidation.error || 'Invalid authorization code' };
  }
  
  // 生成令牌
  const accessToken = await generateAccessToken(
    codeValidation.userId,
    undefined,
    undefined,
    undefined,
    env
  );
  
  const refreshToken = await generateRefreshToken(
    codeValidation.userId,
    undefined,
    env
  );
  
  const tokenResponse: TokenResponse = {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 900, // 15分钟
    scope: codeValidation.scope?.join(' ')
  };
  
  return { success: true, token: tokenResponse };
}

/**
 * 客户端凭证模式 - 生成令牌
 */
export async function clientCredentialsGrant(
  clientId: string,
  clientSecret: string,
  scope: string | undefined,
  env: Env
): Promise<{ success: boolean; token?: TokenResponse; error?: string }> {
  // 验证客户端凭证
  const client = await validateClientCredentials(clientId, clientSecret, env);
  if (!client) {
    return { success: false, error: 'Invalid client credentials' };
  }
  
  // 验证 grant type
  if (!client.grantTypes.includes('client_credentials')) {
    return { success: false, error: 'Unsupported grant type for this client' };
  }
  
  // 验证 scope
  const requestedScopes = scope ? scope.split(' ') : [];
  const invalidScopes = requestedScopes.filter(s => !client.scope.includes(s));
  if (invalidScopes.length > 0) {
    return { success: false, error: 'Invalid scope requested' };
  }
  
  // 生成访问令牌（客户端凭证模式通常不提供刷新令牌）
  const accessToken = await generateAccessToken(
    clientId,
    undefined,
    ['client'],
    undefined,
    env
  );
  
  const tokenResponse: TokenResponse = {
    accessToken,
    refreshToken: '', // 客户端凭证模式不返回刷新令牌
    tokenType: 'Bearer',
    expiresIn: 900,
    scope: requestedScopes.join(' ')
  };
  
  return { success: true, token: tokenResponse };
}

/**
 * 验证重定向 URI
 */
export function validateRedirectUri(
  redirectUri: string,
  client: OAuthClient
): boolean {
  return client.redirectUris.includes(redirectUri);
}

/**
 * 验证 scope
 */
export function validateScope(
  requestedScope: string | undefined,
  client: OAuthClient
): boolean {
  if (!requestedScope) {
    return true;
  }
  
  const requestedScopes = requestedScope.split(' ');
  return requestedScopes.every(s => client.scope.includes(s));
}

/**
 * 撤销 OAuth 令牌
 */
export async function revokeOAuthToken(
  token: string,
  clientId: string,
  clientSecret: string,
  env: Env
): Promise<boolean> {
  // 验证客户端凭证
  const client = await validateClientCredentials(clientId, clientSecret, env);
  if (!client) {
    return false;
  }
  
  // 这里可以添加令牌撤销逻辑
  // 具体实现取决于令牌存储方式
  
  return true;
}
