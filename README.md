# @flow-ez/nestjs

NestJS 工具模块集合，提供常用第三方服务的开箱即用集成。

## 包列表

| 包名                                      | 版本  | 说明                     |
| ----------------------------------------- | ----- | ------------------------ |
| [@flow-ez/nestjs-redis](./packages/redis) | 0.0.1 | Redis 模块，基于 ioredis |
| [@flow-ez/nestjs-minio](./packages/minio) | 0.0.1 | MinIO 对象存储模块       |

## 安装

```bash
# Redis
pnpm add @flow-ez/nestjs-redis

# MinIO
pnpm add @flow-ez/nestjs-minio
```

## 使用

### Redis

```typescript
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

注入 Redis 客户端：

```typescript
import { InjectRedis } from '@flow-ez/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class CatsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
}
```

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

// 注入指定客户端
@InjectRedis('cache') private readonly cacheRedis: Redis
```

### MinIO

```typescript
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

注入 MinIO 客户端：

```typescript
import { InjectMinio } from '@flow-ez/nestjs-minio';
import { Client } from 'minio';

@Injectable()
export class StorageService {
  constructor(@InjectMinio() private readonly minio: Client) {}
}
```

异步配置：

```typescript
MinioModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    endPoint: configService.get('MINIO_ENDPOINT'),
    port: configService.get('MINIO_PORT'),
    useSSL: false,
    accessKey: configService.get('MINIO_ACCESS_KEY'),
    secretKey: configService.get('MINIO_SECRET_KEY'),
  }),
  inject: [ConfigService],
});
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 格式化代码
pnpm format

# 检查格式
pnpm check
```

## License

ISC
