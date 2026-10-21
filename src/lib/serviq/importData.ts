import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type DataValue = string | number | boolean | null;

export type MetricCalculation = "sum" | "average" | "count";

export interface ParsedTable {
  name: string;
  columns: string[];
  rows: Record<string, DataValue>[];
  rowCount: number;
}

export interface DataMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  sourceTable: string;
  sourceColumn: string;
  calculation: MetricCalculation;
}

export interface ImportedDataset {
  version: 1;
  fileName: string;
  fileType: "xlsx" | "xls" | "pdf";
  importedAt: string;
  detectedCategory: string;
  tables: ParsedTable[];
  metrics: DataMetric[];
  totalRows: number;
  totalTables: number;
  warnings: string[];
}

interface PdfToken {
  str: string;
  x: number;
  y: number;
  width: number;
}

interface PdfLine {
  y: number;
  tokens: PdfToken[];
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_ROWS_PER_TABLE = 2000;
const MAX_TOTAL_ROWS = 6000;
const MAX_PDF_PAGES = 100;
const MAX_PDF_LINES = 1500;

const FINANCIAL_COLUMN =
  /revenue|sales amount|total sales|gross sales|net sales|income|turnover|collection|fees?|salary|payroll|expenses?|cost|profit|payments?|amount|invoice total|total value/i;

const QUANTITY_COLUMN =
  /quantity|qty|units sold|cars washed|vehicles sold|students|employees|teachers|faculty count|transactions|orders|attendance count|applications|units/i;

const AVERAGE_COLUMN =
  /average|avg|unit price|price per|rate per|salary per|cost per unit/i;

const AMOUNT_COLUMN =
  /revenue|sales|income|turnover|collection|fees?|salary|payroll|expenses?|cost|profit|payments?|amount|invoice total|total value/i;

const EDUCATION_TERMS =
  /\b(students?|teachers?|faculty|school|college|class(es)?|attendance|admissions?|tuition|departments?|courses?)\b/i;

const SALES_TERMS =
  /\b(sales?|salesperson|dealer|vehicles?|cars?|models?|units sold|regions?|retail)\b/i;

const SERVICE_TERMS =
  /\b(work orders?|technicians?|repairs?|field service|dispatch|service jobs?)\b/i;

const INVENTORY_TERMS =
  /\b(inventory|stock|sku|warehouse|suppliers?|reorder|items in stock)\b/i;

const FINANCE_TERMS =
  /\b(revenue|expenses?|profit|payroll|invoices?|payments?|transactions?|accounts)\b/i;

const normalizeHeader = (value: unknown, index: number): string => {
  const header =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value ?? "").trim();

  return header || `Column ${index + 1}`;
};

const uniqueHeaders = (values: unknown[]): string[] => {
  const seen = new Map<string, number>();

  return values.map((value, index) => {
    const base = normalizeHeader(value, index);
    const count = (seen.get(base) ?? 0) + 1;

    seen.set(base, count);

    return count === 1 ? base : `${base} (${count})`;
  });
};

const normalizeValue = (value: unknown): DataValue => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value === "string" ? value.trim() : value;
  }

  return String(value);
};

const isEmptyRow = (row: unknown[]): boolean => {
  return row.every(
    (value) =>
      value === null || value === undefined || String(value).trim() === "",
  );
};

const findHeaderRow = (grid: unknown[][]): number => {
  const limit = Math.min(grid.length, 15);

  for (let index = 0; index < limit; index += 1) {
    const row = grid[index] ?? [];
    const populated = row.filter((value) => String(value ?? "").trim() !== "");

    if (populated.length >= 2) {
      return index;
    }
  }

  return -1;
};

const parseWorksheet = (
  name: string,
  worksheet: XLSX.WorkSheet,
  remainingRows: number,
  warnings: string[],
): ParsedTable => {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: true,
    blankrows: false,
  });

  const headerIndex = findHeaderRow(grid);

  if (headerIndex < 0) {
    warnings.push(
      `The "${name}" sheet did not contain a clear header row and was skipped.`,
    );

    return {
      name,
      columns: [],
      rows: [],
      rowCount: 0,
    };
  }

  const headers = uniqueHeaders(grid[headerIndex] ?? []);
  const availableRows = grid.slice(headerIndex + 1);
  const nonEmptyRows = availableRows.filter((row) => !isEmptyRow(row));

  const allowedRows = Math.max(0, Math.min(MAX_ROWS_PER_TABLE, remainingRows));

  const selectedRows = nonEmptyRows.slice(0, allowedRows);

  if (selectedRows.length < nonEmptyRows.length) {
    warnings.push(
      `The "${name}" sheet was limited to ${allowedRows.toLocaleString()} records for this browser demo.`,
    );
  }

  const rows = selectedRows.map((values) => {
    const record: Record<string, DataValue> = {};

    headers.forEach((header, index) => {
      record[header] = normalizeValue(values[index]);
    });

    return record;
  });

  return {
    name,
    columns: headers,
    rows,
    rowCount: rows.length,
  };
};

