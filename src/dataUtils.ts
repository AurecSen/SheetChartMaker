import type {
  AggregatedChartData,
  Aggregation,
  ChartConfig,
  ColumnProfile,
  DataRow,
  RawCell,
  ScatterSeries
} from './types';

export const CHART_COLORS = [
  '#2563eb',
  '#0f766e',
  '#7c3aed',
  '#c2410c',
  '#be123c',
  '#4d7c0f',
  '#0369a1',
  '#a16207'
];

const EMPTY_VALUES = new Set(['', 'null', 'undefined', 'n/a', 'na', '-']);

export function isEmptyCell(value: RawCell): boolean {
  if (value === null || value === undefined) return true;
  const text = String(value).trim();
  return EMPTY_VALUES.has(text.toLowerCase());
}

export function formatCell(value: RawCell): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

export function coerceNumber(value: RawCell): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean' || value instanceof Date || isEmptyCell(value)) {
    return null;
  }

  const text = String(value)
    .trim()
    .replace(/[,$£€¥\s]/g, '')
    .replace(/%$/, '');

  if (!text || text === '.') return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function coerceDate(value: RawCell): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== 'string' || isEmptyCell(value)) {
    return null;
  }

  const text = value.trim();
  const looksLikeDate =
    /\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/.test(text) ||
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(text);

  if (!looksLikeDate) return null;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function profileColumns(rows: DataRow[]): ColumnProfile[] {
  const names = Array.from(
    rows.reduce((columns, row) => {
      Object.keys(row).forEach((key) => columns.add(key));
      return columns;
    }, new Set<string>())
  );

  return names.map((name) => {
    const values = rows.map((row) => row[name]).filter((value) => !isEmptyCell(value));
    const numberCount = values.filter((value) => coerceNumber(value) !== null).length;
    const dateCount = values.filter((value) => coerceDate(value) !== null).length;
    const populated = values.length;
    const uniqueValues = new Set(values.map(formatCell));
    const samples = Array.from(uniqueValues).slice(0, 3);

    let type: ColumnProfile['type'] = 'text';
    if (populated > 0 && numberCount / populated >= 0.72) {
      type = 'number';
    } else if (populated > 0 && dateCount / populated >= 0.72) {
      type = 'date';
    }

    return {
      name,
      type,
      populated,
      unique: uniqueValues.size,
      samples
    };
  });
}

export function normalizeRows(rows: DataRow[]): DataRow[] {
  return rows
    .map((row) => {
      const cleaned: DataRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const name = key.trim() || 'Column';
        cleaned[name] = typeof value === 'string' ? value.trim() : value;
      });
      return cleaned;
    })
    .filter((row) => Object.values(row).some((value) => !isEmptyCell(value)));
}

export function createDataset(name: string, rows: DataRow[]) {
  const normalizedRows = normalizeRows(rows);
  return {
    name,
    rows: normalizedRows,
    columns: profileColumns(normalizedRows)
  };
}

export function chooseDefaultConfig(rows: DataRow[], columns: ColumnProfile[]): ChartConfig {
  const firstNumber = columns.find((column) => column.type === 'number');
  const firstDate = columns.find((column) => column.type === 'date');
  const firstText = columns.find((column) => column.type === 'text');
  const xColumn = firstDate?.name ?? firstText?.name ?? columns[0]?.name ?? '';

  return {
    chartType: 'bar',
    xColumn,
    yColumn: firstNumber?.name ?? '',
    groupColumn: '',
    aggregation: firstNumber ? 'sum' : 'count'
  };
}

