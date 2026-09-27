export interface ISyncServicePort {
  syncSales(reconcilerShiftId?: string): Promise<any>;
}
