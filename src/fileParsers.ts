import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createDataset } from './dataUtils';
import type { DataRow, Dataset } from './types';

const CSV_EXTENSIONS = ['csv'];
const EXCEL_EXTENSIONS = ['xlsx', 'xls'];

export async function parseFile(file: File): Promise<Dataset> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (CSV_EXTENSIONS.includes(extension) || file.type.includes('csv')) {
    return parseCsv(file);
  }

  if (EXCEL_EXTENSIONS.includes(extension)) {
    return parseExcel(file);
  }

  throw new Error('Use a CSV, XLSX, or XLS file.');
}

async function parseCsv(file: File): Promise<Dataset> {
  const text = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse<DataRow>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim() || 'Column',
      complete: (result) => {
        if (result.errors.some((error) => error.type === 'Delimiter')) {
          reject(new Error('The CSV file could not be parsed. Check the delimiter and header row.'));
          return;
        }

        const dataset = createDataset(file.name, result.data);
        if (dataset.rows.length === 0) {
          reject(new Error('No usable rows were found in this CSV file.'));
          return;
        }

        resolve(dataset);
      },
      error: () => reject(new Error('The CSV file could not be read.'))
    });
  });
}

async function parseExcel(file: File): Promise<Dataset> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('This workbook does not contain any sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<DataRow>(worksheet, {
    defval: '',
    raw: false
  });

  const dataset = createDataset(`${file.name} / ${sheetName}`, rows);

  if (dataset.rows.length === 0) {
    throw new Error('No usable rows were found in the first sheet.');
  }

  return dataset;
}
