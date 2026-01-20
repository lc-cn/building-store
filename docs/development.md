# 开发指南

## 概述

本文档为 Building Store 微服务系统的开发人员提供开发规范、最佳实践和工作流程指导。

## 开发环境要求

### 必需工具

- **Node.js**: 18.x 或更高版本
- **Java**: 17 或更高版本（如果使用Java服务）
- **Go**: 1.20 或更高版本（如果使用Go服务）
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.x
- **IDE**: VSCode / IntelliJ IDEA / GoLand

### 推荐工具

- **Postman** 或 **Insomnia**: API测试
- **DBeaver** 或 **pgAdmin**: 数据库管理
- **Redis Desktop Manager**: Redis管理
- **k9s** 或 **Lens**: Kubernetes管理

## 项目设置

### 1. 克隆主仓库

```bash
git clone https://github.com/lc-cn/building-store.git
cd building-store
```

### 2. 搭建基础设施

```bash
# 运行环境搭建脚本
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. 开始开发

```bash
# 所有微服务都在 services/ 目录下
cd services

# 进入具体服务进行开发
cd user-service
npm install
npm run dev

# 或开发其他服务
cd ../product-service
# ...
```

## 代码规范

### 通用规范

1. **命名约定**
   - 变量名: camelCase
   - 常量名: UPPER_SNAKE_CASE
   - 类名: PascalCase
   - 文件名: kebab-case

2. **代码格式化**
   - 使用 Prettier / ESLint（JavaScript/TypeScript）
   - 使用 Checkstyle（Java）
   - 使用 gofmt（Go）

3. **注释规范**
   - 公共API必须有文档注释
   - 复杂逻辑需要解释性注释
   - 使用JSDoc / JavaDoc / GoDoc格式

### Node.js/TypeScript规范

```typescript
// ✅ 好的示例
/**
 * 创建新用户
 * @param userData - 用户数据
 * @returns 创建的用户对象
 */
export async function createUser(userData: CreateUserDto): Promise<User> {
  // 验证输入
  validateUserData(userData);
  
  // 创建用户
  const user = await userRepository.create(userData);
  
  // 发布事件
  await eventBus.publish('user.created', { userId: user.id });
  
  return user;
}

// ❌ 不好的示例
export async function createUser(data: any): Promise<any> {
  const u = await db.users.create(data);
  return u;
}
```

### 错误处理

```typescript
// 定义错误类
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

