import { cn } from "@/lib/utils";
import { formatDateUTC } from "@/lib/format";

interface ActiveCustomer {
  customerNo: string;
  rtn: string;
  customerName: string;
  totalCredit: number;
  totalNC: number;
}

interface StatementLine {
  docNo: string;
  docType: number;
  date: string;
  amount: number;
  charge: number;
  payment: number;
  balance: number;
  customerName: string;
  rtn: string;
  productDetails: string;
  fleetInfo: string;
  customerNo?: string;
}

function getDocTypeName(type: number): string {
  switch (type) {
    case 2: return 'Factura Credito';
    case 3: return 'Nota de Credito';
    default: return 'Documento';
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'HNL',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value).replace('HNL', 'L.');
}

function formatProductDetail(detail: string, asHtml: boolean = false) {
  if (!detail) return detail;
  let formatted = detail.replace(/= ([\d.]+)/g, (match, p1) => {
    const num = parseFloat(p1);
    return !isNaN(num) ? `= ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : match;
  });
  const parts = formatted.split(/(- [\d.]+)(?=\s*=)/);
  if (parts.length > 1) {
    if (asHtml) return `${parts[0]}<span style="color: #ef4444; font-weight: bold;">${parts[1]}</span>${parts[2]}`;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
        {parts[0]}<span style={{ color: '#ef4444', fontWeight: 'bold' }}>{parts[1]}</span>{parts[2]}
      </span>
    );
  }
  return formatted;
}

export function PrintCustomerStatement({
  customer, statement, store, user, dateRange
}: {
  customer: ActiveCustomer;
  statement: StatementLine[];
  store: any;
  user: any;
  dateRange: { start: string; end: string };
}) {
  return (
    <div className="bg-white p-4 pb-12 text-black font-mono text-[10px] w-full">
      <style>{`@media print {
        @page { size: letter; margin: 15mm 10mm; }
        body { overflow: visible !important; height: auto !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
        .print-header { display: table-header-group; }
        .signatures-container { break-inside: avoid; }
      }`}</style>
      <table className="w-full">
        <thead className="print-header">
          <tr><td>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{store?.titulo || 'ESTADO DE CUENTA'}</h1>
                  <p className="text-[10px] font-bold uppercase text-slate-800">{store?.name || ''} | RTN: {store?.RTN || 'N/D'}</p>
                  <p className="text-[8.5px] text-slate-500">{store?.address || 'Direccion no disponible'}</p>
                </div>
                <div className="text-right">
                  <img src={store?.logoUrl || "/store.jpg"} alt="Logo" className="h-12 w-28 object-contain" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-slate-200 text-[8.5px]">
                <div className="space-y-0.5 text-slate-700">
                  <p><span className="text-slate-400 font-medium">CLIENTE:</span> <span className="font-bold">{customer.customerName.toUpperCase()}</span></p>
                  <p><span className="text-slate-400 font-medium">RTN:</span> <span className="font-bold">{customer.rtn}</span></p>
                  <p><span className="text-slate-400 font-medium">CUENTA:</span> <span className="font-bold text-slate-600">{customer.customerNo}</span></p>
                </div>
                <div className="text-right space-y-0.5 text-slate-500">
                  <p><span className="font-medium mr-1">RANGO:</span> <span className="font-bold text-slate-700">{dateRange.start} al {dateRange.end}</span></p>
                  <p><span className="font-medium mr-1">IMPRESO POR:</span> <span className="font-bold text-slate-700">{user?.name || user?.username || 'ADMINISTRACION'}</span></p>
                  <p><span className="font-medium mr-1">FECHA IMPRESION:</span> <span>{new Date().toLocaleString()}</span></p>
                </div>
              </div>
            </div>
          </td></tr>
        </thead>
        <tbody>
          <tr><td>
            <div className="mb-1.5 overflow-hidden rounded-lg border border-slate-300 text-[9px]">
              <div className="bg-slate-100 text-slate-900 px-3 py-1 flex justify-between items-center border-b border-slate-200">
                <h2 className="font-bold text-[9px] uppercase tracking-wider">DETALLE DE MOVIMIENTOS</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-50">
                    <th className="px-2 py-1 text-left">Fecha</th>
                    <th className="px-2 py-1 text-left">Documento</th>
                    <th className="px-2 py-1 text-left">Tipo</th>
                    <th className="px-2 py-1 text-left">Productos</th>
                    {store?.showDetailsInStatement !== false && <th className="px-2 py-1 text-center">Placa | Chofer | KM | Orden</th>}
                    <th className="px-2 py-1 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((line, idx) => (
                    <tr key={idx} className="border-b border-gray-100 h-6 even:bg-slate-50/30">
                      <td className="px-2 py-1 whitespace-nowrap">{formatDateUTC(line.date)}</td>
                      <td className="px-2 py-1 font-bold">{line.docNo}</td>
                      <td className="px-2 py-1">{getDocTypeName(line.docType)}</td>
                      <td className={cn("px-2 py-1", store?.showDetailsInStatement !== false ? "max-w-[200px]" : "max-w-none")}>
                        <div className="flex flex-wrap gap-1">
                          {line.productDetails ? line.productDetails.split(' | ').map((prod, pIdx) => (
                            <span key={pIdx} className={cn("bg-slate-100 px-1 rounded-sm border border-slate-200 font-medium", store?.showDetailsInStatement !== false ? "text-[7px]" : "text-[10px]")}>{formatProductDetail(prod)}</span>
                          )) : '-'}
                        </div>
                      </td>
                      {store?.showDetailsInStatement !== false && (
                        <td className="px-2 py-1 text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            {line.fleetInfo ? line.fleetInfo.split(' | ').map((info, iIdx) => (
                              <span key={iIdx} className="text-[8px] bg-blue-50 text-blue-700 px-1 rounded-sm border border-blue-100">{info}</span>
                            )) : '-'}
                          </div>
                        </td>
                      )}
                      <td className="px-2 py-1 text-right font-bold">{formatCurrency(Number(line.charge > 0 ? line.charge : line.payment))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="break-inside-avoid">
                <div className="flex justify-end mt-4">
                  <div className="w-[45%] rounded-md border-2 border-slate-400 overflow-hidden shadow-sm bg-white">
                    <div className="bg-slate-100 text-slate-900 py-1 text-center border-b border-slate-300">
                      <h3 className="text-[9px] font-black uppercase tracking-tighter italic">Resumen del Estado</h3>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold uppercase italic border-b border-dashed border-slate-200 pb-1">
                        <span>Total Abonos (NC):</span>
                        <span className="font-bold text-red-500">{formatCurrency(statement.reduce((acc, curr) => acc + curr.payment, 0))}</span>
                      </div>
                      <div className="pt-2 flex justify-between items-end">
                        <span className="text-[10px] font-black text-blue-900 italic uppercase">CONSUMO REPORTE</span>
                        <span className="text-[18px] font-black text-blue-900 leading-none">{formatCurrency(statement[statement.length - 1]?.balance || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 mb-4 px-4 text-center">
                  <p className="text-[10px] font-black italic uppercase">HEMOS RECIBIDO DE {store?.name || ''}, LA CANTIDAD DE {statement.length} FACTURAS ORIGINALES PARA TRAMITE DE PAGOS, SE APLICARAN CARGOS ADMINISTRATIVOS SOBRE SALDOS VENCIDOS</p>
                </div>
                <div className="mt-12 grid grid-cols-2 gap-32 px-16 signatures-container">
                  <div className="text-center flex flex-col items-center">
                    <div className="border-b-[2px] border-black w-full mb-3 shadow-sm"></div>
                    <p className="text-[9px] font-black text-slate-900 uppercase tracking-wide leading-none mb-1">{user?.name || user?.username || 'ADMINISTRACION'}</p>
                    <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.2em] text-center">Sello y Firma Autorizada</p>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="border-b-[2px] border-black w-full mb-3 shadow-sm"></div>
                    <p className="text-[9px] font-black text-slate-900 uppercase tracking-wide leading-none mb-1">{customer.customerName}</p>
                    <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.2em] text-center">Firma de Conformidad Cliente</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center text-[8px] text-gray-400 italic pb-2">
                <p>Generado por BCPOS-BACKOFFICE | {new Date().getFullYear()}</p>
              </div>
            </div>
          </td></tr>
        </tbody>
      </table>
    </div>
  );
}
