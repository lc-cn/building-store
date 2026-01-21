// 类型定义

// Cloudflare Workers 环境变量
export interface Env {
  // KV 命名空间
  AUTH_KV: KVNamespace;
  TOKEN_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  
  // 密钥和配置
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string; // 例如: "15m"
  JWT_REFRESH_EXPIRES_IN: string; // 例如: "7d"
  OAUTH_CLIENT_SECRET: string;
  
  // Cloudflare Workers 绑定需要的索引签名
  [key: string]: any;
}

// JWT 令牌载荷
export interface JWTPayload {
  sub: string; // 用户ID
  email?: string;
  roles?: string[];
  type: 'access' | 'refresh';
  iat: number; // 签发时间
  exp: number; // 过期时间
  jti?: string; // JWT ID
  sessionId?: string; // 会话ID
}

// 令牌响应
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope?: string;
}

// 令牌请求
export interface TokenRequest {
  grantType: 'password' | 'refresh_token' | 'client_credentials' | 'authorization_code';
  username?: string;
  password?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  code?: string;
  redirectUri?: string;
  scope?: string;
}

// OAuth 客户端
export interface OAuthClient {
  clientId: string;
  clientSecret: string;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  scope: string[];
  createdAt: number;
}

// OAuth 授权码
export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string[];
  expiresAt: number;
  createdAt: number;
}

// 会话信息
export interface Session {
  sessionId: string;
  userId: string;
  email?: string;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// 密码重置令牌
export interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
  createdAt: number;
  used?: boolean;
}

// 用户凭证（简化版，实际应从用户服务获取）
export interface UserCredentials {
  userId: string;
  email: string;
  passwordHash: string;
  roles?: string[];
  active: boolean;
}

// API 响应包装
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

// 撤销令牌请求
export interface RevokeTokenRequest {
  token: string;
  tokenTypeHint?: 'access_token' | 'refresh_token';
}

// 验证令牌请求
export interface VerifyTokenRequest {
  token: string;
}

// 验证令牌响应
export interface VerifyTokenResponse {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

// 密码重置请求
export interface PasswordResetRequest {
  email: string;
}

// 密码重置验证请求
export interface PasswordResetVerifyRequest {
  token: string;
}

// 密码重置确认请求
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

// OAuth 授权请求
export interface OAuthAuthorizeRequest {
  responseType: 'code' | 'token';
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  userId: string; // 已认证用户ID
}

// OAuth 令牌请求
export interface OAuthTokenRequest {
  grantType: 'authorization_code' | 'client_credentials' | 'refresh_token';
  code?: string;
  redirectUri?: string;
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
  scope?: string;
}

// 错误代码
export enum ErrorCode {
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_SCOPE = 'invalid_scope',
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
  TOKEN_REVOKED = 'token_revoked',
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  SESSION_NOT_FOUND = 'session_not_found',
  SESSION_EXPIRED = 'session_expired',
  INTERNAL_ERROR = 'internal_error',
}
