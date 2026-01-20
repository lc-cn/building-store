/**
 * API网关类型定义
 */

// 环境变量绑定
export type Env = {
  ROUTES: KVNamespace;        // 路由配置存储
  RATE_LIMIT: KVNamespace;    // 限流数据存储
  METRICS: KVNamespace;        // 指标数据存储
  CIRCUIT_BREAKER: KVNamespace; // 熔断器状态存储
  JWT_SECRET: string;          // JWT密钥
  ADMIN_API_KEY: string;       // 管理API密钥
}

// 路由配置
export interface RouteConfig {
  id: string;                  // 路由ID
  path: string;                // 匹配路径（支持通配符）
  methods: string[];           // 允许的HTTP方法
  backends: BackendConfig[];   // 后端服务列表
  loadBalancer: LoadBalancerType; // 负载均衡策略
  authentication: AuthConfig;  // 认证配置
  rateLimit?: RateLimitConfig; // 限流配置
  circuitBreaker?: CircuitBreakerConfig; // 熔断器配置
  timeout: number;             // 请求超时（毫秒）
  retries: number;             // 重试次数
  rewrite?: RewriteConfig;     // 路径重写配置
  enabled: boolean;            // 是否启用
  createdAt: number;
  updatedAt: number;
}

// 后端服务配置
export interface BackendConfig {
  id: string;
  url: string;                 // 后端服务URL
  weight: number;              // 权重（用于加权轮询）
  healthCheckPath?: string;    // 健康检查路径
  healthy: boolean;            // 健康状态
  lastHealthCheck?: number;
}

// 负载均衡类型
export enum LoadBalancerType {
  ROUND_ROBIN = 'round_robin',     // 轮询
  WEIGHTED = 'weighted',           // 加权轮询
  RANDOM = 'random',               // 随机
  LEAST_CONNECTIONS = 'least_connections' // 最少连接
}

// 认证配置
export interface AuthConfig {
  type: AuthType;
  required: boolean;
  roles?: string[];            // 允许的角色列表
  skipPaths?: string[];        // 跳过认证的路径
}

// 认证类型
export enum AuthType {
  NONE = 'none',
  JWT = 'jwt',
  API_KEY = 'api_key',
  BASIC = 'basic'
}

// 限流配置
export interface RateLimitConfig {
  windowMs: number;            // 时间窗口（毫秒）
  maxRequests: number;         // 最大请求数
  keyPrefix: string;           // 键前缀
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// 熔断器配置
export interface CircuitBreakerConfig {
  failureThreshold: number;    // 失败阈值（失败率）
  successThreshold: number;    // 成功阈值（用于半开状态）
  timeout: number;             // 超时时间（毫秒）
  halfOpenRequests: number;    // 半开状态允许的请求数
}

// 熔断器状态
export enum CircuitBreakerState {
  CLOSED = 'closed',           // 关闭（正常）
  OPEN = 'open',               // 打开（熔断）
  HALF_OPEN = 'half_open'      // 半开（尝试恢复）
}

// 熔断器数据
export interface CircuitBreakerData {
  state: CircuitBreakerState;
  failures: number;            // 失败次数
  successes: number;           // 成功次数
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

// 路径重写配置
export interface RewriteConfig {
  from: string;                // 原路径模式
  to: string;                  // 目标路径模式
}

// 请求日志
export interface RequestLog {
  id: string;
  method: string;
  path: string;
  routeId?: string;
  backend?: string;
  status: number;
  duration: number;            // 请求耗时（毫秒）
  timestamp: number;
  ip?: string;
  userAgent?: string;
  error?: string;
}

// 指标数据
export interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  requestsByRoute: Record<string, number>;
  requestsByStatus: Record<number, number>;
  errorRate: number;
}

// 限流键
export interface RateLimitKey {
  identifier: string;          // IP或用户ID
  route: string;
  window: number;              // 时间窗口起始时间
}

// 限流数据
export interface RateLimitData {
  count: number;               // 请求计数
  resetAt: number;             // 重置时间
}

// JWT载荷
export interface JWTPayload {
  sub: string;                 // 用户ID
  email?: string;
  roles?: string[];
  iat: number;
  exp: number;
}

// 上下文变量
export interface ContextVariables {
  user?: JWTPayload;
  routeConfig?: RouteConfig;
  startTime: number;
  requestId: string;
}

// API响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId: string;
    [key: string]: any;
  };
}

// 健康检查结果
export interface HealthCheckResult {
  backend: string;
  healthy: boolean;
  latency?: number;
  error?: string;
  timestamp: number;
}

// 服务连接统计
export interface ConnectionStats {
  backendId: string;
  activeConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}
