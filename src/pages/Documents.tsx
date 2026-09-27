import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    FileText, 
    Search, 
    Calendar as CalendarIcon,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useDocStore } from '@/store/useDocStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { TransactionCard } from '@/components/TransactionCard';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton"
import { getPosCodes, getUsers, getShiftCount } from '@/services/doc.service';

const Documents: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { getDocuments } = useDocStore();
    const { selectedStore, getAvailableDates, availableDates } = useAppStore();
    const [docs, setDocs] = useState<any[]>([]);
    const [totalDocs, setTotalDocs] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [posCodes, setPosCodes] = useState<string[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [shiftCount, setShiftCount] = useState(0);

    // Cargar listas de POS, Cajeros y Turnos
    useEffect(() => {
        if (selectedStore) {
            getPosCodes().then(setPosCodes).catch(() => {});
            getUsers().then(setUsers).catch(() => {});
            getShiftCount().then(setShiftCount).catch(() => {});
        }
    }, [selectedStore]);

    // Filters state
    const [filters, setFilters] = useState({
        startDate: new Date().toLocaleDateString('en-CA'),
        endDate: new Date().toLocaleDateString('en-CA'),
        shiftId: '',
        docNo: '',
        customerName: '',
        staff: '',
        posTerminal: '',
        docType: 'all',
        page: 1
    });

    // Cargar fechas disponibles y setear la última por defecto
    useEffect(() => {
        const init = async () => {
            if (selectedStore) {
                await getAvailableDates();
            }
        };
        init();
    }, [selectedStore, getAvailableDates]);

    // Cuando availableDates cambie y tenga datos, o cuando hay URL params, actualizar los filtros
    useEffect(() => {
        const startDateParam = searchParams.get('startDate') || searchParams.get('shiftDate');
        const endDateParam = searchParams.get('endDate') || searchParams.get('shiftDate');
        const shiftNo = searchParams.get('shiftNo');
        const staff = searchParams.get('staff');
        const docType = searchParams.get('docType');

        if (startDateParam || endDateParam || shiftNo || staff || docType) {
            const apiFilters: Record<string, any> = {};
            if (startDateParam) { apiFilters.startDate = startDateParam; apiFilters.endDate = endDateParam || startDateParam; setFilters(prev => ({ ...prev, startDate: startDateParam, endDate: endDateParam || startDateParam })); }
            if (shiftNo) { apiFilters.shiftId = shiftNo; setFilters(prev => ({ ...prev, shiftId: shiftNo })); }
            if (staff) { apiFilters.staff = staff; setFilters(prev => ({ ...prev, staff })); }
            if (docType && docType !== 'all') { apiFilters.docType = docType; setFilters(prev => ({ ...prev, docType })); }
            else setFilters(prev => ({ ...prev, docType: 'all' }));
            
            setHasSearched(true);
            setIsRefreshing(true);
            (async () => {
                try {
                    const res = await getDocuments(apiFilters);
                    if (res && res.data) { setDocs(res.data); setTotalDocs(res.total || 0); }
                    else { setDocs(res as any || []); setTotalDocs((res as any)?.length || 0); }
                } catch (error) {
                    console.error('Error fetching documents:', error);
                    toast.error('Error al cargar documentos');
                } finally { setIsRefreshing(false); }
            })();
        } else if (availableDates && availableDates.length > 0) {
            const latestDate = availableDates[0];
            setFilters(prev => ({
                ...prev,
                startDate: latestDate,
                endDate: latestDate
            }));
        }
    }, [searchParams, availableDates, getDocuments]);

    const fetchDocs = useCallback(async (isManual = false, overrideFilters?: any) => {
        if (isManual) setIsRefreshing(true);
        else setLoading(true);

        try {
            setHasSearched(true);
            const apiFilters: any = { ...filters, ...overrideFilters };
            if (apiFilters.docType === 'all') delete apiFilters.docType;
            if (apiFilters.docNo) {
                delete apiFilters.startDate;
                delete apiFilters.endDate;
            }
            
            const res = await getDocuments(apiFilters);
            // Si la API devuelve el nuevo formato { data, total }
            if (res && res.data) {
                setDocs(res.data);
                setTotalDocs(res.total || 0);
            } else {
                setDocs(res as any || []);
                setTotalDocs((res as any)?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Error al cargar documentos');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [getDocuments, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        const latestDate = (availableDates && availableDates.length > 0) 
            ? availableDates[0] 
            : new Date().toLocaleDateString('en-CA');

        setFilters({
            startDate: latestDate,
            endDate: latestDate,
            shiftId: '',
            docNo: '',
            customerName: '',
            staff: '',
            posTerminal: '',
            docType: 'all',
            page: 1
        });
        setHasSearched(false);
        setDocs([]);
        setTotalDocs(0);
    };

    const docTypes = [
        { id: 'all', label: 'Todos los tipos' },
        { id: '1', label: 'Factura Contado' },
        { id: '2', label: 'Factura Crédito' },
        { id: '3', label: 'Nota de Crédito' },
        { id: '7', label: 'Ticket' },
    ];

    const changePage = (newPage: number) => {
        if (newPage < 1) return;
        setFilters(prev => ({ ...prev, page: newPage }));
        fetchDocs(true, { page: newPage });
    };

    if (!selectedStore) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Card className="w-[400px]">
                    <CardHeader>
                        <CardTitle className="text-center">Seleccione una tienda</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        Debe seleccionar una sucursal en el menú superior para ver los documentos.
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header section con Estilo Premium */}
            <div className="flex flex-col md:flex-row justify-start items-start md:items-center gap-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-xl border border-border/50 sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Monitor de Documentos
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Visualización en tiempo real de facturas, notas de crédito y tickets de {selectedStore.name}.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => fetchDocs(true)}
                        disabled={loading || isRefreshing}
                        className="gap-2"
                    >
                        {isRefreshing || loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        {isRefreshing || loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Limpiar Filtros
                    </Button>
                </div>
            </div>

            {/* Filters Panel - Más compacto verticalmente */}
            <Card className="border-border/50 shadow-sm bg-muted/20">
                <CardContent className="p-2 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Fecha Inicio</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    type="date" 
                                    className="pl-8 h-9 text-xs"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Fecha Fin</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    type="date" 
                                    className="pl-8 h-9 text-xs"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Turno</label>
                            <Select 
                                value={filters.shiftId} 
                                onValueChange={(v) => handleFilterChange('shiftId', v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="h-9 text-xs bg-background">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                                    {Array.from({ length: shiftCount }, (_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)} className="text-xs font-mono">{i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Nº Doc.</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    placeholder="000-001-..." 
                                    className="pl-8 h-9 text-xs font-mono"
                                    value={filters.docNo}
                                    onChange={(e) => handleFilterChange('docNo', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Cliente</label>
                            <Input 
                                placeholder="Nombre de cliente" 
                                className="h-8 text-xs bg-background/50 placeholder:text-muted-foreground/50 transition-all focus:bg-background"
                                value={filters.customerName}
                                onChange={(e) => handleFilterChange('customerName', e.target.value)}
                                // Búsqueda al presionar Enter
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') fetchDocs(true);
                                }}
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Cajero</label>
                            <Select 
                                value={filters.staff} 
                                onValueChange={(v) => handleFilterChange('staff', v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u} value={u} className="text-xs font-mono">{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">POS</label>
                            <Select 
                                value={filters.posTerminal} 
                                onValueChange={(v) => handleFilterChange('posTerminal', v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                                    {posCodes.map(p => (
                                        <SelectItem key={p} value={p} className="text-xs font-mono">{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Tipo Doc.</label>
                            <Select 
                                value={filters.docType} 
                                onValueChange={(v) => handleFilterChange('docType', v)}
                            >
                                <SelectTrigger className="h-9 text-xs bg-background">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {docTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="text-xs">
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Grid - Scrollable area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                        <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">Búsqueda de Documentos</h3>
                        <p className="text-muted-foreground text-center max-w-xs mb-4">
                            Utiliza los filtros de arriba y haz clic en "Buscar" para consultar los 200 documentos más recientes.
                        </p>
                        <Button onClick={() => fetchDocs(true)} variant="outline" className="gap-2">
                            Buscar Documentos
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="space-y-3 py-10">
                        <Skeleton className="h-8 w-64" />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                        </div>
                    </div>
                ) : docs.length > 0 ? (
                    <div className="flex flex-col pb-4 h-full">
                        <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 px-3 rounded-lg border">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                Mostrando <span className="text-foreground">{docs.length}</span> de <span className="text-foreground">{totalDocs}</span> documentos
                            </div>
                            <div className="flex gap-1 items-center">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => changePage(filters.page - 1)}
                                    disabled={filters.page === 1 || loading}
                                    className="h-8 shadow-sm flex items-center gap-1"
                                    title="Página Anterior"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Anterior
                                </Button>
                                <span className="text-xs text-muted-foreground font-mono px-2">
                                    Pág {filters.page} de {Math.max(1, Math.ceil(totalDocs / 50))}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => changePage(filters.page + 1)}
                                    disabled={filters.page >= Math.ceil(totalDocs / 50) || loading}
                                    className="h-8 shadow-sm flex items-center gap-1"
                                    title="Página Siguiente"
                                >
                                    Siguiente <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {docs.map((doc, idx) => (
                                <TransactionCard 
                                    key={doc.transactionId || idx} 
                                    doc={doc} 
                                    compact={true}
                                    onRefresh={() => fetchDocs(true)}
                                    variant={
                                    doc.docType === 3 ? 'destructive' : 
                                    (doc.docType === 2 ? 'warning' : 
                                    (doc.docType === 7 ? 'info' : 'success'))
                                    }
                                />
                            ))}
                        </div>
                        {/* Bottom Pagination */}
                        <div className="flex justify-center mt-6 mb-4">
                            <div className="flex gap-2 items-center">
                                <Button 
                                    variant="outline" 
                                    onClick={() => changePage(filters.page - 1)}
                                    disabled={filters.page === 1 || loading}
                                    className="shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                </Button>
                                <span className="text-xs text-muted-foreground font-mono px-3">
                                    Pág {filters.page} / {Math.max(1, Math.ceil(totalDocs / 50))}
                                </span>
                                <Button 
                                    variant="outline" 
                                    onClick={() => changePage(filters.page + 1)}
                                    disabled={filters.page >= Math.ceil(totalDocs / 50) || loading}
                                    className="shadow-sm"
                                >
                                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">No se encontraron documentos</h3>
                        <p className="text-muted-foreground text-center max-w-xs">
                            No hay registros que coincidan con los filtros aplicados o no hay ventas recientes.
                        </p>
                        <Button variant="link" onClick={clearFilters} className="mt-2">
                            Limpiar filtros y reintentar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
