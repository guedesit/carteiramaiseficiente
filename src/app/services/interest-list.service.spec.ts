import { beforeEach, describe, expect, it } from 'vitest';
import { InterestListService } from './interest-list.service';

class LocalStorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('InterestListService', () => {
  beforeEach(() => {
    (globalThis as { window?: unknown }).window = { localStorage: new LocalStorageMock() };
  });

  it('adds and persists tickers in localStorage', () => {
    const service = new InterestListService('browser' as unknown as object);

    service.addTicker('petr4');
    service.addTicker('VALE3');
    service.addTicker('PETR4');

    expect(service.snapshot.tickers).toEqual(['PETR4', 'VALE3']);

    const persisted = JSON.parse(
      ((globalThis as { window: { localStorage: Storage } }).window.localStorage.getItem(
        'carteira_eficiente_interest_list_v1',
      ) as string) ?? '{}',
    );

    expect(persisted.tickers).toEqual(['PETR4', 'VALE3']);
  });

  it('removes ticker and keeps desired return positive', () => {
    const service = new InterestListService('browser' as unknown as object);

    service.addTicker('ITUB4');
    service.removeTicker('ITUB4');
    service.setDesiredReturn(0.08);

    expect(service.snapshot.tickers).toEqual([]);
    expect(service.snapshot.desiredReturn).toBe(0.08);

    service.setDesiredReturn(0);
    expect(service.snapshot.desiredReturn).toBe(0.08);
  });

  it('uses safe fallback outside browser', () => {
    const service = new InterestListService('server' as unknown as object);

    service.addTicker('BBAS3');

    expect(service.snapshot.tickers).toEqual(['BBAS3']);
  });
});
