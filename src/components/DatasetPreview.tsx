import { formatCell, truncateLabel } from '../dataUtils';
import type { Dataset } from '../types';

interface DatasetPreviewProps {
  dataset: Dataset;
}

export function DatasetPreview({ dataset }: DatasetPreviewProps) {
  const columns = dataset.columns.map((column) => column.name);
  const previewRows = dataset.rows.slice(0, 8);

  return (
    <section className="tableCard" aria-labelledby="preview-heading">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Table preview</p>
          <h2 id="preview-heading">{dataset.name}</h2>
        </div>
        <p>
          {dataset.rows.length.toLocaleString()} rows, {dataset.columns.length.toLocaleString()} columns
        </p>
      </div>

      <div className="tableScroller">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${formatCell(row[columns[0]])}`}>
                {columns.map((column) => (
                  <td key={column} title={formatCell(row[column])}>
                    {truncateLabel(formatCell(row[column]), 28)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
