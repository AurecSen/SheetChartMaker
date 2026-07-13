import { useMemo, useRef } from 'react';
import {
  aggregateRows,
  buildDonutData,
  buildScatterSeries,
  formatNumber,
  truncateLabel
} from '../dataUtils';
import type { AggregatedChartData, ChartConfig, Dataset, ScatterSeries } from '../types';

interface ChartCanvasProps {
  dataset: Dataset;
  config: ChartConfig;
}

const WIDTH = 920;
const HEIGHT = 460;
const MARGIN = { top: 36, right: 36, bottom: 72, left: 74 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

export function ChartCanvas({ dataset, config }: ChartCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartData = useMemo(() => {
    return config.chartType === 'donut' ? buildDonutData(dataset.rows, config) : aggregateRows(dataset.rows, config);
  }, [dataset.rows, config]);
  const scatterData = useMemo(() => buildScatterSeries(dataset.rows, config), [dataset.rows, config]);

  const hasChart = config.chartType === 'scatter' ? scatterData.some((series) => series.points.length) : chartData.series.length > 0;

  return (
    <section className="chartPanel" aria-labelledby="chart-heading">
      <div className="chartHeader">
        <div>
          <p className="panelKicker">Visualization</p>
          <h2 id="chart-heading">{getChartTitle(config)}</h2>
          <p>{getChartDescription(config)}</p>
        </div>
        <button className="secondaryButton" type="button" onClick={() => exportChart(svgRef.current)} disabled={!hasChart}>
          Export PNG
        </button>
      </div>

      {chartData.notice ? <div className="notice">{chartData.notice}</div> : null}

      <div className="chartShell">
        {!hasChart ? (
          <div className="emptyChart">
            <h3>No chartable values yet</h3>
            <p>Choose compatible columns or switch to Count aggregation for text-only data.</p>
          </div>
        ) : (
          <svg ref={svgRef} className="chartSvg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={getChartTitle(config)}>
            <rect width={WIDTH} height={HEIGHT} rx="24" fill="var(--chart-bg)" />
            {config.chartType === 'bar' ? <BarChart data={chartData} /> : null}
            {config.chartType === 'line' ? <LineChart data={chartData} /> : null}
            {config.chartType === 'area' ? <AreaChart data={chartData} /> : null}
            {config.chartType === 'donut' ? <DonutChart data={chartData} /> : null}
            {config.chartType === 'scatter' ? <ScatterChart data={scatterData} /> : null}
          </svg>
        )}
      </div>
    </section>
  );
}

function getChartTitle(config: ChartConfig): string {
  const metric = config.aggregation === 'count' ? 'Record count' : `${config.aggregation} of ${config.yColumn}`;
  return `${metric} by ${config.xColumn}`;
}

function getChartDescription(config: ChartConfig): string {
  if (config.chartType === 'scatter') {
    return `Comparing ${config.xColumn} and ${config.yColumn}${config.groupColumn ? `, segmented by ${config.groupColumn}` : ''}.`;
  }

  return `${config.chartType} chart using ${config.aggregation} aggregation${config.groupColumn ? `, segmented by ${config.groupColumn}` : ''}.`;
}

function getValueRange(data: AggregatedChartData) {
  const values = data.series.flatMap((series) => series.values);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  return { min, span: max - min || 1 };
}

function yScale(value: number, min: number, span: number) {
  return MARGIN.top + PLOT_HEIGHT - ((value - min) / span) * PLOT_HEIGHT;
}

function renderGrid(min: number, span: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const value = min + (span / 4) * index;
    const y = yScale(value, min, span);
    return (
      <g key={value}>
        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} stroke="var(--chart-grid)" />
        <text x={MARGIN.left - 12} y={y + 4} textAnchor="end" className="axisText">
          {formatNumber(value)}
        </text>
      </g>
    );
  });
}

function renderXAxis(labels: string[]) {
  const step = labels.length > 14 ? Math.ceil(labels.length / 10) : 1;
  return labels.map((label, index) => {
    if (index % step !== 0) return null;
    const x = MARGIN.left + (labels.length <= 1 ? PLOT_WIDTH / 2 : (index / (labels.length - 1)) * PLOT_WIDTH);
    return (
      <text key={`${label}-${index}`} x={x} y={HEIGHT - 34} textAnchor="middle" className="axisText">
        {truncateLabel(label, labels.length > 10 ? 10 : 16)}
      </text>
    );
  });
}

function Legend({ items }: { items: Array<{ name: string; color: string }> }) {
  return (
    <g transform={`translate(${MARGIN.left}, 18)`}>
      {items.slice(0, 5).map((item, index) => (
        <g key={item.name} transform={`translate(${index * 148}, 0)`}>
          <rect width="10" height="10" rx="3" fill={item.color} />
          <text x="16" y="10" className="legendText">
            {truncateLabel(item.name, 16)}
          </text>
        </g>
      ))}
    </g>
  );
}

function BarChart({ data }: { data: AggregatedChartData }) {
  const { min, span } = getValueRange(data);
  const band = PLOT_WIDTH / Math.max(data.labels.length, 1);
  const barGroupWidth = band * 0.68;
  const barWidth = Math.max(4, barGroupWidth / Math.max(data.series.length, 1));
  const baseline = yScale(0, min, span);

  return (
    <g>
      {renderGrid(min, span)}
      {data.labels.map((label, labelIndex) => {
        const groupStart = MARGIN.left + labelIndex * band + (band - barGroupWidth) / 2;
        return data.series.map((series, seriesIndex) => {
          const value = series.values[labelIndex] ?? 0;
          const y = yScale(value, min, span);
          return (
            <rect
              key={`${label}-${series.name}`}
              x={groupStart + seriesIndex * barWidth}
              y={Math.min(y, baseline)}
              width={Math.max(2, barWidth - 3)}
              height={Math.max(1, Math.abs(baseline - y))}
              rx="5"
              fill={series.color}
            />
          );
        });
      })}
      {renderXAxis(data.labels)}
      <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={baseline} y2={baseline} stroke="var(--chart-axis)" />
      <Legend items={data.series} />
    </g>
  );
}

