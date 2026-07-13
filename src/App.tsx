import { useState } from 'react';
import { ChartCanvas } from './components/ChartCanvas';
import { ChartControls } from './components/ChartControls';
import { DatasetPreview } from './components/DatasetPreview';
import { FileDropzone } from './components/FileDropzone';
import { chooseDefaultConfig } from './dataUtils';
import { parseFile } from './fileParsers';
import { getSampleDataset } from './sampleData';
import type { ChartConfig, Dataset } from './types';

function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [config, setConfig] = useState<ChartConfig | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function applyDataset(nextDataset: Dataset) {
    setDataset(nextDataset);
    setConfig(chooseDefaultConfig(nextDataset.rows, nextDataset.columns));
    setError('');
  }

  async function handleFileSelected(file: File) {
    setIsLoading(true);
    setError('');

    try {
      const parsed = await parseFile(file);
      applyDataset(parsed);
    } catch (caught) {
      setDataset(null);
      setConfig(null);
      setError(caught instanceof Error ? caught.message : 'The file could not be parsed.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoadSample() {
    applyDataset(getSampleDataset());
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SheetChartMaker home">
          <span className="brandMark">SC</span>
          <span>SheetChartMaker</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#upload">Upload</a>
          <a href="#chart">Chart</a>
          <a href="#preview">Preview</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="upload">
          <div className="heroCopy">
            <p className="eyebrow">Spreadsheet visualization</p>
            <h1>Turn uploaded sheets into clear charts.</h1>
            <p>Import CSV or Excel data, preview the table, then shape a visual chart in a few clicks.</p>
          </div>
          <FileDropzone onFileSelected={handleFileSelected} onLoadSample={handleLoadSample} isLoading={isLoading} />
        </section>

        {error ? (
          <div className="errorBanner" role="alert">
            <strong>Import failed</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {dataset && config ? (
          <>
            <section className="workbench" id="chart">
              <ChartControls columns={dataset.columns} config={config} onChange={setConfig} />
              <ChartCanvas dataset={dataset} config={config} />
            </section>
            <div id="preview">
              <DatasetPreview dataset={dataset} />
            </div>
          </>
        ) : (
          <section className="emptyState" aria-label="Getting started">
            <div>
              <h2>Start with any flat table</h2>
              <p>
                Best results come from one header row, at least one category or date column, and at least one numeric column.
              </p>
            </div>
            <div className="emptyGrid">
              <span>CSV exports</span>
              <span>Excel reports</span>
              <span>Sales tables</span>
              <span>Survey results</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
