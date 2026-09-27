import React from 'react';
import { cn } from "@/lib/utils";
import { formatTimeLiteral, formatShiftDate } from "@/lib/format";
import type { Shift } from '@/types/api';

function groupItems(items: any[], key: string) {
  if (!items) return [];
  return items.reduce((acc: any[], current: any) => {
    const existing = acc.find(item => item[key] === current[key]);
    let currentPrices: string[] = [];
    if (current.prices && typeof current.prices === 'string') {
      currentPrices = current.prices.split(' | ').filter(Boolean);
    } else {
      const p = Number(current.unitPrice || current.price || 0);
      if (p > 0) currentPrices = [p.toLocaleString('en-US', { minimumFractionDigits: 2 })];
    }
    if (existing) {
      existing.amount += current.amount || 0;
      existing.discount = (existing.discount || 0) + (current.discount || 0);
      if (current.volumeGL) existing.volumeGL += current.volumeGL;
      if (current.quantity) existing.quantity += current.quantity;
      if (current.fsVolume) existing.fsVolume = (existing.fsVolume || 0) + Number(current.fsVolume);
      if (current.fsAmount) existing.fsAmount = (existing.fsAmount || 0) + Number(current.fsAmount);
      currentPrices.forEach(p => {
        if (!existing.allPrices.includes(p)) existing.allPrices.push(p);
      });
      existing.displayPrice = existing.allPrices.sort().join(' | ');
    } else {
      acc.push({
        ...current,
        fsVolume: Number(current.fsVolume || 0), fsAmount: Number(current.fsAmount || 0),
        discount: Number(current.discount || 0), appliedDocNo: current.appliedDocNo,
        allPrices: [...currentPrices], displayPrice: currentPrices.sort().join(' | ')
      });
    }
    return acc;
  }, []);
}

