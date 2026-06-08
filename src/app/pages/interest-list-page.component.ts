import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';
import { StockAutocompleteItem } from '../models/api.models';
import { InterestListService } from '../services/interest-list.service';
import { StockApiService } from '../services/stock-api.service';

@Component({
  selector: 'app-interest-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './interest-list-page.component.html',
  styleUrl: './interest-list-page.component.css',
})
export class InterestListPageComponent {
  private readonly interestList = inject(InterestListService);
  private readonly stockApi = inject(StockApiService);

  readonly state$ = this.interestList.state$;
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly suggestions$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(250),
    distinctUntilChanged(),
    switchMap((value) => this.stockApi.searchStocks(value)),
    map((items) => items.slice(0, 10)),
  );

  addTicker(raw: string): void {
    this.interestList.addTicker(raw);
    this.searchControl.setValue('');
  }

  addFromSuggestion(item: StockAutocompleteItem): void {
    this.addTicker(item.codigo);
  }

  removeTicker(ticker: string): void {
    this.interestList.removeTicker(ticker);
  }

  formatDesiredReturn(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }
}
