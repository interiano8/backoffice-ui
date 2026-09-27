import { getProductColor } from '../domain/dashboard';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Droplets } from 'lucide-react';
import { VolumeDisplay } from "./VolumeDisplay";

interface Props {
  products: any[];
  formatCurrency: (n: number) => string;
}

export function DashboardProductCards({ products, formatCurrency }: Props) {
  if (!products || products.length === 0) return null;

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total Productos Combustible</p>
                <p className="text-lg font-black text-foreground">{products.length} productos</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Monto Total</p>
                <p className="text-xl font-black text-primary">{formatCurrency(products.reduce((acc: number, p: any) => acc + (p.amount || 0), 0))}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Litros</p>
                <p className="text-lg font-black text-sky-500">{Number(products.reduce((acc: number, p: any) => acc + (p.volumeLT || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} LT</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Galones</p>
                <p className="text-lg font-black text-sky-400">{Number(products.reduce((acc: number, p: any) => acc + (p.volumeGL || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} GL</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Total Despachos</p>
                <p className="text-lg font-black text-orange-500">{products.reduce((acc: number, p: any) => acc + (p.count || 0), 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {products.map((p: any, idx: number) => {
          const productCol = getProductColor(p.name, idx);
          return (
            <Card
              key={p.name}
              className="relative bg-card/40 backdrop-blur-xl border border-border/80 overflow-hidden group hover:bg-card/60 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div
                className="h-1.5 w-full absolute top-0 left-0 opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(90deg, ${productCol}, ${productCol}dd)`,
                  boxShadow: `0 2px 10px ${productCol}44`
                }}
              />

              <CardContent className="p-5 pt-7">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: productCol }} />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                          {p.name}
                        </p>
                      </div>
                      <h3 className="text-2xl font-black text-foreground tracking-tighter group-hover:scale-105 transition-transform origin-left">
                        {formatCurrency(p.amount)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Droplets className="w-4 h-4" style={{ color: productCol }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Volumen Despachado</span>
                      <VolumeDisplay
                        volumeLT={p.volumeLT}
                        volumeGL={p.volumeGL}
                        volume={p.volume}
                        decimals={6}
                        compact
                        primaryClassName="text-sm font-bold text-sky-600"
                        secondaryClassName="text-[10px]"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Despachos</span>
                      <p className="text-xs font-bold text-foreground/80">{p.count || 0}</p>
                    </div>
                  </div>

                  {p.prices && p.prices.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 block mb-1">Precios</span>
                      <p className="text-[11px] font-mono font-bold text-primary">
                        {p.prices.map((price: number) => formatCurrency(price)).join(' | ')}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity blur-2xl"
                  style={{ backgroundColor: productCol }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
