import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  ServerOff, 
  ExternalLink, 
  Settings, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getRecentAlerts, 
  RecentAlertsResponse 
} from '../services/alerts.service';

export const AlertsBell: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RecentAlertsResponse>({
    total: 0,
    criticalCount: 0,
    warningCount: 0,
    alerts: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getRecentAlerts();
      setData(res);
    } catch {
      // Silenciar errores de conexión
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Polling cada 60s
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNavigate = (link: string) => {
    setIsOpen(false);
    navigate(link);
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (type === 'FISCAL_GAP') {
      return <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />;
    }
    if (type === 'OFFLINE_STORE') {
      return <ServerOff className="h-4 w-4 text-amber-500 shrink-0" />;
    }
    return <AlertTriangle className={`h-4 w-4 shrink-0 ${severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-lg hover:bg-muted/40 transition-colors"
        title="Alertas operacionales"
        aria-label="Alertas operacionales"
      >
        <Bell className="h-4 w-4 text-foreground/80" />
        {data.total > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
              data.criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-amber-500'
            }`}
          >
            {data.total > 9 ? '9+' : data.total}
          </span>
        )}
      </Button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-card border border-border/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3 px-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Alertas e Incidentes</span>
              {data.total > 0 ? (
                <Badge variant={data.criticalCount > 0 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                  {data.total} activo{data.total > 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-green-600 border-green-600/30 bg-green-500/10">
                  Todo al día
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchAlerts}
                disabled={loading}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Actualizar"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigate('/alertas')}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Configuración de Alertas"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Lista de Alertas */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {data.alerts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground space-y-2">
                <Check className="h-8 w-8 text-green-500 mx-auto opacity-80" />
                <p className="text-xs font-medium">No hay incidentes operativos pendientes</p>
                <p className="text-[11px] text-muted-foreground/80">
                  La red de estaciones opera con normalidad y los turnos cuadran con el arqueo.
                </p>
              </div>
            ) : (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleNavigate(alert.link)}
                  className="p-3 hover:bg-muted/40 transition-colors cursor-pointer flex gap-3 items-start group"
                >
                  <div className="mt-0.5">{getAlertIcon(alert.type, alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                        {alert.title}
                      </p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {alert.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 block font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Tienda {alert.storeCode}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 px-3 border-t border-border/40 bg-muted/10 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate('/alertas')}
              className="w-full text-xs text-muted-foreground hover:text-primary h-7"
            >
              Administrar Reglas y Destinatarios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
