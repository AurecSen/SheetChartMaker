import { describe, expect, it } from 'vitest';
import { aggregateRows, chooseDefaultConfig, coerceNumber, createDataset, profileColumns } from './dataUtils';
import type { ChartConfig, DataRow } from './types';

const rows: DataRow[] = [
  { Month: '2026-01-01', Region: 'North', Revenue: '$1,200', Orders: 12 },
  { Month: '2026-01-01', Region: 'South', Revenue: '$900', Orders: 9 },
  { Month: '2026-02-01', Region: 'North', Revenue: '$1,500', Orders: 15 },
  { Month: '2026-02-01', Region: 'South', Revenue: '$1,100', Orders: 11 }
];

describe('data utilities', () => {
  it('coerces formatted numbers', () => {
    expect(coerceNumber('$1,240.50')).toBe(1240.5);
    expect(coerceNumber('38%')).toBe(38);
    expect(coerceNumber('not a number')).toBeNull();
  });

  it('profiles columns by likely data type', () => {
    const profiles = profileColumns(rows);
    expect(profiles.find((column) => column.name === 'Month')?.type).toBe('date');
    expect(profiles.find((column) => column.name === 'Revenue')?.type).toBe('number');
    expect(profiles.find((column) => column.name === 'Region')?.type).toBe('text');
  });

  it('chooses sensible default chart configuration', () => {
    const dataset = createDataset('test', rows);
    const config = chooseDefaultConfig(dataset.rows, dataset.columns);

    expect(config.xColumn).toBe('Month');
    expect(config.yColumn).toBe('Revenue');
    expect(config.aggregation).toBe('sum');
  });

  it('aggregates values by label and segment', () => {
    const config: ChartConfig = {
      chartType: 'bar',
      xColumn: 'Month',
      yColumn: 'Revenue',
      groupColumn: 'Region',
      aggregation: 'sum'
    };

    const result = aggregateRows(rows, config);
    expect(result.labels).toEqual(['2026-01-01', '2026-02-01']);
    expect(result.series).toHaveLength(2);
    expect(result.series.find((series) => series.name === 'North')?.values).toEqual([1200, 1500]);
    expect(result.series.find((series) => series.name === 'South')?.values).toEqual([900, 1100]);
  });

  it('supports count aggregation without a metric column', () => {
    const result = aggregateRows(rows, {
      chartType: 'bar',
      xColumn: 'Region',
      yColumn: '',
      groupColumn: '',
      aggregation: 'count'
    });

    expect(result.labels).toEqual(['North', 'South']);
    expect(result.series[0].values).toEqual([2, 2]);
  });
});
