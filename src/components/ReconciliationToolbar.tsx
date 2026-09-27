import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Package, RefreshCw, Filter, Printer, Loader2, Search, ShieldAlert } from 'lucide-react';
import { CardTitle } from "@/components/ui/card";
import type { Shift } from "@/types/api";

interface Props {
  shifts: Shift[];
  filteredCount: number;
  isLoadingUnified: boolean;
  isLoadingProducts: boolean;
  isLoadingFusion: boolean;
  isBatchPrinting: boolean;
  syncingDate: boolean;
  autoSyncRunning: boolean;
  searchCriteria: string;
  searchQuery: string;
  selectedShiftNo: string;
  onFetchUnifiedPayments: () => void;
  onFetchUnifiedProducts: () => void;
  onSyncByDate: () => void;
  onFetchFusionDetails: () => void;
  onBatchPrint: () => void;
  onOpenFiscalAudit?: () => void;
  onSearchCriteriaChange: (v: string) => void;
  onSearchQueryChange: (v: string) => void;
  onSelectedShiftNoChange: (v: string) => void;
}

const btnClass = "h-9 text-xs font-semibold gap-1.5 transition-all duration-200 active:scale-[0.97] shadow-sm";

export function ReconciliationToolbar({
  shifts, filteredCount, isLoadingUnified, isLoadingProducts, isLoadingFusion,
  isBatchPrinting, syncingDate, autoSyncRunning, searchCriteria, searchQuery, selectedShiftNo,
  onFetchUnifiedPayments, onFetchUnifiedProducts, onSyncByDate, onFetchFusionDetails, onBatchPrint,
  onOpenFiscalAudit,
  onSearchCriteriaChange, onSearchQueryChange, onSelectedShiftNoChange,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <CardTitle className="text-xl font-bold whitespace-nowrap">Turnos</CardTitle>
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md font-mono border">
          {filteredCount} mostrados
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto overflow-x-auto pb-1 scrollbar-hide">
        {/* Pagos */}
        <Button variant="outline" size="sm" className={`${btnClass} border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/50 dark:text-emerald-400`}
          onClick={onFetchUnifiedPayments} disabled={isLoadingUnified}>
          {isLoadingUnified ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
          Pagos
        </Button>

        {/* Productos */}
        <Button variant="outline" size="sm" className={`${btnClass} border-violet-500/30 text-violet-600 hover:bg-violet-500/10 hover:border-violet-500/50 dark:text-violet-400`}
          onClick={onFetchUnifiedProducts} disabled={isLoadingProducts}>
          {isLoadingProducts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
          Productos
        </Button>

        {/* CTRL */}
        <Button variant="outline" size="sm" className={`${btnClass} border-sky-500/30 text-sky-600 hover:bg-sky-500/10 hover:border-sky-500/50 dark:text-sky-400`}
          onClick={onFetchFusionDetails} disabled={isLoadingFusion}>
          {isLoadingFusion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />}
          CTRL
        </Button>

        {/* Auditoría SAR */}
        {onOpenFiscalAudit && (
          <Button variant="outline" size="sm" className={`${btnClass} border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50 dark:text-amber-400`}
            onClick={onOpenFiscalAudit} title="Auditoría de correlativos y saltos fiscales SAR">
            <ShieldAlert className="h-3.5 w-3.5" />
            Auditoría SAR
          </Button>
        )}

        {/* Sync */}
        <Button variant="outline" size="sm" className={`${btnClass} border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50 dark:text-amber-400`}
          onClick={onSyncByDate} disabled={syncingDate || autoSyncRunning} title={autoSyncRunning ? 'Sincronización automática en curso' : undefined}>
          {syncingDate ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> <span>Sincronizando...</span></>
            : autoSyncRunning ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> <span>Auto-sync activo</span></>
            : <><RefreshCw className="h-3.5 w-3.5" /> <span>Sincronizar</span></>}
        </Button>

        {/* Batch Print */}
        <Button variant="outline" size="sm" className={`${btnClass} border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/50 dark:text-rose-400`}
          onClick={onBatchPrint} disabled={isBatchPrinting || filteredCount === 0}>
          {isBatchPrinting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
          Imprimir
        </Button>

        <div className="w-px h-7 bg-border/50 mx-1" />

        {/* Buscador */}
        <div className="flex items-center rounded-lg border text-sm focus-within:ring-1 focus-within:ring-ring overflow-hidden shadow-sm">
          <Select value={searchCriteria} onValueChange={onSearchCriteriaChange}>
            <SelectTrigger className="w-[90px] h-8 border-0 rounded-none bg-muted/30 text-[10px] font-medium focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuario</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
              <SelectItem value="shift"># Turno</SelectItem>
              <SelectItem value="fusion">CTRL</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder={searchCriteria === 'user' ? "Buscar usuario..." : searchCriteria === 'pos' ? "Buscar POS..." : searchCriteria === 'shift' ? "Buscar # turno..." : "Buscar ID CTRL..."}
              className="pl-8 h-8 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 w-[130px] text-xs"
              value={searchQuery} onChange={e => onSearchQueryChange(e.target.value)} />
          </div>
        </div>

        {/* Selector de Turno */}
        <Select value={selectedShiftNo} onValueChange={onSelectedShiftNoChange}>
          <SelectTrigger className="w-[120px] h-8 text-xs shadow-sm">
            <SelectValue placeholder="Turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Turnos</SelectItem>
            {Array.from(new Set(shifts.map(s => s.shiftNo))).sort((a, b) => parseInt(a) - parseInt(b)).map(no => (
              <SelectItem key={no} value={no}>Turno {no}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
