import { cn } from "@/lib/utils";
import { formatShiftDate } from "@/lib/format";
import type { Shift } from '@/types/api';
import ShiftReportContent from './ShiftReportContent';
import FusionDetailsReportContent from './FusionDetailsContent';

export function PrintShiftReport({ shift, details, metadata, store, user }: {
  shift: Shift | null; details: any; metadata: any; store: any; user: any;
}) {
  if (!shift || !metadata) return null;
  return (
    <div className="hidden print:block print:w-full print:bg-white p-0 m-0">
      <style>{`@media print {
        @page { size: letter; margin: 10mm; }
        body { overflow: visible !important; height: auto !important; width: 100% !important; }
        .print-header { display: table-header-group; }
        button, svg, [role="button"], .sonner-toast, [data-sonner-toaster], header, nav, footer, aside, .print\\:hidden, .print-hide, .DialogClose, [role="dialog"] > button { display: none !important; }
        [data-radix-portal], [role="dialog"], [class*="Overlay"], .fixed.inset-0 { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; background: white !important; }
      }`}</style>
      <ShiftReportContent shift={shift} details={details} metadata={metadata} store={store} user={user} />
    </div>
  );
}

export function PrintBatchShiftsReport({ batchData, fusionData, filteredShifts, metadata, store, user }: {
  batchData: { shift: Shift; details: any }[]; fusionData: any[]; filteredShifts: Shift[];
  metadata: any; store: any; user: any;
}) {
  if (batchData.length === 0 || !metadata) return null;
  return (
    <div className="hidden print:block print:w-full print:bg-white p-0 m-0">
      <style>{`@media print {
        @page { size: letter portrait; margin: 10mm; }
        body { overflow: visible !important; height: auto !important; }
        .shift-report-wrapper { page-break-after: always; padding: 1rem; }
        .fusion-report-wrapper { padding: 10mm; width: 100% !important; box-sizing: border-box; }
        .print-header { display: table-header-group; }
        button, svg, [role="button"], .sonner-toast, [data-sonner-toaster] { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
      }`}</style>
      {batchData.map((item, index) => (
        <div key={item.shift.id} className={index > 0 ? "break-before-page pt-4" : ""}>
          <ShiftReportContent shift={item.shift} details={item.details} metadata={metadata} store={store} user={user} />
        </div>
      ))}
      {filteredShifts.some(s => s.fsShiftIds) && (
        <div className={cn("bg-white", batchData.length > 0 ? "page-break-before-always" : "")}>
          <FusionDetailsReportContent fusionDetails={fusionData} globalDate={formatShiftDate(batchData[0]?.shift.shiftDate)} store={store} filteredShifts={filteredShifts} />
        </div>
      )}
    </div>
  );
}

export function PrintFusionDetailsReport({ globalDate, fusionDetails, store, filteredShifts }: {
  globalDate: string; fusionDetails: any[]; store: any; filteredShifts: Shift[];
}) {
  if (!fusionDetails || fusionDetails.length === 0) return null;
  return (
    <div className={cn("hidden print:block bg-white text-black font-mono text-[10px] print-report-container w-full min-w-full page-portrait p-0")}>
      <style>{`@media print {
        @page { size: letter portrait; margin: 10mm; }
        body, [data-radix-portal], [role="dialog"] { overflow: visible !important; height: auto !important; width: 100% !important; background: white !important; }
        button, svg, [role="button"] { display: none !important; }
        .print-header { display: table-header-group; }
      }`}</style>
      <FusionDetailsReportContent globalDate={globalDate} fusionDetails={fusionDetails} store={store} filteredShifts={filteredShifts} />
    </div>
  );
}

export { default as ShiftReportContent } from './ShiftReportContent';
export { default as FusionDetailsReportContent } from './FusionDetailsContent';
