import { AppEnvironment } from './environment';

export const environment: AppEnvironment = {
  production: false,
  apiMode: 'internal',
  userId: '1',
  apiBaseUrl: 'http://localhost:8000',
  brapiBaseUrl: 'https://brapi.dev/api',
  brapiToken: '',
  investidorBaseUrl: 'https://investidor10.com.br/api',
  cacheTtlMs: 30_000,
};
