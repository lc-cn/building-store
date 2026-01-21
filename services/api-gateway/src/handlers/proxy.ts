/**
 * 代理转发处理器
 */

import { Context } from 'hono';
import { Env, RouteConfig, BackendConfig } from '../types';
import { LoadBalancer } from '../services/loadBalancer';
import { HealthCheckService } from '../services/healthCheck';
import { RouterService } from '../services/router';

/**
 * 代理处理器
 */
export class ProxyHandler {
  private loadBalancer: LoadBalancer;
  private healthChecker: HealthCheckService;

  constructor() {
    this.loadBalancer = new LoadBalancer();
    this.healthChecker = new HealthCheckService();
  }

  /**
   * 处理代理请求
   */
  async handle(c: Context): Promise<Response> {
    const env = c.env as Env;
    const router = new RouterService(env);
    
    // 匹配路由
    const routeConfig = await router.matchRoute(c.req.path, c.req.method);

    if (!routeConfig) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '未找到匹配的路由',
        },
      }, 404);
    }

    try {
      // 健康检查（如果需要）
      const backends = await this.updateBackendHealth(routeConfig);

      // 选择后端服务
      const backend = this.loadBalancer.selectBackend(
        backends,
        routeConfig.loadBalancer,
        routeConfig.id
      );

      if (!backend) {
        return c.json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: '所有后端服务不可用',
          },
        }, 503);
      }

      // 转发请求
      const response = await this.forwardRequest(c, backend, routeConfig);
      return response;
    } catch (error) {
      console.error('代理请求失败:', error);
      
      return c.json({
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: '代理请求失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 502);
    }
  }

  /**
   * 转发请求到后端
   */
  private async forwardRequest(
    c: Context,
    backend: BackendConfig,
    route: RouteConfig
  ): Promise<Response> {
    const originalUrl = new URL(c.req.url);
    
    // 应用路径重写
    let targetPath = originalUrl.pathname;
    if (route.rewrite) {
      targetPath = targetPath.replace(new RegExp(route.rewrite.from), route.rewrite.to);
    }

    // 构建目标URL
    const targetUrl = new URL(targetPath + originalUrl.search, backend.url);

    // 复制请求头
    const headers = new Headers(c.req.raw.headers);
    
    // 添加代理头
    headers.set('X-Forwarded-For', c.req.header('cf-connecting-ip') || '');
    headers.set('X-Forwarded-Proto', originalUrl.protocol.replace(':', ''));
    headers.set('X-Forwarded-Host', originalUrl.host);
    headers.set('X-Real-IP', c.req.header('cf-connecting-ip') || '');

    // 获取请求体
    let body: ReadableStream | null = null;
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      body = c.req.raw.body;
    }

    // 记录连接
    this.loadBalancer.incrementConnection(backend.id);

    try {
      // 创建请求配置
      const fetchOptions: RequestInit = {
        method: c.req.method,
        headers,
        body,
      };

      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), route.timeout);
      fetchOptions.signal = controller.signal;

      // 发送请求（带重试）
      let lastError: Error | null = null;
      for (let attempt = 0; attempt <= route.retries; attempt++) {
        try {
          const response = await fetch(targetUrl.toString(), fetchOptions);
          clearTimeout(timeoutId);

          // 记录成功
          this.loadBalancer.decrementConnection(backend.id, true);

          // 复制响应头
          const responseHeaders = new Headers(response.headers);
          responseHeaders.set('X-Proxied-By', 'API Gateway');
          responseHeaders.set('X-Backend-Server', backend.id);

          // 返回响应
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          });
        } catch (error) {
          lastError = error as Error;
          
          // 如果不是最后一次尝试，等待后重试
          if (attempt < route.retries) {
            await this.sleep(Math.pow(2, attempt) * 100); // 指数退避
            continue;
          }
        }
      }

      // 所有重试失败
      clearTimeout(timeoutId);
      this.loadBalancer.decrementConnection(backend.id, false);
      throw lastError || new Error('请求失败');
    } catch (error) {
      this.loadBalancer.decrementConnection(backend.id, false);
      throw error;
    }
  }

  /**
   * 更新后端健康状态
   */
  private async updateBackendHealth(route: RouteConfig): Promise<BackendConfig[]> {
    // 检查是否需要健康检查
    const needsCheck = route.backends.some(b => this.healthChecker.needsHealthCheck(b));
    
    if (!needsCheck) {
      return route.backends;
    }

    // 执行健康检查
    return this.healthChecker.conditionalHealthCheck(route.backends);
  }

  /**
   * 休眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取负载均衡统计
   */
  getStats() {
    return this.loadBalancer.getAllConnectionStats();
  }
}

/**
 * 创建代理处理器实例
 */
export function createProxyHandler(): ProxyHandler {
  return new ProxyHandler();
}
