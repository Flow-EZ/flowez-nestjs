import { FactoryProvider, Provider, ValueProvider } from '@nestjs/common';
import * as Minio from 'minio';
import {
  MINIO_MODULE_OPTIONS,
  MINIO_CLIENT,
  DEFAULT_MINIO_CLIENT,
} from './minio.constants';
import {
  MinioModuleOptions,
  MinioModuleAsyncOptions,
  MinioOptionsFactory,
} from './interfaces';
import { namespaces } from './minio.decorator';
import { MinioService } from './minio.service';

export class MinioClientError extends Error {}

export interface MinioClient {
  name: string;
  clients: Map<string, Minio.Client>;
  size: number;
}

export const createOptionsProvider = (
  options: MinioModuleOptions | MinioModuleOptions[],
): ValueProvider<MinioModuleOptions | MinioModuleOptions[]> => ({
  provide: MINIO_MODULE_OPTIONS,
  useValue: options,
});

export const createMinioClientProviders =
  (): FactoryProvider<Minio.Client>[] => {
    const providers: FactoryProvider<Minio.Client>[] = [];
    namespaces.forEach((token, namespace) => {
      providers.push({
        provide: token,
        useFactory: (minioService: MinioService) =>
          minioService.getClient(namespace),
        inject: [MinioService],
      });
    });
    return providers;
  };

async function createClient(
  options: MinioModuleOptions,
): Promise<Minio.Client> {
  const client = new Minio.Client(options);
  return client;
}

export const minioClientsProvider = (): FactoryProvider => ({
  provide: MINIO_CLIENT,
  useFactory: async (
    options: MinioModuleOptions | MinioModuleOptions[],
  ): Promise<MinioClient> => {
    const clients = new Map<string, Minio.Client>();
    let defaultName = DEFAULT_MINIO_CLIENT;

    if (Array.isArray(options)) {
      await Promise.all(
        options.map(async (option) => {
          const key = option.clientName || defaultName;
          if (clients.has(key)) {
            throw new MinioClientError(
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
  inject: [MINIO_MODULE_OPTIONS],
});

export const createAsyncClientOptions = (
  options: MinioModuleAsyncOptions,
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
  optionsFactory: MinioOptionsFactory,
): Promise<MinioModuleOptions> => {
  return await optionsFactory.createMinioOptions();
};

export const createAsyncOptionsProvider = (
  options: MinioModuleAsyncOptions,
): Provider => {
  if (options.useFactory) {
    return {
      provide: MINIO_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject,
    };
  }

  if (options.useClass) {
    return {
      provide: MINIO_MODULE_OPTIONS,
      useFactory: createAsyncOptions,
      inject: [options.useClass],
    };
  }

  if (options.useExisting) {
    return {
      provide: MINIO_MODULE_OPTIONS,
      useFactory: createAsyncOptions,
      inject: [options.useExisting],
    };
  }

  return {
    provide: MINIO_MODULE_OPTIONS,
    useValue: {},
  };
};
