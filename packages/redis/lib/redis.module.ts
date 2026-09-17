import { DynamicModule, Module } from '@nestjs/common';
import type {
  RedisModuleOptions,
  RedisModuleAsyncOptions,
} from './interfaces/index.js';
import { RedisCoreModule } from './redis-core.module.js';

@Module({})
export class RedisModule {
  static forRoot(
    options: RedisModuleOptions | RedisModuleOptions[],
  ): DynamicModule {
    return {
      module: RedisModule,
      imports: [RedisCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: [RedisCoreModule.forRootAsync(options)],
    };
  }
}
