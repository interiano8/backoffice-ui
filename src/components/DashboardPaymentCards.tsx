import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PaymentMethod {
  name: string;
  amount: number;
  count: number;
  code?: string;
  description?: string;
}

interface Props {
  paymentMethods: PaymentMethod[];
  paymentMetric: 'amount' | 'count';
  onMetricChange: (metric: 'amount' | 'count') => void;
}

function normalize(name: string): string {
  return name?.toUpperCase().trim() || '';
}

function classifyPayments(methods: PaymentMethod[], metric: 'amount' | 'count') {
  const assignedMethods = new Set<string>();

  const isAssigned = (pm: PaymentMethod) => assignedMethods.has(pm.name);
  const assignAndSum = (pm: PaymentMethod) => {
    assignedMethods.add(pm.name);
    return metric === 'amount' ? (pm.amount || 0) : (pm.count || 0);
  };

  const totalValue = methods.reduce((acc, pm) => acc + (metric === 'amount' ? (pm.amount || 0) : (pm.count || 0)), 0) || 0;

  const efectivo = methods.filter(pm => {
    if (isAssigned(pm)) return false;
    const name = normalize(pm.name);
    return name === 'EFECTIVO' || name.includes('CASH');
  }).reduce((acc, pm) => acc + assignAndSum(pm), 0);

  const credito = methods.filter(pm => {
    if (isAssigned(pm)) return false;
    const name = normalize(pm.name);
    return name === 'CREDITO' || name === 'CREDIT' ||
      (name.includes('CREDITO') && !name.includes('TC') && !name.includes('TARJETA') && !name.includes('CARD'));
  }).reduce((acc, pm) => acc + assignAndSum(pm), 0);

  const tarjetas = methods.filter(pm => {
    if (isAssigned(pm)) return false;
    const name = normalize(pm.name);
    return name.startsWith('TC') || name.includes('ATLANTID') ||
      (name.includes('TARJETA') && !name.includes('CREDITO'));
  }).reduce((acc, pm) => acc + assignAndSum(pm), 0);

  const transferencias = methods.filter(pm => {
    if (isAssigned(pm)) return false;
    const name = normalize(pm.name);
    return name === 'TRANSFERENCIA' || name.includes('TRANSFERENCIA');
  }).reduce((acc, pm) => acc + assignAndSum(pm), 0);

  const aplicaciones = methods.filter(pm => {
    if (isAssigned(pm)) return false;
    const name = normalize(pm.name);
    return name.includes('APLICACION') || name.includes('APLICACION') ||
      name.includes('APP') || name.includes('PAGO POR');
  }).reduce((acc, pm) => acc + assignAndSum(pm), 0);

  const otros = methods.filter(pm => !isAssigned(pm))
    .reduce((acc, pm) => acc + (metric === 'amount' ? (pm.amount || 0) : (pm.count || 0)), 0);

  const getPct = (val: number) => totalValue > 0 ? ((val / totalValue) * 100).toFixed(0) : '0';

  const fmt = (val: number) => val.toLocaleString('en-US', {
    minimumFractionDigits: metric === 'amount' ? 2 : 0,
    maximumFractionDigits: metric === 'amount' ? 2 : 0
  });

  return { totalValue, efectivo, credito, tarjetas, transferencias, aplicaciones, otros, getPct, fmt };
}

function StatCard({ icon, label, value, pct, gradient }: {
  icon: string;
  label: string;
  value: string;
  pct: string;
  gradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-3 border`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      </div>
      <div className="text-lg font-black">{value}</div>
      <div className="text-[9px] text-muted-foreground">{pct}% del total</div>
    </div>
  );
}

export function DashboardPaymentCards({ paymentMethods, paymentMetric, onMetricChange }: Props) {
  if (!paymentMethods || paymentMethods.length === 0) return null;

  const { totalValue, efectivo, credito, tarjetas, transferencias, aplicaciones, otros, getPct, fmt } =
    classifyPayments(paymentMethods, paymentMetric);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-bold">Metodos de Pago</CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => onMetricChange('amount')}
            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
              paymentMetric === 'amount' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted/30'
            }`}
          >
            MONETARIO
          </button>
          <button
            onClick={() => onMetricChange('count')}
            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
              paymentMetric === 'count' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted/30'
            }`}
          >
            DESPACHOS
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon="T" label="Total Consolidado" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(totalValue)}`} pct="100" gradient="from-blue-500/20 to-blue-600/10" />
            <StatCard icon="EF" label="Efectivo" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(efectivo)}`} pct={getPct(efectivo)} gradient="from-emerald-500/20 to-emerald-600/10" />
            <StatCard icon="CR" label="Credito" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(credito)}`} pct={getPct(credito)} gradient="from-pink-500/20 to-pink-600/10" />
            <StatCard icon="TC" label="Tarjetas" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(tarjetas)}`} pct={getPct(tarjetas)} gradient="from-amber-500/20 to-amber-600/10" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="TR" label="Transferencias" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(transferencias)}`} pct={getPct(transferencias)} gradient="from-purple-500/20 to-purple-600/10" />
            <StatCard icon="AP" label="Aplicaciones" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(aplicaciones)}`} pct={getPct(aplicaciones)} gradient="from-orange-500/20 to-orange-600/10" />
            <StatCard icon=".." label="Otros Metodos" value={`${paymentMetric === 'amount' ? 'L ' : ''}${fmt(otros)}`} pct={getPct(otros)} gradient="from-cyan-500/20 to-cyan-600/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-muted/5 rounded-xl p-4 border border-border/40">
            <h4 className="text-[11px] font-black uppercase text-muted-foreground/80 tracking-wider mb-4">
              {paymentMetric === 'amount' ? 'Monto por Metodo de Pago' : 'Despachos por Metodo de Pago'}
            </h4>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...paymentMethods].sort((a, b) =>
                    (paymentMetric === 'amount' ? (b.amount || 0) - (a.amount || 0) : (b.count || 0) - (a.count || 0))
                  )}
                  layout="vertical"
                  margin={{ top: 5, right: 80, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(val: any) => {
                    const n = Number(val) || 0;
                    return paymentMetric === 'amount' ? `L${(n/1000000).toFixed(1)}M` : String(n);
                  }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const val = Number(item?.value) || 0;
                      const formatted = paymentMetric === 'amount'
                        ? `L. ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : String(val);
                      return (
                        <div style={{ backgroundColor: 'hsl(var(--card))', padding: '6px 10px', borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 11 }}>
                          {item?.payload?.name}: {formatted}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey={paymentMetric} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-muted/5 rounded-xl p-4 border border-border/40">
            <h4 className="text-[11px] font-black uppercase text-muted-foreground/80 tracking-wider mb-4">Distribucion</h4>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods.map(pm => ({
                      name: pm.name,
                      value: paymentMetric === 'amount' ? (pm.amount || 0) : (pm.count || 0)
                    }))}
                    cx="50%"
                    cy="45%"
                    outerRadius={120}
                    dataKey="value"
                    label={false}
                  >
                    {paymentMethods.map((pm, idx) => (
                      <Cell key={pm.name} fill={`hsl(${idx * 40}, 60%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', fontSize: 11, borderRadius: 8 }}
                    formatter={(_value: any, _name: any, _props: any) => {
                      const val = Number(_value) || 0;
                      return [paymentMetric === 'amount' ? `L. ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : val, _props?.payload?.name || _name || ''];
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
