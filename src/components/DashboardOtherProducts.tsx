import { getDefaultColor } from '../domain/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, ShoppingBag, Clock, Coins, Gauge } from 'lucide-react';
import type { DashboardData } from "../types/api";

interface Props {
  data: DashboardData | null;
  otherMetric: string;
  onOtherMetricChange: (m: any) => void;
  formatCurrency: (n: number) => string;
}

export function DashboardOtherProducts({ data, otherMetric, onOtherMetricChange, formatCurrency }: Props) {
  if (!data?.otherProducts || data.otherProducts.length === 0) return null;

  return (
    <div className="space-y-6 border-t border-border/40 pt-6 mt-6">
      <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2 uppercase">
        <Package className="w-6 h-6 text-orange-500" />
        Otros Productos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.otherProducts.map((p: any) => (
          <Card key={p.name} className="relative bg-card/40 backdrop-blur-xl border border-border/80 overflow-hidden group hover:bg-card/60 hover:border-orange-500/50 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="h-1.5 w-full absolute top-0 left-0 opacity-80 group-hover:opacity-100 transition-opacity bg-orange-500" />
            <CardContent className="p-5 pt-7">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {p.name}
                      </p>
                    </div>
                    <h3 className="text-2xl font-black text-foreground tracking-tighter group-hover:scale-105 transition-transform origin-left">
                      {formatCurrency(p.amount)}
                    </h3>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Package className="w-4 h-4 text-orange-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Unidades</span>
                    <p className="text-sm font-bold text-orange-500">{Number(p.volume || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Despachos</span>
                    <p className="text-xs font-bold text-foreground/80">{p.count || 0}</p>
                  </div>
                </div>

                {p.prices && p.prices.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 block mb-1">Precio</span>
                    <p className="text-[11px] font-mono font-bold text-primary">
                      {p.prices.map((price: number) => formatCurrency(price)).join(' | ')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden ring-1 ring-white/5">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase italic">
                Ventas de Otros Productos
              </CardTitle>
              <CardDescription>
                Productos de (tienda, lubricantes, etc.)
              </CardDescription>
            </div>
          </div>

          <div className="flex p-1 bg-muted/20 border border-border/40 rounded-xl">
            <Button
              variant={otherMetric === 'amount' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg font-bold text-[10px] sm:text-xs h-8 sm:h-9 uppercase tracking-widest transition-all"
              onClick={() => onOtherMetricChange('amount')}
            >
              <Coins className="w-3 h-3 mr-2" />
              Monetario
            </Button>
            <Button
              variant={otherMetric === 'volume' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg font-bold text-[10px] sm:text-xs h-8 sm:h-9 uppercase tracking-widest transition-all"
              onClick={() => onOtherMetricChange('volume')}
            >
              <Gauge className="w-3 h-3 mr-2" />
              Volumen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="w-full min-h-[300px] relative">
          <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={100}>
            <AreaChart data={otherMetric === 'amount' ? data.otherDailyAmount : data.otherDailyVolume}>
              <defs>
                {data.otherProducts?.map((_p, idx) => (
                  <linearGradient key={`grad-other-${idx}`} id={`color-other-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getDefaultColor(idx)} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={getDefaultColor(idx)} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.1)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                label={{
                  value: otherMetric === 'amount' ? 'VENTAS (HNL)' : 'VOLUMEN',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: '9px', fontWeight: 'black' }
                }}
              />
              <Tooltip
                formatter={(val: any) => {
                  const formattedNumber = new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(Number(val));
                  return otherMetric === 'amount' ? `L. ${formattedNumber}` : formattedNumber;
                }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              {data.otherProducts?.map((p, idx) => (
                <Area
                  key={p.name}
                  type="monotone"
                  dataKey={p.name}
                  stroke={getDefaultColor(idx)}
                  fillOpacity={1}
                  fill={`url(#color-other-${idx})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden ring-1 ring-white/5">
        <CardHeader className="bg-muted/10">
          <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Frecuencia de Ventas por Hora - Otros Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.otherHourly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.1)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              {data.otherProducts?.map((p, idx) => (
                <Line
                  key={p.name}
                  type="monotone"
                  dataKey={p.name}
                  stroke={getDefaultColor(idx)}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
