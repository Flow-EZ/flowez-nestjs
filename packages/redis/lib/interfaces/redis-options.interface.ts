import { FactoryProvider, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';

export interface RedisModuleOptions extends RedisOptions {
  clientName?: string;
  url?: string;
  onClientReady?(client: Redis): void;
}

export interface RedisOptionsFactory {
  createRedisOptions: () => RedisModuleOptions | Promise<RedisModuleOptions>;
}

export interface RedisModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<RedisOptionsFactory>;
  useClass?: Type<RedisOptionsFactory>;
  useFactory?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions;
  inject?: FactoryProvider['inject'];
  extraProviders?: Provider[];
}