import {
  Scale,
  Search,
  ChevronRight,
  ChevronLeft,
  FileText,
  Table,
  Printer
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PrintCustomerStatement } from "../components/reports/CustomerStatementPrint";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from '../lib/format';
import { exportStatementToExcel, exportStatementToPdf } from '../services/customer-statement-export.service';
import { CustomerStatementTable } from "../components/CustomerStatementTable";
import { useCustomerStatements } from "../hooks/useCustomerStatements";

const formatRtn = (v: string): string => {
  const d = v?.replace(/\D/g, '').slice(0, 16) || '';
  if (d.length > 8) return d.slice(0, 4) + '-' + d.slice(4, 8) + '-' + d.slice(8);
  if (d.length > 4) return d.slice(0, 4) + '-' + d.slice(4);
  return d || '-';
};

export const CustomerStatements = () => {
  const {
    selectedStore, user, today,
    startDate, setStartDate, endDate, setEndDate,
    customers, selectedCustomer, statement,
    loading, loadingStatement, view, setView,
    fetchActiveCustomers, fetchStatement,
  } = useCustomerStatements();

  const exportToExcel = async () => {
    await exportStatementToExcel({
      selectedCustomer,
      selectedStore,
      statement,
      startDate,
      endDate,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdfExport = async () => {
    await exportStatementToPdf({
      selectedCustomer,
      selectedStore,
      statement,
      startDate,
      endDate,
    });
  };

  const renderContent = () => {
    if (view === 'detail' && selectedCustomer) {
      const showDetails = selectedStore?.showDetailsInStatement !== false;
      const totalCredit = statement.reduce((acc, c) => acc + c.charge, 0);
      const totalPayments = statement.reduce((acc, c) => acc + c.payment, 0);
      const balance = statement.length > 0 ? (statement[statement.length - 1]?.balance || 0) : 0;

      return (
        <div className="flex flex-col h-full gap-3 p-1">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('list')}
                className="h-8 w-8 rounded-full"
                title="Volver a la lista"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {selectedCustomer.customerName}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-medium">Cuenta: {selectedCustomer.customerNo}</span>
                  <span className="text-border">·</span>
                  <span className="font-mono text-[11px]">RTN: {formatRtn(selectedCustomer.rtn)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={exportToExcel} title="Descargar Excel">
                <Table className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handlePdfExport} title="Descargar PDF">
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 shrink-0">
            {loadingStatement ? (
              [1,2,3,4].map(i => (
                <Card key={i} className="h-20 flex items-center px-5">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-2.5 w-12" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </Card>
              ))
            ) : (
              <>
                <Card className="py-3 px-5 flex flex-col justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Documentos</span>
                  <span className="text-xl font-bold tabular-nums">{statement.length}</span>
                </Card>
                <Card className="py-3 px-5 flex flex-col justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Cargos</span>
                  <span className="text-xl font-bold tabular-nums text-emerald-600">{formatCurrency(totalCredit)}</span>
                </Card>
                <Card className="py-3 px-5 flex flex-col justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Abonos</span>
                  <span className="text-xl font-bold tabular-nums text-amber-600">{formatCurrency(totalPayments)}</span>
                </Card>
                <Card className="py-3 px-5 flex flex-col justify-center bg-primary text-primary-foreground">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Saldo</span>
                  <span className="text-xl font-bold tabular-nums">{formatCurrency(balance)}</span>
                </Card>
              </>
            )}
          </div>

          <Card id="statement-table-container" className="flex-1 min-h-0 border-0 shadow-none">
            <CustomerStatementTable
              statements={statement}
              loading={loadingStatement}
              showDetails={showDetails}
              formatCurrency={formatCurrency}
            />
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full gap-3 p-1">
        <div className="flex items-end justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Estado de Cuenta</h1>
              <p className="text-xs text-muted-foreground">Consulta de saldos por cliente</p>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground block">Desde</label>
              <Input type="date" className="h-8 w-[150px] text-xs" value={startDate} max={today} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground block">Hasta</label>
              <Input type="date" className="h-8 w-[150px] text-xs" value={endDate} max={today} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={fetchActiveCustomers} disabled={loading} size="sm" className="h-8 gap-1.5">
              <Search className="h-3.5 w-3.5" /> Buscar
            </Button>
          </div>
        </div>

        <Card className="flex-1 min-h-0 border shadow-sm">
          <div className="overflow-auto h-full rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-card z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9 shadow-[0_1px_0_0] shadow-border">
                  <th className="px-5 text-left w-[140px]">Cuenta</th>
                  <th className="px-5 text-left w-[170px]">RTN</th>
                  <th className="px-5 text-left">Nombre</th>
                  <th className="px-5 text-right w-[190px] text-emerald-600">Crédito</th>
                  <th className="px-5 text-right w-[170px] text-amber-600">N. Crédito</th>
                  <th className="px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {customers.map((customer) => (
                  <tr
                    key={customer.customerNo}
                    className="hover:bg-muted/50 cursor-pointer h-11 transition-colors"
                    onClick={() => fetchStatement(customer)}
                  >
                    <td className="px-5 font-mono text-xs font-semibold">{customer.customerNo}</td>
                    <td className="px-5 font-mono text-xs text-muted-foreground">{formatRtn(customer.rtn)}</td>
                    <td className="px-5 text-sm font-medium">{customer.customerName}</td>
                    <td className="px-5 text-right font-mono text-base font-bold text-emerald-600 tabular-nums">{formatCurrency(customer.totalCredit)}</td>
                    <td className="px-5 text-right font-mono text-base font-bold text-amber-600 tabular-nums">{formatCurrency(customer.totalNC)}</td>
                    <td className="px-3 text-center text-muted-foreground/40"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="sticky bottom-0 bg-muted/80 backdrop-blur-sm h-9 text-[11px] font-semibold border-t">
                  <td colSpan={3} className="px-5 text-right text-muted-foreground">Totales</td>
                  <td className="px-5 text-right font-mono text-base font-bold text-emerald-600 tabular-nums">{formatCurrency(customers.reduce((acc, c) => acc + (Number(c.totalCredit) || 0), 0))}</td>
                  <td className="px-5 text-right font-mono text-base font-bold text-amber-600 tabular-nums">{formatCurrency(customers.reduce((acc, c) => acc + (Number(c.totalNC) || 0), 0))}</td>
                  <td className="px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="print:hidden h-full">
        {renderContent()}
      </div>

      <div className="hidden print:block w-full">
        {view === 'detail' && selectedCustomer && (
          <PrintCustomerStatement
            customer={selectedCustomer}
            statement={statement}
            store={selectedStore}
            user={user}
            dateRange={{ start: startDate, end: endDate }}
          />
        )}
      </div>
    </>
  );
};
