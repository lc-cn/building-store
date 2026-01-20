// 验证工具函数

import { Environment } from '../types';

/**
 * 验证环境名称
 */
export function isValidEnvironment(env: string): env is Environment {
  return ['dev', 'test', 'prod'].includes(env);
}

/**
 * 验证服务名称
 */
export function isValidServiceName(service: string): boolean {
  return /^[a-z0-9-]+$/.test(service) && service.length >= 2 && service.length <= 50;
}

/**
 * 验证配置键
 */
export function isValidConfigKey(key: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(key) && key.length >= 1 && key.length <= 100;
}

/**
 * 验证配置值
 */
export function isValidConfigValue(value: any): boolean {
  if (typeof value === 'string') {
    return value.length <= 10000; // 最大10KB
  }
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value);
      return json.length <= 10000;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * 验证版本号
 */
export function isValidVersion(version: any): boolean {
  return typeof version === 'number' && version > 0 && Number.isInteger(version);
}

/**
 * 清理和验证输入
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * 验证分页参数
 */
export function validatePaginationParams(page?: number, pageSize?: number): {
  page: number;
  pageSize: number;
} {
  const validPage = page && page > 0 ? page : 1;
  const validPageSize = pageSize && pageSize > 0 && pageSize <= 100 ? pageSize : 20;
  return { page: validPage, pageSize: validPageSize };
}