function LineChart({ data }: { data: AggregatedChartData }) {
  const { min, span } = getValueRange(data);

  return (
    <g>
      {renderGrid(min, span)}
      {data.series.map((series) => {
        const points = series.values.map((value, index) => {
          const x = MARGIN.left + (data.labels.length <= 1 ? PLOT_WIDTH / 2 : (index / (data.labels.length - 1)) * PLOT_WIDTH);
          const y = yScale(value, min, span);
          return `${x},${y}`;
        });

        return (
          <g key={series.name}>
            <polyline points={points.join(' ')} fill="none" stroke={series.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {series.values.map((value, index) => {
              const x = MARGIN.left + (data.labels.length <= 1 ? PLOT_WIDTH / 2 : (index / (data.labels.length - 1)) * PLOT_WIDTH);
              const y = yScale(value, min, span);
              return <circle key={`${series.name}-${index}`} cx={x} cy={y} r="4" fill="var(--chart-bg)" stroke={series.color} strokeWidth="2" />;
            })}
          </g>
        );
      })}
      {renderXAxis(data.labels)}
      <Legend items={data.series} />
    </g>
  );
}

function AreaChart({ data }: { data: AggregatedChartData }) {
  const { min, span } = getValueRange(data);
  const baseline = yScale(0, min, span);

  return (
    <g>
      {renderGrid(min, span)}
      {data.series.map((series) => {
        const points = series.values.map((value, index) => {
          const x = MARGIN.left + (data.labels.length <= 1 ? PLOT_WIDTH / 2 : (index / (data.labels.length - 1)) * PLOT_WIDTH);
          const y = yScale(value, min, span);
          return { x, y };
        });
        const line = points.map((point) => `${point.x},${point.y}`).join(' ');
        const area = `${MARGIN.left},${baseline} ${line} ${WIDTH - MARGIN.right},${baseline}`;

        return (
          <g key={series.name}>
            <polygon points={area} fill={series.color} opacity="0.14" />
            <polyline points={line} fill="none" stroke={series.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      })}
      {renderXAxis(data.labels)}
      <Legend items={data.series} />
    </g>
  );
}

function DonutChart({ data }: { data: AggregatedChartData }) {
  const total = data.series.reduce((sum, series) => sum + Math.max(0, series.values[0] ?? 0), 0) || 1;
  let startAngle = -90;

  return (
    <g>
      <g transform={`translate(${WIDTH / 2 - 120}, ${HEIGHT / 2 + 10})`}>
        {data.series.map((series) => {
          const value = Math.max(0, series.values[0] ?? 0);
          const angle = (value / total) * 360;
          const path = describeArc(0, 0, 128, 72, startAngle, startAngle + angle);
          startAngle += angle;
          return <path key={series.name} d={path} fill={series.color} />;
        })}
        <circle r="70" fill="var(--chart-bg)" />
        <text textAnchor="middle" y="-4" className="donutTotal">
          {formatNumber(total)}
        </text>
        <text textAnchor="middle" y="22" className="axisText">
          total
        </text>
      </g>
      <g transform={`translate(${WIDTH / 2 + 88}, 112)`}>
        {data.series.slice(0, 10).map((series, index) => (
          <g key={series.name} transform={`translate(0, ${index * 28})`}>
            <rect width="12" height="12" rx="4" fill={series.color} />
            <text x="22" y="11" className="legendText">
              {truncateLabel(series.name, 24)}: {formatNumber(series.values[0] ?? 0)}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

function ScatterChart({ data }: { data: ScatterSeries[] }) {
  const points = data.flatMap((series) => series.points);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(0, ...points.map((point) => point.y));
  const maxY = Math.max(1, ...points.map((point) => point.y));
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;

  const xScale = (value: number) => MARGIN.left + ((value - minX) / xSpan) * PLOT_WIDTH;

  return (
    <g>
      {renderGrid(minY, ySpan)}
      {data.map((series) => (
        <g key={series.name}>
          {series.points.map((point, index) => (
            <circle key={`${series.name}-${index}`} cx={xScale(point.x)} cy={yScale(point.y, minY, ySpan)} r="6" fill={series.color} opacity="0.78">
              <title>{`${point.xLabel}: ${point.label}`}</title>
            </circle>
          ))}
        </g>
      ))}
      <text x={MARGIN.left} y={HEIGHT - 34} className="axisText">
        {formatNumber(minX)}
      </text>
      <text x={WIDTH - MARGIN.right} y={HEIGHT - 34} textAnchor="end" className="axisText">
        {formatNumber(maxX)}
      </text>
      <Legend items={data} />
    </g>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    'L',
    startInner.x,
    startInner.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    endInner.x,
    endInner.y,
    'Z'
  ].join(' ');
}

function exportChart(svg: SVGSVGElement | null) {
  if (!svg) return;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH * 2;
    canvas.height = HEIGHT * 2;
    const context = canvas.getContext('2d');

    if (!context) return;

    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--chart-bg') || '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const link = document.createElement('a');
    link.download = 'sheetchartmaker-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  image.src = url;
}
