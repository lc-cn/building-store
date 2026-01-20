// 配置中心类型定义

/**
 * 环境类型
 */
export type Environment = 'dev' | 'test' | 'prod';

/**
 * 配置项
 */
export interface ConfigItem {
  key: string;
  value: string;
  encrypted: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * 配置版本
 */
export interface ConfigVersion {
  version: number;
  value: string;
  encrypted: boolean;
  description?: string;
  createdAt: string;
  createdBy: string;
}

/**
 * 环境配置
 */
export interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

/**
 * 审计日志
 */
export interface AuditLog {
  id: string;
  environment: Environment;
  service: string;
  key: string;
  action: 'create' | 'update' | 'delete' | 'rollback' | 'read';
  oldValue?: string;
  newValue?: string;
  operator: string;
  timestamp: string;
  ip?: string;
}

/**
 * 配置订阅事件
 */
export interface ConfigChangeEvent {
  environment: Environment;
  service: string;
  key: string;
  value: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

/**
 * 服务配置
 */
export interface ServiceConfig {
  service: string;
  environment: Environment;
  configs: Record<string, ConfigItem>;
  inheritFrom?: string; // 继承的服务名
}

/**
 * KV 存储键前缀
 */
export const KV_PREFIX = {
  CONFIG: 'config',          // config:{env}:{service}:{key}
  VERSION: 'version',        // version:{env}:{service}:{key}
  ENVIRONMENT: 'env',        // env:{name}
  AUDIT: 'audit',            // audit:{env}:{service}:{id}
  SUBSCRIPTION: 'sub',       // sub:{env}:{service}
} as const;

/**
 * 构建配置键
 */
export function buildConfigKey(env: Environment, service: string, key: string): string {
  return `${KV_PREFIX.CONFIG}:${env}:${service}:${key}`;
}

/**
 * 构建版本键
 */
export function buildVersionKey(env: Environment, service: string, key: string, version?: number): string {
  const base = `${KV_PREFIX.VERSION}:${env}:${service}:${key}`;
  return version !== undefined ? `${base}:${version}` : base;
}

/**
 * 构建审计日志键
 */
export function buildAuditKey(env: Environment, service: string, id: string): string {
  return `${KV_PREFIX.AUDIT}:${env}:${service}:${id}`;
}

/**
 * 构建环境键
 */
export function buildEnvironmentKey(env: Environment): string {
  return `${KV_PREFIX.ENVIRONMENT}:${env}`;
}

/**
 * Cloudflare Workers 绑定
 */
export interface Bindings {
  CONFIG_KV: KVNamespace;
  ENCRYPTION_KEY: string; // 加密密钥
  [key: string]: any; // 支持其他绑定
}

/**
 * 请求上下文
 */
export interface RequestContext {
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
