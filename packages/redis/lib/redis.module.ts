import { DynamicModule, Module } from '@nestjs/common';
import { RedisModuleAsyncOptions, RedisModuleOptions } from './interfaces';
import { RedisCoreModule } from './redis-core.module';

@Module({})
export class RedisModule {
  static forRoot(
    options: RedisModuleOptions | RedisModuleOptions[]
  ): DynamicModule {
    return {
      module: RedisModule,
      imports: [RedisCoreModule.forRoot(options)],
      exports: [RedisCoreModule],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: [RedisCoreModule.forRootAsync(options)],
      exports: [RedisCoreModule],
    };
  }
}