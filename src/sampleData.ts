import { createDataset } from './dataUtils';
import type { Dataset } from './types';

const rows = [
  { Week: '2026-01-05', Region: 'North', Channel: 'Retail', Revenue: 18420, Orders: 312, Margin: 37.2 },
  { Week: '2026-01-05', Region: 'South', Channel: 'Retail', Revenue: 14260, Orders: 244, Margin: 34.8 },
  { Week: '2026-01-05', Region: 'West', Channel: 'Online', Revenue: 23840, Orders: 418, Margin: 41.1 },
  { Week: '2026-01-12', Region: 'North', Channel: 'Online', Revenue: 21280, Orders: 356, Margin: 39.5 },
  { Week: '2026-01-12', Region: 'South', Channel: 'Wholesale', Revenue: 16690, Orders: 205, Margin: 31.4 },
  { Week: '2026-01-12', Region: 'West', Channel: 'Retail', Revenue: 19740, Orders: 337, Margin: 38.9 },
  { Week: '2026-01-19', Region: 'North', Channel: 'Wholesale', Revenue: 17110, Orders: 226, Margin: 32.6 },
  { Week: '2026-01-19', Region: 'South', Channel: 'Online', Revenue: 22630, Orders: 392, Margin: 40.3 },
  { Week: '2026-01-19', Region: 'West', Channel: 'Online', Revenue: 24890, Orders: 441, Margin: 42.7 },
  { Week: '2026-01-26', Region: 'North', Channel: 'Retail', Revenue: 19480, Orders: 321, Margin: 36.5 },
  { Week: '2026-01-26', Region: 'South', Channel: 'Online', Revenue: 21920, Orders: 379, Margin: 39.8 },
  { Week: '2026-01-26', Region: 'West', Channel: 'Wholesale', Revenue: 18130, Orders: 218, Margin: 33.1 }
];

export function getSampleDataset(): Dataset {
  return createDataset('Sample weekly sales', rows);
}
