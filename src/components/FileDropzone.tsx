import { useRef, useState } from 'react';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export function FileDropzone({ onFileSelected, onLoadSample, isLoading }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <section
      className={`dropzone ${isDragging ? 'dropzoneActive' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="srOnly"
        id="file-upload"
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="dropzoneMark" aria-hidden="true">
        <span />
      </div>
      <div>
        <p className="panelKicker">Local file parsing</p>
        <h2>Upload a spreadsheet</h2>
        <p>
          Drop a CSV or Excel file here. Your data stays in this browser session while you build charts.
        </p>
      </div>
      <div className="dropzoneActions">
        <button className="primaryButton" type="button" onClick={() => inputRef.current?.click()} disabled={isLoading}>
          {isLoading ? 'Reading file' : 'Choose file'}
        </button>
        <button className="secondaryButton" type="button" onClick={onLoadSample} disabled={isLoading}>
          Try sample
        </button>
      </div>
    </section>
  );
}
