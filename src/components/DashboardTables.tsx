import { getProductColor } from '../domain/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Droplets } from 'lucide-react';
import { VolumeDisplay } from "./VolumeDisplay";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "../types/api";

interface Props {
  data: DashboardData | null;
}

export function DashboardTables({ data }: Props) {
  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-2xl border-border bg-card/30 overflow-hidden ring-1 ring-white/5">
          <CardHeader className="bg-muted/10">
            <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Despachos por Pistero
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <table className="w-full text-sm text-left border-separate border-spacing-0">
                <thead className="text-[10px] uppercase font-black text-muted-foreground sticky top-0 bg-card z-20 shadow-sm">
                  <tr className="bg-card">
                    <th className="px-6 py-4 border-b border-border/40">Datos del Empleado</th>
                    <th className="px-6 py-4 text-right border-b border-border/40">Venta Total</th>
                    <th className="px-6 py-4 text-right border-b border-border/40">Volumen</th>
                    <th className="px-6 py-4 text-right border-b border-border/40">Despachos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data?.attendants?.map((a) => (
                    <tr key={a.employee} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <p className="font-black text-sm text-foreground leading-tight uppercase tracking-tight">{a.fullName}</p>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase w-fit">
                            Usuario: {a.employee}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-primary font-bold">{formatCurrency(a.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <VolumeDisplay
                          volumeLT={a.volumeLT}
                          volumeGL={a.volumeGL}
                          volume={a.volume}
                          decimals={6}
                          compact
                          primaryClassName="text-xs font-medium"
                          secondaryClassName="text-[9px]"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant="secondary" className="font-mono font-bold">{a.count}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/20 font-black uppercase border-t-2 border-border">
                  <tr>
                    <td className="px-6 py-4 italic">Totales</td>
                    <td className="px-6 py-4 text-right text-primary">
                      {formatCurrency(data?.attendants?.reduce((acc: number, a: any) => acc + (a.amount || 0), 0) || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VolumeDisplay
                        volumeLT={data?.attendants?.reduce((acc: number, a: any) => acc + (a.volumeLT || a.volume || 0), 0)}
                        volumeGL={data?.attendants?.reduce((acc: number, a: any) => acc + (a.volumeGL || 0), 0)}
                        decimals={6}
                        compact
                        primaryClassName="text-xs font-medium"
                        secondaryClassName="text-[9px]"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="outline">{data?.attendants?.reduce((acc: number, a: any) => acc + (a.count || 0), 0) || 0}</Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-border bg-card/30 backdrop-blur-sm ring-1 ring-white/5">
          <CardHeader className="bg-muted/10">
            <CardTitle className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top 10 Clientes por Volumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/5">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-muted/20 text-muted-foreground font-black uppercase">
                  <tr>
                    <th className="px-4 py-3 w-16">#</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-right">Volumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-bold">
                  {data?.topCustomers?.slice(0, 10).map((c, idx) => (
                    <tr key={`${c.name}-${idx}`} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground/60 text-center">
                        {idx === 0 ? '#1' : idx === 1 ? '#2' : idx === 2 ? '#3' : (idx + 1)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="uppercase tracking-wider text-muted-foreground/90 leading-tight">
                            {c.name}
                          </span>
                          <div className={`text-[8px] font-black w-fit px-1.5 py-0.5 rounded leading-none ${c.type === 'CRÉDITO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-primary/20 text-primary border border-primary/20'}`}>
                            {c.type}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <VolumeDisplay
                          volumeLT={c.volumeLT}
                          volumeGL={c.volumeGL}
                          volume={c.volume}
                          decimals={6}
                          compact
                          primaryClassName="text-xs font-medium text-primary"
                          secondaryClassName="text-[9px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xl border-border bg-card/30 overflow-hidden ring-1 ring-white/5">
        <CardHeader className="bg-muted/10">
          <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Resumen por Combustible
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase font-bold text-muted-foreground border-b border-border/40 bg-muted/5">
              <tr>
                <th className="px-6 py-3">Combustible</th>
                <th className="px-6 py-3 text-right">Monto</th>
                <th className="px-6 py-3 text-right">Volumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data?.products?.map((p, idx) => (
                <tr key={p.name} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getProductColor(p.name, idx) }} />
                    {p.name}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-primary font-bold">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <VolumeDisplay
                      volumeLT={p.volumeLT}
                      volumeGL={p.volumeGL}
                      volume={p.volume}
                      decimals={6}
                      compact
                      primaryClassName="text-sm font-medium"
                      secondaryClassName="text-[10px]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/20 font-black uppercase border-t-2 border-border">
              <tr>
                <td className="px-6 py-4 italic">Total Consolidado</td>
                <td className="px-6 py-4 text-right text-primary">
                  {formatCurrency(data?.products?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0)}
                </td>
                <td className="px-6 py-4 text-right">
                  <VolumeDisplay
                    volumeLT={data?.totalVolumeLT}
                    volumeGL={data?.totalVolumeGL}
                    volume={data?.totalVolume}
                    decimals={6}
                    compact
                    primaryClassName="text-sm font-bold"
                    secondaryClassName="text-[10px]"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
