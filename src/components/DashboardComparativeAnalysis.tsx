import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Coins, RefreshCcw } from 'lucide-react';
import { formatCurrency } from "@/lib/format";
import type { MonthlyData } from "@/types/api";

interface Props {
  monthlyData: MonthlyData;
  loadingMonthly: boolean;
  tempPeriod1Start: string;
  tempPeriod1End: string;
  tempPeriod2Start: string;
  tempPeriod2End: string;
  hasPendingChanges: boolean;
  onTempPeriod1StartChange: (v: string) => void;
  onTempPeriod1EndChange: (v: string) => void;
  onTempPeriod2StartChange: (v: string) => void;
  onTempPeriod2EndChange: (v: string) => void;
  onApplyDateChanges: () => void;
}

export function DashboardComparativeAnalysis({
  monthlyData, loadingMonthly,
  tempPeriod1Start, tempPeriod1End, tempPeriod2Start, tempPeriod2End,
  hasPendingChanges,
  onTempPeriod1StartChange, onTempPeriod1EndChange,
  onTempPeriod2StartChange, onTempPeriod2EndChange,
  onApplyDateChanges,
}: Props) {
  const totalRef = monthlyData.period2.contado + monthlyData.period2.credito;
  const totalActual = monthlyData.period1.contado + monthlyData.period1.credito;
  const totalDiff = totalActual - totalRef;
  const totalPct = totalRef > 0 ? ((totalDiff / totalRef) * 100) : 0;

  const contadoDiff = monthlyData.period1.contado - monthlyData.period2.contado;
  const contadoPct = monthlyData.period2.contado > 0 ? ((contadoDiff / monthlyData.period2.contado) * 100) : 0;

  const creditoDiff = monthlyData.period1.credito - monthlyData.period2.credito;
  const creditoPct = monthlyData.period2.credito > 0 ? ((creditoDiff / monthlyData.period2.credito) * 100) : 0;

  const descDiff = monthlyData.discountComparison?.difference || 0;
  const descPct = monthlyData.discountComparison?.percentChange || 0;

  return (
    <div className="space-y-6 border-t border-border/40 pt-6 mt-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2 uppercase">
          <TrendingUp className="w-6 h-6 text-primary" />
          Analisis Contado / Credito
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border border-border/40">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Referencia:</span>
            <input type="date" className="bg-transparent border-none text-xs font-bold focus:outline-none w-28" value={tempPeriod2Start} onChange={e => onTempPeriod2StartChange(e.target.value)} />
            <span className="text-muted-foreground">→</span>
            <input type="date" className="bg-transparent border-none text-xs font-bold focus:outline-none w-28" value={tempPeriod2End} onChange={e => onTempPeriod2EndChange(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-2 border border-primary/30">
            <span className="text-[10px] font-bold text-primary uppercase">Analizar:</span>
            <input type="date" className="bg-transparent border-none text-xs font-bold focus:outline-none w-28 text-primary" value={tempPeriod1Start} onChange={e => onTempPeriod1StartChange(e.target.value)} />
            <span className="text-primary">→</span>
            <input type="date" className="bg-transparent border-none text-xs font-bold focus:outline-none w-28 text-primary" value={tempPeriod1End} onChange={e => onTempPeriod1EndChange(e.target.value)} />
          </div>
          {hasPendingChanges && (
            <Button onClick={onApplyDateChanges} disabled={loadingMonthly} size="sm" className="h-8">
              {loadingMonthly ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><TrendingUp className="w-4 h-4 mr-1" /> Analizar</>}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Ventas Totales</span>
            <div className="text-xl font-black text-blue-400">{formatCurrency(totalActual)}</div>
            <div className={`flex items-center gap-1 text-[11px] ${totalDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span>{totalDiff >= 0 ? '↑' : '↓'}</span>
              <span>{totalDiff >= 0 ? '+' : ''}{totalPct.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs referencia</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Contado</span>
            <div className="text-xl font-black text-emerald-400">{formatCurrency(monthlyData.period1.contado)}</div>
            <div className={`flex items-center gap-1 text-[11px] ${contadoDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span>{contadoDiff >= 0 ? '↑' : '↓'}</span>
              <span>{contadoDiff >= 0 ? '+' : ''}{contadoPct.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs referencia</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Credito</span>
            <div className="text-xl font-black text-orange-400">{formatCurrency(monthlyData.period1.credito)}</div>
            <div className={`flex items-center gap-1 text-[11px] ${creditoDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span>{creditoDiff >= 0 ? '↑' : '↓'}</span>
              <span>{creditoDiff >= 0 ? '+' : ''}{creditoPct.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs referencia</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Descuentos</span>
            <div className="text-xl font-black text-red-400">{formatCurrency(monthlyData.discountComparison?.current || 0)}</div>
            <div className={`flex items-center gap-1 text-[11px] ${descDiff <= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span>{descDiff <= 0 ? '↓' : '↑'}</span>
              <span>{descDiff >= 0 ? '+' : ''}{descPct.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs referencia</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-xl border-border bg-card/30 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Contado vs Credito
            </CardTitle>
            <div className="flex items-center justify-between text-[9px] mt-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-muted-foreground">Periodo Analizado</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500" /><span className="text-muted-foreground">Periodo Referencia</span></div>
            </div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
              <span>({monthlyData.period1.label})</span>
              <span>({monthlyData.period2.label})</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[{
              label: 'CONTADO', color: 'blue', value: monthlyData.period1.contado,
              refValue: monthlyData.period2.contado, textColor: 'text-blue-400'
            }, {
              label: 'CREDITO', color: 'orange', value: monthlyData.period1.credito,
              refValue: monthlyData.period2.credito, textColor: 'text-orange-400'
            }].map(({ label, color, value, refValue, textColor }) => {
              const diff = value - refValue;
              const pct = refValue > 0 ? ((diff / refValue) * 100) : 0;
              const maxVal = Math.max(monthlyData.period1.contado, monthlyData.period2.contado, monthlyData.period1.credito, monthlyData.period2.credito);
              return (
                <div key={label} className="grid grid-cols-[100px_1fr_100px] gap-4 items-center">
                  <div>
                    <div className={`text-xs font-bold ${textColor}`}>{label}</div>
                    <div className={`text-[9px] font-black ${textColor}`}>{formatCurrency(value)}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-7 bg-muted rounded overflow-hidden relative">
                      <div className={`h-full bg-${color}-500 rounded flex items-center justify-end px-2 absolute right-0`}
                        style={{ width: `${(value / maxVal) * 100}%`, backgroundColor: color === 'blue' ? '#3b82f6' : '#f97316' }}>
                        <span className="text-[10px] text-white font-bold">{(value / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                    <div className="h-5 bg-muted rounded overflow-hidden relative">
                      <div className="h-full bg-slate-600 rounded flex items-center justify-end px-2 absolute right-0"
                        style={{ width: `${(refValue / maxVal) * 100}%` }}>
                        <span className="text-[10px] text-white/70 font-medium">{(refValue / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1">DIFERENCIA</div>
                    <div className={`text-[9px] font-mono font-bold ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </div>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${diff >= 0 ? `bg-${color}-500/20 ${textColor}` : 'bg-red-500/20 text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
            {(() => {
              const ref = monthlyData.period2.contado + monthlyData.period2.credito;
              const actual = monthlyData.period1.contado + monthlyData.period1.credito;
              const diff = actual - ref;
              const pct = ref > 0 ? ((diff / ref) * 100) : 0;
              return (
                <div className="pt-4 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">TOTAL</span>
                    <span className={`text-lg font-mono font-bold ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </span>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${diff >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>Las ventas totales {diff >= 0 ? 'aumentaron' : 'disminuyeron'} {Math.abs(pct).toFixed(1)}% vs referencia</span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-border bg-card/30 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
              <Coins className="w-4 h-4 text-red-500" />
              Monto en Descuentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Periodo Analizado</p>
              <p className="text-2xl font-black text-red-400">{formatCurrency(monthlyData.discountComparison?.current || 0)}</p>
            </div>
            <div className="text-center py-2 bg-muted/20 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Periodo Referencia</p>
              <p className="text-lg font-mono text-muted-foreground">{formatCurrency(monthlyData.discountComparison?.previous || 0)}</p>
            </div>
            <div className="pt-3 border-t border-border/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">Diferencia</span>
                <span className={`font-mono font-bold ${descDiff <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {descDiff >= 0 ? '+' : ''}{formatCurrency(descDiff)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Porcentaje</span>
                <Badge variant={descDiff <= 0 ? "default" : "destructive"} className="text-[10px]">
                  {descDiff >= 0 ? '+' : ''}{descPct.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-border bg-card/30 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Crecimiento por Combustible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(() => {
              const maxVal = Math.max(...monthlyData.fuelGrowth?.map((f: any) => Math.max(f.currentAmount, f.previousAmount)) || [0]);
              return monthlyData.fuelGrowth?.map((fuel: any, idx: number) => {
                const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#a855f7'];
                const color = colors[idx % colors.length];
                return (
                  <div key={fuel.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-bold uppercase tracking-wide">{fuel.name}</span>
                      </div>
                      <span className={`text-lg font-black ${fuel.growthPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fuel.growthPercent > 0 ? '+' : ''}{fuel.growthPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                        <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${(fuel.currentAmount / maxVal) * 100}%` }} />
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                        <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(fuel.previousAmount / maxVal) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[10px]">
                      <span className="text-muted-foreground font-mono">{formatCurrency(fuel.previousAmount)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground font-mono font-bold">{formatCurrency(fuel.currentAmount)}</span>
                    </div>
                  </div>
                );
              });
            })()}
            <div className="pt-4 border-t border-border/40">
              {(() => {
                const totalRef = monthlyData.fuelGrowth?.reduce((acc: number, f: any) => acc + f.previousAmount, 0) || 0;
                const totalActual = monthlyData.fuelGrowth?.reduce((acc: number, f: any) => acc + f.currentAmount, 0) || 0;
                const diff = totalActual - totalRef;
                const pct = totalRef > 0 ? ((diff / totalRef) * 100) : 0;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">TOTAL COMBUSTIBLE</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-mono font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                        </span>
                        <span className={`text-sm font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div className={`flex items-center gap-2 text-[10px] ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span>Las ventas de combustible {diff > 0 ? 'aumentaron' : 'disminuyeron'} {Math.abs(pct).toFixed(1)}% vs referencia</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-muted/20 to-muted/10 border-border">
        <CardContent className="p-4">
          <span className="text-xs font-black uppercase tracking-wider">Resumen General</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Periodo Referencia</p>
              <p className="text-lg font-mono font-bold text-muted-foreground">{formatCurrency(monthlyData.period2.contado + monthlyData.period2.credito)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-primary uppercase mb-1">Periodo Analizado</p>
              <p className="text-lg font-mono font-bold text-primary">{formatCurrency(monthlyData.period1.contado + monthlyData.period1.credito)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Diferencia Total</p>
              <p className={`text-lg font-mono font-bold ${totalDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Variacion %</p>
              <Badge variant={totalDiff >= 0 ? "default" : "destructive"} className="text-sm">
                {totalDiff >= 0 ? '+' : ''}{totalPct.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
