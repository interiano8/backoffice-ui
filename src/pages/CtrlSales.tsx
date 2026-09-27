import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useCtrlStore } from '../store/useCtrlStore';
import { 
  Activity, 
  Search, 
  Fuel, 
  ArrowUpDown,
  Clock,
  X,
  Check,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton"
export const CtrlSales = () => {
    const { getCtrlSales } = useCtrlStore();
    const { getAvailableDates, availableDates, selectedStore } = useAppStore();

    const formatCtrlDateTime = (dateOfTx: any, timeOfTx: any) => {
      if (dateOfTx == null || timeOfTx == null) return { date: '-', time: '-' };
      const d = String(dateOfTx).trim().replace(/-/g, '');
      const t = String(timeOfTx).padStart(6, '0').trim();
      if (d.length < 8 || t.length < 6) return { date: '-', time: '-' };
      const date = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
      const time = `${t.substring(0, 2)}:${t.substring(2, 4)}`;
      return { date, time };
    };

    const GALLON_TO_LITER = 3.78541;
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchField, setSearchField] = useState('saleId');
    const [searchValue, setSearchValue] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [filters, setFilters] = useState({
        startDate: new Date().toLocaleDateString('en-CA'),
        endDate: new Date().toLocaleDateString('en-CA'),
        shiftId: '',
        posNumber: '',
        pumpNumber: '',
        saleId: '',
        minAmount: '',
        maxAmount: ''
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

    // Cuando availableDates cambie y tenga datos, actualizar los filtros
    useEffect(() => {
        if (availableDates && availableDates.length > 0) {
            const latestDate = availableDates[0];
            setFilters(prev => ({
                ...prev,
                startDate: latestDate,
                endDate: latestDate
            }));
            
            // Opcional: Ejecutar la búsqueda automáticamente con la última fecha
            // loadSales(true); 
        }
    }, [availableDates]);

    const loadSales = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            setHasSearched(true);
            // Limpiar filtros vacíos
            const activeFilters: Record<string, string> = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            
            if (searchValue) {
                activeFilters[searchField] = searchValue;
            }

            const data = await getCtrlSales(activeFilters);
            setSales(data);
        } catch (error) {
            toast.error("Error al cargar ventas de controlador");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        const latestDate = (availableDates && availableDates.length > 0) 
            ? availableDates[0] 
            : new Date().toLocaleDateString('en-CA');

        setFilters({
            startDate: latestDate,
            endDate: latestDate,
            shiftId: '',
            posNumber: '',
            pumpNumber: '',
            saleId: '',
            minAmount: '',
            maxAmount: ''
        });
        setSearchField('saleId');
        setSearchValue('');
        setHasSearched(false);
        setSales([]);
    };

    // No cargar automáticamente las ventas. Esperar acción del usuario.
    /* useEffect(() => {
        if (selectedStore) {
            loadSales();
        }
    }, [selectedStore]); */



    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedSales = React.useMemo(() => {
        let sortableSales = [...sales];

        if (sortConfig !== null) {
            sortableSales.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableSales;
    }, [sales, sortConfig]);

    const { totalAmount, totalVolume } = React.useMemo(() => {
        return sortedSales.reduce((acc, sale) => ({
            totalAmount: acc.totalAmount + Number(sale.Amount || 0),
            totalVolume: acc.totalVolume + Number(sale.Volume || 0)
        }), { totalAmount: 0, totalVolume: 0 });
    }, [sortedSales]);

    const totalVolumeGL = totalVolume / GALLON_TO_LITER;

    return (
        <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-start gap-12 shrink-0">
                <div className="shrink-0">
                    <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-primary/10 border border-primary/20">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        Monitor CTRL
                    </h1>
                    <p className="text-muted-foreground text-[10px] mt-0.5 flex items-center gap-2">
                        Ventas reales Fusion
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[9px] py-0 h-3.5 px-1.5">
                            {sales.length}
                        </Badge>
                    </p>
                </div>

                {/* Counters in the middle (Red Box area) */}
                {sales.length > 0 && (
                    <div className="flex items-center gap-4 bg-card/60 backdrop-blur-sm px-4 py-1.5 rounded-xl border border-border/40 shadow-sm shrink-0 animate-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2 relative after:content-[''] after:absolute after:-right-2 after:h-6 after:w-[1px] after:bg-border/40">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Clock className="h-3 w-3 text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Última Venta</span>
                                <span className="text-xs font-black font-mono text-foreground leading-none">{sales[0]?.TimeOfTransaction ? `${sales[0].TimeOfTransaction.substring(0,2)}:${sales[0].TimeOfTransaction.substring(2,4)}` : '--:--'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <Fuel className="h-3 w-3 text-green-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Turno Actual</span>
                                <span className="text-xs font-black font-mono text-foreground leading-none">#{sales[0]?.ShiftID || '---'}</span>
                            </div>
                        </div>
                    </div>
                )}
                
            </div>



            {/* Main Table Card */}
            <Card className="border-border/60 shadow-xl shadow-foreground/5 bg-card/60 backdrop-blur-md overflow-hidden flex flex-col h-full min-h-[300px]">
                <CardHeader className="p-3 border-b border-border/40 flex flex-col xl:flex-row items-center justify-between gap-3 space-y-0">
                    <div className="shrink-0 flex items-center h-full">
                        <CardTitle className="text-base font-bold whitespace-nowrap">Registro de Ventas</CardTitle>
                        <CardDescription className="text-[10px] hidden 2xl:block ml-2">Últimos registros detectados</CardDescription>
                    </div>
                    
                    {/* Compact Filters in Header */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 hide-scrollbar" onKeyDown={(e) => e.key === 'Enter' && loadSales()}>
                        {/* Date Range */}
                        <div className="flex items-center gap-1 border border-border/50 rounded-md bg-background/50 p-1 shrink-0">
                            <Input type="date" className="h-8 text-[11px] border-0 focus-visible:ring-0 px-2 w-[115px] bg-transparent" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} title="Fecha Inicio" />
                            <span className="text-muted-foreground text-[11px] text-center">-</span>
                            <Input type="date" className="h-8 text-[11px] border-0 focus-visible:ring-0 px-2 w-[115px] bg-transparent" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} title="Fecha Fin" />
                        </div>

                        {/* Search Field */}
                        <div className="flex items-center gap-0 border border-border/50 rounded-md bg-background/50 p-1 shrink-0">
                            <Select value={searchField} onValueChange={setSearchField}>
                                <SelectTrigger className="h-8 w-[95px] text-[11px] border-0 focus:ring-0 bg-transparent px-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="saleId" className="text-[11px]">ID Venta</SelectItem>
                                    <SelectItem value="shiftId" className="text-[11px]">CTRL</SelectItem>
                                    <SelectItem value="posNumber" className="text-[11px]">POS</SelectItem>
                                    <SelectItem value="pumpNumber" className="text-[11px]">Bomba</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input placeholder="Valor..." className="h-8 text-[11px] border-0 focus-visible:ring-0 px-2 w-[85px] bg-transparent border-l border-border/50 rounded-none shrink-0" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-0 border border-border/50 rounded-md bg-background/50 p-1 shrink-0">
                            <Input placeholder="Min (L)" className="h-8 text-[11px] border-0 focus-visible:ring-0 px-2 w-[65px] bg-transparent text-center" value={filters.minAmount} onChange={(e) => setFilters({...filters, minAmount: e.target.value})} />
                            <span className="text-muted-foreground text-[11px]">-</span>
                            <Input placeholder="Max (L)" className="h-8 text-[11px] border-0 focus-visible:ring-0 px-2 w-[65px] bg-transparent border-l border-border/50 rounded-none text-center" value={filters.maxAmount} onChange={(e) => setFilters({...filters, maxAmount: e.target.value})} />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2 shrink-0 ml-1">
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2.5 text-[11px]">
                                Limpiar
                            </Button>
                            <Button variant="default" size="sm" onClick={() => loadSales()} disabled={loading} className="h-8 shadow-sm gap-1.5 text-[11px] px-3 bg-primary">
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                Buscar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto relative">
                    {!hasSearched ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/90 backdrop-blur-md">
                            <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium">Búsqueda Manual CTRL</h3>
                            <p className="text-muted-foreground text-center max-w-xs mb-4">
                                Utiliza los filtros de arriba y haz clic en "Buscar" para consultar las ventas. Si no hay filtros, traeremos las del último turno.
                            </p>
                            <Button onClick={() => loadSales()} variant="outline" className="gap-2 bg-background">
                                Obtener Último Turno
                            </Button>
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="absolute inset-0 z-10 p-6 space-y-3 bg-card/60 backdrop-blur-sm">
                            <Skeleton className="h-8 w-full rounded-lg" />
                            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                        </div>
                    ) : null}

                    <div className="h-full">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b border-border/40">
                                    <TableHead className="w-24 font-bold text-foreground py-4 px-6 cursor-pointer group" onClick={() => handleSort('SaleID')}>
                                        <div className="flex items-center gap-2">
                                            ID <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-20 font-bold text-foreground py-4 px-2 cursor-pointer group" onClick={() => handleSort('ShiftID')}>
                                        <div className="flex items-center gap-2">
                                            Turno <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-bold text-foreground py-4">Bomba</TableHead>
                                    <TableHead className="w-20 font-bold text-foreground py-4">Mang.</TableHead>
                                    <TableHead className="font-bold text-foreground py-4">Producto</TableHead>
                                    <TableHead className="text-right font-bold text-foreground py-4" onClick={() => handleSort('Amount')}>
                                        <div className="flex items-center justify-end gap-2 cursor-pointer group text-primary">
                                            Monto <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right font-bold text-foreground py-4">PPU</TableHead>
                                    <TableHead className="text-right font-bold text-foreground py-4">Volumen</TableHead>
                                    <TableHead className="font-bold text-foreground py-4 px-6 text-right">Fecha/Hora</TableHead>
                                    <TableHead className="w-24 font-bold text-foreground py-4 text-center">Facturado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && sales.length === 0 ? (
                                    Array(10).fill(0).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell colSpan={10} className="h-12 bg-muted/20"></TableCell>
                                        </TableRow>
                                    ))
                                ) : sortedSales.length > 0 ? (
                                    sortedSales.map((sale) => (
                                        <TableRow key={sale.SaleID} className="group hover:bg-muted/30 transition-colors border-b border-border/30">
                                            <TableCell className="font-mono font-medium text-xs px-6 py-3">
                                                {sale.SaleID}
                                            </TableCell>
                                            <TableCell className="py-3 px-2 font-mono font-bold text-sm text-muted-foreground">
                                                #{sale.ShiftID}
                                            </TableCell>
                                            <TableCell className="font-bold text-sm py-3 px-4">
                                                {sale.PumpNumber}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="h-7 w-7 rounded-sm bg-muted/50 border border-border/40 flex items-center justify-center text-[10px] font-bold">
                                                    {sale.HoseNumber}{String.fromCharCode(64 + parseInt(sale.HoseNumber))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground/90">{sale.productName}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Grado: {sale.GradeNr}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-3 pr-2">
                                                <span className="font-mono font-bold text-primary">L. {Number(sale.Amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </TableCell>
                                            <TableCell className="text-right py-3 pr-2 text-muted-foreground/80 font-mono text-sm">
                                                {Number(sale.PPU).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right py-3 pr-2 font-mono font-semibold">
                                                <div className="flex flex-col items-end">
                                                  <span>{Number(sale.Volume).toLocaleString('en-US', { minimumFractionDigits: 6 })} <span className="text-[10px] text-muted-foreground">LT</span></span>
                                                  <span className="text-[10px] text-muted-foreground">{(Number(sale.Volume) / GALLON_TO_LITER).toLocaleString('en-US', { minimumFractionDigits: 6 })} GL</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6 py-3">
                                                {(() => {
                                                  const dt = formatCtrlDateTime(sale.DateOfTransaction, sale.TimeOfTransaction);
                                                  return (
                                                    <div className="flex flex-col items-end">
                                                      <span className="text-xs font-bold text-foreground/80">{dt.date}</span>
                                                      <span className="text-[10px] font-medium text-muted-foreground">{dt.time}</span>
                                                    </div>
                                                  );
                                                })()}
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <div className="flex justify-center">
                                                    {sale.IsInvoiced ? (
                                                        <div className="bg-green-500/10 p-1 rounded-full border border-green-500/20">
                                                            <Check className="h-3.5 w-3.5 text-green-500" strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-muted p-1 rounded-full border border-border/40">
                                                            <X className="h-3.5 w-3.5 text-muted-foreground/50" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                <Search className="h-12 w-12" />
                                                <p className="font-medium text-lg">No se encontraron ventas recientes</p>
                                                <p className="text-sm">Intenta actualizar o cambiar de tienda</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {/* Totals Footer Bar */}
                <div className="bg-muted/30 border-t border-border/40 p-3 px-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Transacciones</span>
                            <span className="text-sm font-mono font-bold">{sortedSales.length}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-border/40 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Volumen Total</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-bold text-foreground">
                                  {totalVolume.toLocaleString('en-US', { minimumFractionDigits: 6 })}
                                  <span className="text-[10px] font-bold text-muted-foreground ml-0.5">LT</span>
                              </span>
                              <span className="text-sm font-mono font-bold text-muted-foreground">
                                  {totalVolumeGL.toLocaleString('en-US', { minimumFractionDigits: 6 })}
                                  <span className="text-[10px] font-bold text-muted-foreground ml-0.5">GL</span>
                              </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 shadow-inner">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Monto Total Visualizado</span>
                            <span className="text-lg font-mono font-black text-primary leading-tight">
                                L. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
