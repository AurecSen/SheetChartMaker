export type RawCell = string | number | boolean | Date | null | undefined;

export type DataRow = Record<string, RawCell>;

export type ColumnType = 'number' | 'date' | 'text';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  populated: number;
  unique: number;
  samples: string[];
}

export interface Dataset {
  name: string;
  rows: DataRow[];
  columns: ColumnProfile[];
}

export type ChartType = 'bar' | 'line' | 'area' | 'donut' | 'scatter';

export type Aggregation = 'sum' | 'average' | 'count' | 'min' | 'max';

export interface ChartConfig {
  chartType: ChartType;
  xColumn: string;
  yColumn: string;
  groupColumn: string;
  aggregation: Aggregation;
}

export interface ChartSeries {
  name: string;
  values: number[];
  color: string;
}

export interface AggregatedChartData {
  labels: string[];
  series: ChartSeries[];
  notice?: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  xLabel: string;
  label: string;
}

export interface ScatterSeries {
  name: string;
  points: ScatterPoint[];
  color: string;
}
