import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel } from 'lucide-react';
import { VolumeDisplay } from "./VolumeDisplay";

interface Props {
  pumps: any[];
  totalVolume: number;
  totalVolumeGL: number;
  totalAmount: number;
  formatCurrency: (n: number) => string;
}

export function DashboardPumpMonitor({ pumps, totalVolume, totalVolumeGL, totalAmount, formatCurrency }: Props) {
  if (!pumps || pumps.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Fuel className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Control Operativo de Bombas</h1>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-black border border-primary/20">
            Litros: {Number(totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} LT
          </span>
          <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-sm font-black border border-orange-500/20">
            Galones: {Number(totalVolumeGL || 0).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} GL
          </span>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-black border border-primary/20">
            Monto: {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pumps.map((pump: any) => (
          <Card key={pump.pumpId} className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Fuel className="h-12 w-12 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Surtidor</p>
                  <CardTitle className="text-3xl font-black italic">#{pump.pumpId}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Volumen Surtidor</p>
                  <div className="flex flex-col items-end">
                    <VolumeDisplay
                      volumeLT={pump.totalVolumeLT}
                      volumeGL={pump.totalVolumeGL}
                      volume={pump.totalVolume}
                      decimals={6}
                      compact
                      primaryClassName="text-lg font-bold text-sky-600 leading-none"
                      secondaryClassName="text-lg font-bold"
                    />
                    <p className="text-lg font-black text-primary/80 font-mono mt-0.5">
                      {formatCurrency(pump.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {pump.nozzles?.map((nozzle: any) => (
                  <div key={nozzle.hoseId} className="bg-background/40 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(nozzle.volumeLT || nozzle.volume || 0) > 0 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                        <span className="text-[11px] font-bold uppercase tracking-tighter">{nozzle.gradeName}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 py-0.5 px-2 rounded-md bg-primary/10 border border-primary/20">
                        <VolumeDisplay
                          volumeLT={nozzle.volumeLT}
                          volumeGL={nozzle.volumeGL}
                          volume={nozzle.volume}
                          decimals={6}
                          compact
                          primaryClassName="text-[10px] font-bold text-sky-600"
                          secondaryClassName="text-[10px] font-bold"
                        />
                        <span className="text-sm font-mono font-black text-primary/70">
                          {formatCurrency(nozzle.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
                        style={{ width: `${Math.min(((nozzle.volumeLT || nozzle.volume || 0) / (pump.totalVolumeLT || pump.totalVolume || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
