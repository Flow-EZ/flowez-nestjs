import { Inject } from '@nestjs/common';
import { DEFAULT_MINIO_CLIENT } from './minio.constants';

export const namespaces = new Map<string, string>();

export const InjectMinio = (
  clientName = DEFAULT_MINIO_CLIENT,
): ParameterDecorator => {
  namespaces.set(clientName, clientName);
  return Inject(clientName);
};
