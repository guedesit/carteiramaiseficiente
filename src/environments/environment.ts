import { ApiMode } from '../app/models/api.models';

export interface AppEnvironment {
  production: boolean;
  apiMode: ApiMode;
  userId: string;
  apiBaseUrl: string;
  brapiBaseUrl: string;
  brapiToken: string;
  investidorBaseUrl: string;
  cacheTtlMs: number;
}

export const environment: AppEnvironment = {
  production: true,
  apiMode: 'internal',
  userId: '1',
  apiBaseUrl: 'http://localhost:8000',
  brapiBaseUrl: 'https://brapi.dev/api',
  brapiToken: '',
  investidorBaseUrl: 'https://investidor10.com.br/api',
  cacheTtlMs: 60_000,
};
