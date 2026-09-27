import { createWorkbook, addLogo, downloadWorkbook, formatCellNumber, TITLE_STYLE, SUBTITLE_STYLE, INFO_STYLE, HEADER_STYLE, CELL_STYLE, TOTAL_STYLE } from './excel-export.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateUTC } from '../lib/format';
import { getDocTypeName, formatProductDetail } from '../hooks/useCustomerStatements';

export interface StatementExportOptions {
  selectedCustomer: any;
  selectedStore: any;
  statement: any[];
  startDate: string;
  endDate: string;
}

export async function exportStatementToExcel({
  selectedCustomer,
  selectedStore,
  statement,
  startDate,
  endDate,
}: StatementExportOptions): Promise<void> {
  if (!selectedCustomer || statement.length === 0) return;

  const showDetails = selectedStore?.showDetailsInStatement !== false;
  const workbook = createWorkbook();
  const worksheet = workbook.addWorksheet('Estado de Cuenta');

  const logoUrl = selectedStore?.logoUrl || `${window.location.origin}/store.jpg`;
  await addLogo(worksheet, logoUrl);

  if (showDetails) {
    worksheet.columns = [
      { width: 12 }, { width: 15 }, { width: 18 }, { width: 50 }, { width: 35 }, { width: 15 },
    ];
  } else {
    worksheet.columns = [
      { width: 12 }, { width: 15 }, { width: 18 }, { width: 60 }, { width: 15 },
    ];
  }

  worksheet.mergeCells('C1:F1');
  worksheet.getCell('C1').value = selectedStore?.titulo || 'ESTADO DE CUENTA';
  worksheet.getCell('C1').style = TITLE_STYLE;

  worksheet.mergeCells('C2:F2');
  worksheet.getCell('C2').value = selectedStore?.name || '';
  worksheet.getCell('C2').style = SUBTITLE_STYLE;

  worksheet.mergeCells('C3:F3');
  worksheet.getCell('C3').value = `RTN: ${selectedStore?.RTN || 'N/D'}`;
  worksheet.getCell('C3').style = INFO_STYLE;

  worksheet.mergeCells('C4:F4');
  worksheet.getCell('C4').value = selectedStore?.address || '';
  worksheet.getCell('C4').style = INFO_STYLE;

  const clientRow = 6;
  worksheet.mergeCells(`A${clientRow}:C${clientRow}`);
  worksheet.getCell(`A${clientRow}`).value = `CLIENTE: ${selectedCustomer.customerName}`;
  worksheet.getCell(`A${clientRow}`).style = { font: { bold: true, size: 10 } };

  worksheet.mergeCells(`D${clientRow}:F${clientRow}`);
  worksheet.getCell(`D${clientRow}`).value = `RANGO: ${startDate} al ${endDate}`;
  worksheet.getCell(`D${clientRow}`).style = { font: { bold: true, size: 10 }, alignment: { horizontal: 'right' } };

  const accountRow = 7;
  worksheet.mergeCells(`A${accountRow}:C${accountRow}`);
  worksheet.getCell(`A${accountRow}`).value = `CUENTA: ${selectedCustomer.customerNo}  |  RTN: ${selectedCustomer.rtn}`;
  worksheet.getCell(`A${accountRow}`).style = { font: { bold: true, size: 10 } };

  worksheet.mergeCells(`D${accountRow}:F${accountRow}`);
  worksheet.getCell(`D${accountRow}`).value = `EXPORTADO: ${new Date().toLocaleString()}`;
  worksheet.getCell(`D${accountRow}`).style = { font: { bold: true, size: 10 }, alignment: { horizontal: 'right' } };

  const headerRow = 9;
  const headers = showDetails
    ? ['Fecha', 'Documento', 'Tipo', 'Detalle de Productos', 'Placa | Chofer | KM | Orden', 'Monto']
    : ['Fecha', 'Documento', 'Tipo', 'Detalle de Productos', 'Monto'];

  headers.forEach((header, idx) => {
    const cell = worksheet.getCell(headerRow, idx + 1);
    cell.value = header;
    cell.style = HEADER_STYLE;
  });

  statement.forEach((line, idx) => {
    const rowNum = headerRow + 1 + idx;

    const rowData: (string | number)[] = [
      formatDateUTC(line.date),
      line.docNo,
      getDocTypeName(line.docType),
      line.productDetails ? line.productDetails.split(' | ').map((p: string) => formatProductDetail(p, true)).join(' | ') : '-',
    ];
    if (showDetails) {
      rowData.push(line.fleetInfo || '');
    }
    rowData.push(formatCellNumber(line.charge > 0 ? line.charge : line.payment));

    rowData.forEach((value, colIdx) => {
      const cell = worksheet.getCell(rowNum, colIdx + 1);
      cell.value = value;
      cell.style = CELL_STYLE;
      if (colIdx === rowData.length - 1) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0.00';
      }
    });
  });

  const totalRowNum = headerRow + 1 + statement.length;
  const lastCol = showDetails ? 5 : 4;
  worksheet.mergeCells(totalRowNum, 1, totalRowNum, lastCol);
  worksheet.getCell(totalRowNum, 1).value = 'CONSUMO REPORTE L.';
  worksheet.getCell(totalRowNum, 1).style = TOTAL_STYLE;

  const valueCol = showDetails ? 6 : 5;
  worksheet.getCell(totalRowNum, valueCol).value = formatCellNumber(statement[statement.length - 1]?.balance);
  worksheet.getCell(totalRowNum, valueCol).style = TOTAL_STYLE;

  const filename = `EDC_${selectedCustomer.customerNo}_${startDate}.xlsx`;
  downloadWorkbook(workbook, filename);
}

export async function exportStatementToPdf({
  selectedCustomer,
  selectedStore,
  statement,
  startDate,
  endDate,
}: StatementExportOptions): Promise<void> {
  if (!selectedCustomer || statement.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const showDetails = selectedStore?.showDetailsInStatement !== false;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(selectedStore?.titulo || 'ESTADO DE CUENTA', 105, 15, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(selectedStore?.name || '', 105, 21, { align: 'center' });
  pdf.text(`RTN: ${selectedStore?.RTN || 'N/D'} | ${selectedStore?.address || ''}`, 105, 26, { align: 'center' });

  pdf.setFontSize(9);
  pdf.text(`CLIENTE: ${selectedCustomer.customerName} (${selectedCustomer.customerNo})`, 14, 34);
  pdf.text(`RANGO: ${startDate} al ${endDate}`, 196, 34, { align: 'right' });

  const tableHeaders = showDetails
    ? [['Fecha', 'Doc #', 'Tipo', 'Detalle', 'Flota', 'Monto (L.)']]
    : [['Fecha', 'Doc #', 'Tipo', 'Detalle', 'Monto (L.)']];

  const tableBody = statement.map((line) => {
    const row = [
      formatDateUTC(line.date),
      line.docNo,
      getDocTypeName(line.docType),
      line.productDetails ? line.productDetails.split(' | ').map((p: string) => formatProductDetail(p, true)).join(' | ') : '-',
    ];
    if (showDetails) {
      row.push(line.fleetInfo || '-');
    }
    row.push(Number(line.charge > 0 ? line.charge : line.payment).toFixed(2));
    return row;
  });

  autoTable(pdf, {
    startY: 38,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  pdf.save(`EDC_${selectedCustomer.customerNo}_${startDate}.pdf`);
}
