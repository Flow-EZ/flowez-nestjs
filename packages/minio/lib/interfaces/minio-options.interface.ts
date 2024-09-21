import {
  FactoryProvider,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { ClientOptions } from 'minio';

export interface MinioModuleOptions extends ClientOptions {
  clientName?: string;
}

export interface MinioOptionsFactory {
  createMinioOptions: () => MinioModuleOptions | Promise<MinioModuleOptions>;
}

export interface MinioModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MinioOptionsFactory>;
  useClass?: Type<MinioOptionsFactory>;
  useFactory?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<MinioModuleOptions> | MinioModuleOptions;
  inject?: FactoryProvider['inject'];
  extraProviders?: Provider[];
}
