# @flow-ez/nestjs-redis

NestJS 的 Redis 模块，基于 [ioredis](https://github.com/redis/ioredis) 封装，支持多客户端实例、异步配置和自动连接管理。

## 特性

- 支持同步 (`forRoot`) 和异步 (`forRootAsync`) 配置
- 支持多 Redis 客户端实例
- 支持通过 URL 或配置对象连接
- 全局模块，注册一次即可在任意位置注入
- 应用关闭时自动断开连接
- 提供 `@InjectRedis()` 装饰器，方便注入客户端
- 提供 `RedisService` 服务，统一管理所有客户端

## 安装

```bash
pnpm add @flow-ez/nestjs-redis
```

需要同时安装 peer dependencies：

```bash
pnpm add @nestjs/common @nestjs/core ioredis
```

## 快速开始

### 基础配置

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@flow-ez/nestjs-redis';

@Module({
  imports: [
    RedisModule.forRoot({
      host: 'localhost',
      port: 6379,
      password: 'your-password',
      db: 0,
    }),
  ],
})
export class AppModule {}
```

### 通过 URL 连接

```typescript
RedisModule.forRoot({
  url: 'redis://:password@localhost:6379/0',
});
```

### 注入使用

使用 `@InjectRedis()` 装饰器直接注入 ioredis 客户端实例：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@flow-ez/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class CatsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async findAll(): Promise<string[]> {
    return this.redis.lrange('cats', 0, -1);
  }

  async create(cat: string): Promise<void> {
    await this.redis.rpush('cats', cat);
  }
}
```

## 异步配置

### useFactory

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@flow-ez/nestjs-redis';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_DB'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### useClass

```typescript
import { Injectable } from '@nestjs/common';
import { RedisOptionsFactory, RedisModuleOptions } from '@flow-ez/nestjs-redis';

@Injectable()
export class RedisConfigService implements RedisOptionsFactory {
  createRedisOptions(): RedisModuleOptions {
    return {
      host: 'localhost',
      port: 6379,
    };
  }
}

@Module({
  imports: [
    RedisModule.forRootAsync({
      useClass: RedisConfigService,
    }),
  ],
})
export class AppModule {}
```

### useExisting

```typescript
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: RedisConfigService,
    }),
  ],
})
export class AppModule {}
```

## 多客户端

支持同时注册多个 Redis 客户端，通过 `clientName` 区分：

```typescript
RedisModule.forRoot([
  {
    clientName: 'cache',
    host: 'localhost',
    port: 6379,
    db: 0,
  },
  {
    clientName: 'queue',
    host: 'localhost',
    port: 6379,
    db: 1,
  },
]);
```

注入指定客户端：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@flow-ez/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis('cache') private readonly redis: Redis) {}
}

@Injectable()
export class QueueService {
  constructor(@InjectRedis('queue') private readonly redis: Redis) {}
}
```

## RedisService

除了通过装饰器注入，还可以使用 `RedisService` 动态获取客户端：

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@flow-ez/nestjs-redis';

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}

  async someMethod() {
    // 获取默认客户端
    const client = this.redisService.getClient();

    // 获取指定客户端
    const cacheClient = this.redisService.getClient('cache');

    // 获取所有客户端
    const allClients = this.redisService.getClients();
  }
}
```

## onClientReady 回调

可以在客户端创建完成后执行回调：

```typescript
RedisModule.forRoot({
  host: 'localhost',
  port: 6379,
  onClientReady: (client) => {
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  },
});
```

## 配置项

`RedisModuleOptions` 继承自 ioredis 的 `RedisOptions`，额外支持：

| 参数            | 类型                      | 说明                                  |
| --------------- | ------------------------- | ------------------------------------- |
| `clientName`    | `string`                  | 客户端名称，用于多客户端场景区分实例  |
| `url`           | `string`                  | Redis 连接 URL，优先于 host/port 配置 |
| `onClientReady` | `(client: Redis) => void` | 客户端就绪回调                        |

其他所有 ioredis 配置项均可使用，详见 [ioredis 文档](https://github.com/redis/ioredis#connect-to-redis)。

## License

ISC
