import { DynamicModule, Module } from '@nestjs/common';
import type {
  MinioModuleOptions,
  MinioModuleAsyncOptions,
} from './interfaces/index.js';
import { MinioCoreModule } from './minio-core.module.js';

@Module({})
export class MinioModule {
  static forRoot(
    options: MinioModuleOptions | MinioModuleOptions[],
  ): DynamicModule {
    return {
      module: MinioModule,
      imports: [MinioCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: MinioModuleAsyncOptions): DynamicModule {
    return {
      module: MinioModule,
      imports: [MinioCoreModule.forRootAsync(options)],
    };
  }
}
