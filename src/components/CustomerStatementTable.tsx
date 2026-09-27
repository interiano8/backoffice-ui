import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateUTC } from "../lib/format";
import { formatProductDetail, getDocTypeName, StatementLine } from "../hooks/useCustomerStatements";

interface CustomerStatementTableProps {
  statements: StatementLine[];
  loading: boolean;
  showDetails: boolean;
  formatCurrency: (n: number) => string;
}

export const CustomerStatementTable = ({ statements, loading, showDetails, formatCurrency }: CustomerStatementTableProps) => (
  <div className="overflow-auto h-full rounded-lg border">
    <table className="w-full text-sm">
      <thead>
        <tr className="sticky top-0 bg-card z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9 shadow-[0_1px_0_0] shadow-border">
          <th className="px-5 text-left w-[100px]">Fecha</th>
          <th className="px-5 text-left w-[170px]">Documento</th>
          <th className="px-5 text-center w-[140px]">Tipo</th>
          <th className="px-5 text-left">Detalle</th>
          {showDetails && <th className="px-5 text-center">Placa | Chofer | KM | Orden</th>}
          <th className="px-5 text-right w-[130px]">Monto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <tr key={i} className="h-10">
              <td className="px-5"><Skeleton className="h-3 w-16" /></td>
              <td className="px-5"><Skeleton className="h-3 w-20" /></td>
              <td className="px-5 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
              <td className="px-5"><Skeleton className="h-3 w-40" /></td>
              {showDetails && <td className="px-5 text-center"><Skeleton className="h-3 w-28 mx-auto" /></td>}
              <td className="px-5 text-right"><Skeleton className="h-3 w-16 ml-auto" /></td>
            </tr>
          ))
        ) : (
          statements.map((line) => (
            <tr key={line.docNo} className="hover:bg-muted/30 transition-colors h-9">
              <td className="px-5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {formatDateUTC(line.date)}
              </td>
              <td className="px-5 font-mono text-xs font-semibold whitespace-nowrap">{line.docNo}</td>
              <td className="px-5 text-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    line.docType === 2
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : line.docType === 3
                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}
                >
                  {getDocTypeName(line.docType)}
                </span>
              </td>
              <td className={cn("px-5 py-1", showDetails ? "max-w-[350px]" : "max-w-none")}>
                <div className="flex flex-wrap gap-1">
                  {line.productDetails
                    ? line.productDetails.split(' | ').map((prod, pIdx) => (
                        <span
                          key={pIdx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/60 text-muted-foreground whitespace-nowrap"
                        >
                          {formatProductDetail(prod)}
                        </span>
                      ))
                    : <span className="text-muted-foreground/25 text-[10px]">—</span>}
                </div>
              </td>
              {showDetails && (
                <td className="px-5 py-1 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {line.fleetInfo
                      ? line.fleetInfo.split(' | ').map((info, iIdx) => (
                          <span
                            key={iIdx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/5 text-blue-600 border border-blue-500/10 whitespace-nowrap"
                          >
                            {info}
                          </span>
                        ))
                      : <span className="text-muted-foreground/25 text-[10px]">—</span>}
                  </div>
                </td>
              )}
              <td className={cn(
                "px-5 text-right font-mono text-xs font-semibold tabular-nums",
                line.charge > 0 ? "text-emerald-600" : "text-amber-600"
              )}>
                {formatCurrency(Number(line.charge > 0 ? line.charge : line.payment))}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
