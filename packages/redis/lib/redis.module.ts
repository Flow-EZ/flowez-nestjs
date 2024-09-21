import { DynamicModule, Module } from '@nestjs/common';
import { RedisModuleOptions, RedisModuleAsyncOptions } from './interfaces';
import { RedisCoreModule } from './redis-core.module';

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
