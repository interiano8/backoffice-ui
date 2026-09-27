import { formatCurrency } from '../../lib/format';

function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function formatDateUTC(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
}

export function PrintSalesDeclaration({ data, reportType, store, month, year, months }: any) {
  if (data.length === 0) return null;

  const groupedData = data.reduce((acc: any, item: any) => {
    const key = `${item.pos || 'N/A'}-${item.rangeNo || 'Sin Rango'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="hidden print:block bg-white p-4 text-black font-sans text-[9px]">
      <div className="text-center mb-6">
        <h1 className="text-sm font-bold uppercase">{store?.titulo}</h1>
        <h2 className="text-xs font-black text-[#583192] uppercase mt-1">Declaracion de ventas</h2>
        <p className="text-[10px] font-bold uppercase text-gray-600">{reportType === 'resumido' ? 'Reporte Resumido' : 'Reporte Detallado'}</p>
        <p className="font-bold text-xs">{store?.name} | RTN: {store?.RTN}</p>
        <p className="font-bold text-xs uppercase">Mes de: {months[month]}, Ano: {year}</p>
      </div>

      {Object.keys(groupedData).map((rangeKey) => {
        const rangeItems = groupedData[rangeKey];
        const firstItem = rangeItems[0];
        return (
          <div key={rangeKey} className="mb-8">
            <div className="bg-gray-100 p-2 mb-2 border border-black flex justify-between">
              <div>
                <p className="font-bold text-[11px] uppercase">{firstItem.docType === 3 ? 'Rango de NC' : 'Rango de Facturacion'}: {firstItem.rangeFrom} AL {firstItem.rangeTo}</p>
                <p className="text-[9px]">CAI: {firstItem.cai}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold">Fecha Vencimiento</p>
                <p className="text-[9px]">{firstItem.rangeDueDate ? formatDateUTC(firstItem.rangeDueDate) : 'N/A'}</p>
              </div>
            </div>
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-1 py-1">Fecha</th>
                  {reportType === 'resumido' ? (
                    <><th className="border border-gray-400 px-1 py-1">Desde</th><th className="border border-gray-400 px-1 py-1">Hasta</th></>
                  ) : (
                    <th className="border border-gray-400 px-1 py-1">Factura</th>
                  )}
                  <th className="border border-gray-400 px-1 py-1">Exento</th>
                  <th className="border border-gray-400 px-1 py-1">Gravado %15</th>
                  <th className="border border-gray-400 px-1 py-1">Gravado %18</th>
                  <th className="border border-gray-400 px-1 py-1">Impuesto %15</th>
                  <th className="border border-gray-400 px-1 py-1">Impuesto %18</th>
                  <th className="border border-gray-400 px-1 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {rangeItems.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 px-1 py-0.5">{formatDateUTC(row.date)}</td>
                    {reportType === 'resumido' ? (
                      <><td className="border border-gray-400 px-1 py-0.5">{row.desde}</td><td className="border border-gray-400 px-1 py-0.5">{row.hasta}</td></>
                    ) : (
                      <td className="border border-gray-400 px-1 py-0.5">{row.docNo}</td>
                    )}
                    <td className="border border-gray-400 px-1 py-0.5 text-right">{formatNumber(Number(row.exempt))}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-right">{formatNumber(Number(row.taxed15))}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-right">{formatNumber(Number(row.taxed18))}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-right">{formatNumber(Number(row.tax15))}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-right">{formatNumber(Number(row.tax18))}</td>
                    <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{formatNumber(Number(row.total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={reportType === 'resumido' ? 3 : 2} className="border border-gray-400 px-1 py-1 uppercase">Subtotal Rango</td>
                  <td className="border border-gray-400 px-1 py-1 text-right">{formatNumber(rangeItems.reduce((acc: any, r: any) => acc + Number(r.exempt), 0))}</td>
                  <td className="border border-gray-400 px-1 py-1 text-right">{formatNumber(rangeItems.reduce((acc: any, r: any) => acc + Number(r.taxed15), 0))}</td>
                  <td className="border border-gray-400 px-1 py-1 text-right">{formatNumber(rangeItems.reduce((acc: any, r: any) => acc + Number(r.taxed18), 0))}</td>
                  <td className="border border-gray-400 px-1 py-1 text-right">{formatNumber(rangeItems.reduce((acc: any, r: any) => acc + Number(r.tax15), 0))}</td>
                  <td className="border border-gray-400 px-1 py-1 text-right">{formatNumber(rangeItems.reduce((acc: any, r: any) => acc + Number(r.tax18), 0))}</td>
                  <td className="border border-gray-400 px-1 py-1 text-right">{formatNumber(rangeItems.reduce((acc: any, r: any) => acc + Number(r.total), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      <div className="mt-4 border-t-2 border-black pt-2">
        <table className="w-full text-xs font-bold">
          <tr>
            <td className="uppercase">Gran Total General</td>
            <td className="text-right text-sm">{formatCurrency(data.reduce((acc: any, r: any) => acc + Number(r.total), 0))}</td>
          </tr>
          <tr>
            <td colSpan={2} className="text-[9px] font-normal uppercase mt-1">Total Documentos: {data.reduce((acc: any, r: any) => acc + Number(r.docs), 0)}</td>
          </tr>
        </table>
      </div>
    </div>
  );
}
