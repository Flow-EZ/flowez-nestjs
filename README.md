# @flow-ez/nestjs

NestJS 工具模块集合，把常用第三方客户端封装成 `forRoot` / `forRootAsync` 全局模块，支持多实例注入。

当前面向 **NestJS 12**。各包把具体 SDK 声明为 peer dependency，由应用安装，避免类型和运行时各打一份。

## 包列表

| 包                                        | 说明                                                                | Peer         |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------ |
| [@flow-ez/nestjs-redis](./packages/redis) | Redis 模块，基于 [ioredis](https://github.com/redis/ioredis)        | `ioredis` ^6 |
| [@flow-ez/nestjs-minio](./packages/minio) | MinIO 对象存储模块，基于 [minio](https://github.com/minio/minio-js) | `minio` ^8   |

公共 peer：`@nestjs/common` ^12、`@nestjs/core` ^12、`reflect-metadata` ^0.2。

## 安装

```bash
pnpm add @flow-ez/nestjs-redis ioredis
pnpm add @flow-ez/nestjs-minio minio
```

NestJS 12 应用里通常已有 `@nestjs/common`、`@nestjs/core`、`reflect-metadata`。

完整 API 见各包 README：

- [packages/redis/README.md](./packages/redis/README.md)
- [packages/minio/README.md](./packages/minio/README.md)

## Redis

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@flow-ez/nestjs-redis';

@Module({
  imports: [
    RedisModule.forRoot({
      host: 'localhost',
      port: 6379,
    }),
  ],
})
export class AppModule {}
```

注入客户端：

```typescript
import { InjectRedis } from '@flow-ez/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class CatsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
}
```

或使用 `RedisService.getClient()` / `getClients()`。

异步配置：

```typescript
RedisModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
  }),
  inject: [ConfigService],
});
```

多客户端：

```typescript
RedisModule.forRoot([
  { clientName: 'cache', host: 'localhost', port: 6379 },
  { clientName: 'queue', host: 'localhost', port: 6380 },
]);

// @InjectRedis('cache') private readonly cacheRedis: Redis
```

也支持 `url`、`onClientReady`。应用关闭时会 `disconnect()`；配置了 `keepAlive` 则跳过断开。

## MinIO

```typescript
import { Module } from '@nestjs/common';
import { MinioModule } from '@flow-ez/nestjs-minio';

@Module({
  imports: [
    MinioModule.forRoot({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    }),
  ],
})
export class AppModule {}
```

注入客户端：

```typescript
import { InjectMinio } from '@flow-ez/nestjs-minio';
import { Client } from 'minio';

@Injectable()
export class StorageService {
  constructor(@InjectMinio() private readonly minio: Client) {}
}
```

或使用 `MinioService.getClient()` / `getClients()`。`forRootAsync` 与多客户端用法与 Redis 相同，用 `clientName` + `@InjectMinio('public')` 区分实例。

## 开发

```bash
pnpm install
pnpm build
pnpm test
pnpm format
pnpm check
```

测试用 `@nestjs/testing` 编译模块，ioredis / minio 在用例里 mock，不依赖本地 Redis 或 MinIO。

## License

ISC
