export interface User {
  username: string;
  role: string;
  roles?: string[];
  permissions?: string[];
  sub: number;
  name?: string;
  usuario?: string;
  email?: string;
}

export interface Store {
  id: string;
  code: string;
  titulo?: string;
  name: string;
  RTN?: string;
  address?: string;
  ip: string;
  isActive?: boolean;
  apiUrl?: string;
  lanUrl?: string;
  lanFrontUrl?: string;
  showDetailsInStatement?: boolean;
  logoUrl?: string;
  frontendUrl?: string;
  isLocalStore?: boolean;
  moduleCustomers?: number;
  moduleAccounting?: number;
  printCreditInvoices?: boolean;
  SyncMinutes?: number;
  PresentationMinutes?: number;
}

export interface Shift {
  id: string;
  shiftNo: string;
  shiftDate: string;
  employeeName: string;
  employeeUsername?: string;
  startTime: string;
  endTime: string | null;
  status: string;
  totalSale?: number;
  totalDiscount?: number;
  reconcilerShiftId?: string;
  posCodes?: string;
  fsShiftIds?: string;
  isPresented?: boolean;
  isBalanced?: boolean;
  presentationDetails?: string;
  presentationComment?: string;
  presentationDate?: string;
  auditStatus?: 'PENDING' | 'IN_REVIEW' | 'AUDITED' | 'SYNC_IN_PROGRESS' | 'OPEN_OPERATIONAL' | 'BALANCED' | 'DISCREPANCY' | string;
  auditedBy?: string | null;
  auditNotes?: string | null;
  auditedAt?: string | null;
  cashVariance?: number | null;
  fuelVariance?: number | null;
  isLocked?: boolean;
}

export interface SaleLine {
  id?: string;
  lineNo?: number;
  externalId?: string;
  description?: string;
  productName?: string;
  quantity?: number;
  volume?: number;
  volumeLT?: number;
  volumeGL?: number;
  unitPrice?: number;
  amount?: number;
  discount?: number;
  discountPct?: number;
  pumpId?: string;
  hoseId?: string;
  tankId?: string;
}

export interface PaymentMethod {
  id?: string;
  transactionId?: string;
  chargeMethodCode?: string;
  description?: string;
  amount?: number;
  count?: number;
  paymentCardNo?: string;
  esTicket?: boolean;
}

export interface DocumentHeader {
  transactionId: string;
  docNo: string;
  docType: number;
  date?: string;
  totalAmount?: number;
  subTotal?: number;
  customerName?: string;
  customerNo?: string;
  rtn?: string;
  billingType?: string;
  placa?: string;
  chofer?: string;
  km?: string;
  orden?: string;
  staff?: string;
  posTerminal?: string;
  shiftNo?: string;
  shiftDate?: string;
  status?: number;
  lines?: SaleLine[];
  payments?: PaymentMethod[];
  appliedDocNo?: string;
  leal?: LealInfo;
}

export interface LealInfo {
  points: number;
  activePoints: number;
  type: number;
  dni: string;
  name: string;
  id: string;
}

export interface Customer {
  customerNo: string;
  customerName: string;
  rtn: string;
  billingType: number;
  billingTypeLabel: string;
  blocked: boolean | number;
  address?: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  notes?: string;
}

export interface DashboardProduct {
  name: string;
  productName?: string;
  volume?: number;
  totalVolume?: number;
  volumeLT?: number;
  volumeGL?: number;
  amount?: number;
  totalAmount?: number;
  type?: string;
}

export interface DashboardDaily {
  date?: string;
  volume?: number;
  totalVolume?: number;
  amount?: number;
  totalAmount?: number;
}

export interface DashboardAttendant {
  employeeName?: string;
  employee?: string;
  fullName?: string;
  volume?: number;
  totalVolume?: number;
  volumeLT?: number;
  volumeGL?: number;
  amount?: number;
  totalAmount?: number;
  count?: number;
  transactionCount?: number;
}

export interface DashboardPaymentStats {
  name: string;
  amount: number;
  count: number;
  code?: string;
  description?: string;
  declared?: number;
  difference?: number;
}

export interface DashboardHourly {
  hour: string;
  volume: number;
  amount: number;
}

export interface DashboardData {
  products: DashboardProduct[];
  dailyVolume: DashboardDaily[];
  dailyAmount?: DashboardDaily[];
  hourly?: DashboardHourly[];
  attendants: DashboardAttendant[];
  paymentMethods: DashboardPaymentStats[];
  topCustomers?: DashboardProduct[];
  pumps?: DashboardProduct[];
  totalAmount?: number;
  totalVolume?: number;
  totalVolumeLT?: number;
  totalVolumeGL?: number;
  totalSales?: number;
  averageTicket?: number;
  otherProducts?: DashboardProduct[];
  otherDailyVolume?: DashboardDaily[];
  otherDailyAmount?: DashboardDaily[];
  otherHourly?: DashboardHourly[];
}

export interface DailyDataPoint {
  date: string;
  totalVolume: number;
  totalAmount: number;
  transactionCount: number;
}

export interface MonthlyPeriod {
  label?: string;
  contado: number;
  credito: number;
  dailyData: DailyDataPoint[];
}

export interface MonthlyData {
  period1: MonthlyPeriod;
  period2: MonthlyPeriod;
  discountComparison?: any;
  fuelGrowth?: any;
}

export interface FusionHose {
  pumpId: string;
  hoseId: string;
  displayHose: string;
  productName: string;
  tpvVolume: number;
  tpvAmount: number;
  fusionVolume: number;
  fusionAmount: number;
  initialVolume: number;
  finalVolume: number;
  diffVolume: number;
  diffAmount: number;
}

export interface FusionValidation {
  netSales: number;
  otherProductsSales: number;
  discounts: number;
  creditNotes: number;
  tickets: number;
  grossSales: number;
  calculatedTotal: number;
}

export interface FusionData {
  hoses: FusionHose[];
  validationSummary: FusionValidation;
}

export interface UnifiedPayment {
  description: string;
  code: string | null;
  amount: number;
  count: number;
  declared: number;
  difference: number;
}

export interface UnifiedByShift {
  shiftNo: string;
  employeeNames: string[];
  hasPendingPresentation: boolean;
  payments: UnifiedPayment[];
}

export interface UnifiedData {
  unified: UnifiedPayment[];
  byShift: UnifiedByShift[];
}

export interface CustomerTransaction {
  customerNo: string;
  docNo: string;
  docType: number;
  date: string;
  amount: number;
  billingType: number;
  customerName: string;
  rtn: string;
  charge: number;
  payment: number;
  balance: number;
  productDetails: string;
  fleetInfo: string;
}

export interface CustomerStatement {
  customerNo: string;
  customerName: string;
  rtn: string;
  totalCredit: number;
  totalNC: number;
  transactions?: CustomerTransaction[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PresentationPayload {
  shiftDate: string;
  shiftNo: string;
  employeeName: string;
  details: { name: string; expected: number; declared: number; type: string }[];
  comment?: string;
}
