import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import { Redis } from 'ioredis';
import { RedisClient, RedisClientError } from './redis-client.provider';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
  ) {}

  getClient(clientName?: string): Redis {
    const name = clientName || this.redisClient.name;
    const client = this.redisClient.clients.get(name);
    if (!client) {
      throw new RedisClientError(`client ${name} does not exist`);
    }
    return client;
  }

  getClients(): Map<string, Redis> {
    return this.redisClient.clients;
  }
}
