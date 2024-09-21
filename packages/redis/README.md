# NestJS IORedis

<a href="https://www.npmjs.com/package/@flowez/nestjs-ioredis"><img src="https://img.shields.io/npm/v/@flowez/nestjs-ioredis.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@flowez/nestjs-ioredis"><img src="https://img.shields.io/npm/l/@flowez/nestjs-ioredis.svg" alt="Package License" /></a>

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Examples](#examples)
- [License](#license)

## Description

Integrates IORedis with Nest

## Installation

```bash
npm install @flowez/nestjs-ioredis ioredis
```

You can also use the interactive CLI

```sh
npx nestjs-modules
```

## Examples

Let's register the RedisModule in `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@flowez/nestjs-ioredis';

@Module({
  imports: [RedisModule.register(options)],
})
export class AppModule {}
```

With Async

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@flowez/nestjs-ioredis';

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.get('redis'), // or use async method
      //useFactory: async (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

And the config file look like this
With single client

```typescript
export default {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  db: parseInt(process.env.REDIS_DB),
  password: process.env.REDIS_PASSWORD,
  keyPrefix: process.env.REDIS_PRIFIX,
};
Or;
export default {
  url: 'redis://:authpassword@127.0.0.1:6380/4',
};
```

With custom error handler

```typescript
export default {
  url: 'redis://:authpassword@127.0.0.1:6380/4',
  onClientReady: (client) => {
    client.on('error', (err) => {});
  },
};
```

With multi client

```typescript
export default [
  {
    clientName: 'test1',
    url: 'redis://:authpassword@127.0.0.1:6380/4',
  },
  {
    clientName: 'test2',
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    db: parseInt(process.env.REDIS_DB),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: process.env.REDIS_PRIFIX,
  },
];
```

And use in your service

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@flowez/nestjs-ioredis';

@Injectable()
export class TestService {
  constructor(private readonly redisService: RedisService) {}
  async root(): Promise<boolean> {
    const client = await this.redisService.getClient('test');
    return true;
  }
}
```

That's it!

## License

MIT