function applyAggregation(values: number[], aggregation: Aggregation): number {
  if (aggregation === 'count') return values.length;
  if (values.length === 0) return 0;

  if (aggregation === 'sum') {
    return values.reduce((sum, value) => sum + value, 0);
  }

  if (aggregation === 'average') {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  if (aggregation === 'min') {
    return Math.min(...values);
  }

  return Math.max(...values);
}

function sortLabels(labels: string[], rows: DataRow[], xColumn: string): string[] {
  const lookup = new Map<string, RawCell>();
  rows.forEach((row) => {
    const label = formatCell(row[xColumn]) || 'Blank';
    if (!lookup.has(label)) lookup.set(label, row[xColumn]);
  });

  return [...labels].sort((left, right) => {
    const leftDate = coerceDate(lookup.get(left));
    const rightDate = coerceDate(lookup.get(right));
    if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime();

    const leftNumber = coerceNumber(lookup.get(left));
    const rightNumber = coerceNumber(lookup.get(right));
    if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber;

    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function aggregateRows(rows: DataRow[], config: ChartConfig): AggregatedChartData {
  if (!config.xColumn || rows.length === 0) {
    return { labels: [], series: [] };
  }

  const grouped = new Map<string, Map<string, number[]>>();

  rows.forEach((row) => {
    const label = formatCell(row[config.xColumn]) || 'Blank';
    const seriesName = config.groupColumn ? formatCell(row[config.groupColumn]) || 'Blank' : 'Value';
    const metric = config.aggregation === 'count' ? 1 : coerceNumber(row[config.yColumn]);

    if (metric === null) return;

    const seriesMap = grouped.get(label) ?? new Map<string, number[]>();
    const values = seriesMap.get(seriesName) ?? [];
    values.push(metric);
    seriesMap.set(seriesName, values);
    grouped.set(label, seriesMap);
  });

  let labels = sortLabels(Array.from(grouped.keys()), rows, config.xColumn);
  let notice: string | undefined;

  if (labels.length > 32) {
    labels = labels.slice(0, 32);
    notice = 'Showing the first 32 grouped values. Filter the source file for a tighter chart.';
  }

  const seriesNames = Array.from(
    labels.reduce((names, label) => {
      grouped.get(label)?.forEach((_, seriesName) => names.add(seriesName));
      return names;
    }, new Set<string>())
  ).slice(0, 8);

  const series = seriesNames.map((seriesName, index) => ({
    name: seriesName,
    color: CHART_COLORS[index % CHART_COLORS.length],
    values: labels.map((label) => applyAggregation(grouped.get(label)?.get(seriesName) ?? [], config.aggregation))
  }));

  return { labels, series, notice };
}

export function buildDonutData(rows: DataRow[], config: ChartConfig): AggregatedChartData {
  const data = aggregateRows(rows, { ...config, groupColumn: '' });
  const firstSeries = data.series[0];

  if (!firstSeries) return data;

  return {
    labels: data.labels,
    notice: data.notice,
    series: data.labels.map((label, index) => ({
      name: label,
      color: CHART_COLORS[index % CHART_COLORS.length],
      values: [firstSeries.values[index] ?? 0]
    }))
  };
}

export function buildScatterSeries(rows: DataRow[], config: ChartConfig): ScatterSeries[] {
  if (!config.xColumn || !config.yColumn) return [];

  const groups = new Map<string, ScatterSeries>();

  rows.forEach((row) => {
    const xNumber = coerceNumber(row[config.xColumn]);
    const xDate = coerceDate(row[config.xColumn]);
    const y = coerceNumber(row[config.yColumn]);

    if ((xNumber === null && !xDate) || y === null) return;

    const name = config.groupColumn ? formatCell(row[config.groupColumn]) || 'Blank' : 'Value';
    const existing = groups.get(name);
    const color = existing?.color ?? CHART_COLORS[groups.size % CHART_COLORS.length];
    const series = existing ?? { name, color, points: [] };

    series.points.push({
      x: xDate ? xDate.getTime() : xNumber ?? 0,
      y,
      xLabel: formatCell(row[config.xColumn]),
      label: formatCell(row[config.yColumn])
    });

    groups.set(name, series);
  });

  return Array.from(groups.values()).slice(0, 8);
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 0
  }).format(value);
}

export function truncateLabel(label: string, maxLength = 14): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}
