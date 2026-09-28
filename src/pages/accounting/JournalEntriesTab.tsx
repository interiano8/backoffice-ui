import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  accountingService,
  JournalEntryItem,
  AccountItem,
  CostCenterItem,
} from '../../services/accounting.service';

interface FormLine {
  accountId: string;
  costCenterId?: string;
  debit: number;
  credit: number;
  description?: string;
}

export const JournalEntriesTab: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [costCenterFilter, setCostCenterFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Entry for Detail View Modal
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Void Modal
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  // Create Manual Entry Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newEntryType, setNewEntryType] = useState('DIARY');
  const [newEntryConcept, setNewEntryConcept] = useState('');
  const [newEntryRef, setNewEntryRef] = useState('');
  const [newEntryNotes, setNewEntryNotes] = useState('');
  const [lines, setLines] = useState<FormLine[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, accs, ccs] = await Promise.all([
        accountingService.getJournalEntries({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          costCenterId: costCenterFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search.trim() || undefined,
          page,
          limit: 15,
        }),
        accountingService.getAccounts({ allowsMovement: true }),
        accountingService.getCostCenters(true),
      ]);

      setEntries(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
      setAccounts(accs);
      setCostCenters(ccs);
    } catch (err: any) {
      toast.error('Error cargando pólizas contables: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter, costCenterFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleApprove = async (id: string) => {
    try {
      await accountingService.approveJournalEntry(id);
      toast.success('Póliza contable aprobada y posteada en libros');
      if (selectedEntry && selectedEntry.id === id) {
        setDetailModalOpen(false);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al aprobar póliza');
    }
  };

  const openVoidDialog = (id: string) => {
    setVoidingId(id);
    setVoidReason('');
    setVoidModalOpen(true);
  };

  const handleVoidSubmit = async () => {
    if (!voidingId || !voidReason.trim()) {
      toast.error('Debe especificar un motivo válido de anulación');
      return;
    }

    setVoiding(true);
    try {
      const res = await accountingService.voidJournalEntry(voidingId, voidReason.trim());
      toast.success(`Póliza anulada con éxito. Se generó la contracuenta reversa #${res.reversal.entryNumber}`);
      setVoidModalOpen(false);
      if (selectedEntry && selectedEntry.id === voidingId) {
        setDetailModalOpen(false);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al anular póliza');
    } finally {
      setVoiding(false);
    }
  };

  // Manual Entry Form Line Handlers
  const addLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error('Una partida contable debe tener al menos 2 líneas');
      return;
    }
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, field: keyof FormLine, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.005 && totalDebit > 0;

  const handleCreateManualEntry = async () => {
    if (!newEntryConcept.trim()) {
      toast.error('El concepto o glosa de la póliza es obligatorio');
      return;
    }

    if (!isBalanced) {
      toast.error('Principio de partida doble incumplido: Total Debe debe ser igual a Total Haber');
      return;
    }

    const invalidLine = lines.find((l) => !l.accountId || (Number(l.debit) === 0 && Number(l.credit) === 0));
    if (invalidLine) {
      toast.error('Todas las líneas deben tener cuenta asignada y un monto en Debe o Haber');
      return;
    }

    setCreating(true);
    try {
      await accountingService.createJournalEntry({
        date: newEntryDate,
        type: newEntryType,
        concept: newEntryConcept.trim(),
        sourceRef: newEntryRef.trim() || undefined,
        notes: newEntryNotes.trim() || undefined,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          costCenterId: l.costCenterId || undefined,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description?.trim() || undefined,
        })),
      });

      toast.success('Póliza manual creada exitosamente (guardada como Borrador)');
      setCreateModalOpen(false);
      resetManualForm();
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al crear póliza');
    } finally {
      setCreating(false);
    }
  };

  const resetManualForm = () => {
    setNewEntryDate(new Date().toISOString().slice(0, 10));
    setNewEntryType('DIARY');
    setNewEntryConcept('');
    setNewEntryRef('');
    setNewEntryNotes('');
    setLines([
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Borrador
          </Badge>
        );
      case 'POSTED':
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Aprobada / Posteada
          </Badge>
        );
      case 'VOIDED':
        return (
          <Badge variant="outline" className="border-rose-500/40 text-rose-500 bg-rose-500/10 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Anulada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DIARY':
        return <Badge variant="secondary" className="text-xs">Diario</Badge>;
      case 'INCOME':
        return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 text-xs">Ingreso</Badge>;
      case 'EXPENSE':
        return <Badge variant="secondary" className="bg-rose-500/15 text-rose-600 text-xs">Egreso</Badge>;
      case 'REVERSAL':
        return <Badge variant="secondary" className="bg-purple-500/15 text-purple-600 text-xs">Reversión</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 bg-card/60 border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Libro Diario & Pólizas Contables
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bandeja de revisión del contador: aprueba pólizas generadas por turnos/ventas y elabora partidas manuales con partida doble.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={() => {
                resetManualForm();
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Póliza Manual
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-6 border-t border-border/40 pt-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="DRAFT">⏳ Borrador (Pendiente Aprobación)</option>
              <option value="POSTED">✓ Posteada / Aprobada</option>
              <option value="VOIDED">✕ Anulada</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Tipo de Póliza
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="DIARY">Diario</option>
              <option value="INCOME">Ingreso (Cobro)</option>
              <option value="EXPENSE">Egreso (Gasto)</option>
              <option value="REVERSAL">Reversión (Anulación)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Centro de Costo
            </label>
            <select
              value={costCenterFilter}
              onChange={(e) => {
                setCostCenterFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos los Centros</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Desde
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
              Hasta
            </label>
            <div className="flex gap-1">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs font-mono flex-1"
              />
              <Button size="sm" variant="secondary" onClick={() => { setPage(1); loadData(); }} className="h-8 px-2 text-xs">
                Filtrar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Entries Table */}
      <Card className="p-6 bg-card/60 border-border/60">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por concepto o # póliza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {totalCount} pólizas encontradas (Página {page} de {totalPages || 1})
          </span>
        </form>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Cargando pólizas contables...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-lg border-border/60">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron pólizas contables</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajusta los filtros de búsqueda o crea una póliza contable manual.
            </p>
          </div>
        ) : (
          <div className="border border-border/40 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="py-3 px-4"># Póliza</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Concepto / Glosa</th>
                  <th className="py-3 px-4 text-right">Total Débito</th>
                  <th className="py-3 px-4 text-right">Total Crédito</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      #{entry.entryNumber.toString().padStart(6, '0')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('es-HN')}
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(entry.type)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground line-clamp-1">{entry.concept}</span>
                        {entry.sourceRef && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Ref: {entry.sourceRef}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                      L {Number(entry.totalDebit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                      L {Number(entry.totalCredit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(entry.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setDetailModalOpen(true);
                          }}
                          title="Ver detalle de póliza"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {entry.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => handleApprove(entry.id)}
                            title="Aprobar póliza"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}

                        {entry.status === 'POSTED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                            onClick={() => openVoidDialog(entry.id)}
                            title="Anular póliza (genera contracuenta reversa)"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 px-3"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 px-3"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Detalle de Póliza */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl bg-card border-border">
          {selectedEntry && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 font-mono text-lg font-bold">
                    <FileText className="w-5 h-5 text-primary" />
                    Póliza Contable #{selectedEntry.entryNumber.toString().padStart(6, '0')}
                  </DialogTitle>
                  {getStatusBadge(selectedEntry.status)}
                </div>
              </DialogHeader>

              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-lg border border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block">Fecha:</span>
                  <span className="font-mono font-bold text-foreground">
                    {new Date(selectedEntry.date).toLocaleDateString('es-HN')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Tipo:</span>
                  <span className="font-bold text-foreground">{selectedEntry.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Referencia:</span>
                  <span className="font-mono text-foreground">{selectedEntry.sourceRef || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Aprobado en:</span>
                  <span className="font-mono text-foreground">
                    {selectedEntry.approvedAt ? new Date(selectedEntry.approvedAt).toLocaleDateString('es-HN') : 'Pendiente'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-4 mt-1">
                  <span className="text-muted-foreground block">Concepto / Glosa:</span>
                  <p className="text-sm font-medium text-foreground">{selectedEntry.concept}</p>
                </div>
              </div>

              {/* Lines Table */}
              <div className="border border-border/40 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="py-2.5 px-3">Cuenta Contable</th>
                      <th className="py-2.5 px-3">Centro de Costo</th>
                      <th className="py-2.5 px-3 text-right">Debe</th>
                      <th className="py-2.5 px-3 text-right">Haber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {selectedEntry.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-primary mr-2">
                            {line.account?.code}
                          </span>
                          <span className="text-foreground">{line.account?.name}</span>
                          {line.description && (
                            <span className="block text-[11px] text-muted-foreground italic">
                              {line.description}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {line.costCenter ? `${line.costCenter.code} - ${line.costCenter.name}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                          {Number(line.debit) > 0
                            ? `L ${Number(line.debit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                          {Number(line.credit) > 0
                            ? `L ${Number(line.credit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t border-border/60 font-mono font-bold text-xs">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-right uppercase">
                        Totales Cuadrados:
                      </td>
                      <td className="py-2.5 px-3 text-right text-foreground">
                        L {Number(selectedEntry.totalDebit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-foreground">
                        L {Number(selectedEntry.totalCredit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Cerrar
                </Button>
                {selectedEntry.status === 'DRAFT' && (
                  <Button
                    onClick={() => handleApprove(selectedEntry.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprobar y Postear Póliza
                  </Button>
                )}
                {selectedEntry.status === 'POSTED' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      openVoidDialog(selectedEntry.id);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Anular Póliza
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Anular Póliza */}
      <Dialog open={voidModalOpen} onOpenChange={setVoidModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Anular Póliza Contable
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Por principios contables y trazabilidad de auditoría, las pólizas posteadas no se borran de la base de datos.
              Al anularla, el sistema generará de forma automática una <strong className="text-foreground">póliza de contracuenta de reversión idéntica e invertida</strong> que neutralizará los saldos contables.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Motivo / Justificación de la Anulación *
              </label>
              <Input
                placeholder="Ej: Registro duplicado, error en factura física #123..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoidModalOpen(false)} disabled={voiding}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleVoidSubmit} disabled={voiding}>
              {voiding ? 'Anulando...' : 'Confirmar Anulación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Póliza Manual */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Plus className="w-5 h-5 text-primary" />
              Elaborar Póliza Contable Manual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Cabecera */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Fecha Contable
                </label>
                <Input
                  type="date"
                  value={newEntryDate}
                  onChange={(e) => setNewEntryDate(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Tipo de Asiento
                </label>
                <select
                  value={newEntryType}
                  onChange={(e) => setNewEntryType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="DIARY">Diario (Ajustes / Depreciaciones)</option>
                  <option value="INCOME">Ingreso (Cobros / Entradas)</option>
                  <option value="EXPENSE">Egreso (Pagos / Gastos)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Referencia / Doc Fuente
                </label>
                <Input
                  placeholder="Ej: Factura 001-002, Cheque 449..."
                  value={newEntryRef}
                  onChange={(e) => setNewEntryRef(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Concepto / Glosa General *
              </label>
              <Input
                placeholder="Descripción detallada de la transacción..."
                value={newEntryConcept}
                onChange={(e) => setNewEntryConcept(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Line Items Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Partidas / Líneas del Asiento
                </span>
                <Button size="sm" variant="outline" onClick={addLine} className="h-7 text-xs flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Línea
                </Button>
              </div>

              <div className="border border-border/40 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="py-2 px-3 w-[40%]">Cuenta Contable</th>
                      <th className="py-2 px-3 w-[25%]">Centro de Costo</th>
                      <th className="py-2 px-3 w-[15%] text-right">Debe</th>
                      <th className="py-2 px-3 w-[15%] text-right">Haber</th>
                      <th className="py-2 px-2 w-[5%] text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="py-2 px-3">
                          <select
                            value={line.accountId}
                            onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                            className="w-full h-8 rounded border border-input bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">-- Seleccione Cuenta --</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={line.costCenterId || ''}
                            onChange={(e) => updateLine(idx, 'costCenterId', e.target.value || undefined)}
                            className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">(Sin Centro / Global)</option>
                            {costCenters.map((cc) => (
                              <option key={cc.id} value={cc.id}>
                                {cc.code} - {cc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-8 text-right font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-8 text-right font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={lines.length <= 2}
                            onClick={() => removeLine(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totales & Partida Doble Indicator */}
                  <tfoot className="bg-muted/50 border-t border-border/60 font-mono text-xs">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-right font-bold uppercase">
                        Sumas Iguales:
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        L {totalDebit.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        L {totalCredit.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between mt-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">Estado de Cuadratura:</span>
                  {isBalanced ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10">
                      ✓ Partida Cuadrada (Diferencia: L 0.00)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-500 bg-rose-500/10">
                      ✕ Descuadrada: Diferencia de L {difference.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {lines.length} movimientos
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateManualEntry}
              disabled={creating || !isBalanced}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {creating ? 'Guardando...' : 'Crear Póliza Contable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
