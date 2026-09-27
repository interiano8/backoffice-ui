export interface IShiftServicePort {
  getShifts(date?: string, status?: string): Promise<any>;
  getShiftDetails(date: string, shiftNo: string, attendantName?: string): Promise<any>;
  getUniqueDates(): Promise<string[]>;
  getAvailableDates(limit?: number): Promise<string[]>;
  getShiftsByDate(date: string): Promise<any[]>;
  getFusionDetails(fsShiftIds: string): Promise<any>;
  getUnifiedPayments(fsShiftIds: string): Promise<any>;
  getUnifiedProducts(fsShiftIds: string): Promise<any>;
  getPresentationExpected(shiftDate: string, shiftNo: string, employeeName: string): Promise<any>;
  savePresentation(payload: any): Promise<any>;
  printShiftReport(payload: any): Promise<any>;
}
