import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Fuel,
  Receipt,
  Layers,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadConsolidatedReport } from '../services/alerts.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import api from '../infrastructure/api/api-client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const DashboardGlobalView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const handleExportConsolidated = async () => {
    setExporting(true);
    try {
      await downloadConsolidatedReport({ startDate, endDate });
      toast.success('Reporte consolidado descargado exitosamente');
    } catch (err) {
      console.error('Error al exportar reporte consolidado:', err);
      toast.error('No se pudo generar el reporte consolidado');
    } finally {
      setExporting(false);
    }
  };

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard-global', {
        params: { startDate, endDate },
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching global dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs uppercase font-bold">
              Vista Corporativa
            </Badge>
            <span className="text-xs text-muted-foreground">• Todas las estaciones</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2 mt-1">
            <Building2 className="w-8 h-8 text-primary" />
            Dashboard Global de la Red
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas consolidadas, ranking de estaciones y volumen total despachado en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase ml-1 mb-1 opacity-60">Desde</span>
            <input
              type="date"
              className="bg-muted/20 px-3 py-1.5 rounded-lg border border-border/40 text-xs font-bold focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase ml-1 mb-1 opacity-60">Hasta</span>
            <input
              type="date"
              className="bg-muted/20 px-3 py-1.5 rounded-lg border border-border/40 text-xs font-bold focus:outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchGlobalStats}
            className="mt-4 h-9 w-9 hover:bg-primary/10"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={handleExportConsolidated}
            disabled={exporting}
            className="mt-4 h-9 flex items-center gap-2 border-border/40 hover:bg-primary/10 font-bold text-xs"
            title="Exportar reporte tabular consolidado de la red"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4 text-primary" />
            )}
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/60 relative overflow-hidden bg-gradient-to-br from-card to-primary/5">
          <div className="h-1 w-full bg-primary" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Ventas Totales Red</span>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(data?.totalAmount || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total facturado en el periodo</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 relative overflow-hidden bg-gradient-to-br from-card to-emerald-500/5">
          <div className="h-1 w-full bg-emerald-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Volumen Despachado</span>
              <Fuel className="w-5 h-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">
              {(data?.totalVolumeGL || 0).toLocaleString('es-HN', { maximumFractionDigits: 2 })} <span className="text-sm font-bold text-muted-foreground">Gal</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Galones netos vendidos</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 relative overflow-hidden bg-gradient-to-br from-card to-blue-500/5">
          <div className="h-1 w-full bg-blue-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Transacciones</span>
              <Receipt className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">
              {(data?.totalTransactions || 0).toLocaleString('es-HN')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Tickets y facturas emitidas</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 relative overflow-hidden bg-gradient-to-br from-card to-purple-500/5">
          <div className="h-1 w-full bg-purple-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Estaciones Activas</span>
              <Layers className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">
              {data?.activeStoresCount || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Tiendas conectadas y reportando</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts: Store Ranking & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Ranking Bar Chart */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Ranking de Ventas por Estación
            </CardTitle>
            <CardDescription>Comparativa de facturación total por sucursal</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data?.storeRanking?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.storeRanking} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" tickFormatter={(val) => `L. ${(val / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="storeName" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Ventas']} />
                  <Bar dataKey="totalAmount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sin datos en el periodo
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Volume Share Pie Chart */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-500" />
              Distribución de Combustibles (Galones)
            </CardTitle>
            <CardDescription>Participación por tipo de producto en toda la red</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data?.products?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.products.slice(0, 6)}
                    dataKey="totalVolumeGL"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => `${entry.name || ''} (${Number(entry.totalVolumeGL || 0).toFixed(0)} GL)`}
                  >
                    {data.products.slice(0, 6).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${Number(val).toFixed(2)} Gal`, 'Volumen']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sin datos en el periodo
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fuel Type Breakdown Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-500" />
                Consolidado de Combustibles por Producto
              </CardTitle>
              <CardDescription>
                Volúmenes, ventas y precio promedio ponderado de combustibles en toda la red
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Red Central
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-6 py-3">Combustible</th>
                  <th className="px-6 py-3 text-right">Volumen (GL)</th>
                  <th className="px-6 py-3 text-right">Venta Total</th>
                  <th className="px-6 py-3 text-right">Precio Promedio (L./GL)</th>
                  <th className="px-6 py-3 text-right">Despachos</th>
                  <th className="px-6 py-3 text-right">% Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data?.products?.length > 0 ? (
                  data.products.map((p: any, idx: number) => {
                    const volGL = Number(p.totalVolumeGL || 0);
                    const amt = Number(p.totalAmount || 0);
                    const avgPrice = volGL > 0 ? amt / volGL : 0;
                    const totalNetworkVol = Number(data?.totalVolumeGL || 0);
                    const sharePct = totalNetworkVol > 0 ? ((volGL / totalNetworkVol) * 100).toFixed(1) : '0';
                    return (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-bold flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          {p.name || p.productName}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-medium">
                          {volGL.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GL
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-foreground">
                          {formatCurrency(amt)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-muted-foreground">
                          {avgPrice > 0 ? formatCurrency(avgPrice) : '-'}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-muted-foreground">
                          {(p.count || 0).toLocaleString('es-HN')}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {sharePct}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-muted-foreground text-sm">
                      Sin datos de combustibles en el periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Traffic & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic Line Chart */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Curva de Tráfico por Hora (Red Completa)
            </CardTitle>
            <CardDescription>Monto total de ventas según la hora del día</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {data?.hourlyTraffic?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hourlyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(val) => `L. ${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Ventas']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sin datos en el periodo
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Table */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Métodos de Pago
            </CardTitle>
            <CardDescription>Desglose de cobros consolidados</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data?.paymentMethods?.length > 0 ? (
              data.paymentMethods.map((pm: any, idx: number) => {
                const pct = data.totalAmount > 0 ? ((pm.amount / data.totalAmount) * 100).toFixed(1) : '0';
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{pm.name}</span>
                      <span>{formatCurrency(pm.amount)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(Number(pct), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground text-xs">
                Sin registros de pago
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Store Ranking Details Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Desglose Detallado por Estación</CardTitle>
          <CardDescription>Rendimiento individual de cada sucursal en el periodo seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Estación</th>
                  <th className="px-6 py-3 text-right">Transacciones</th>
                  <th className="px-6 py-3 text-right">Volumen (GL)</th>
                  <th className="px-6 py-3 text-right">Venta Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data?.storeRanking?.map((st: any) => (
                  <tr key={st.storeCode} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs">{st.storeCode}</td>
                    <td className="px-6 py-4 font-semibold">{st.storeName}</td>
                    <td className="px-6 py-4 text-right font-mono">{st.transactionCount?.toLocaleString('es-HN')}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">{st.totalVolumeGL?.toFixed(2)} GL</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">{formatCurrency(st.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardGlobalView;