// 使用错误类
try {
  const user = await findUserById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }
  return user;
} catch (error) {
  if (error instanceof UserNotFoundError) {
    logger.warn(error.message);
    throw new NotFoundError('User not found');
  }
  throw error;
}
```

## Git 工作流

### 分支策略

采用 Git Flow 工作流：

```
main           - 生产环境代码
  └─ develop   - 开发环境代码
      ├─ feature/* - 新功能分支
      ├─ bugfix/*  - bug修复分支
      └─ hotfix/*  - 紧急修复分支
```

### 分支命名

```bash
feature/user-authentication
feature/product-search
bugfix/order-calculation-error
hotfix/payment-security-issue
```

### 提交信息规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建工具、依赖更新等

示例：
```
feat(user): add user registration endpoint

Implement user registration with email verification.
Includes input validation and duplicate check.

Closes #123
```

### Pull Request 流程

1. **创建分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **开发和提交**
   ```bash
   git add .
   git commit -m "feat(user): add feature"
   git push origin feature/my-feature
   ```

3. **创建 Pull Request**
   - 在GitHub上创建PR
   - 填写PR模板
   - 关联相关Issue
   - 请求代码审查

4. **代码审查**
   - 至少一位审查者批准
   - 通过所有CI检查
   - 解决所有评论

5. **合并**
   - 使用 Squash and Merge
   - 删除特性分支

## 测试规范

### 测试类型

1. **单元测试**
   - 测试单个函数/方法
   - 使用Mock隔离依赖
   - 覆盖率要求 > 80%

2. **集成测试**
   - 测试服务间交互
   - 使用测试数据库
   - 测试关键业务流程

3. **端到端测试**
   - 测试完整用户场景
   - 使用真实环境
   - 自动化UI测试

### 测试示例（Jest）

```typescript
describe('UserService', () => {
  let userService: UserService;
  let userRepository: MockRepository<User>;
  
  beforeEach(() => {
    userRepository = createMockRepository<User>();
    userService = new UserService(userRepository);
  });
  
  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const expectedUser = { id: '1', ...userData };
      userRepository.create.mockResolvedValue(expectedUser);
      
      const result = await userService.createUser(userData);
      
      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
    });
    
    it('should throw error if user already exists', async () => {
      userRepository.create.mockRejectedValue(
        new Error('User already exists')
      );
      
      await expect(
        userService.createUser({ username: 'existing' })
      ).rejects.toThrow('User already exists');
    });
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- user.service.test.ts

# 生成覆盖率报告
npm run test:coverage

# 监视模式
npm test -- --watch
```

## API开发规范

### 路由定义

```typescript
// routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createUserSchema } from '../schemas/user.schema';

const router = Router();
const userController = new UserController();

router.post(
  '/users',
  validate(createUserSchema),
  userController.createUser
);

router.get(
  '/users/:id',
  authenticate,
  userController.getUserById
);

export default router;
```

### 控制器

```typescript
// controllers/user.controller.ts
export class UserController {
  constructor(private userService: UserService) {}
  
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
  
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### 数据验证

```typescript
// schemas/user.schema.ts
import Joi from 'joi';

export const createUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  
  email: Joi.string()
    .email()
    .required(),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase and number'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
});
```

## 日志规范

### 日志级别

- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

### 日志格式

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 使用示例
logger.info('User created', { userId: user.id, username: user.username });
logger.error('Failed to create user', { error: error.message, stack: error.stack });
```

## 环境配置

### 配置文件结构

```
config/
  ├── default.json        # 默认配置
  ├── development.json    # 开发环境
  ├── test.json          # 测试环境
  └── production.json    # 生产环境
```

### 配置加载

```typescript
// config/index.ts
import { config } from 'dotenv';
import { z } from 'zod';

config();

const configSchema = z.object({
  port: z.number().default(8001),
  nodeEnv: z.enum(['development', 'test', 'production']),
  database: z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
    database: z.string()
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('24h')
  })
});

export const appConfig = configSchema.parse({
  port: parseInt(process.env.PORT || '8001'),
  nodeEnv: process.env.NODE_ENV,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  }
});
```

## 数据库操作

### 使用ORM（TypeORM示例）

```typescript
// entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ unique: true })
  username: string;
  
  @Column({ unique: true })
  email: string;
  
  @Column()
  passwordHash: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}

// repositories/user.repository.ts
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>
  ) {}
  
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }
  
  async create(userData: CreateUserDto): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }
}
```

## 事件驱动开发

### 发布事件

```typescript
// events/event-bus.ts
export class EventBus {
  constructor(private rabbitMQ: RabbitMQClient) {}
  
  async publish(eventType: string, data: any): Promise<void> {
    const event = {
      eventType,
      timestamp: new Date().toISOString(),
      data
    };
    
    await this.rabbitMQ.publish('events', eventType, event);
    logger.info('Event published', { eventType, data });
  }
}

// 使用示例
await eventBus.publish('user.created', {
  userId: user.id,
  username: user.username,
  email: user.email
});
```

### 订阅事件

```typescript
// subscribers/user-created.subscriber.ts
export class UserCreatedSubscriber {
  constructor(
    private rabbitMQ: RabbitMQClient,
    private notificationService: NotificationService
  ) {}
  
  async subscribe(): Promise<void> {
    await this.rabbitMQ.subscribe('events', 'user.created', async (event) => {
      await this.handleUserCreated(event.data);
    });
  }
  
  private async handleUserCreated(data: any): Promise<void> {
    logger.info('Handling user.created event', { userId: data.userId });
    
    await this.notificationService.sendWelcomeEmail(
      data.email,
      data.username
    );
  }
}
```

## 性能优化

### 缓存策略

```typescript
// 使用Redis缓存
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private redis: Redis
  ) {}
  
  async getUserById(id: string): Promise<User> {
    // 尝试从缓存获取
    const cached = await this.redis.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 从数据库获取
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    
    // 写入缓存（TTL: 1小时）
    await this.redis.setex(`user:${id}`, 3600, JSON.stringify(user));
    
    return user;
  }
}
```

### 数据库查询优化

```typescript
// ❌ N+1问题
const orders = await orderRepository.find();
for (const order of orders) {
  order.items = await orderItemRepository.findByOrderId(order.id);
}

// ✅ 使用关联查询
const orders = await orderRepository.find({
  relations: ['items']
});
```

## 安全最佳实践

### 密码处理

```typescript
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 输入清洗

```typescript
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
}
```

## 调试技巧

### 使用调试器

VSCode launch.json:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug User Service",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### 日志调试

```typescript
// 添加请求ID追踪
app.use((req, res, next) => {
  req.id = uuidv4();
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path
  });
  next();
});
```

## 文档编写

### API文档

使用Swagger/OpenAPI注解：

```typescript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDto'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
```

### README模板

每个微服务仓库应包含完整的README：

```markdown
# Service Name

## Description
Brief description of the service

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

## Installation
\`\`\`bash
npm install
\`\`\`

## Configuration
Copy .env.example to .env and configure

## Running
\`\`\`bash
npm run dev
\`\`\`

## Testing
\`\`\`bash
npm test
\`\`\`

## API Documentation
Available at /api-docs when running

## Contributing
See main repository's CONTRIBUTING.md
```

## 持续学习

### 推荐资源

- **书籍**: 
  - "Designing Data-Intensive Applications"
  - "Building Microservices"
  - "Clean Code"

- **在线课程**:
  - Microservices Architecture
  - Docker and Kubernetes

- **社区**:
  - Stack Overflow
  - GitHub Discussions
  - 技术博客

## 总结

遵循本开发指南可以确保代码质量、提高开发效率，并保持整个项目的一致性。如有疑问，请参考主仓库文档或联系团队成员。
