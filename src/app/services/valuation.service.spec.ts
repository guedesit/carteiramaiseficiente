import { describe, expect, it } from 'vitest';
import { ValuationService } from './valuation.service';

describe('ValuationService', () => {
  const service = new ValuationService();

  it('calculates Graham price correctly', () => {
    const result = service.calculateGrahamPrice(20, 5);
    expect(result).toBeCloseTo(47.434, 3);
  });

  it('calculates Graham potential correctly', () => {
    const result = service.calculateGrahamPotential(10, 12);
    expect(result).toBeCloseTo(20, 2);
  });

  it('calculates Bazin price using latest five dividends', () => {
    const result = service.calculateBazinPrice([1, 1, 1, 1, 1, 2], 0.06);
    expect(result).toBeCloseTo(20, 2);
  });

  it('returns undefined for invalid desired return', () => {
    expect(service.calculateBazinPrice([1, 2], 0)).toBeUndefined();
  });
});