export default function ShiftReportContent({ shift, details, metadata, store, user }: {
  shift: Shift | null; details: any; metadata: any; store: any; user: any;
}) {
  if (!shift) return null;

  const groupedFuel = groupItems((details.fuel || []).filter((i: any) => !i.isTicket), 'productName');
  const groupedProducts = groupItems(details.products, 'productName');

  const fuelTotalCtrl = (details.fuel || []).reduce((acc: number, i: any) => acc + (i.fsAmount || 0), 0);
  const fuelNetPos = (details.fuel || []).filter((i: any) => !i.isTicket).reduce((acc: number, i: any) => acc + (i.amount || 0), 0);
  const productsNetPos = (details.products || []).reduce((acc: number, i: any) => acc + (i.amount || 0), 0);
  const otherProductsSalesPos = (details.fuel || []).filter((i: any) => !i.fsAmount && !i.isTicket).reduce((acc: number, i: any) => acc + (i.amount || 0), 0);
  const totalOtherProducts = productsNetPos + otherProductsSalesPos;
  const outflowsTotal = (details.documents?.outflows || []).reduce((acc: number, i: any) => acc + (i.totalAmount || 0), 0);
  const totalDiscounts = ((details.fuel || []).reduce((acc: number, i: any) => acc + (i.discount || 0), 0) +
    (details.products || []).reduce((acc: number, i: any) => acc + (i.discount || 0), 0));
  const totalCreditNotes = (details.documents?.creditNotes || []).reduce((acc: number, i: any) => acc + (i.totalAmount || 0), 0);
  const netSalesExpectedFuel = fuelTotalCtrl - (outflowsTotal + totalDiscounts + totalCreditNotes);
  const diffFuel = fuelNetPos - netSalesExpectedFuel;
  const totalNetSalesPos = fuelNetPos + totalOtherProducts;

  let parsedPresentation: any[] = [];
  if (shift.isPresented && shift.presentationDetails) {
    try {
      parsedPresentation = typeof shift.presentationDetails === 'string'
        ? JSON.parse(shift.presentationDetails) : shift.presentationDetails;
    } catch (e) {
      console.error('Error parsing presentationDetails', e);
    }
  }

  const systemMethods = details.paymentMethods || [];
  const combinedMethods = [...systemMethods];
  parsedPresentation.forEach(pres => {
    if (!combinedMethods.find((sm: any) => sm.description.toUpperCase() === pres.name.toUpperCase())) {
      combinedMethods.push({ description: pres.name, count: 0, amount: pres.expected || 0 });
    }
  });

  let totalCount = 0, totalSys = 0, totalDecl = 0, totalDiff = 0;
  const paymentRows = combinedMethods.map((pm: any) => {
    const presentation = parsedPresentation.find((p: any) => p.name.toUpperCase() === pm.description.toUpperCase());
    totalCount += (pm.count || 0);
    const sysAmount = presentation ? Number(presentation.expected || pm.amount || 0) : Number(pm.amount || 0);
    totalSys += sysAmount;
    const declaredAmt = presentation ? Number(presentation.declared || 0) : 0;
    const diffAmt = presentation ? Number(presentation.difference || 0) : 0;
    totalDecl += declaredAmt;
    totalDiff += diffAmt;
    return (
      <tr key={pm.description} className="border-b border-slate-100 h-6 even:bg-slate-50/30">
        <td className="px-3 font-black text-slate-900">{pm.description}</td>
        <td className="text-right px-3 text-slate-900 font-bold italic">{pm.count || '-'}</td>
        <td className="text-right px-3 font-mono font-black italic text-slate-900">
          {sysAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
        {shift.isPresented && shift.presentationDetails && (
          <>
            <td className="text-right px-3 font-mono font-bold italic text-slate-900">
              {presentation ? declaredAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
            </td>
            <td className={`text-right px-3 font-mono font-black italic ${diffAmt !== 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {presentation ? (diffAmt > 0 ? '+' : '') + diffAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
            </td>
          </>
        )}
      </tr>
    );
  });

  const diffFinal = totalDecl - totalNetSalesPos;
  const isCuadradoPrint = Math.abs(diffFuel) < 0.1 && (!shift.isPresented || Math.abs(diffFinal) < 0.1);
  let sIdx = 1;

  return (
    <div className="w-full">
      <table className="w-full">
        <thead className="print-header">
          <tr><td>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{store?.titulo || 'REPORTE DE TURNO'}</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase text-slate-800">{store?.name || ''} | RTN: {store?.RTN || 'N/D'}</p>
                  </div>
                  <p className="text-[8.5px] text-slate-700 max-w-sm">{store?.address || 'Direccion no disponible'}</p>
                </div>
                <div className="text-right">
                  <div className="h-12 w-28 flex items-center justify-end overflow-hidden">
                    <img src={store?.logoUrl || "/store.jpg"} alt="Station Logo" className="h-full w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-[8.5px]">
                <div className="space-y-0.5 text-slate-900 uppercase">
                  <p><span className="text-slate-900 font-bold">FECHA TURNO:</span> <span className="font-black">{(() => { const d = new Date(shift.shiftDate); return `${d.getUTCFullYear()}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCDate().toString().padStart(2, '0')}`; })()}</span></p>
                  <p><span className="text-slate-900 font-bold">FACTURADO POR:</span> <span className="font-black">{shift.employeeName.toUpperCase()}</span></p>
                  <p><span className="text-slate-900 font-bold">POS:</span> <span className="font-black">{shift.posCodes}</span></p>
                </div>
                <div className="text-right space-y-0.5 text-slate-900">
                  <p><span className="font-medium mr-1">IMPRESO POR:</span> <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{user?.name || metadata.printedBy}</span></p>
                  <p><span className="font-medium mr-1">FECHA IMPRESION:</span> {(() => { const d = new Date(metadata.printedAt); return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`; })()}</p>
                  <div className="flex flex-col items-end gap-1 mt-0.5 pt-0.5 border-t border-slate-100 italic">
                    <div className="flex items-center gap-2">
                      <p className="text-[8.5px] text-slate-900 font-black">
                        CTRL: <span className="font-black text-slate-900 mr-1">{shift.fsShiftIds || 'N/A'}</span>
                        | <span className="ml-1 uppercase tracking-tighter mr-0.5 text-[7.5px] font-bold">Horario:</span>
                        <span className="font-black text-slate-900">
                          {formatTimeLiteral(shift.startTime).substring(0, 5)} - {shift.endTime ? formatTimeLiteral(shift.endTime).substring(0, 5) : '...'}
                        </span>
                      </p>
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-tighter shadow-sm min-w-[60px] text-center", shift.endTime ? "bg-emerald-500 text-white" : "bg-red-500 text-white animate-pulse")}>
                        {shift.endTime ? "CERRADO" : "ABIERTO"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td></tr>
        </thead>
        <tbody>
          <tr><td>
            <div className="mb-1.5 overflow-hidden rounded-lg border border-slate-300">
              <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. DOCUMENTOS EMITIDOS</h2>
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-200 text-center bg-white h-7">
                <div className="flex flex-col justify-center"><p className="font-black text-slate-900 text-[8px] uppercase">Fact. Contado</p><p className="text-sm font-black text-slate-900">{details.counters?.InvoiceCashCount || 0}</p></div>
                <div className="flex flex-col justify-center"><p className="font-black text-slate-900 text-[8px] uppercase">Fact. Credito</p><p className="text-sm font-black text-slate-900">{details.counters?.InvoiceCreditCount || 0}</p></div>
                <div className="flex flex-col justify-center"><p className="font-black text-slate-900 text-[8px] uppercase">Notas Credito</p><p className="text-sm font-black text-slate-900">{details.counters?.CreditNoteCount || 0}</p></div>
                <div className="flex flex-col justify-center"><p className="font-black text-slate-900 text-[8px] uppercase">Tickets</p><p className="text-sm font-black text-slate-900">{details.counters?.OutflowCount || 0}</p></div>
              </div>
            </div>

            <div className="mb-1.5 overflow-hidden rounded-lg border border-slate-300">
              <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. RESUMEN DE VENTAS</h2>
                <span className="text-[8px] opacity-70 italic font-mono uppercase">Cantidades Acumuladas</span>
              </div>
              <table className="w-full text-[9px]">
                <thead className="text-slate-900 font-black uppercase">
                  <tr className="border-b-2 border-slate-900">
                    <th className="text-left w-1/4 py-1">Producto</th>
                    <th className="text-center py-1">Precio</th>
                    <th className="text-right py-1">Volumen (POS)</th>
                    <th className="text-right py-1">Monto (POS)</th>
                    <th className="text-right py-1">Descuento</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedFuel.map((item: any) => (
                    <tr key={item.productName} className="border-b border-slate-100 h-5 text-slate-900 font-bold">
                      <td>{item.productName}</td>
                      <td className="text-center italic text-slate-900">{item.displayPrice}</td>
                      <td className="text-right font-mono">{item.volumeGL?.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
                      <td className="text-right font-mono">{item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="text-right font-mono">{item.discount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="font-black bg-slate-100 border-t-2 border-slate-900 text-slate-950">
                    <td colSpan={2}>TOTAL RESUMEN</td>
                    <td className="text-right font-mono">{(details.fuel || []).filter((i: any) => !i.isTicket).reduce((acc: number, i: any) => acc + (i.volumeGL || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
                    <td className="text-right font-mono">{(details.fuel || []).filter((i: any) => !i.isTicket).reduce((acc: number, i: any) => acc + (i.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right font-mono">{(details.fuel || []).filter((i: any) => !i.isTicket).reduce((acc: number, i: any) => acc + (i.discount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-1.5 overflow-hidden rounded-lg border border-slate-300">
              <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. OTROS PRODUCTOS</h2>
              </div>
              <table className="w-full text-[9px]">
                <thead className="text-slate-900 font-black uppercase">
                  <tr className="border-b-2 border-slate-900">
                    <th className="text-left w-1/3 py-1">Descripcion</th>
                    <th className="text-center py-1">Precio</th>
                    <th className="text-right py-1">Cant.</th>
                    <th className="text-right py-1">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedProducts.map((item: any) => (
                    <tr key={item.productName} className="border-b border-slate-100 text-slate-900 font-bold">
                      <td>{item.productName}</td>
                      <td className="text-center italic text-slate-900">{item.displayPrice}</td>
                      <td className="text-right font-mono">{item.quantity?.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
                      <td className="text-right font-mono">{item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {groupedProducts.length > 0 && (
                    <tr className="font-black bg-slate-100 border-t-2 border-slate-900 text-slate-950">
                      <td colSpan={2}>TOTAL OTROS</td>
                      <td className="text-right font-mono">{details.products?.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
                      <td className="text-right font-mono">{details.products?.reduce((acc: number, i: any) => acc + (i.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {store?.printCreditInvoices !== false && details.documents?.invoicesCredit?.length > 0 && (
              <div className="mb-2 overflow-hidden rounded-lg border border-slate-300 break-inside-avoid">
                <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                  <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. FACTURAS DE CREDITO</h2>
                  <span className="text-[8px] opacity-70 italic font-mono">{details.documents.invoicesCredit.length} facturas</span>
                </div>
                <table className="w-full text-[9px] border-collapse">
                  <thead className="text-slate-900 font-black uppercase">
                    <tr className="border-b-2 border-slate-900">
                    <th className="text-left px-2 py-1">Cliente</th>
                    <th className="text-left px-2 py-1 w-12">Cta.</th>
                    <th className="text-left px-2 py-1">Producto</th>
                    <th className="text-right px-2 py-1 w-16">Cant.</th>
                    <th className="text-right px-2 py-1 w-20">Monto</th>
                    <th className="text-left px-2 py-1 w-24">RTN</th>
                    <th className="text-center px-2 py-1 w-20">Fecha</th>
                  </tr></thead>
                  <tbody>
                    {details.documents.invoicesCredit.map((inv: any) => (
                      <tr key={inv.docNo} className="border-b border-slate-100 text-slate-900 font-bold">
                        <td className="px-2 py-0.5">{inv.customerName || 'CLIENTE FINAL'}</td>
                        <td className="px-2 py-0.5 font-mono">{inv.customerNo || '-'}</td>
                        <td className="px-2 py-0.5 italic truncate max-w-[200px]">
                          {inv.lines?.map((l: any) => l.description).join(', ')}
                        </td>
                        <td className="px-2 py-0.5 text-right font-mono">
                          {inv.lines?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.lines?.[0]?.unit || 'UN'}
                        </td>
                        <td className="px-2 py-0.5 text-right font-mono font-black">
                          L. {Number(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-0.5 font-mono">{inv.rtn || '-'}</td>
                        <td className="px-2 py-0.5 text-center">
                          {formatShiftDate(shift.shiftDate) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


 
            {store?.printCreditInvoices !== false && (() => {
              const lealPayments = (details.documents?.invoicesCash || []).reduce((acc: any[], inv: any) => {
                const lp = inv.payments?.filter((p: any) => p.paymentMethod?.toUpperCase().includes('LEAL')) || [];
                lp.forEach((p: any) => {
                  acc.push({
                    ...inv,
                    lealAmount: Number(p.amount),
                    totalAmount: Number(inv.totalAmount),
                  });
                });
                return acc;
              }, []);
              if (lealPayments.length === 0) return null;
              return (
                <div className="mb-2 overflow-hidden rounded-lg border border-slate-300 break-inside-avoid">
                  <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                    <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. PAGOS LEAL</h2>
                    <span className="text-[8px] opacity-70 italic font-mono">{lealPayments.length} pagos</span>
                  </div>
                  <table className="w-full text-[9px] border-collapse">
                    <thead className="text-slate-900 font-black uppercase">
                      <tr className="border-b-2 border-slate-900">
                      <th className="text-left px-2 py-1">Cliente</th>
                      <th className="text-left px-2 py-1 w-12">Cta.</th>
                      <th className="text-left px-2 py-1">Producto</th>
                      <th className="text-right px-2 py-1 w-16">Cant.</th>
                      <th className="text-right px-2 py-1 w-20">Monto</th>
                      <th className="text-left px-2 py-1 w-24">RTN</th>
                      <th className="text-center px-2 py-1 w-20">Fecha</th>
                    </tr></thead>
                    <tbody>
                      {lealPayments.map((inv: any, idx: number) => (
                        <tr key={`${inv.docNo}-${idx}`} className="border-b border-slate-100 text-slate-900 font-bold">
                          <td className="px-2 py-0.5">{inv.customerName || 'CLIENTE FINAL'}</td>
                          <td className="px-2 py-0.5 font-mono">{inv.customerNo || '-'}</td>
                          <td className="px-2 py-0.5 italic truncate max-w-[200px]">
                            {inv.lines?.map((l: any) => l.description).join(', ')}
                          </td>
                          <td className="px-2 py-0.5 text-right font-mono">
                            {inv.lines?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.lines?.[0]?.unit || 'UN'}
                          </td>
                          <td className="px-2 py-0.5 text-right font-mono font-black">
                            L. {inv.lealAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-0.5 font-mono">{inv.rtn || '-'}</td>
                          <td className="px-2 py-0.5 text-center">
                            {formatShiftDate(shift.shiftDate) || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {store?.printCreditInvoices !== false && (details.documents?.creditNotes?.length > 0) && (
              <div className="mb-2 overflow-hidden rounded-lg border border-slate-300 break-inside-avoid">
                <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                  <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. DETALLE DE NOTAS DE CREDITO</h2>
                </div>
                <table className="w-full text-[9px] border-collapse">
                  <thead className="text-slate-900 font-black uppercase">
                    <tr className="border-b-2 border-slate-900">
                    <th className="text-left px-2 py-1 w-32">NC No. / Factura Afectada</th>
                    <th className="text-left px-2 py-1">Cliente / Productos</th>
                    <th className="text-right px-2 py-1 w-16">Cant.</th>
                    <th className="text-right px-2 py-1 w-20">Precio</th>
                    <th className="text-right px-2 py-1 w-24">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {details.documents.creditNotes.map((nc: any) => (
                      <React.Fragment key={nc.docNo}>
                        <tr className="bg-slate-100/50 border-t border-slate-300 text-slate-900 font-bold">
                          <td className="px-2 py-1 border-r border-slate-200">
                            <div className="leading-tight">{nc.docNo}</div>
                            {nc.appliedDocNo && <div className="text-[7px] text-blue-700 mt-0.5">Anula: {nc.appliedDocNo}</div>}
                          </td>
                          <td className="px-2 py-1 font-black uppercase" colSpan={3}>{nc.customerName || 'CLIENTE FINAL'}</td>
                          <td className="px-2 py-1 text-right font-black bg-slate-100 border-l border-slate-200">L. {nc.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {nc.lines?.map((line: any, lIdx: number) => (
                          <tr key={`${nc.docNo}-${lIdx}`} className="border-b border-slate-100 text-slate-900 font-bold">
                            <td className="border-r border-slate-200"></td>
                            <td className="px-2 py-0.5 truncate max-w-[200px] italic">{line.description}</td>
                            <td className="px-2 py-0.5 text-right font-mono">{line.quantity?.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
                            <td className="px-2 py-0.5 text-right font-mono">{line.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-0.5 text-right font-mono font-black border-l border-slate-200">{line.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {details.documents?.outflows?.length > 0 && (
              <div className="mb-2 overflow-hidden rounded-lg border border-slate-300 break-inside-avoid">
                <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                  <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. DETALLE DE TICKETS</h2>
                  <span className="text-[8px] opacity-70 italic font-mono uppercase text-slate-600">Control de Salidas</span>
                </div>
                <table className="w-full text-[9px] border-collapse">
                  <thead><tr className="border-b-2 border-slate-400 bg-slate-50 text-[8px] font-bold uppercase">
                    <th className="text-left px-2 py-1 w-24">Ticket No.</th>
                    <th className="text-left px-2 py-1">Concepto / Productos</th>
                    <th className="text-right px-2 py-1 w-16">Cant.</th>
                    <th className="text-right px-2 py-1 w-20">Precio</th>
                    <th className="text-right px-2 py-1 w-24">Total</th>
                  </tr></thead>
                  <tbody>
                    {details.documents.outflows.map((t: any) => (
                      <React.Fragment key={t.docNo}>
                        <tr className="bg-slate-100/50 border-t border-slate-300">
                          <td className="px-2 py-1 font-bold text-slate-900 border-r border-slate-200">{t.docNo}</td>
                          <td className="px-2 py-1 font-black text-slate-800 uppercase" colSpan={3}>{t.movementType || t.customerName || 'TICKET DE SALIDA'}</td>
                          <td className="px-2 py-1 text-right font-black bg-slate-100 border-l border-slate-200">L. {t.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {t.lines?.map((line: any, lIdx: number) => (
                          <tr key={`${t.docNo}-${lIdx}`} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="border-r border-slate-200"></td>
                            <td className="px-2 py-0.5 text-slate-900 italic font-bold">
                              {line.description}
                              {(line.pump || line.hose) && <span className="ml-2 text-[7px] text-slate-900 not-italic font-black">(B:{line.pump} M:{line.hose})</span>}
                            </td>
                            <td className="px-2 py-0.5 text-right text-slate-900 font-mono font-bold">{line.quantity?.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</td>
                            <td className="px-2 py-0.5 text-right text-slate-900 font-mono font-bold">{line.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-2 py-0.5 text-right text-slate-900 font-mono font-bold border-l border-slate-200">{line.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-2 mb-2 break-inside-avoid">
              <div className="overflow-hidden rounded-xl border border-slate-300 w-full shadow-sm">
                <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                  <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. Formas de Pago{shift.isPresented ? ' y Conciliacion Fisica' : ''}</h2>
                </div>
                <table className="w-full text-[9px]">
                  <thead><tr className="bg-slate-50 border-b border-slate-200 text-[8px] text-slate-900 font-black uppercase">
                    <th className="text-left px-3 py-1">Metodo</th>
                    <th className="text-right px-3 py-1">Contador</th>
                    <th className="text-right px-3 py-1">Venta BCPOS</th>
                    {shift.isPresented && shift.presentationDetails && (
                      <><th className="text-right px-3 py-1">Presentado</th><th className="text-right px-3 py-1">Diferencia</th></>
                    )}
                  </tr></thead>
                  <tbody>
                    {paymentRows}
                    <tr className="bg-slate-100 h-6 border-t border-slate-300">
                      <td className="px-3 font-black uppercase text-slate-950 border-r border-slate-300/30">TOTAL</td>
                      <td className="text-right px-3 text-slate-950 font-black">{totalCount}</td>
                      <td className="text-right px-3 font-black text-slate-950">{totalSys.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      {shift.isPresented && shift.presentationDetails && (
                        <><td className="text-right px-3 font-black text-slate-950">{totalDecl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className={`text-right px-3 font-black ${totalDiff !== 0 ? 'text-red-700' : 'text-slate-950'}`}>
                          {(totalDiff > 0 ? '+' : '') + totalDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td></>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="w-full rounded-md border-2 border-slate-900 overflow-hidden shadow-sm break-inside-avoid">
                <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                  <h2 className="font-bold text-[9px] uppercase tracking-wider">{sIdx++}. VALIDACION FINAL (CONTROLADOR VS POS VS PRESENTADO)</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase">Validacion:</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-slate-300 ${isCuadradoPrint ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {isCuadradoPrint ? 'CUADRADO' : 'CON DIFERENCIA'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 divide-x-2 divide-slate-300">
                  <div className="p-2 space-y-1 bg-slate-50">
                    <p className="text-[7px] font-black text-slate-500 uppercase leading-none">Bloque 1: Medicion</p>
                    <p className="text-[8px] font-black text-slate-900 uppercase leading-tight">Controlador Bruto</p>
                    <div className="flex justify-between items-center pt-0.5 mt-0.5 border-t border-slate-200">
                      <span className="text-[7px] font-bold text-slate-600 uppercase italic">Total Bruto</span>
                      <span className="text-[9px] font-black text-slate-900">L. {fuelTotalCtrl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-[7px] font-black text-slate-500 uppercase leading-none">Bloque 2: Ajustes</p>
                    <p className="text-[8px] font-black text-slate-900 uppercase leading-tight">Rebajas No Venta</p>
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-700"><span>Salidas/Tickets (-)</span><span>L. {outflowsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-700"><span>Desc / NC (-)</span><span>L. {(totalDiscounts + totalCreditNotes).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-center pt-0.5 mt-0.5 border-t border-slate-200">
                      <span className="text-[7.5px] font-black text-slate-900 uppercase">Total:</span>
                      <span className="text-[8px] font-black text-slate-900">L. {(outflowsTotal + totalDiscounts + totalCreditNotes).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1 bg-slate-50">
                    <p className="text-[7px] font-black text-slate-500 uppercase leading-none">Bloque 3: Combustible</p>
                    <p className="text-[8px] font-black text-slate-900 uppercase leading-tight">BCPOS vs CTRL</p>
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-700"><span>Esperado</span><span className="font-black">L. {netSalesExpectedFuel.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-700"><span>Facturado</span><span className="font-black text-blue-900">L. {fuelNetPos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-center pt-0.5 mt-0.5 border-t-2 border-slate-900 border-dotted">
                      <span className="text-[7.5px] font-black text-slate-950 uppercase italic">Dif Fuel:</span>
                      <span className={`text-[9.5px] font-black ${Math.abs(diffFuel) < 0.1 ? 'text-slate-950' : 'text-red-700'}`}>
                        L. {(diffFuel > 0 ? '+' : '') + diffFuel.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-[7px] font-black text-slate-500 uppercase leading-none">Bloque 4: Otros</p>
                    <p className="text-[8px] font-black text-slate-900 uppercase leading-tight">Tienda / Aceites</p>
                    <div className="pt-0.5 mt-0.5 border-t border-slate-200">
                      <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-700 uppercase italic"><span>Subtotal Otros:</span></div>
                      <div className="text-[11px] font-black text-slate-900 text-right">L. {totalOtherProducts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                  <div className="p-2 space-y-1 bg-slate-100 border-l border-slate-400">
                    <p className="text-[5.5px] font-black text-slate-500 uppercase leading-none">Bloque 5: Final</p>
                    <p className="text-[6.5px] font-black text-slate-900 uppercase leading-tight">Facturado vs Presentado</p>
                    <div className="flex justify-between items-end gap-1 mt-1 leading-none"><span className="text-[5.5px] font-black text-slate-700 uppercase">Total POS:</span><span className="text-[7px] font-black text-slate-900">L. {totalNetSalesPos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between items-end gap-1 leading-none"><span className="text-[5.5px] font-black text-blue-900 uppercase underline decoration-slate-400">Total Pres:</span><span className="text-[7px] font-black text-blue-900 underline decoration-slate-400">L. {totalDecl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    <div className="mt-1 pt-1 border-t-2 border-slate-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[5.5px] font-black text-slate-950 uppercase italic">Sobrante / Falt:</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[5.5px] font-black">L.</span>
                          <span className={`text-[8px] font-black ${Math.abs(diffFinal) < 0.1 ? 'text-slate-950' : 'text-red-800'}`}>
                            {(diffFinal > 0 ? '+' : '') + diffFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {shift.presentationComment && (
                  <div className="mt-1 px-3 py-2 border-t border-slate-300 bg-slate-50/50">
                    <p className="text-[6px] font-black uppercase text-slate-500 mb-0.5">Comentarios de la Presentacion:</p>
                    <p className="text-[8px] font-bold text-slate-800 uppercase italic leading-tight">"{shift.presentationComment}"</p>
                  </div>
                )}
              </div>
            </div>
          </td></tr>
        </tbody>
      </table>

      <div className="mt-10 grid grid-cols-2 gap-20 px-12 break-inside-avoid">
        <div className="text-center">
          <div className="border-b-2 border-black w-full mb-1"></div>
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide leading-none mb-1">{shift.employeeName}</p>
          <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest text-center">FIRMA VENDEDOR RESPONSABLE</p>
        </div>
        <div className="text-center">
          <div className="border-b-2 border-black w-full mb-1"></div>
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide leading-none mb-1">{user?.name || user?.username || 'ADMINISTRACION'}</p>
          <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest text-center">Sello y Firma Autorizada</p>
        </div>
      </div>
      <div className="mt-2 text-center text-[8.5px] text-slate-500 font-medium">
        <p>Generado por BCPOS-BACKOFFICE | {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
