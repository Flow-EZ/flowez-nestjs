import { FactoryProvider, Provider, ValueProvider } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';
import {
  REDIS_CLIENT,
  REDIS_MODULE_OPTIONS,
  DEFAULT_REDIS_CLIENT,
} from './redis.constants';
import {
  RedisModuleAsyncOptions,
  RedisModuleOptions,
  RedisOptionsFactory,
} from './interfaces';
import { namespaces } from './redis.decorator';
import { RedisService } from './redis.service';

export class RedisClientError extends Error {}

export interface RedisClient {
  name: string;
  clients: Map<string, Redis>;
  size: number;
}

export const createOptionsProvider = (
  options: RedisModuleOptions | RedisModuleOptions[],
): ValueProvider<RedisModuleOptions | RedisModuleOptions[]> => ({
  provide: REDIS_MODULE_OPTIONS,
  useValue: options,
});

export const createRedisClientProviders = (): FactoryProvider<Redis>[] => {
  const providers: FactoryProvider<Redis>[] = [];
  namespaces.forEach((token, namespace) => {
    providers.push({
      provide: token,
      useFactory: (redisService: RedisService) =>
        redisService.getClient(namespace),
      inject: [RedisService],
    });
  });
  return providers;
};

async function createClient(options: RedisModuleOptions): Promise<Redis> {
  const { onClientReady, url, ...opt } = options;
  const client = url ? new IORedis(url, opt) : new IORedis(opt);
  if (onClientReady) {
    onClientReady(client);
  }
  return client;
}

export const redisClientsProvider = (): FactoryProvider => ({
  provide: REDIS_CLIENT,
  useFactory: async (
    options: RedisModuleOptions | RedisModuleOptions[],
  ): Promise<RedisClient> => {
    const clients = new Map<string, Redis>();
    let defaultName = DEFAULT_REDIS_CLIENT;

    if (Array.isArray(options)) {
      await Promise.all(
        options.map(async (option) => {
          const key = option.clientName || defaultName;
          if (clients.has(key)) {
            throw new RedisClientError(
              `${option.clientName || 'default'} client is exists`,
            );
          }
          clients.set(key, await createClient(option));
        }),
      );
    } else {
      if (options.clientName && options.clientName.length !== 0) {
        defaultName = options.clientName;
      }
      clients.set(defaultName, await createClient(options));
    }

    return {
      name: defaultName,
      clients,
      size: clients.size,
    };
  },
  inject: [REDIS_MODULE_OPTIONS],
});

export const createAsyncClientOptions = (
  options: RedisModuleAsyncOptions,
): Provider[] => {
  if (options.useClass) {
    return [
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
      createAsyncOptionsProvider(options),
    ];
  }

  if (options.useExisting || options.useFactory)
    return [createAsyncOptionsProvider(options)];

  return [];
};

export const createAsyncOptions = async (
  optionsFactory: RedisOptionsFactory,
): Promise<RedisModuleOptions> => {
  return await optionsFactory.createRedisOptions();
};

export const createAsyncOptionsProvider = (
  options: RedisModuleAsyncOptions,
): Provider => {
  if (options.useFactory) {
    return {
      provide: REDIS_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject,
    };
  }

  if (options.useClass) {
    return {
      provide: REDIS_MODULE_OPTIONS,
      useFactory: createAsyncOptions,
      inject: [options.useClass],
    };
  }

  if (options.useExisting) {
    return {
      provide: REDIS_MODULE_OPTIONS,
      useFactory: createAsyncOptions,
      inject: [options.useExisting],
    };
  }

  return {
    provide: REDIS_MODULE_OPTIONS,
    useValue: {},
  };
};
