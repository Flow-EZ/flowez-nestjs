import { DynamicModule, Global, Module, Inject } from '@nestjs/common';
import { MinioModuleOptions, MinioModuleAsyncOptions } from './interfaces';
import {
  createAsyncClientOptions,
  createOptionsProvider,
  createMinioClientProviders,
  minioClientsProvider,
  MinioClient,
} from './minio-client.provider';
import { MINIO_MODULE_OPTIONS, MINIO_CLIENT } from './minio.constants';
import { MinioService } from './minio.service';

@Global()
@Module({})
export class MinioCoreModule {
  constructor(
    @Inject(MINIO_MODULE_OPTIONS)
    private readonly options: MinioModuleOptions | MinioModuleOptions[],
    @Inject(MINIO_CLIENT)
    private readonly minioClient: MinioClient,
  ) {}

  /* forRoot */
  static forRoot(
    options: MinioModuleOptions | MinioModuleOptions[],
  ): DynamicModule {
    const minioClientProviders = createMinioClientProviders();
    return {
      module: MinioCoreModule,
      providers: [
        createOptionsProvider(options),
        minioClientsProvider(),
        MinioService,
        ...minioClientProviders,
      ],
      exports: [MinioService, ...minioClientProviders],
    };
  }

  /* forRootAsync */
  static forRootAsync(options: MinioModuleAsyncOptions): DynamicModule {
    if (!options.useFactory && !options.useClass && !options.useExisting) {
      throw new Error(
        'The asynchronous configurations are missing. Expected one of: "useFactory", "useClass", "useExisting".',
      );
    }

    const minioClientProviders = createMinioClientProviders();

    return {
      module: MinioCoreModule,
      imports: options.imports,
      providers: [
        ...createAsyncClientOptions(options),
        minioClientsProvider(),
        MinioService,
        ...minioClientProviders,
        ...(options.extraProviders ?? []),
      ],
      exports: [MinioService, ...minioClientProviders],
    };
  }
}
