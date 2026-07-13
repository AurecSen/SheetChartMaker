# SheetChartMaker

SheetChartMaker is a browser-based web app for turning uploaded spreadsheets into charts. It parses CSV and Excel files locally in the browser, profiles the columns, previews the table, and renders configurable charts without requiring an account or database.

## Features

- Upload `.csv`, `.xlsx`, and `.xls` files.
- Parse files locally in the browser.
- Detect number, date, and text columns.
- Preview imported rows before charting.
- Build bar, line, area, donut, and scatter charts.
- Choose X-axis, Y-axis, optional segment column, and aggregation method.
- Export the current chart as a PNG image.
- Use built-in sample data to try the app before uploading a file.

## Privacy model

Uploaded files are processed in the browser session. The app does not include a database, authentication, server storage, or backend file upload path.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test
npm run build
```

## Tech stack

- React
- TypeScript
- Vite
- SheetJS for Excel parsing
- Papa Parse for CSV parsing
- Custom SVG chart rendering
