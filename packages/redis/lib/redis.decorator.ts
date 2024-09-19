import { Inject } from '@nestjs/common';
import { DEFAULT_REDIS_CLIENT } from './redis.constants';

export const namespaces = new Map<string, string>();

export const InjectRedis = (
  clientName = DEFAULT_REDIS_CLIENT,
): ParameterDecorator => {
  namespaces.set(clientName, clientName);
  return Inject(clientName);
};

