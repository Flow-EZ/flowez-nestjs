import { Injectable, Inject } from '@nestjs/common';
import * as Minio from 'minio';
import { MINIO_CLIENT } from './minio.constants';
import { MinioClient, MinioClientError } from './minio-client.provider';

@Injectable()
export class MinioService {
  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: MinioClient,
  ) {}

  getClient(clientName?: string): Minio.Client {
    if (!clientName) {
      clientName = this.minioClient.name;
    }
    if (!this.minioClient.clients.has(clientName)) {
      throw new MinioClientError(`client ${clientName} does not exist`);
    }
    return this.minioClient.clients.get(clientName);
  }

  getClients(): Map<string, Minio.Client> {
    return this.minioClient.clients;
  }
}
