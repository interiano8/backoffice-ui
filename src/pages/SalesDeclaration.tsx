import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  FileText,
  Search,
  Printer,
  Table,
  LayoutList,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateUTC } from '../lib/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSalesDeclaration } from '../services/report.service';
import { toast } from 'sonner';
import { createWorkbook, downloadWorkbook, addLogo, TITLE_STYLE, SUBTITLE_STYLE, INFO_STYLE, HEADER_STYLE, CELL_STYLE, TOTAL_STYLE } from '../services/excel-export.service';
import { exportElementToPdf } from '../services/pdf-export.service';
import { Skeleton } from "@/components/ui/skeleton"

export const SalesDeclaration = () => {
  const { selectedStore } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'resumido' | 'detallado'>('resumido');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
      const firstDay = `${selectedYear}-${monthStr}-01`;
      const lastDayDate = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const lastDay = `${selectedYear}-${monthStr}-${lastDayDate.toString().padStart(2, '0')}`;

      const data = await getSalesDeclaration(firstDay, lastDay, reportType);
      setData(data);
      if (data.length === 0) {
        toast.info('No se encontraron registros para el periodo seleccionado.');
      }
    } catch (error) {
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const exportToExcel = async () => {
    if (data.length === 0) return;

    const workbook = createWorkbook();
    const worksheet = workbook.addWorksheet('Declaración Ventas');

    const logoUrl = selectedStore?.logoUrl || `${window.location.origin}/store.jpg`;
    await addLogo(worksheet, logoUrl);

    // Configurar anchos de columna
    if (reportType === 'resumido') {
      worksheet.columns = [
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 },
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
      ];
    } else {
      worksheet.columns = [
        { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 },
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
      ];
    }

    // Estilos


    // Título y datos de la tienda
    worksheet.mergeCells('C1:H1');
    worksheet.getCell('C1').value = selectedStore?.titulo || 'DECLARACIÓN DE VENTAS';
    worksheet.getCell('C1').style = TITLE_STYLE;

    worksheet.mergeCells('C2:H2');
    worksheet.getCell('C2').value = 'DECLARACIÓN DE VENTAS';
    worksheet.getCell('C2').style = SUBTITLE_STYLE;

    worksheet.mergeCells('C3:H3');
    worksheet.getCell('C3').value = `${selectedStore?.name || ''} | RTN: ${selectedStore?.RTN || ''}`;
    worksheet.getCell('C3').style = INFO_STYLE;

    worksheet.mergeCells('C4:H4');
    worksheet.getCell('C4').value = `MES: ${months[selectedMonth].toUpperCase()}, ${selectedYear} | ${reportType.toUpperCase()}`;
    worksheet.getCell('C4').style = INFO_STYLE;

    // Agrupar datos por POS y Rango
    const groupedData = data.reduce((acc: any, item: any) => {
      const key = `${item.pos || 'N/A'}-${item.rangeNo || 'Sin Rango'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    let currentRow = 6;

    // Procesar cada grupo de rango
    Object.keys(groupedData).forEach(rangeKey => {
      const rangeItems = groupedData[rangeKey];
      const firstItem = rangeItems[0];

      // Header del rango
      worksheet.mergeCells(currentRow, 1, currentRow, reportType === 'resumido' ? 9 : 8);
      worksheet.getCell(currentRow, 1).value = `${firstItem.docType === 3 ? 'RANGO NOTAS CRÉDITO' : 'RANGO FACTURACIÓN'}: ${firstItem.rangeFrom} AL ${firstItem.rangeTo}`;
      worksheet.getCell(currentRow, 1).style = HEADER_STYLE;
      currentRow++;

      worksheet.mergeCells(currentRow, 1, currentRow, reportType === 'resumido' ? 9 : 8);
      worksheet.getCell(currentRow, 1).value = `CAI: ${firstItem.cai || 'N/A'} | VENCE: ${firstItem.rangeDueDate ? new Date(firstItem.rangeDueDate).toLocaleDateString() : 'N/A'}`;
      worksheet.getCell(currentRow, 1).style = INFO_STYLE;
      currentRow++;

      currentRow++; // Espacio

      // Headers de la tabla
      const headers = reportType === 'resumido'
        ? ['Fecha', 'Desde', 'Hasta', 'Exento', 'Gravado %15', 'Gravado %18', 'Impuesto %15', 'Impuesto %18', 'Total']
        : ['Fecha', 'Factura', 'Exento', 'Gravado %15', 'Gravado %18', 'Impuesto %15', 'Impuesto %18', 'Total'];

      headers.forEach((header, idx) => {
        const cell = worksheet.getCell(currentRow, idx + 1);
        cell.value = header;
        cell.style = HEADER_STYLE;
      });
      currentRow++;

      // Datos del rango
      rangeItems.forEach((row: any) => {
        const rowData = reportType === 'resumido'
          ? [formatDateUTC(row.date), row.desde, row.hasta, Number(row.exempt), Number(row.taxed15), Number(row.taxed18), Number(row.tax15), Number(row.tax18), Number(row.total)]
          : [formatDateUTC(row.date), row.docNo, Number(row.exempt), Number(row.taxed15), Number(row.taxed18), Number(row.tax15), Number(row.tax18), Number(row.total)];

        rowData.forEach((value, colIdx) => {
          const cell = worksheet.getCell(currentRow, colIdx + 1);
          cell.value = value;
          cell.style = CELL_STYLE;
          if (colIdx >= 3) {
            cell.alignment = { horizontal: 'right' };
            cell.numFmt = '#,##0.00';
          }
        });
        currentRow++;
      });

      // Subtotal del rango
      const subtotalStartCol = reportType === 'resumido' ? 4 : 3;
      worksheet.mergeCells(currentRow, 1, currentRow, subtotalStartCol - 1);
      worksheet.getCell(currentRow, 1).value = 'SUBTOTAL RANGO';
      worksheet.getCell(currentRow, 1).style = TOTAL_STYLE;

      const totals = [
        rangeItems.reduce((acc: number, r: any) => acc + Number(r.exempt), 0),
        rangeItems.reduce((acc: number, r: any) => acc + Number(r.taxed15), 0),
        rangeItems.reduce((acc: number, r: any) => acc + Number(r.taxed18), 0),
        rangeItems.reduce((acc: number, r: any) => acc + Number(r.tax15), 0),
        rangeItems.reduce((acc: number, r: any) => acc + Number(r.tax18), 0),
        rangeItems.reduce((acc: number, r: any) => acc + Number(r.total), 0)
      ];

      totals.forEach((total, idx) => {
        const cell = worksheet.getCell(currentRow, subtotalStartCol + idx);
        cell.value = total;
        cell.style = TOTAL_STYLE;
        cell.numFmt = '#,##0.00';
      });
      currentRow += 2; // Espacio después del subtotal
    });

    // Gran Total General
    currentRow++;
    const totalCols = reportType === 'resumido' ? 8 : 7;
    worksheet.mergeCells(currentRow, 1, currentRow, totalCols);
    worksheet.getCell(currentRow, 1).value = 'GRAN TOTAL GENERAL';
    worksheet.getCell(currentRow, 1).style = TOTAL_STYLE;

    const grandTotalCell = worksheet.getCell(currentRow, totalCols + 1);
    grandTotalCell.value = data.reduce((acc: number, r: any) => acc + Number(r.total), 0);
    grandTotalCell.style = TOTAL_STYLE;
    grandTotalCell.numFmt = '#,##0.00';
    currentRow++;

    worksheet.mergeCells(currentRow, 1, currentRow, totalCols + 1);
    worksheet.getCell(currentRow, 1).value = `TOTAL DOCUMENTOS: ${data.reduce((acc: number, r: any) => acc + Number(r.docs), 0)}`;
    worksheet.getCell(currentRow, 1).style = { font: { size: 10, color: { argb: 'FF64748b' } } };

    // Generar y descargar
    const filenameDate = `${selectedYear}_${(selectedMonth + 1).toString().padStart(2, '0')}`;
    downloadWorkbook(workbook, `Ventas_${reportType}_${filenameDate}.xlsx`);
  };

  const handlePdfExport = async () => {
    if (data.length === 0) return;
    const element = document.getElementById('sales-declaration-content');
    if (!element) return;
    const filenameDate = `${selectedYear}_${(selectedMonth + 1).toString().padStart(2, '0')}`;
    const filename = `Ventas_${reportType}_${filenameDate}.pdf`;
    await exportElementToPdf(element, filename);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-card to-muted/30 backdrop-blur-xl print:hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-start gap-12">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Declaración de Ventas</CardTitle>
                <CardDescription className="text-sm font-medium">Consulte y exporte facturación con desglose de impuestos</CardDescription>
              </div>
            </div>

            <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border/50">
              <Button
                variant={reportType === 'resumido' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setReportType('resumido');
                  setData([]);
                }}
                className="rounded-lg h-9 px-4 font-bold"
              >
                <Layers className="mr-2 h-4 w-4" /> Resumido
              </Button>
              <Button
                variant={reportType === 'detallado' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setReportType('detallado');
                  setData([]);
                }}
                className="rounded-lg h-9 px-4 font-bold"
              >
                <LayoutList className="mr-2 h-4 w-4" /> Detallado
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-end gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40">
            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mes</label>
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger className="h-10 font-bold bg-background">
                  <SelectValue placeholder="Seleccione mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()} className="font-medium">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Año</label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="h-10 font-mono font-bold"
                min={2000}
                max={2100}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col items-center justify-center px-4 border-r border-border/40">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documentos</span>
                <span className="text-xl font-black text-primary">{data.reduce((acc, r) => acc + Number(r.docs), 0)}</span>
              </div>
              <Button
                onClick={fetchReport}
                disabled={loading}
                className="h-10 px-6 font-bold shadow-lg shadow-primary/20"
              >
                {loading ? "Generando..." : "Ver Reporte"}
                {!loading && <Search className="ml-2 h-4 w-4" />}
              </Button>

              {data.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-10 border-border/60"
                    title="Imprimir"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePdfExport}
                    className="h-10 border-border/60 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                    title="Descargar PDF"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    className="h-10 border-border/60 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                    title="Descargar Excel"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : data.length > 0 && (
        <div id="sales-declaration-content" className="space-y-10 print:hidden">
          {Object.keys(data.reduce((acc: any, item: any) => {
            const key = `${item.pos || 'N/A'}-${item.rangeNo || 'Sin Rango'}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {})).map((rangeKey) => {
            const rangeItems = data.reduce((acc: any, item: any) => {
              const key = `${item.pos || 'N/A'}-${item.rangeNo || 'Sin Rango'}`;
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
            }, {})[rangeKey];
            const firstItem = rangeItems[0];

            return (
              <Card key={rangeKey} className="border-none shadow-xl overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex flex-wrap justify-between items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      {firstItem.docType === 3 ? 'Rango de Notas de crédito' : 'Rango de Facturación'}
                    </h3>
                    <p className="text-xl font-black">{firstItem.rangeFrom} <span className="text-muted-foreground/30 font-medium mx-2">al</span> {firstItem.rangeTo}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">CAI: <span className="text-foreground ml-2">{firstItem.cai}</span></p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vence: <span className="text-foreground ml-2">{firstItem.rangeDueDate ? formatDateUTC(firstItem.rangeDueDate) : 'N/A'}</span></p>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#583192] text-white">
                          <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider">Fecha</th>
                          {reportType === 'resumido' ? (
                            <>
                              <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider">Desde</th>
                              <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider">Hasta</th>
                            </>
                          ) : (
                            <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider">Factura</th>
                          )}
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider">Exento</th>
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider">Grav. 15%</th>
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider">Grav. 18%</th>
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider">Imp. 15%</th>
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider">Imp. 18%</th>
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider bg-black/10">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {rangeItems.map((row: any, idx: number) => (
                          <tr
                            key={idx}
                            className={cn(
                              "hover:bg-muted/30 transition-colors",
                              idx % 2 === 0 ? "bg-card/50" : "bg-muted/10"
                            )}
                          >
                            <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">{formatDateUTC(row.date)}</td>
                            {reportType === 'resumido' ? (
                              <>
                                <td className="px-4 py-3 text-sm font-bold text-muted-foreground">{row.desde}</td>
                                <td className="px-4 py-3 text-sm font-bold text-muted-foreground">{row.hasta}</td>
                              </>
                            ) : (
                              <td className="px-4 py-3 text-sm font-black text-primary">{row.docNo}</td>
                            )}
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(row.exempt))}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(row.taxed15))}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(row.taxed18))}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(row.tax15))}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(Number(row.tax18))}</td>
                            <td className="px-4 py-3 text-sm text-right font-black bg-primary/5">{formatCurrency(Number(row.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-primary/20">
                        <tr className="bg-muted/50">
                          <td colSpan={reportType === 'resumido' ? 3 : 2} className="px-4 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Subtotal Rango</td>
                          <td className="px-4 py-4 text-sm text-right font-black">{formatCurrency(rangeItems.reduce((acc: any, r: any) => acc + Number(r.exempt), 0))}</td>
                          <td className="px-4 py-4 text-sm text-right font-black">{formatCurrency(rangeItems.reduce((acc: any, r: any) => acc + Number(r.taxed15), 0))}</td>
                          <td className="px-4 py-4 text-sm text-right font-black">{formatCurrency(rangeItems.reduce((acc: any, r: any) => acc + Number(r.taxed18), 0))}</td>
                          <td className="px-4 py-4 text-sm text-right font-black">{formatCurrency(rangeItems.reduce((acc: any, r: any) => acc + Number(r.tax15), 0))}</td>
                          <td className="px-4 py-4 text-sm text-right font-black">{formatCurrency(rangeItems.reduce((acc: any, r: any) => acc + Number(r.tax18), 0))}</td>
                          <td className="px-4 py-4 text-sm text-right font-black text-white bg-[#583192]">{formatCurrency(rangeItems.reduce((acc: any, r: any) => acc + Number(r.total), 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="mt-8 p-8 rounded-3xl bg-black dark:bg-[#583192] text-white shadow-2xl shadow-primary/40 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors" />
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Consolidado Final</p>
                <h2 className="text-4xl font-black tracking-tight">Gran Total General</h2>
                <p className="text-sm font-medium text-white/40">{data.reduce((acc, r) => acc + Number(r.docs), 0)} Documentos Procesados en el Periodo</p>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <span className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                  {formatCurrency(data.reduce((acc, r) => acc + Number(r.total), 0))}
                </span>
                <div className="mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                  <span className="text-[10px] font-black uppercase tracking-widest">Lempiras Exactos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print View Component inside the same page for simplicity (hidden by CSS usually) */}
      <PrintSalesDeclaration
        data={data}
        reportType={reportType}
        store={selectedStore}
        month={selectedMonth}
        year={selectedYear}
        months={months}
      />
    </div>
  );
};

import { PrintSalesDeclaration } from "../components/reports/SalesDeclarationPrint";
