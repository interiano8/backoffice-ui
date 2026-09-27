import { cn } from "@/lib/utils";
import type { Shift } from '@/types/api';

export default function FusionDetailsReportContent({ fusionDetails, globalDate, store, filteredShifts }: {
  fusionDetails: any[]; globalDate: string; store: any; filteredShifts: Shift[];
}) {
  if (!fusionDetails || fusionDetails.length === 0) return null;

  const fsShiftIds = Array.from(new Set(filteredShifts.filter(s => s.fsShiftIds).flatMap(s => s.fsShiftIds!.split('|').map((id: string) => id.trim())))).join(' | ');
  const shiftNumbers = Array.from(new Set(filteredShifts.map(s => s.shiftNo))).sort((a, b) => Number(a) - Number(b)).join(' | ');

  return (
    <div className="w-full">
      <table className="w-full min-w-full border-collapse table-auto">
        <thead className="print-header">
          <tr>
            <th colSpan={11} className="text-left font-normal pb-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-3 w-full">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{store?.titulo || 'REPORTE DE TURNO'}</h1>
                    <p className="text-[10px] font-bold uppercase text-slate-800">{store?.name || 'ESTACION'} | RTN: {store?.RTN || '0000-0000-000000'}</p>
                    <p className="text-[8.5px] text-slate-700">{store?.address || 'Direccion General de la Estacion'}</p>
                    <div className="flex gap-4 text-[9px] mt-2 pt-2 border-t border-slate-100 items-center text-slate-800">
                      <p><span className="font-bold">FECHA REPORTE:</span> {globalDate}</p>
                      <p><span className="font-bold">HORA:</span> {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="h-10 w-24 flex items-center justify-end overflow-hidden mb-2">
                      <img src={store?.logoUrl || "/store.jpg"} alt="Station Logo" className="h-full w-auto object-contain" />
                    </div>
                    <div className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase mb-1">CUADRE INTEGRAL</div>
                    <div className="text-[8px] font-mono text-slate-800 text-right space-y-0.5">
                      <p className="truncate">CTRL: {fsShiftIds}</p>
                      <p>TURNOS POS: {shiftNumbers}</p>
                    </div>
                  </div>
                </div>
              </div>
            </th>
          </tr>
          <tr className="bg-slate-100 border-y border-slate-300 text-[10px]">
            <th className="py-2 px-1 text-center border-r border-slate-200 w-12 text-slate-900">Bomba</th>
            <th className="py-2 px-1 text-center border-r border-slate-200 w-12 text-slate-900">Mang.</th>
            <th className="py-2 px-1 text-left border-r border-slate-200 text-slate-900">Producto</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 bg-slate-50/50 underline text-slate-900">Cont. Inicio</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 bg-slate-50/50 underline text-slate-900">Cont. Fin</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 text-blue-900">Cant. TPV</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 text-purple-900">Cant. Fusion</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 font-black">Dif. Cant.</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 text-blue-900">Monto TPV</th>
            <th className="py-2 px-2 text-right border-r border-slate-200 text-purple-900">Monto Fusion</th>
            <th className="py-2 px-2 text-right font-black">Dif. Monto</th>
          </tr>
        </thead>
        <tbody>
          {fusionDetails.map((row: any, idx) => (
            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/30 h-7 even:bg-slate-50/20">
              <td className="text-center font-bold border-r border-slate-100 text-slate-900">#{row.pumpId}</td>
              <td className="text-center border-r border-slate-100 text-slate-800">{row.displayHose || row.hoseId}</td>
              <td className="px-2 border-r border-slate-100 font-bold text-slate-900">{row.productName}</td>
              <td className="px-1 text-right border-r border-slate-100 font-mono text-slate-800 text-[8px] whitespace-nowrap italic">{Number(row.initialVolume).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
              <td className="px-1 text-right border-r border-slate-100 font-mono text-slate-800 text-[8px] whitespace-nowrap italic">{Number(row.finalVolume).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
              <td className="px-2 text-right border-r border-slate-100 font-mono text-blue-900 font-black">{Number(row.tpvVolume).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
              <td className="px-2 text-right border-r border-slate-100 font-mono text-purple-900 font-black">{Number(row.fusionVolume).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
              <td className={cn("px-2 text-right border-r border-slate-100 font-mono font-black", Math.abs(row.diffVolume) > 0.000001 ? "text-red-600 underline" : "text-green-700")}>{Number(row.diffVolume).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
              <td className="px-2 text-right border-r border-slate-100 font-mono text-blue-900 font-black italic">{Number(row.tpvAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-2 text-right border-r border-slate-100 font-mono text-purple-900 font-black italic">{Number(row.fusionAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className={cn("px-2 text-right font-mono font-black", Math.abs(row.diffAmount) > 0.1 ? "text-red-700 underline" : "text-green-800")}>{Number(row.diffAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-100 border-t-2 border-slate-900">
          <tr className="h-8 font-black text-[9px]">
            <td colSpan={5} className="text-center uppercase tracking-tighter italic">TOTALES DE REPORTE CTRL</td>
            <td className="px-1 text-right border-r border-slate-200 text-blue-900">{fusionDetails.reduce((acc: number, r: any) => acc + Number(r.tpvVolume), 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
            <td className="px-1 text-right border-r border-slate-200 text-purple-900">{fusionDetails.reduce((acc: number, r: any) => acc + Number(r.fusionVolume), 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
            <td className="px-1 text-right border-r border-slate-200">{fusionDetails.reduce((acc: number, r: any) => acc + Number(r.diffVolume), 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
            <td className="px-1 text-right border-r border-slate-200 text-blue-900 italic">L. {fusionDetails.reduce((acc: number, r: any) => acc + Number(r.tpvAmount), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="px-1 text-right border-r border-slate-200 text-purple-900 italic">L. {fusionDetails.reduce((acc: number, r: any) => acc + Number(r.fusionAmount), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="px-1 text-right">L. {fusionDetails.reduce((acc: number, r: any) => acc + Number(r.diffAmount), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
      <div className="mt-12 grid grid-cols-3 gap-12 px-6 break-inside-avoid">
        <div className="text-center pt-8 border-t border-slate-900"><p className="text-[10px] uppercase font-bold text-slate-600">Elaborado Por</p><p className="font-black text-slate-900 uppercase mt-1 italic">-</p></div>
        <div className="text-center pt-8 border-t border-slate-900"><p className="text-[10px] uppercase font-bold text-slate-600">Revisado Por</p><p className="font-black text-slate-900 uppercase mt-1 italic">Administracion</p></div>
        <div className="text-center pt-8 border-t border-slate-900"><p className="text-[10px] uppercase font-bold text-slate-600">Sello de Sucursal</p><p className="font-black text-slate-900 uppercase mt-1 italic">{store?.name || 'SUCURSAL'}</p></div>
      </div>
      <div className="mt-8 text-center text-[7px] text-slate-800 font-mono tracking-widest italic border-t border-slate-200 pt-2 break-inside-avoid uppercase">
        REPORTE DE CONCILIACION CTRL - GENERADO POR SISTEMA BCPOS v2 - {new Date().getFullYear()}
      </div>
    </div>
  );
}
