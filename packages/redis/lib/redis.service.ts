import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants.js';
import type { RedisClient } from './redis-client.provider.js';
import { RedisClientError } from './redis-client.provider.js';

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