const parseExcel = async (
  file: File,
  warnings: string[],
): Promise<ParsedTable[]> => {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const tables: ParsedTable[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    if (totalRows >= MAX_TOTAL_ROWS) {
      warnings.push(
        `The workbook was limited to ${MAX_TOTAL_ROWS.toLocaleString()} total records.`,
      );

      break;
    }

    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) continue;

    const table = parseWorksheet(
      sheetName,
      worksheet,
      MAX_TOTAL_ROWS - totalRows,
      warnings,
    );

    if (table.columns.length > 0) {
      tables.push(table);
      totalRows += table.rowCount;
    }
  }

  if (tables.length === 0) {
    throw new Error("No readable worksheets with column headers were found.");
  }

  return tables;
};

const groupPdfLines = (tokens: PdfToken[]): string[] => {
  const sorted = [...tokens].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: PdfLine[] = [];

  for (const token of sorted) {
    let line = lines[lines.length - 1];

    if (!line || Math.abs(line.y - token.y) > 3.5) {
      line = {
        y: token.y,
        tokens: [],
      };

      lines.push(line);
    }

    line.tokens.push(token);
  }

  return lines
    .map((line) => {
      const parts = line.tokens.sort((a, b) => a.x - b.x);

      let text = "";
      let previousEnd = Number.NEGATIVE_INFINITY;

      for (const part of parts) {
        const gap = part.x - previousEnd;

        if (text && gap > 28) {
          text += "\t";
        } else if (text && gap > 8) {
          text += "  ";
        } else if (text && gap > 1) {
          text += " ";
        }

        text += part.str.trim();
        previousEnd = part.x + part.width;
      }

      return text.trim();
    })
    .filter(Boolean);
};

const extractPdfLines = async (
  file: File,
  warnings: string[],
): Promise<string[]> => {
  const loadingTask = pdfjsLib.getDocument({
    data: await file.arrayBuffer(),
  });

  const document = await loadingTask.promise;
  const pageLimit = Math.min(document.numPages, MAX_PDF_PAGES);
  const lines: string[] = [];

  if (document.numPages > MAX_PDF_PAGES) {
    warnings.push(`Only the first ${MAX_PDF_PAGES} PDF pages were processed.`);
  }

  try {
    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();

      const tokens: PdfToken[] = content.items
        .filter(
          (
            item,
          ): item is typeof item & {
            str: string;
            transform: number[];
            width: number;
          } =>
            "str" in item &&
            "transform" in item &&
            Array.isArray(item.transform),
        )
        .map((item) => ({
          str: item.str,
          x: item.transform[4] ?? 0,
          y: item.transform[5] ?? 0,
          width: item.width ?? 0,
        }));

      const pageLines = groupPdfLines(tokens);

      lines.push(...pageLines.map((line) => `[Page ${pageNumber}] ${line}`));

      if (lines.length >= MAX_PDF_LINES) {
        lines.length = MAX_PDF_LINES;

        warnings.push(
          `PDF text extraction was limited to ${MAX_PDF_LINES} lines.`,
        );

        break;
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  if (lines.length === 0) {
    warnings.push(
      "No selectable text was extracted. This PDF may be scanned or image-based and may require OCR.",
    );
  } else {
    warnings.push(
      "PDF text and numbers were extracted heuristically. Review the detected fields and figures before relying on them.",
    );
  }

  return lines;
};

const parsePdf = async (
  file: File,
  warnings: string[],
): Promise<ParsedTable[]> => {
  const lines = await extractPdfLines(file, warnings);

  if (lines.length === 0) {
    throw new Error(
      "No selectable text was found in this PDF. Scanned-document OCR is not enabled yet.",
    );
  }

  const rows: Record<string, DataValue>[] = lines.map((line) => {
    const pageMatch = line.match(/^\[Page (\d+)\]\s*/);

    return {
      Page: pageMatch ? Number(pageMatch[1]) : null,
      "Extracted Text": line.replace(/^\[Page \d+\]\s*/, ""),
    };
  });

  return [
    {
      name: "PDF Extracted Text",
      columns: ["Page", "Extracted Text"],
      rows,
      rowCount: rows.length,
    },
  ];
};

const parseNumeric = (value: DataValue): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/[₹$€£]/g, "")
    .replace(/\b(?:INR|USD|EUR|GBP|Rs\.?)\b/gi, "")
    .replace(/,/g, "")
    .replace(/%$/, "")
    .trim();

  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
};

