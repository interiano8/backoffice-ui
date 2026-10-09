import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getDashboardStats, getMonthlyAnalysis } from '../services/report.service';
import { cn } from "@/lib/utils"
import { RefreshCcw, TrendingUp, Download, Loader2, ShoppingBag, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { downloadConsolidatedReport } from '../services/alerts.service';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { GALLON_TO_LITER } from "@/lib/constants";
import type { DashboardData, MonthlyData } from "../types/api";
import { DashboardPaymentCards } from "../components/DashboardPaymentCards";
import { DashboardComparativeAnalysis } from "../components/DashboardComparativeAnalysis";
import { DashboardProductCards } from "../components/DashboardProductCards";
import { DashboardVolumeChart } from "../components/DashboardVolumeChart";
import { DashboardPumpMonitor } from "../components/DashboardPumpMonitor";
import { DashboardHourlyChart } from "../components/DashboardHourlyChart";
import { DashboardTables } from "../components/DashboardTables";
import { DashboardOtherProducts } from "../components/DashboardOtherProducts";
import { DashboardGlobalView } from "../components/DashboardGlobalView";

export const Dashboard: React.FC = () => {
    const { selectedStore } = useAppStore();

    if (selectedStore?.code === 'GLOBAL' || selectedStore?.code === '000') {
        return <DashboardGlobalView />;
    }
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [metric, setMetric] = useState<'volume' | 'amount' | 'gallons'>('volume');
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [paymentMetric, setPaymentMetric] = useState<'amount' | 'count'>('amount');
    const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
    const [loadingMonthly, setLoadingMonthly] = useState(true);
    const [otherMetric, setOtherMetric] = useState<'volume' | 'amount'>('amount');
    const [exportingConsolidated, setExportingConsolidated] = useState(false);

    const handleDownloadConsolidated = async () => {
        setExportingConsolidated(true);
        try {
            await downloadConsolidatedReport({ startDate, endDate });
            toast.success('Reporte consolidado descargado exitosamente');
        } catch (error) {
            console.error('Error downloading consolidated report:', error);
            toast.error('No se pudo descargar el reporte consolidado');
        } finally {
            setExportingConsolidated(false);
        }
    };
    
    const [period1Start, setPeriod1Start] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
    const [period1End, setPeriod1End] = useState<string>(new Date().toISOString().split('T')[0]);
    const [period2Start, setPeriod2Start] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0]);
    const [period2End, setPeriod2End] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() - 1, 0)).toISOString().split('T')[0]);
    
    const [tempPeriod1Start, setTempPeriod1Start] = useState<string>(period1Start);
    const [tempPeriod1End, setTempPeriod1End] = useState<string>(period1End);
    const [tempPeriod2Start, setTempPeriod2Start] = useState<string>(period2Start);
    const [tempPeriod2End, setTempPeriod2End] = useState<string>(period2End);
    
    const hasPendingChanges = 
        tempPeriod1Start !== period1Start || 
        tempPeriod1End !== period1End || 
        tempPeriod2Start !== period2Start || 
        tempPeriod2End !== period2End;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchData = async () => {
        if (!selectedStore) return;
        setLoading(true);
        try {
            const result = await getDashboardStats(undefined, undefined, startDate, endDate);
            setData(result);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyData = async () => {
        if (!selectedStore) return;
        setLoadingMonthly(true);
        try {
            const result = await getMonthlyAnalysis(period1Start, period1End, period2Start, period2End);
            setMonthlyData(result);
        } catch (error) {
            console.error('Error fetching monthly analysis:', error);
        } finally {
            setLoadingMonthly(false);
        }
    };

    const applyDateChanges = () => {
        setPeriod1Start(tempPeriod1Start);
        setPeriod1End(tempPeriod1End);
        setPeriod2Start(tempPeriod2Start);
        setPeriod2End(tempPeriod2End);
    };

    useEffect(() => {
        if (selectedStore) {
            fetchMonthlyData();
        }
    }, [selectedStore, period1Start, period1End, period2Start, period2End]);

    useEffect(() => {
        fetchData();
    }, [selectedStore, startDate, endDate]);

    if (loading && !data) {
        return (
            <div className="space-y-6 p-6 animate-in fade-in duration-500">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-[400px] rounded-xl" />
                <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    const getChartData = () => {
        if (metric === 'amount') return data?.dailyAmount || [];
        if (metric === 'gallons') {
            return (data?.dailyVolume || []).map((day: any) => {
                const converted: any = { date: day.date };
                Object.keys(day).forEach(key => {
                    if (key !== 'date') {
                        converted[key] = (day[key] || 0) / GALLON_TO_LITER;
                    }
                });
                return converted;
            });
        }
        return data?.dailyVolume || [];
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2 uppercase">
                        <TrendingUp className="w-8 h-8 text-primary" />
                        Dashboard Analítico
                    </h1>
                    <p className="text-muted-foreground font-medium">Visualización de rendimiento y ventas de combustible</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 w-fit">
                        <RefreshCcw className="w-3 h-3" />
                        <span className="font-bold">Importante: Sincronice los turnos de las fechas a visualizar en la pantalla de Conciliación para alimentar el Dashboard</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase ml-1 mb-1 opacity-60">Desde</span>
                            <label className="flex items-center bg-muted/20 px-4 py-1.5 rounded-lg border border-border/40 h-10 transition-all hover:bg-muted/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 cursor-pointer group">
                                <input
                                    type="date"
                                    className="bg-transparent text-[11px] font-bold focus:outline-none uppercase cursor-pointer w-full text-foreground"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase ml-1 mb-1 opacity-60">Hasta</span>
                            <label className="flex items-center bg-muted/20 px-4 py-1.5 rounded-lg border border-border/40 h-10 transition-all hover:bg-muted/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 cursor-pointer group">
                                <input
                                    type="date"
                                    className="bg-transparent text-[11px] font-bold focus:outline-none uppercase cursor-pointer w-full text-foreground"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={fetchData} className="h-10 w-10 hover:bg-primary/10 border-border/40" title="Actualizar datos">
                                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDownloadConsolidated}
                                disabled={exportingConsolidated}
                                className="h-10 flex items-center gap-2 border-border/40 hover:bg-primary/10 font-bold text-xs"
                                title="Exportar reporte consolidado de la red"
                            >
                                {exportingConsolidated ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Download className="h-4 w-4 text-primary" />}
                                <span>Exportar CSV</span>
                            </Button>
                        </div>
                    </div>

                    <div className="h-10 w-[1px] bg-border/40 mx-2 hidden lg:block" />

                </div>
            </div>

            {/* VISTA RETAIL O ESTACIÓN */}
            {selectedStore?.businessType === 'RETAIL' ? (
                /* === MODO TIENDA / RETAIL PURO === */
                <div className="space-y-8">
                    {/* Tarjetas KPI Retail */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Venta Mercancía Total</p>
                                    <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                                        {formatCurrency(
                                            (data?.otherProducts?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || data?.totalAmount || 0)
                                        )}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Artículos en Catálogo Vendidos</p>
                                    <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                                        {(data?.otherProducts?.length || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                    <Receipt className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unidades Despachadas</p>
                                    <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                                        {(data?.otherProducts?.reduce((sum, p) => sum + (p.totalVolume || 0), 0) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ventas de mercancía / otros productos prioritario */}
                    <DashboardOtherProducts
                        data={data}
                        otherMetric={otherMetric}
                        onOtherMetricChange={setOtherMetric}
                        formatCurrency={formatCurrency}
                    />

                    {/* Métodos de Pago */}
                    <DashboardPaymentCards
                        paymentMethods={data?.paymentMethods || []}
                        paymentMetric={paymentMetric}
                        onMetricChange={setPaymentMetric}
                    />

                    {/* Desglose por Hora */}
                    {data?.hourly && data.hourly.length > 0 && (
                        <DashboardHourlyChart
                            hourly={data.hourly}
                            products={data.products || []}
                        />
                    )}
                </div>
            ) : (
                /* === MODO ESTACIÓN DE COMBUSTIBLE === */
                <>
                    <DashboardProductCards products={data?.products || []} formatCurrency={formatCurrency} />

                    {isMounted && data && data.products?.length > 0 && (
                        <div className="flex flex-col gap-8">
                            <DashboardVolumeChart
                                data={data}
                                metric={metric}
                                onMetricChange={setMetric}
                                startDate={startDate}
                                endDate={endDate}
                                getChartData={getChartData}
                            />
                            <DashboardPumpMonitor
                                pumps={data.pumps || []}
                                totalVolume={data.totalVolume || 0}
                                totalVolumeGL={data.totalVolumeGL || 0}
                                totalAmount={data.totalAmount || 0}
                                formatCurrency={formatCurrency}
                            />
                            <DashboardHourlyChart
                                hourly={data.hourly || []}
                                products={data.products || []}
                            />
                            <DashboardPaymentCards
                                paymentMethods={data.paymentMethods || []}
                                paymentMetric={paymentMetric}
                                onMetricChange={setPaymentMetric}
                            />
                        </div>
                    )}
                </>
            )}

            <div className="space-y-6 pb-12">
                <DashboardTables data={data} />
                {selectedStore?.businessType !== 'RETAIL' && (
                    <DashboardOtherProducts
                        data={data}
                        otherMetric={otherMetric}
                        onOtherMetricChange={setOtherMetric}
                        formatCurrency={formatCurrency}
                    />
                )}

                {!loadingMonthly && monthlyData && (
                    <DashboardComparativeAnalysis
                        monthlyData={monthlyData}
                        loadingMonthly={loadingMonthly}
                        tempPeriod1Start={tempPeriod1Start}
                        tempPeriod1End={tempPeriod1End}
                        tempPeriod2Start={tempPeriod2Start}
                        tempPeriod2End={tempPeriod2End}
                        hasPendingChanges={hasPendingChanges}
                        onTempPeriod1StartChange={setTempPeriod1Start}
                        onTempPeriod1EndChange={setTempPeriod1End}
                        onTempPeriod2StartChange={setTempPeriod2Start}
                        onTempPeriod2EndChange={setTempPeriod2End}
                        onApplyDateChanges={applyDateChanges}
                    />
                )}
            </div>
        </div>
    );
};
