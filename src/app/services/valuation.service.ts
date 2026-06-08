import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValuationService {
  calculateGrahamPrice(vpa?: number, lpa?: number): number | undefined {
    if (!this.isPositive(vpa) || !this.isPositive(lpa)) {
      return undefined;
    }
    return Math.sqrt(22.5 * (vpa as number) * (lpa as number));
  }

  calculateGrahamPotential(currentPrice?: number, grahamPrice?: number): number | undefined {
    if (!this.isPositive(currentPrice) || grahamPrice === undefined) {
      return undefined;
    }
    return ((grahamPrice - (currentPrice as number)) / (currentPrice as number)) * 100;
  }

  calculateBazinPrice(dividendPrices: number[], desiredReturn: number): number | undefined {
    if (!this.isPositive(desiredReturn) || !dividendPrices.length) {
      return undefined;
    }

    const usable = dividendPrices
      .filter((price) => Number.isFinite(price))
      .slice(-5);

    if (!usable.length) {
      return undefined;
    }

    const averageDividends = usable.reduce((sum, value) => sum + value, 0) / usable.length;
    return (averageDividends / desiredReturn) * 100;
  }

  calculateBazinMargin(currentPrice?: number, bazinPrice?: number): number | undefined {
    if (!this.isPositive(currentPrice) || bazinPrice === undefined) {
      return undefined;
    }
    return ((bazinPrice - (currentPrice as number)) / (currentPrice as number)) * 100;
  }

  hasLowDividendConfidence(dividendPrices: number[]): boolean {
    return dividendPrices.filter((price) => Number.isFinite(price)).length < 5;
  }

  private isPositive(value?: number): value is number {
    return value !== undefined && Number.isFinite(value) && value > 0;
  }
}
