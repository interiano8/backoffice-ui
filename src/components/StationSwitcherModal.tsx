import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Store } from '../types/api';
import { Button } from '@/components/ui/button';
import {
    LayoutGrid,
    X,
    ExternalLink,
    Wifi,
    Globe,
    MapPin,
    Building2,
    Search,
    ShieldCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Utilidad para derivar la URL del FRONTEND desde la URL de la API ─────────
const resolveStationUrl = (store: Store): { cloudUrl: string | null; lanUrl: string | null } => {
    // Cloud: reemplaza api-xxx o api.xxx → app-xxx o app.xxx
    const cloudUrl = store.apiUrl
        ? store.apiUrl
            .replace('://api-', '://app-')
            .replace('://api.', '://app.')
        : null;

    // LAN: si el usuario llenó lanFrontUrl úsala, si no, intenta derivar de lanUrl
    // (solo funciona si el patrón de puertos es consistente, ej: API=3001 UI=8081)
    const lanUrl = store.lanFrontUrl || null;

    return { cloudUrl, lanUrl };
};



const StoreCard = ({ store, onNavigate }: { store: Store; onNavigate: (url: string) => void }) => {
    const { cloudUrl, lanUrl } = resolveStationUrl(store);

    const handleCloud = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (cloudUrl) onNavigate(cloudUrl);
    };

    const handleLan = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lanUrl) onNavigate(lanUrl);
    };

    return (
        <div className={cn(
            "group relative flex flex-col gap-3 p-4 rounded-xl border border-border/60",
            "bg-card hover:bg-primary/5 hover:border-primary/40",
            "transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-primary/10"
        )}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center overflow-hidden shrink-0">
                    {store.logoUrl ? (
                        <img src={store.logoUrl} className="h-full w-full object-contain" alt="Logo" />
                    ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground/60" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate leading-tight">
                        {store.titulo || store.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{store.code}</p>
                    {store.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            <p className="text-[11px] text-muted-foreground/70 truncate">{store.address}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2">
                {cloudUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Globe className="h-3 w-3" /> WEB
                    </span>
                )}
                {lanUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Wifi className="h-3 w-3" /> LAN
                    </span>
                )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
                {cloudUrl && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        onClick={handleCloud}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        WEB
                        <ExternalLink className="h-3 w-3 opacity-60" />
                    </Button>
                )}
                {lanUrl && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                        onClick={handleLan}
                    >
                        <Wifi className="h-3.5 w-3.5" />
                        LAN
                        <ExternalLink className="h-3 w-3 opacity-60" />
                    </Button>
                )}
                {!cloudUrl && !lanUrl && (
                    <p className="text-xs text-muted-foreground/50 text-center w-full py-1">
                        Sin URL configurada
                    </p>
                )}
            </div>
        </div>
    );
};

// ─── Componente Principal: Modal ──────────────────────────────────────────────
export const StationSwitcherModal = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
    const { stores, getStores } = useAppStore();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOpen = async () => {
        setOpen(true);
        setLoading(true);
        await getStores();
        setLoading(false);
    };

    const handleNavigate = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const activeStores = stores.filter(s =>
        s.isActive !== false &&
        (s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.code?.toLowerCase().includes(search.toLowerCase()) ||
            s.address?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            {/* ── Botón en el sidebar ── */}
            <Button
                variant="ghost"
                onClick={handleOpen}
                title="Estaciones"
                className={cn(
                    "w-full transition-all duration-200 group h-10",
                    "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                    sidebarOpen ? "justify-start" : "justify-center px-0"
                )}
            >
                <LayoutGrid className={cn(
                    "h-5 w-5 min-w-[20px] transition-transform group-hover:scale-110",
                    sidebarOpen && "mr-3"
                )} />
                {sidebarOpen && <span className="font-medium">Estaciones</span>}
            </Button>

            {/* ── Overlay + Modal ── */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className={cn(
                            "relative w-full max-w-2xl max-h-[85vh] flex flex-col",
                            "bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/40",
                            "animate-in zoom-in-95 fade-in-0 duration-200"
                        )}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <LayoutGrid className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base text-foreground leading-tight">Estaciones</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {activeStores.length} sucursal{activeStores.length !== 1 ? 'es' : ''} activa{activeStores.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setOpen(false)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Búsqueda */}
                        <div className="p-4 border-b border-border/40">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                    placeholder="Buscar estación..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 h-9 bg-muted/30 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/40"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-muted-foreground">
                                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                                    Cargando estaciones...
                                </div>
                            ) : activeStores.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                    <ShieldCheck className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">No se encontraron estaciones</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeStores.map(store => (
                                        <StoreCard
                                            key={store.id}
                                            store={store}
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-border/40 bg-muted/10 rounded-b-2xl">
                            <p className="text-[11px] text-muted-foreground/60 text-center">
                                Las URLs se derivan automáticamente de <code className="text-primary/70">apiUrl</code> del registro.
                                Para acceso LAN configura <code className="text-primary/70">lanFrontUrl</code> en la tabla BoStore.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
