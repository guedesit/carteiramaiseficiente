import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ApiAccessFailureLog {
  id: string;
  timestamp: string;
  api: string;
  url: string;
  message: string;
  status?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiAccessLogService {
  private readonly storageKey = 'carteira_eficiente_api_access_failures_v1';
  private readonly maxEntries = 200;

  private readonly logsSubject = new BehaviorSubject<ApiAccessFailureLog[]>(this.loadFromStorage());
  readonly logs$ = this.logsSubject.asObservable();

  add(entry: Omit<ApiAccessFailureLog, 'id' | 'timestamp'>): void {
    const nextEntry: ApiAccessFailureLog = {
      id: this.makeId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const next = [nextEntry, ...this.logsSubject.value].slice(0, this.maxEntries);
    this.logsSubject.next(next);
    this.saveToStorage(next);
  }

  clear(): void {
    this.logsSubject.next([]);
    this.saveToStorage([]);
  }

  private loadFromStorage(): ApiAccessFailureLog[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((item) => item && typeof item === 'object');
    } catch {
      return [];
    }
  }

  private saveToStorage(items: ApiAccessFailureLog[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private makeId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
