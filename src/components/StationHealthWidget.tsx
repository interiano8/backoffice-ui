import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Radio,
  RefreshCw,
  Server,
  Zap,
  Clock,
  HardDrive,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { telemetryService, TelemetrySummaryResponse } from '../services/telemetry.service';
import { useAuthStore } from '../store/useAuthStore';

export const StationHealthWidget: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<TelemetrySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await telemetryService.getStatuses();
      setData(res);
    } catch {
      // Manejo silencioso en el polling de telemetría para no saturar la UI
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 30000); // Latido cada 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchStatus]);

  if (!isAuthenticated || !data) {
    return null;
  }

  const { online, degraded, offline, total, stations } = data;

  const isAllHealthy = offline === 0 && degraded === 0;
  const hasOffline = offline > 0;

  const formatLastPing = (seconds: number) => {
    if (seconds < 0) return 'Sin conexión registrada';
    if (seconds < 60) return `Hace ${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    return `Hace ${hours}h`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-2.5 text-xs font-semibold gap-1.5 transition-all border ${
            hasOffline
              ? 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : !isAllHealthy
              ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
          }`}
          title="Monitoreo de Salud Operativa de Estaciones POS"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasOffline ? 'bg-rose-400' : !isAllHealthy ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                hasOffline ? 'bg-rose-500' : !isAllHealthy ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <Radio className="h-3.5 w-3.5 ml-0.5" />
          <span className="hidden md:inline">
            {online}/{total} Online
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-88 sm:w-96 p-0 shadow-2xl border-border/60" align="end">
        {/* Encabezado */}
        <div className="p-3 border-b border-border/40 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <h4 className="text-xs font-bold leading-none">Salud de Estaciones POS</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Telemetría en tiempo real de la red
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Resumen Semáforo */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/10 border-b border-border/30 text-center">
          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{online}</span>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Online</p>
          </div>
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{degraded}</span>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Degradada</p>
          </div>
          <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{offline}</span>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Offline</p>
          </div>
        </div>

        {/* Lista de estaciones */}
        <div className="max-h-72 overflow-y-auto divide-y divide-border/20 p-1">
          {stations.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No hay estaciones registradas.
            </div>
          ) : (
            stations.map((st) => (
              <div key={st.storeCode} className="p-2.5 hover:bg-muted/30 rounded-md transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">
                      {st.storeName}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ({st.storeCode})
                    </span>
                  </div>

                  {st.status === 'ONLINE' && (
                    <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/40 text-emerald-600 bg-emerald-500/10 font-bold">
                      ONLINE
                    </Badge>
                  )}
                  {st.status === 'DEGRADED' && (
                    <Badge variant="outline" className="text-[10px] py-0 border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold">
                      DEGRADADA
                    </Badge>
                  )}
                  {st.status === 'OFFLINE' && (
                    <Badge variant="outline" className="text-[10px] py-0 border-rose-500/40 text-rose-600 bg-rose-500/10 font-bold">
                      OFFLINE
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className={`h-3 w-3 ${st.fusionStatus === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <span>Fusion: {st.fusionStatus === 'ONLINE' ? 'Activo' : st.fusionStatus === 'OFFLINE' ? 'Caído' : 'N/D'}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end font-mono">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{formatLastPing(st.secondsSinceLastPing)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    <span>Sync pend: <strong className={st.pendingSyncCount > 50 ? 'text-amber-500' : 'text-foreground'}>{st.pendingSyncCount}</strong></span>
                  </div>
                  {st.posVersion && (
                    <div className="text-right truncate font-mono text-[10px]">
                      v{st.posVersion}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
