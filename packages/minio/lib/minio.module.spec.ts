import 'reflect-metadata';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Client } from 'minio';
import type {
  MinioModuleOptions,
  MinioOptionsFactory,
} from './interfaces/index.js';

const ClientMock = jest.fn().mockImplementation(() => ({}));

jest.unstable_mockModule('minio', () => ({
  Client: ClientMock,
}));

const { MinioModule } = await import('./minio.module.js');
const { MinioService } = await import('./minio.service.js');
const { MinioClientError } = await import('./minio-client.provider.js');
const { InjectMinio, namespaces } = await import('./minio.decorator.js');

const defaultOptions: MinioModuleOptions = {
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
};

describe('MinioModule', () => {
  let moduleRef: TestingModule | undefined;

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
      moduleRef = undefined;
    }
    ClientMock.mockClear();
    namespaces.clear();
  });

  it('forRoot provides MinioService and a default client', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MinioModule.forRoot(defaultOptions)],
    }).compile();

    const service = moduleRef.get(MinioService);
    expect(service.getClient()).toBeDefined();
    expect(service.getClients().size).toBe(1);
    expect(ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endPoint: 'localhost',
        port: 9000,
        accessKey: 'minioadmin',
      }),
    );
  });

  it('uses clientName as the default when registering a single client', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MinioModule.forRoot({
          ...defaultOptions,
          clientName: 'public',
        }),
      ],
    }).compile();

    const service = moduleRef.get(MinioService);
    expect(service.getClient()).toBe(service.getClient('public'));
  });

  it('registers multiple named clients', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MinioModule.forRoot([
          { ...defaultOptions, clientName: 'public' },
          {
            ...defaultOptions,
            clientName: 'private',
            endPoint: 'minio-internal',
          },
        ]),
      ],
    }).compile();

    const service = moduleRef.get(MinioService);
    expect(service.getClient('public')).toBeDefined();
    expect(service.getClient('private')).toBeDefined();
    expect(service.getClient('public')).not.toBe(service.getClient('private'));
    expect(service.getClients().size).toBe(2);
  });

  it('throws when a named client is missing', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MinioModule.forRoot(defaultOptions)],
    }).compile();

    expect(() => moduleRef!.get(MinioService).getClient('missing')).toThrow(
      MinioClientError,
    );
  });

  it('throws when duplicate client names are registered', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          MinioModule.forRoot([
            { ...defaultOptions, clientName: 'public' },
            { ...defaultOptions, clientName: 'public' },
          ]),
        ],
      }).compile(),
    ).rejects.toThrow(MinioClientError);
  });

  it('injects the default client with @InjectMinio()', async () => {
    @Injectable()
    class StorageService {
      constructor(@InjectMinio() readonly minio: Client) {}
    }

    moduleRef = await Test.createTestingModule({
      imports: [MinioModule.forRoot(defaultOptions)],
      providers: [StorageService],
    }).compile();

    const storage = moduleRef.get(StorageService);
    expect(storage.minio).toBe(moduleRef.get(MinioService).getClient());
  });

  it('injects a named client with @InjectMinio(name)', async () => {
    @Injectable()
    class PublicStorageService {
      constructor(@InjectMinio('public') readonly minio: Client) {}
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        MinioModule.forRoot({
          ...defaultOptions,
          clientName: 'public',
        }),
      ],
      providers: [PublicStorageService],
    }).compile();

    const storage = moduleRef.get(PublicStorageService);
    expect(storage.minio).toBe(moduleRef.get(MinioService).getClient('public'));
  });

  it('forRootAsync with useFactory provides a client', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MinioModule.forRootAsync({
          useFactory: (): MinioModuleOptions => ({
            ...defaultOptions,
            endPoint: 'async-minio',
          }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(MinioService).getClient()).toBeDefined();
    expect(ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ endPoint: 'async-minio' }),
    );
  });

  it('forRootAsync with useClass provides a client', async () => {
    @Injectable()
    class MinioConfigService implements MinioOptionsFactory {
      createMinioOptions(): MinioModuleOptions {
        return { ...defaultOptions, endPoint: 'from-class' };
      }
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        MinioModule.forRootAsync({
          useClass: MinioConfigService,
        }),
      ],
    }).compile();

    expect(moduleRef.get(MinioService).getClient()).toBeDefined();
    expect(ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ endPoint: 'from-class' }),
    );
  });

  it('forRootAsync throws when no async config is given', () => {
    expect(() => MinioModule.forRootAsync({} as never)).toThrow(
      'The asynchronous configurations are missing. Expected one of: "useFactory", "useClass", "useExisting".',
    );
  });
});
