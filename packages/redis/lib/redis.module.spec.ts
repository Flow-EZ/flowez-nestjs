import 'reflect-metadata';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Redis } from 'ioredis';
import type {
  RedisModuleOptions,
  RedisOptionsFactory,
} from './interfaces/index.js';

const RedisMock = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  on: jest.fn(),
}));

jest.unstable_mockModule('ioredis', () => ({
  Redis: RedisMock,
}));

const { RedisModule } = await import('./redis.module.js');
const { RedisService } = await import('./redis.service.js');
const { RedisClientError } = await import('./redis-client.provider.js');
const { InjectRedis, namespaces } = await import('./redis.decorator.js');

describe('RedisModule', () => {
  let moduleRef: TestingModule | undefined;

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
      moduleRef = undefined;
    }
    RedisMock.mockClear();
    namespaces.clear();
  });

  it('forRoot provides RedisService and a default client', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RedisModule.forRoot({ host: '127.0.0.1', port: 6379 })],
    }).compile();

    const service = moduleRef.get(RedisService);
    const client = service.getClient();

    expect(client).toBeDefined();
    expect(service.getClients().size).toBe(1);
    expect(RedisMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: '127.0.0.1', port: 6379 }),
    );
  });

  it('connects with url when provided', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({ url: 'redis://:secret@localhost:6379/0' }),
      ],
    }).compile();

    expect(RedisMock).toHaveBeenCalledWith(
      'redis://:secret@localhost:6379/0',
      expect.any(Object),
    );
  });

  it('calls onClientReady with the created client', async () => {
    const onClientReady = jest.fn();
    moduleRef = await Test.createTestingModule({
      imports: [RedisModule.forRoot({ host: 'localhost', onClientReady })],
    }).compile();

    const client = moduleRef.get(RedisService).getClient();
    expect(onClientReady).toHaveBeenCalledWith(client);
  });

  it('uses clientName as the default when registering a single client', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({
          clientName: 'cache',
          host: 'localhost',
        }),
      ],
    }).compile();

    const service = moduleRef.get(RedisService);
    expect(service.getClient()).toBe(service.getClient('cache'));
  });

  it('registers multiple named clients', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot([
          { clientName: 'cache', host: 'localhost', port: 6379 },
          { clientName: 'queue', host: 'localhost', port: 6380 },
        ]),
      ],
    }).compile();

    const service = moduleRef.get(RedisService);
    expect(service.getClient('cache')).toBeDefined();
    expect(service.getClient('queue')).toBeDefined();
    expect(service.getClient('cache')).not.toBe(service.getClient('queue'));
    expect(service.getClients().size).toBe(2);
  });

  it('throws when a named client is missing', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RedisModule.forRoot({ host: 'localhost' })],
    }).compile();

    expect(() => moduleRef!.get(RedisService).getClient('missing')).toThrow(
      RedisClientError,
    );
  });

  it('throws when duplicate client names are registered', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          RedisModule.forRoot([
            { clientName: 'cache', host: 'localhost' },
            { clientName: 'cache', host: 'localhost' },
          ]),
        ],
      }).compile(),
    ).rejects.toThrow(RedisClientError);
  });

  it('injects the default client with @InjectRedis()', async () => {
    @Injectable()
    class DemoService {
      constructor(@InjectRedis() readonly redis: Redis) {}
    }

    moduleRef = await Test.createTestingModule({
      imports: [RedisModule.forRoot({ host: 'localhost' })],
      providers: [DemoService],
    }).compile();

    const demo = moduleRef.get(DemoService);
    const service = moduleRef.get(RedisService);
    expect(demo.redis).toBe(service.getClient());
  });

  it('injects a named client with @InjectRedis(name)', async () => {
    @Injectable()
    class CacheService {
      constructor(@InjectRedis('cache') readonly redis: Redis) {}
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({
          clientName: 'cache',
          host: 'localhost',
        }),
      ],
      providers: [CacheService],
    }).compile();

    const cache = moduleRef.get(CacheService);
    expect(cache.redis).toBe(moduleRef.get(RedisService).getClient('cache'));
  });

  it('forRootAsync with useFactory provides a client', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRootAsync({
          useFactory: (): RedisModuleOptions => ({
            host: 'async-host',
            port: 6381,
          }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(RedisService).getClient()).toBeDefined();
    expect(RedisMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'async-host', port: 6381 }),
    );
  });

  it('forRootAsync with useClass provides a client', async () => {
    @Injectable()
    class RedisConfigService implements RedisOptionsFactory {
      createRedisOptions(): RedisModuleOptions {
        return { host: 'from-class', port: 6379 };
      }
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.forRootAsync({
          useClass: RedisConfigService,
        }),
      ],
    }).compile();

    expect(moduleRef.get(RedisService).getClient()).toBeDefined();
    expect(RedisMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'from-class' }),
    );
  });

  it('forRootAsync throws when no async config is given', () => {
    expect(() => RedisModule.forRootAsync({} as never)).toThrow(
      'The asynchronous configurations are missing. Expected one of: "useFactory", "useClass", "useExisting".',
    );
  });

  it('disconnects clients on application shutdown', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RedisModule.forRoot({ host: 'localhost' })],
    }).compile();

    const client = moduleRef.get(RedisService).getClient();
    await moduleRef.close();
    moduleRef = undefined;

    expect(client.disconnect).toHaveBeenCalled();
  });

  it('skips disconnect when keepAlive is set', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RedisModule.forRoot({ host: 'localhost', keepAlive: 30000 })],
    }).compile();

    const client = moduleRef.get(RedisService).getClient();
    await moduleRef.close();
    moduleRef = undefined;

    expect(client.disconnect).not.toHaveBeenCalled();
  });
});