const createMetric = (
  label: string,
  value: number,
  sourceTable: string,
  sourceColumn: string,
  calculation: MetricCalculation,
): DataMetric => ({
  id: `${sourceTable}-${sourceColumn}-${calculation}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  label,
  value,
  formattedValue: formatNumber(value),
  sourceTable,
  sourceColumn,
  calculation,
});

const createMetrics = (tables: ParsedTable[]): DataMetric[] => {
  const metrics: DataMetric[] = [];

  for (const table of tables) {
    if (table.rowCount === 0) continue;

    metrics.push(
      createMetric(
        `${table.name} Records`,
        table.rowCount,
        table.name,
        "",
        "count",
      ),
    );

    for (const column of table.columns) {
      const values = table.rows
        .map((row) => row[column])
        .map(parseNumeric)
        .filter((value): value is number => value !== null);

      if (values.length === 0) continue;

      const financial = FINANCIAL_COLUMN.test(column);
      const quantity = QUANTITY_COLUMN.test(column);
      const average = AVERAGE_COLUMN.test(column);

      if (!financial && !quantity) continue;

      const sum = values.reduce((total, value) => total + value, 0);

      if (average || /unit price|price per|rate per/i.test(column)) {
        metrics.push(
          createMetric(
            `Average ${column}`,
            sum / values.length,
            table.name,
            column,
            "average",
          ),
        );

        continue;
      }

      if (financial || quantity) {
        metrics.push(
          createMetric(
            `${financial ? "Total" : "Total"} ${column}`,
            sum,
            table.name,
            column,
            "sum",
          ),
        );
      }
    }
  }

  const seen = new Set<string>();

  return metrics.filter((metric) => {
    const key = `${metric.sourceTable}:${metric.sourceColumn}:${metric.calculation}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const detectCategory = (tables: ParsedTable[]): string => {
  const searchableText = tables
    .map((table) => `${table.name} ${table.columns.join(" ")}`)
    .join(" ");

  if (EDUCATION_TERMS.test(searchableText)) {
    return "Education";
  }

  if (SALES_TERMS.test(searchableText)) {
    return "Sales & Retail";
  }

  if (SERVICE_TERMS.test(searchableText)) {
    return "Field Operations";
  }

  if (INVENTORY_TERMS.test(searchableText)) {
    return "Inventory & Supply";
  }

  if (FINANCE_TERMS.test(searchableText)) {
    return "Business & Finance";
  }

  return "General Operations";
};

export const importDataFile = async (file: File): Promise<ImportedDataset> => {
  if (!(file instanceof File)) {
    throw new Error("Please select a file to import.");
  }

  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Files must be 25 MB or smaller.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!["xlsx", "xls", "pdf"].includes(extension)) {
    throw new Error("Supported formats are PDF, XLS and XLSX.");
  }

  const warnings: string[] = [];

  let tables: ParsedTable[];

  if (extension === "pdf") {
    tables = await parsePdf(file, warnings);
  } else {
    tables = await parseExcel(file, warnings);
  }

  const totalRows = tables.reduce((total, table) => total + table.rowCount, 0);

  const dataset: ImportedDataset = {
    version: 1,
    fileName: file.name,
    fileType: extension as "xlsx" | "xls" | "pdf",
    importedAt: new Date().toISOString(),
    detectedCategory: detectCategory(tables),
    tables,
    metrics: createMetrics(tables),
    totalRows,
    totalTables: tables.length,
    warnings,
  };

  if (dataset.metrics.length === 0) {
    dataset.warnings.push(
      "No reliable numeric metrics were detected. The extracted tables may still be useful, but the columns need review.",
    );
  }

  return dataset;
};
