import { Injectable, Inject } from '@nestjs/common';
import type * as Minio from 'minio';
import { MINIO_CLIENT } from './minio.constants.js';
import type { MinioClient } from './minio-client.provider.js';
import { MinioClientError } from './minio-client.provider.js';

@Injectable()
export class MinioService {
  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: MinioClient,
  ) {}

  getClient(clientName?: string): Minio.Client {
    const name = clientName || this.minioClient.name;
    const client = this.minioClient.clients.get(name);
    if (!client) {
      throw new MinioClientError(`client ${name} does not exist`);
    }
    return client;
  }

  getClients(): Map<string, Minio.Client> {
    return this.minioClient.clients;
  }
}
