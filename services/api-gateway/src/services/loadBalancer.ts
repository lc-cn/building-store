/**
 * 负载均衡服务
 */

import { BackendConfig, LoadBalancerType, ConnectionStats } from '../types';

/**
 * 负载均衡器
 */
export class LoadBalancer {
  private roundRobinCounters: Map<string, number> = new Map();
  private connectionStats: Map<string, ConnectionStats> = new Map();

  /**
   * 选择后端服务
   */
  selectBackend(
    backends: BackendConfig[],
    strategy: LoadBalancerType,
    routeId: string
  ): BackendConfig | null {
    // 过滤出健康的后端
    const healthyBackends = backends.filter(b => b.healthy);

    if (healthyBackends.length === 0) {
      return null;
    }

    switch (strategy) {
      case LoadBalancerType.ROUND_ROBIN:
        return this.roundRobin(healthyBackends, routeId);
      
      case LoadBalancerType.WEIGHTED:
        return this.weighted(healthyBackends);
      
      case LoadBalancerType.RANDOM:
        return this.random(healthyBackends);
      
      case LoadBalancerType.LEAST_CONNECTIONS:
        return this.leastConnections(healthyBackends);
      
      default:
        return this.roundRobin(healthyBackends, routeId);
    }
  }

  /**
   * 轮询算法
   */
  private roundRobin(backends: BackendConfig[], routeId: string): BackendConfig {
    const counter = this.roundRobinCounters.get(routeId) || 0;
    const index = counter % backends.length;
    this.roundRobinCounters.set(routeId, counter + 1);
    return backends[index];
  }

  /**
   * 加权轮询算法
   */
  private weighted(backends: BackendConfig[]): BackendConfig {
    const totalWeight = backends.reduce((sum, b) => sum + b.weight, 0);
    
    if (totalWeight === 0) {
      return backends[0];
    }

    let random = Math.random() * totalWeight;
    
    for (const backend of backends) {
      random -= backend.weight;
      if (random <= 0) {
        return backend;
      }
    }

    return backends[backends.length - 1];
  }

  /**
   * 随机算法
   */
  private random(backends: BackendConfig[]): BackendConfig {
    const index = Math.floor(Math.random() * backends.length);
    return backends[index];
  }

  /**
   * 最少连接算法
   */
  private leastConnections(backends: BackendConfig[]): BackendConfig {
    let minConnections = Infinity;
    let selected = backends[0];

    for (const backend of backends) {
      const stats = this.getConnectionStats(backend.id);
      if (stats.activeConnections < minConnections) {
        minConnections = stats.activeConnections;
        selected = backend;
      }
    }

    return selected;
  }

  /**
   * 获取连接统计
   */
  private getConnectionStats(backendId: string): ConnectionStats {
    let stats = this.connectionStats.get(backendId);
    
    if (!stats) {
      stats = {
        backendId,
        activeConnections: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      };
      this.connectionStats.set(backendId, stats);
    }

    return stats;
  }

  /**
   * 增加活跃连接数
   */
  incrementConnection(backendId: string): void {
    const stats = this.getConnectionStats(backendId);
    stats.activeConnections++;
    stats.totalRequests++;
  }

  /**
   * 减少活跃连接数
   */
  decrementConnection(backendId: string, success: boolean): void {
    const stats = this.getConnectionStats(backendId);
    stats.activeConnections = Math.max(0, stats.activeConnections - 1);
    
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
  }

  /**
   * 获取所有连接统计
   */
  getAllConnectionStats(): ConnectionStats[] {
    return Array.from(this.connectionStats.values());
  }

  /**
   * 重置统计数据
   */
  resetStats(backendId?: string): void {
    if (backendId) {
      this.connectionStats.delete(backendId);
    } else {
      this.connectionStats.clear();
    }
  }
}
