import { DynamicModule, Module } from '@nestjs/common';
import { MinioModuleOptions, MinioModuleAsyncOptions } from './interfaces';
import { MinioCoreModule } from './minio-core.module';

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
