import ExcelJS from 'exceljs';

export const TITLE_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 14, color: { argb: 'FF1e293b' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
};

export const SUBTITLE_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 12, color: { argb: 'FF334155' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
};

export const INFO_STYLE: Partial<ExcelJS.Style> = {
  font: { size: 10, color: { argb: 'FF64748b' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
};

export const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  },
};

export const CELL_STYLE: Partial<ExcelJS.Style> = {
  font: { size: 10 },
  alignment: { vertical: 'middle' },
  border: {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  },
};

export const TOTAL_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 10, color: { argb: 'FF1e293b' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf1f5f9' } },
  alignment: { vertical: 'middle' },
  border: {
    top: { style: 'medium' }, bottom: { style: 'medium' },
    left: { style: 'thin' }, right: { style: 'thin' },
  },
};

export function createWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

export async function addLogo(worksheet: ExcelJS.Worksheet, logoUrl?: string | null): Promise<void> {
  if (!logoUrl) return;
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const imageId = workbook_addImage(worksheet, uint8Array);
    if (imageId !== undefined) {
      worksheet.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 80, height: 80 } });
    }
  } catch {}
}

function workbook_addImage(worksheet: ExcelJS.Worksheet, buffer: Uint8Array): number | undefined {
  try {
    const wb = worksheet.workbook;
    return (wb as any).addImage?.({ buffer, extension: 'png' });
  } catch {
    return undefined;
  }
}

export function applyRowStyle(worksheet: ExcelJS.Worksheet, row: number, style: Partial<ExcelJS.Style>, cols: number): void {
  for (let c = 1; c <= cols; c++) {
    const cell = worksheet.getCell(row, c);
    Object.assign(cell, style);
    if (style.font) cell.font = { ...cell.font, ...style.font };
    if (style.fill) cell.fill = style.fill;
    if (style.alignment) cell.alignment = { ...cell.alignment, ...style.alignment };
    if (style.border) cell.border = style.border;
  }
}

export function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): void {
  workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export function formatCellNumber(val: any): number {
  return Number(val || 0);
}
