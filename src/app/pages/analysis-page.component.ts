import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map, startWith, shareReplay } from 'rxjs';
import { AnalysisViewMode, ChartDatum, StockAnalysisRow } from '../models/analysis.models';
import { AnalysisFacadeService } from '../services/analysis-facade.service';
import { InterestListService } from '../services/interest-list.service';

interface AnalysisVm {
  loading: boolean;
  generatedAt?: string;
  rows: StockAnalysisRow[];
  mainRows: StockAnalysisRow[];
  quarantineRows: StockAnalysisRow[];
  chart: ChartDatum[];
}

@Component({
  selector: 'app-analysis-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './analysis-page.component.html',
  styleUrl: './analysis-page.component.css',
})
export class AnalysisPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly interestList = inject(InterestListService);
  private readonly facade = inject(AnalysisFacadeService);

  readonly desiredReturnControl = new FormControl(this.interestList.snapshot.desiredReturn, {
    nonNullable: true,
  });
  readonly viewModeControl = new FormControl<AnalysisViewMode>('graham', { nonNullable: true });
  readonly statusFilterControl = new FormControl<'all' | 'eligible' | 'quarantine'>('all', {
    nonNullable: true,
  });
  readonly sortControl = new FormControl<'potential' | 'ticker'>('potential', { nonNullable: true });

  private readonly desiredReturn$ = this.desiredReturnControl.valueChanges.pipe(
    startWith(this.desiredReturnControl.value),
  );

  private readonly viewMode$ = this.viewModeControl.valueChanges.pipe(
    startWith(this.viewModeControl.value),
  );

  private readonly rawAnalysis$ = this.facade
    .buildAnalysis(this.interestList.state$.pipe(map((state) => state.tickers)), this.desiredReturn$, this.viewMode$)
    .pipe(shareReplay({ refCount: true, bufferSize: 1 }));

  readonly vm$ = combineLatest([
    this.rawAnalysis$,
    this.statusFilterControl.valueChanges.pipe(startWith(this.statusFilterControl.value)),
    this.sortControl.valueChanges.pipe(startWith(this.sortControl.value)),
    this.viewMode$,
  ]).pipe(
    map(([analysis, statusFilter, sortBy, viewMode]) => {
      const filtered = this.filterRows(analysis.rows, statusFilter);
      const sorted = this.sortRows(filtered, sortBy);
      return {
        loading: false,
        generatedAt: analysis.generatedAt,
        rows: sorted,
        mainRows: this.sortRows(this.filterRows(analysis.mainRows, statusFilter), sortBy),
        quarantineRows: this.sortRows(this.filterRows(analysis.quarantineRows, statusFilter), sortBy),
        chart: this.facade.createChart(sorted, viewMode),
      } as AnalysisVm;
    }),
    startWith({ loading: true, rows: [], mainRows: [], quarantineRows: [], chart: [] } as AnalysisVm),
  );

  constructor() {
    this.desiredReturnControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (Number.isFinite(value) && value > 0) {
          this.interestList.setDesiredReturn(value);
          return;
        }

        this.desiredReturnControl.setValue(this.interestList.snapshot.desiredReturn, {
          emitEvent: false,
        });
      });
  }

  byTicker(_: number, row: StockAnalysisRow): string {
    return row.ticker;
  }

  asPercent(value?: number): string {
    if (value === undefined) {
      return 'N/A';
    }
    return `${value.toFixed(2)}%`;
  }

  asMoney(value?: number): string {
    if (value === undefined) {
      return 'N/A';
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  isUp(value?: number): boolean {
    return (value ?? 0) >= 0;
  }

  chartPercent(item: ChartDatum, metric: 'currentPrice' | 'targetPrice', chart: ChartDatum[]): number {
    const max = Math.max(...chart.map((entry) => Math.max(entry.currentPrice, entry.targetPrice)), 1);
    return (item[metric] / max) * 100;
  }

  private filterRows(rows: StockAnalysisRow[], filter: 'all' | 'eligible' | 'quarantine'): StockAnalysisRow[] {
    if (filter === 'all') {
      return rows;
    }
    return rows.filter((row) => {
      if (filter === 'eligible') {
        return row.status === 'eligible';
      }
      return row.status !== 'eligible';
    });
  }

  private sortRows(rows: StockAnalysisRow[], sortBy: 'potential' | 'ticker'): StockAnalysisRow[] {
    const clone = [...rows];
    if (sortBy === 'ticker') {
      return clone.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }
    return clone.sort((a, b) => (b.grahamPotential ?? -9999) - (a.grahamPotential ?? -9999));
  }
}
