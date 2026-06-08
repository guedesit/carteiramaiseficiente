import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { InterestListState } from '../models/analysis.models';

const STORAGE_KEY = 'carteira_eficiente_interest_list_v1';
const DEFAULT_DESIRED_RETURN = 0.06;

@Injectable({ providedIn: 'root' })
export class InterestListService {
  private readonly isBrowser: boolean;
  private readonly stateSubject: BehaviorSubject<InterestListState>;

  get state$() {
    return this.stateSubject.asObservable();
  }

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.stateSubject = new BehaviorSubject<InterestListState>(this.loadState());
  }

  get snapshot(): InterestListState {
    return this.stateSubject.value;
  }

  addTicker(rawTicker: string): void {
    const ticker = this.normalizeTicker(rawTicker);
    if (!ticker) {
      return;
    }

    const nextTickers = Array.from(new Set([...this.snapshot.tickers, ticker]));
    this.commit({ ...this.snapshot, tickers: nextTickers });
  }

  removeTicker(rawTicker: string): void {
    const ticker = this.normalizeTicker(rawTicker);
    const nextTickers = this.snapshot.tickers.filter((item) => item !== ticker);
    this.commit({ ...this.snapshot, tickers: nextTickers });
  }

  setDesiredReturn(desiredReturn: number): void {
    if (!Number.isFinite(desiredReturn) || desiredReturn <= 0) {
      return;
    }
    this.commit({ ...this.snapshot, desiredReturn });
  }

  private loadState(): InterestListState {
    const fallback: InterestListState = {
      tickers: [],
      desiredReturn: DEFAULT_DESIRED_RETURN,
      updatedAt: new Date().toISOString(),
    };

    if (!this.isBrowser) {
      return fallback;
    }

    try {
      const raw = this.safeStorage()?.getItem(STORAGE_KEY) ?? null;
      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw) as Partial<InterestListState>;
      const tickers = Array.isArray(parsed.tickers)
        ? parsed.tickers.map((item) => this.normalizeTicker(String(item))).filter(Boolean)
        : [];

      const desiredReturn =
        typeof parsed.desiredReturn === 'number' && parsed.desiredReturn > 0
          ? parsed.desiredReturn
          : DEFAULT_DESIRED_RETURN;

      return {
        tickers: Array.from(new Set(tickers)),
        desiredReturn,
        updatedAt:
          typeof parsed.updatedAt === 'string' && parsed.updatedAt
            ? parsed.updatedAt
            : fallback.updatedAt,
      };
    } catch {
      return fallback;
    }
  }

  private commit(state: InterestListState): void {
    const next = { ...state, updatedAt: new Date().toISOString() };
    this.stateSubject.next(next);

    if (!this.isBrowser) {
      return;
    }

    try {
      this.safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota and availability errors.
    }
  }

  private normalizeTicker(value: string): string {
    return value.trim().toUpperCase();
  }

  private safeStorage(): Storage | null {
    if (!this.isBrowser || typeof window === 'undefined') {
      return null;
    }
    return window.localStorage;
  }
}
