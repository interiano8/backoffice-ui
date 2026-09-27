export interface FuelEntry {
  fsAmount?: number;
  amount?: number;
  discount?: number;
  isTicket?: boolean;
}

export interface ProductEntry {
  amount?: number;
  discount?: number;
}

export interface DocumentEntry {
  totalAmount?: number;
}

export interface PresentationDetail {
  declared?: number | string;
}

export interface ReconciliationInput {
  fuel: FuelEntry[];
  products: ProductEntry[];
  creditNotes: DocumentEntry[];
  outflows: DocumentEntry[];
  presentationDetails?: string | PresentationDetail[];
  totalTaxes?: number;
}

export interface ReconciliationResult {
  fuelTotalCtrl: number;
  fuelNetPos: number;
  totalDiscounts: number;
  totalCreditNotes: number;
  outflowsTotal: number;
  netSalesExpected: number;
  diffFuel: number;
  totalOtherProducts: number;
  totalPresented: number;
  totalNetSalesPos: number;
  diffFinal: number;
  isCuadrado: boolean;
  totalTaxes: number;
}

export function calculateReconciliation(input: ReconciliationInput): ReconciliationResult {
  const fuelCtrl = input.fuel.reduce((acc, i) => acc + (i.fsAmount || 0), 0);
  const fuelNet = input.fuel.filter(i => !i.isTicket).reduce((acc, i) => acc + (i.amount || 0), 0);
  const productsNet = input.products.reduce((acc, i) => acc + (i.amount || 0), 0);
  const otherSales = input.fuel.filter(i => !i.fsAmount && !i.isTicket).reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalOtherProducts = productsNet + otherSales;

  const discounts = input.fuel.reduce((acc, i) => acc + (i.discount || 0), 0) +
    input.products.reduce((acc, i) => acc + (i.discount || 0), 0);
  const nc = input.creditNotes.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const tickets = input.outflows.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

  const calculatedFuelExpected = fuelCtrl - (tickets + discounts + nc);
  const fuelDifference = fuelNet - calculatedFuelExpected;
  const netSalesPosTotal = fuelNet + totalOtherProducts;

  let totalPresCount = 0;
  if (input.presentationDetails) {
    try {
      const details = typeof input.presentationDetails === 'string'
        ? JSON.parse(input.presentationDetails)
        : input.presentationDetails;
      if (Array.isArray(details)) {
        totalPresCount = details.reduce((acc, d: any) => acc + Number(d.declared || 0), 0);
      }
    } catch {}
  }

  const finalDiff = totalPresCount - netSalesPosTotal;

  return {
    fuelTotalCtrl: fuelCtrl,
    fuelNetPos: fuelNet,
    totalDiscounts: discounts,
    totalCreditNotes: nc,
    outflowsTotal: tickets,
    netSalesExpected: calculatedFuelExpected,
    diffFuel: fuelDifference,
    totalOtherProducts,
    totalPresented: totalPresCount,
    totalNetSalesPos: netSalesPosTotal,
    diffFinal: finalDiff,
    isCuadrado: Math.abs(fuelDifference) < 0.1 && (!input.presentationDetails || Math.abs(finalDiff) < 0.1),
    totalTaxes: input.totalTaxes || 0,
  };
}
