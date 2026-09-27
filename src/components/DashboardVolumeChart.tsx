import { getProductColor } from '../domain/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Droplets, Gauge } from 'lucide-react';
import type { DashboardData } from "../types/api";

interface Props {
  data: DashboardData;
  metric: string;
  onMetricChange: (m: any) => void;
  startDate: string;
  endDate: string;
  getChartData: () => any[];
}

export function DashboardVolumeChart({ data, metric, onMetricChange, startDate, endDate, getChartData }: Props) {
  return (
    <Card className="shadow-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden ring-1 ring-white/5">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            {metric === 'amount' ? <Coins className="w-6 h-6" /> : metric === 'gallons' ? <Droplets className="w-6 h-6" /> : <Gauge className="w-6 h-6" />}
          </div>
          <div>
            <CardTitle className="text-xl font-black tracking-tight uppercase italic">
              Despachos por Fecha
            </CardTitle>
            <CardDescription>
              Visualizando {metric === 'amount' ? 'Ventas facturadas (HNL)' : metric === 'gallons' ? 'Volumen facturado (Galones)' : 'Volumen facturado (Litros)'} por Fecha de Turno del {startDate} al {endDate}
            </CardDescription>
          </div>
        </div>

        <div className="flex p-1 bg-muted/20 border border-border/40 rounded-xl">
          <Button
            variant={metric === 'amount' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-lg font-bold text-[10px] sm:text-xs h-8 sm:h-9 uppercase tracking-widest transition-all"
            onClick={() => onMetricChange('amount')}
          >
            <Coins className="w-3 h-3 mr-2 sm:hidden lg:block" />
            Monetario
          </Button>
          <Button
            variant={metric === 'volume' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-lg font-bold text-[10px] sm:text-xs h-8 sm:h-9 uppercase tracking-widest transition-all"
            onClick={() => onMetricChange('volume')}
          >
            <Gauge className="w-3 h-3 mr-2 sm:hidden lg:block" />
            Litros
          </Button>
          <Button
            variant={metric === 'gallons' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-lg font-bold text-[10px] sm:text-xs h-8 sm:h-9 uppercase tracking-widest transition-all"
            onClick={() => onMetricChange('gallons')}
          >
            <Droplets className="w-3 h-3 mr-2 sm:hidden lg:block" />
            Galones
          </Button>
        </div>
      </CardHeader>
      <CardContent className="w-full min-h-[400px] relative">
        <ResponsiveContainer width="100%" height={400} minWidth={0} minHeight={0} debounce={100}>
          <AreaChart data={getChartData()}>
            <defs>
              {data.products?.map((p, idx) => (
                <linearGradient key={`grad-${idx}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getProductColor(p.name, idx)} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={getProductColor(p.name, idx)} stopOpacity={0} />
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
                value: metric === 'amount' ? 'VENTAS (HNL)' : metric === 'gallons' ? 'VOLUMEN (GL)' : 'VOLUMEN (LTS)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: '9px', fontWeight: 'black' }
              }}
              tickFormatter={(val) => metric === 'amount' ? `${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` : String(val)}
            />
            <Tooltip
              formatter={(val: any) => {
                const formattedNumber = new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(Number(val));
                if (metric === 'amount') return `L. ${formattedNumber}`;
                if (metric === 'gallons') return `${formattedNumber} GL`;
                return `${formattedNumber} Lts`;
              }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            {data.products?.map((p, idx) => (
              <Area
                key={p.name}
                type="monotone"
                dataKey={p.name}
                stroke={getProductColor(p.name, idx)}
                fillOpacity={1}
                fill={`url(#color-${idx})`}
                strokeWidth={3}
                animationDuration={1500}
                connectNulls={true}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
