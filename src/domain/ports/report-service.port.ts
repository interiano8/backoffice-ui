export interface IReportServicePort {
  getDashboardStats(days?: number, date?: string, startDate?: string, endDate?: string): Promise<any>;
  getMonthlyAnalysis(startDate1: string, endDate1: string, startDate2: string, endDate2: string): Promise<any>;
  getActiveCustomers(startDate: string, endDate: string): Promise<any[]>;
  getCustomerStatement(startDate: string, endDate: string, customerNo: string): Promise<any[]>;
  getSalesDeclaration(startDate: string, endDate: string, type: string): Promise<any[]>;
  getBulkCustomerStatements(startDate: string, endDate: string): Promise<any>;
}
