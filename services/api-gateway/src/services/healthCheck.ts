/**
 * 健康检查服务
 */

import { BackendConfig, HealthCheckResult } from '../types';

/**
 * 健康检查器
 */
export class HealthCheckService {
  private readonly DEFAULT_TIMEOUT = 5000; // 5秒
  private readonly DEFAULT_INTERVAL = 30000; // 30秒

  /**
   * 检查单个后端健康状态
   */
  async checkBackend(backend: BackendConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const url = backend.healthCheckPath
        ? `${backend.url}${backend.healthCheckPath}`
        : `${backend.url}/health`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      const healthy = response.ok;

      return {
        backend: backend.url,
        healthy,
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        backend: backend.url,
        healthy: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 检查多个后端健康状态
   */
  async checkBackends(backends: BackendConfig[]): Promise<HealthCheckResult[]> {
    const checks = backends.map(backend => this.checkBackend(backend));
    return Promise.all(checks);
  }

  /**
   * 更新后端健康状态
   */
  async updateBackendHealth(backends: BackendConfig[]): Promise<BackendConfig[]> {
    const results = await this.checkBackends(backends);
    
    return backends.map((backend, index) => ({
      ...backend,
      healthy: results[index].healthy,
      lastHealthCheck: results[index].timestamp,
    }));
  }

  /**
   * 判断是否需要健康检查
   */
  needsHealthCheck(backend: BackendConfig): boolean {
    if (!backend.lastHealthCheck) {
      return true;
    }

    const elapsed = Date.now() - backend.lastHealthCheck;
    return elapsed >= this.DEFAULT_INTERVAL;
  }

  /**
   * 批量健康检查（仅检查需要检查的）
   */
  async conditionalHealthCheck(backends: BackendConfig[]): Promise<BackendConfig[]> {
    const needsCheck = backends.filter(b => this.needsHealthCheck(b));
    
    if (needsCheck.length === 0) {
      return backends;
    }

    const results = await this.checkBackends(needsCheck);
    const resultsMap = new Map(
      needsCheck.map((b, i) => [b.id, results[i]])
    );

    return backends.map(backend => {
      const result = resultsMap.get(backend.id);
      if (result) {
        return {
          ...backend,
          healthy: result.healthy,
          lastHealthCheck: result.timestamp,
        };
      }
      return backend;
    });
  }

  /**
   * 获取健康后端数量
   */
  getHealthyCount(backends: BackendConfig[]): number {
    return backends.filter(b => b.healthy).length;
  }

  /**
   * 获取健康后端百分比
   */
  getHealthyPercentage(backends: BackendConfig[]): number {
    if (backends.length === 0) {
      return 0;
    }
    return (this.getHealthyCount(backends) / backends.length) * 100;
  }
}
