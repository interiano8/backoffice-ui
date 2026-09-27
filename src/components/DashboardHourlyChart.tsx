import { getProductColor } from '../domain/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface Props {
  hourly: any[];
  products: any[];
}

export function DashboardHourlyChart({ hourly, products }: Props) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <Card className="shadow-2xl border-border bg-card/30 backdrop-blur-sm ring-1 ring-white/5">
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Frecuencia de Despachos por Hora
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0} debounce={100}>
          <LineChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.1)" />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--foreground)/0.7)', fontWeight: 'bold' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--foreground)/0.7)', fontWeight: 'bold' }}
              label={{ value: 'Despachos', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'hsl(var(--foreground)/0.8)', fontSize: '10px', fontWeight: 'bold' } }}
              tickFormatter={(val) => Math.floor(val).toString()}
            />
            <Tooltip
              formatter={(val: any) => Math.floor(Number(val || 0))}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
            />
            <Line
              type="monotone"
              dataKey="TOTAL"
              stroke="hsl(var(--foreground))"
              strokeWidth={4}
              dot={{ r: 4, fill: 'hsl(var(--foreground))', strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="TRÁFICO TOTAL (DESPACHOS)"
              animationDuration={2000}
            />
            {products?.map((p, idx) => (
              <Line
                key={p.name}
                type="monotone"
                dataKey={p.name}
                stroke={getProductColor(p.name, idx)}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
