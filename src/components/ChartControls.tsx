import type { Aggregation, ChartConfig, ChartType, ColumnProfile } from '../types';

interface ChartControlsProps {
  columns: ColumnProfile[];
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
}

const chartTypes: Array<{ value: ChartType; label: string }> = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'donut', label: 'Donut' },
  { value: 'scatter', label: 'Scatter' }
];

const aggregations: Array<{ value: Aggregation; label: string }> = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' }
];

export function ChartControls({ columns, config, onChange }: ChartControlsProps) {
  const numberColumns = columns.filter((column) => column.type === 'number');
  const update = <Key extends keyof ChartConfig>(key: Key, value: ChartConfig[Key]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <aside className="controlPanel" aria-label="Chart controls">
      <div className="panelHeader">
        <p className="panelKicker">Chart builder</p>
        <h2>Configure the view</h2>
      </div>

      <div className="segmentedControl" role="group" aria-label="Chart type">
        {chartTypes.map((item) => (
          <button
            key={item.value}
            type="button"
            className={config.chartType === item.value ? 'segment activeSegment' : 'segment'}
            onClick={() => update('chartType', item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="field">
        <span>X-axis</span>
        <select value={config.xColumn} onChange={(event) => update('xColumn', event.target.value)}>
          {columns.map((column) => (
            <option key={column.name} value={column.name}>
              {column.name} ({column.type})
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Y-axis</span>
        <select
          value={config.yColumn}
          onChange={(event) => update('yColumn', event.target.value)}
          disabled={config.aggregation === 'count'}
        >
          {numberColumns.length === 0 ? <option value="">No number columns found</option> : null}
          {numberColumns.map((column) => (
            <option key={column.name} value={column.name}>
              {column.name}
            </option>
          ))}
        </select>
        {config.aggregation === 'count' ? <small>Count charts do not need a Y-axis value.</small> : null}
      </label>

      <label className="field">
        <span>Segment by</span>
        <select value={config.groupColumn} onChange={(event) => update('groupColumn', event.target.value)}>
          <option value="">No segment</option>
          {columns
            .filter((column) => column.name !== config.xColumn && column.name !== config.yColumn)
            .map((column) => (
              <option key={column.name} value={column.name}>
                {column.name}
              </option>
            ))}
        </select>
      </label>

      <label className="field">
        <span>Aggregation</span>
        <select value={config.aggregation} onChange={(event) => update('aggregation', event.target.value as Aggregation)}>
          {aggregations.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="columnSummary">
        <h3>Detected columns</h3>
        <div className="columnList">
          {columns.map((column) => (
            <div className="columnPill" key={column.name}>
              <strong>{column.name}</strong>
              <span>{column.type}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
