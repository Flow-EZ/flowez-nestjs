import {
  DynamicModule,
  Global,
  Module,
  Inject,
  OnApplicationShutdown,
} from '@nestjs/common';
import { RedisModuleAsyncOptions, RedisModuleOptions } from './interfaces';
import {
  createAsyncClientOptions,
  createOptionsProvider,
  createRedisClientProviders,
  redisClientsProvider,
  RedisClient,
} from './redis-client.provider';
import { REDIS_MODULE_OPTIONS, REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class RedisCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_MODULE_OPTIONS)
    private readonly options: RedisModuleOptions | RedisModuleOptions[],
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClient,
  ) {}

  /* forRoot */
  static forRoot(
    options: RedisModuleOptions | RedisModuleOptions[],
  ): DynamicModule {
    const redisClientProviders = createRedisClientProviders();
    return {
      module: RedisCoreModule,
      providers: [
        createOptionsProvider(options),
        redisClientsProvider(),
        RedisService,
        ...redisClientProviders,
      ],
      exports: [RedisService, ...redisClientProviders],
    };
  }

  /* forRootAsync */
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    if (!options.useFactory && !options.useClass && !options.useExisting) {
      throw new Error(
        'The asynchronous configurations are missing. Expected one of: "useFactory", "useClass", "useExisting".',
      );
    }

    const redisClientProviders = createRedisClientProviders();

    return {
      module: RedisCoreModule,
      imports: options.imports,
      providers: [
        ...createAsyncClientOptions(options),
        redisClientsProvider(),
        RedisService,
        ...redisClientProviders,
        ...(options.extraProviders ?? []),
      ],
      exports: [RedisService, ...redisClientProviders],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const closeConnection =
      ({ clients, name }) =>
      (options) => {
        const key = options.clientName || name;
        const client = clients.get(key);

        if (client && !options.keepAlive) {
          client.disconnect();
        }
      };

    const closeClientConnection = closeConnection(this.redisClient);

    if (Array.isArray(this.options)) {
      this.options.forEach(closeClientConnection);
    } else {
      closeClientConnection(this.options);
    }
  }
}
