import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  BookOpen,
  Printer,
  RefreshCw,
  Scale,
  PieChart,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  accountingService,
  CostCenterItem,
  AccountItem
} from '../../services/accounting.service';

type ReportType = 'INCOME_STATEMENT' | 'TRIAL_BALANCE' | 'GENERAL_LEDGER' | 'JOURNAL_BOOK';

export const FinancialReportsTab: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('INCOME_STATEMENT');
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Default dates: First day of current month to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [ccs, accs] = await Promise.all([
          accountingService.getCostCenters(true),
          accountingService.getAccounts({ allowsMovement: true }),
        ]);
        setCostCenters(ccs);
        setAccounts(accs);
      } catch (err: any) {
        console.error('Error loading filters', err);
      }
    };
    loadPrerequisites();
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Debe seleccionar fecha inicial y final');
      return;
    }

    setLoading(true);
    setReportData(null);
    try {
      const baseFilter = {
        startDate,
        endDate,
        costCenterId: selectedCostCenter || undefined,
      };

      let data;
      if (reportType === 'INCOME_STATEMENT') {
        data = await accountingService.getIncomeStatementReport(baseFilter);
      } else if (reportType === 'TRIAL_BALANCE') {
        data = await accountingService.getTrialBalanceReport(baseFilter);
      } else if (reportType === 'GENERAL_LEDGER') {
        data = await accountingService.getGeneralLedgerReport({
          ...baseFilter,
          accountId: selectedAccount || undefined,
        });
      } else if (reportType === 'JOURNAL_BOOK') {
        data = await accountingService.getJournalBookReport(baseFilter);
      }

      setReportData(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al generar reporte financiero');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const formatLempiras = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return `L ${num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Controls */}
      <Card className="p-6 bg-card/60 border-border/60 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Estados Financieros & Reportes Contables
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Informes normativos bajo NIIF / SAR: Estado de Resultados, Balance de Comprobación y Mayores Auxiliares.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </Button>
            <Button size="sm" onClick={generateReport} disabled={loading} className="flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Generar Reporte
            </Button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-border/40 pt-4">
          <Button
            variant={reportType === 'INCOME_STATEMENT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportType('INCOME_STATEMENT')}
            className="text-xs flex items-center gap-1.5"
          >
            <PieChart className="w-3.5 h-3.5" />
            Estado de Resultados (P&L)
          </Button>
          <Button
            variant={reportType === 'TRIAL_BALANCE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportType('TRIAL_BALANCE')}
            className="text-xs flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            Balance de Comprobación
          </Button>
          <Button
            variant={reportType === 'GENERAL_LEDGER' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportType('GENERAL_LEDGER')}
            className="text-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Libro Mayor y Auxiliares
          </Button>
          <Button
            variant={reportType === 'JOURNAL_BOOK' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportType('JOURNAL_BOOK')}
            className="text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Libro Diario Oficial
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 bg-muted/20 p-3 rounded-lg border border-border/40">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Fecha Desde
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Fecha Hasta
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Centro de Costo / Sucursal
            </label>
            <select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">🌐 Consolidado (Toda la Empresa)</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
          </div>

          {reportType === 'GENERAL_LEDGER' && (
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Cuenta Específica (Opcional)
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas las Cuentas con Movimiento</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Report Canvas / Content */}
      <Card className="p-6 bg-card border-border shadow-sm print:border-none print:shadow-none print:p-0">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Generando estado financiero y consolidando saldos...</span>
          </div>
        ) : !reportData ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Presione "Generar Reporte" para consultar la información financiera.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header del Reporte Imprimible */}
            <div className="border-b border-border/60 pb-4 text-center">
              <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">
                {reportType === 'INCOME_STATEMENT' && 'Estado de Resultados (Pérdidas y Ganancias)'}
                {reportType === 'TRIAL_BALANCE' && 'Balance de Comprobación de Sumas y Saldos'}
                {reportType === 'GENERAL_LEDGER' && 'Libro Mayor y Balances Auxiliares'}
                {reportType === 'JOURNAL_BOOK' && 'Libro Diario General Oficial'}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Período: <strong className="text-foreground">{startDate}</strong> al <strong className="text-foreground">{endDate}</strong>
                {selectedCostCenter && (
                  <span> | Centro de Costo: <strong className="text-foreground">{costCenters.find(c => c.id === selectedCostCenter)?.name || selectedCostCenter}</strong></span>
                )}
                {!selectedCostCenter && <span> | Consolidado Multi-Estación</span>}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                Valores expresados en Lempiras Hondureños (HNL)
              </p>
            </div>

            {/* 1. ESTADO DE RESULTADOS (P&L) */}
            {reportType === 'INCOME_STATEMENT' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:hidden">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider block">Ingresos Operativos</span>
                    <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                      {formatLempiras(reportData.revenues?.total)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block">Costo de Ventas</span>
                    <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                      {formatLempiras(reportData.costs?.total)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block">Utilidad Bruta</span>
                    <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                      {formatLempiras(reportData.grossProfit)}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${reportData.netOperatingProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider block ${reportData.netOperatingProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Utilidad Neta Operativa
                    </span>
                    <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                      {formatLempiras(reportData.netOperatingProfit)}
                    </span>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="border border-border/60 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/60">
                      <tr>
                        <th className="py-2.5 px-4 text-left">Código</th>
                        <th className="py-2.5 px-4 text-left">Concepto / Cuenta Contable</th>
                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {/* INGRESOS */}
                      <tr className="bg-muted/20 font-bold">
                        <td className="py-2 px-4 font-mono text-xs">4</td>
                        <td colSpan={2} className="py-2 px-4 uppercase text-foreground">INGRESOS DE OPERACIÓN</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-600">
                          {formatLempiras(reportData.revenues?.total)}
                        </td>
                      </tr>
                      {reportData.revenues?.items.map((it: any) => (
                        <tr key={it.code} className="hover:bg-muted/10 text-xs">
                          <td className="py-1.5 px-4 font-mono text-muted-foreground">{it.code}</td>
                          <td className="py-1.5 px-4 pl-8 text-foreground">{it.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-muted-foreground">{formatLempiras(it.amount)}</td>
                          <td className="py-1.5 px-4"></td>
                        </tr>
                      ))}

                      {/* COSTO DE VENTAS */}
                      <tr className="bg-muted/20 font-bold">
                        <td className="py-2 px-4 font-mono text-xs">5</td>
                        <td colSpan={2} className="py-2 px-4 uppercase text-foreground">MENOS: COSTO DE VENTAS</td>
                        <td className="py-2 px-4 text-right font-mono text-amber-600">
                          ({formatLempiras(reportData.costs?.total)})
                        </td>
                      </tr>
                      {reportData.costs?.items.map((it: any) => (
                        <tr key={it.code} className="hover:bg-muted/10 text-xs">
                          <td className="py-1.5 px-4 font-mono text-muted-foreground">{it.code}</td>
                          <td className="py-1.5 px-4 pl-8 text-foreground">{it.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-muted-foreground">{formatLempiras(it.amount)}</td>
                          <td className="py-1.5 px-4"></td>
                        </tr>
                      ))}

                      {/* UTILIDAD BRUTA */}
                      <tr className="bg-primary/5 font-bold text-sm border-t-2 border-border/80">
                        <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-foreground">
                          UTILIDAD BRUTA EN VENTAS:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-primary font-bold">
                          {formatLempiras(reportData.grossProfit)}
                        </td>
                      </tr>

                      {/* GASTOS DE OPERACIÓN */}
                      <tr className="bg-muted/20 font-bold">
                        <td className="py-2 px-4 font-mono text-xs">6</td>
                        <td colSpan={2} className="py-2 px-4 uppercase text-foreground">MENOS: GASTOS OPERATIVOS</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-600">
                          ({formatLempiras(reportData.expenses?.total)})
                        </td>
                      </tr>
                      {reportData.expenses?.items.map((it: any) => (
                        <tr key={it.code} className="hover:bg-muted/10 text-xs">
                          <td className="py-1.5 px-4 font-mono text-muted-foreground">{it.code}</td>
                          <td className="py-1.5 px-4 pl-8 text-foreground">{it.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-muted-foreground">{formatLempiras(it.amount)}</td>
                          <td className="py-1.5 px-4"></td>
                        </tr>
                      ))}

                      {/* UTILIDAD NETA */}
                      <tr className="bg-primary/10 font-bold text-base border-t-2 border-primary/50">
                        <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-foreground">
                          UTILIDAD OPERATIVA NETA DEL PERÍODO:
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${reportData.netOperatingProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatLempiras(reportData.netOperatingProfit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. BALANCE DE COMPROBACIÓN */}
            {reportType === 'TRIAL_BALANCE' && (
              <div className="space-y-4">
                {/* Cuadratura Indicator */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-2">
                    {reportData.isBalanced ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                    <span className="text-sm font-semibold">
                      {reportData.isBalanced
                        ? 'Balance Cuadrado: Sumas Iguales de Débitos y Créditos verificadas'
                        : 'Alerta: Se detectó una inconsistencia o descuadre en los saldos'}
                    </span>
                  </div>
                  <Badge variant={reportData.isBalanced ? 'default' : 'destructive'} className="font-mono text-xs">
                    {reportData.isBalanced ? 'CUADRADO' : 'DESCUADRADO'}
                  </Badge>
                </div>

                <div className="border border-border/60 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border/60">
                      <tr>
                        <th rowSpan={2} className="py-2.5 px-3 text-left">Código</th>
                        <th rowSpan={2} className="py-2.5 px-3 text-left">Nombre de la Cuenta</th>
                        <th rowSpan={2} className="py-2.5 px-3 text-right">Saldo Inicial</th>
                        <th colSpan={2} className="py-1 px-3 text-center border-b border-border/40">Movimientos</th>
                        <th colSpan={2} className="py-1 px-3 text-center border-b border-border/40">Saldos Finales</th>
                      </tr>
                      <tr>
                        <th className="py-1.5 px-3 text-right">Debe</th>
                        <th className="py-1.5 px-3 text-right">Haber</th>
                        <th className="py-1.5 px-3 text-right">Deudor</th>
                        <th className="py-1.5 px-3 text-right">Acreedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {reportData.rows?.map((r: any) => (
                        <tr key={r.code} className="hover:bg-muted/10 font-mono">
                          <td className="py-2 px-3 font-bold text-primary">{r.code}</td>
                          <td className="py-2 px-3 font-sans text-foreground font-medium">{r.name}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{formatLempiras(r.initialBalance)}</td>
                          <td className="py-2 px-3 text-right text-foreground">{r.sumDebits > 0 ? formatLempiras(r.sumDebits) : '-'}</td>
                          <td className="py-2 px-3 text-right text-foreground">{r.sumCredits > 0 ? formatLempiras(r.sumCredits) : '-'}</td>
                          <td className="py-2 px-3 text-right font-bold text-foreground">{r.debitBalance > 0 ? formatLempiras(r.debitBalance) : '-'}</td>
                          <td className="py-2 px-3 text-right font-bold text-foreground">{r.creditBalance > 0 ? formatLempiras(r.creditBalance) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/60 font-mono font-bold text-xs border-t-2 border-border/80">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right uppercase">
                          Totales Cuadrados:
                        </td>
                        <td className="py-3 px-3 text-right text-foreground">{formatLempiras(reportData.totalSumDebits)}</td>
                        <td className="py-3 px-3 text-right text-foreground">{formatLempiras(reportData.totalSumCredits)}</td>
                        <td className="py-3 px-3 text-right text-primary">{formatLempiras(reportData.totalDebitBalances)}</td>
                        <td className="py-3 px-3 text-right text-primary">{formatLempiras(reportData.totalCreditBalances)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 3. LIBRO MAYOR */}
            {reportType === 'GENERAL_LEDGER' && (
              <div className="space-y-6">
                {reportData.accounts?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No se registraron movimientos en las cuentas en el rango seleccionado.
                  </p>
                ) : (
                  reportData.accounts?.map((accData: any) => (
                    <div key={accData.account.code} className="border border-border/60 rounded-lg overflow-hidden bg-card/40">
                      <div className="bg-muted/40 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary">{accData.account.code}</span>
                          <span className="font-bold text-sm text-foreground">{accData.account.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {accData.account.nature === 'DEBIT' ? 'Naturaleza Deudora' : 'Naturaleza Acreedora'}
                          </Badge>
                        </div>
                        <div className="mt-2 sm:mt-0 font-mono text-muted-foreground">
                          Saldo Inicial: <strong className="text-foreground">{formatLempiras(accData.initialBalance)}</strong>
                        </div>
                      </div>

                      <table className="w-full text-xs">
                        <thead className="bg-muted/20 font-semibold text-muted-foreground border-b border-border/30">
                          <tr>
                            <th className="py-2 px-3 text-left">Fecha</th>
                            <th className="py-2 px-3 text-left"># Póliza</th>
                            <th className="py-2 px-3 text-left">Concepto</th>
                            <th className="py-2 px-3 text-left">Centro Costo</th>
                            <th className="py-2 px-3 text-right">Debe</th>
                            <th className="py-2 px-3 text-right">Haber</th>
                            <th className="py-2 px-3 text-right">Saldo Acumulado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {accData.movements.map((mov: any, mIdx: number) => (
                            <tr key={mIdx} className="hover:bg-muted/10 font-mono">
                              <td className="py-2 px-3 text-muted-foreground">{new Date(mov.date).toLocaleDateString('es-HN')}</td>
                              <td className="py-2 px-3 font-bold text-foreground">#{mov.entryNumber}</td>
                              <td className="py-2 px-3 font-sans text-foreground">{mov.concept}</td>
                              <td className="py-2 px-3 font-sans text-muted-foreground">{mov.costCenter}</td>
                              <td className="py-2 px-3 text-right text-foreground">{mov.debit > 0 ? formatLempiras(mov.debit) : '-'}</td>
                              <td className="py-2 px-3 text-right text-foreground">{mov.credit > 0 ? formatLempiras(mov.credit) : '-'}</td>
                              <td className="py-2 px-3 text-right font-bold text-primary">{formatLempiras(mov.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 font-mono text-xs border-t border-border/40 font-bold">
                          <tr>
                            <td colSpan={4} className="py-2 px-3 text-right uppercase">Movimientos del Período / Saldo Final:</td>
                            <td className="py-2 px-3 text-right text-foreground">{formatLempiras(accData.totalDebits)}</td>
                            <td className="py-2 px-3 text-right text-foreground">{formatLempiras(accData.totalCredits)}</td>
                            <td className="py-2 px-3 text-right text-emerald-500 font-bold">{formatLempiras(accData.endingBalance)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. LIBRO DIARIO GENERAL */}
            {reportType === 'JOURNAL_BOOK' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total Pólizas Posteadas: <strong className="text-foreground">{reportData.entriesCount}</strong></span>
                  <div className="flex gap-4 font-mono">
                    <span>Total Débitos: <strong className="text-foreground">{formatLempiras(reportData.totalDebits)}</strong></span>
                    <span>Total Créditos: <strong className="text-foreground">{formatLempiras(reportData.totalCredits)}</strong></span>
                  </div>
                </div>

                <div className="space-y-4">
                  {reportData.entries?.map((entry: any) => (
                    <div key={entry.id} className="border border-border/60 rounded-lg overflow-hidden">
                      <div className="bg-muted/30 p-2.5 px-3 flex items-center justify-between text-xs border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">
                            PÓLIZA #{entry.entryNumber.toString().padStart(6, '0')}
                          </span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-mono text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('es-HN')}
                          </span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-medium text-foreground">{entry.concept}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {entry.type}
                        </Badge>
                      </div>

                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-border/20">
                          {entry.lines.map((l: any, lIdx: number) => (
                            <tr key={lIdx} className="hover:bg-muted/10 font-mono">
                              <td className="py-1.5 px-3 w-[15%] text-primary font-bold">{l.account.code}</td>
                              <td className="py-1.5 px-3 w-[45%] font-sans text-foreground">
                                {l.account.name}
                                {l.costCenter && <span className="text-muted-foreground text-[10px] ml-2">({l.costCenter.name})</span>}
                              </td>
                              <td className="py-1.5 px-3 w-[20%] text-right text-foreground">
                                {Number(l.debit) > 0 ? formatLempiras(l.debit) : ''}
                              </td>
                              <td className="py-1.5 px-3 w-[20%] text-right text-foreground">
                                {Number(l.credit) > 0 ? formatLempiras(l.credit) : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/20 font-mono font-bold text-[11px] border-t border-border/40">
                          <tr>
                            <td colSpan={2} className="py-1.5 px-3 text-right uppercase">Sumas:</td>
                            <td className="py-1.5 px-3 text-right">{formatLempiras(entry.totalDebit)}</td>
                            <td className="py-1.5 px-3 text-right">{formatLempiras(entry.totalCredit)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
