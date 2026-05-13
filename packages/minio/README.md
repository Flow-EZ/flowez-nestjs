# @flow-ez/nestjs-minio

NestJS 的 MinIO 模块，基于 [minio-js](https://github.com/minio/minio-js) 封装，支持多客户端实例和异步配置。

## 特性

- 支持同步 (`forRoot`) 和异步 (`forRootAsync`) 配置
- 支持多 MinIO 客户端实例
- 全局模块，注册一次即可在任意位置注入
- 提供 `@InjectMinio()` 装饰器，方便注入客户端
- 提供 `MinioService` 服务，统一管理所有客户端

## 安装

```bash
pnpm add @flow-ez/nestjs-minio
```

需要同时安装 peer dependencies：

```bash
pnpm add @nestjs/common @nestjs/core minio
```

## 快速开始

### 基础配置

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

### 注入使用

使用 `@InjectMinio()` 装饰器直接注入 MinIO 客户端实例：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMinio } from '@flow-ez/nestjs-minio';
import { Client } from 'minio';

@Injectable()
export class StorageService {
  constructor(@InjectMinio() private readonly minio: Client) {}

  async uploadFile(
    bucket: string,
    name: string,
    buffer: Buffer,
  ): Promise<void> {
    const exists = await this.minio.bucketExists(bucket);
    if (!exists) {
      await this.minio.makeBucket(bucket);
    }
    await this.minio.putObject(bucket, name, buffer);
  }

  async getFileUrl(bucket: string, name: string): Promise<string> {
    return this.minio.presignedGetObject(bucket, name, 60 * 60);
  }

  async deleteFile(bucket: string, name: string): Promise<void> {
    await this.minio.removeObject(bucket, name);
  }
}
```

## 异步配置

### useFactory

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from '@flow-ez/nestjs-minio';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MinioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        endPoint: configService.get('MINIO_ENDPOINT'),
        port: configService.get<number>('MINIO_PORT'),
        useSSL: configService.get<boolean>('MINIO_USE_SSL'),
        accessKey: configService.get('MINIO_ACCESS_KEY'),
        secretKey: configService.get('MINIO_SECRET_KEY'),
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
import { MinioOptionsFactory, MinioModuleOptions } from '@flow-ez/nestjs-minio';

@Injectable()
export class MinioConfigService implements MinioOptionsFactory {
  createMinioOptions(): MinioModuleOptions {
    return {
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    };
  }
}

@Module({
  imports: [
    MinioModule.forRootAsync({
      useClass: MinioConfigService,
    }),
  ],
})
export class AppModule {}
```

### useExisting

```typescript
@Module({
  imports: [
    MinioModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: MinioConfigService,
    }),
  ],
})
export class AppModule {}
```

## 多客户端

支持同时注册多个 MinIO 客户端，通过 `clientName` 区分：

```typescript
MinioModule.forRoot([
  {
    clientName: 'public',
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  },
  {
    clientName: 'private',
    endPoint: 'minio-internal.example.com',
    port: 9000,
    useSSL: true,
    accessKey: 'internal-key',
    secretKey: 'internal-secret',
  },
]);
```

注入指定客户端：

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMinio } from '@flow-ez/nestjs-minio';
import { Client } from 'minio';

@Injectable()
export class PublicStorageService {
  constructor(@InjectMinio('public') private readonly minio: Client) {}
}

@Injectable()
export class PrivateStorageService {
  constructor(@InjectMinio('private') private readonly minio: Client) {}
}
```

## MinioService

除了通过装饰器注入，还可以使用 `MinioService` 动态获取客户端：

```typescript
import { Injectable } from '@nestjs/common';
import { MinioService } from '@flow-ez/nestjs-minio';

@Injectable()
export class AppService {
  constructor(private readonly minioService: MinioService) {}

  async someMethod() {
    // 获取默认客户端
    const client = this.minioService.getClient();

    // 获取指定客户端
    const publicClient = this.minioService.getClient('public');

    // 获取所有客户端
    const allClients = this.minioService.getClients();
  }
}
```

## 配置项

`MinioModuleOptions` 继承自 minio-js 的 `ClientOptions`，额外支持：

| 参数         | 类型     | 说明                                 |
| ------------ | -------- | ------------------------------------ |
| `clientName` | `string` | 客户端名称，用于多客户端场景区分实例 |

其他所有 minio-js 配置项均可使用：

| 参数           | 类型      | 必填 | 说明                             |
| -------------- | --------- | ---- | -------------------------------- |
| `endPoint`     | `string`  | 是   | MinIO 服务地址                   |
| `port`         | `number`  | 否   | 端口号，默认 HTTP 80 / HTTPS 443 |
| `useSSL`       | `boolean` | 否   | 是否使用 HTTPS，默认 `true`      |
| `accessKey`    | `string`  | 是   | Access Key                       |
| `secretKey`    | `string`  | 是   | Secret Key                       |
| `region`       | `string`  | 否   | 存储区域                         |
| `sessionToken` | `string`  | 否   | 临时凭证 Session Token           |

详见 [minio-js 文档](https://min.io/docs/minio/linux/developers/javascript/API.html)。

## License

ISC
