import api from '../infrastructure/api/api-client';

export interface AlertConfig {
  recipientEmails: string[];
  cashVarianceThreshold: number;
  alertsEnabled: boolean;
  shiftDiscrepancyEnabled: boolean;
  fiscalGapEnabled: boolean;
  offlineStoreEnabled: boolean;
  offlineMinutesThreshold: number;
  cooldownMinutes: number;
  updatedAt?: string;
}

export interface UpdateAlertConfigInput {
  recipientEmails?: string[] | string;
  cashVarianceThreshold?: number;
  alertsEnabled?: boolean;
  shiftDiscrepancyEnabled?: boolean;
  fiscalGapEnabled?: boolean;
  offlineStoreEnabled?: boolean;
  offlineMinutesThreshold?: number;
  cooldownMinutes?: number;
}

export interface TestAlertResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  recipients: string[];
  error?: string;
}

export interface OperationalAlertItem {
  id: string;
  type:
    | 'SHIFT_DISCREPANCY'
    | 'FISCAL_GAP'
    | 'OFFLINE_STORE'
    | 'STOCK_TRANSFER'
    | 'LOW_STOCK'
    | 'TRANSFER_DISCREPANCY'
    | 'STATION_STATUS';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  storeCode: string;
  timestamp: string;
  link: string;
  metadata?: Record<string, any>;
}

export interface RecentAlertsResponse {
  total: number;
  criticalCount: number;
  warningCount: number;
  alerts: OperationalAlertItem[];
}

export function createAlertsEventSource(
  onAlert: (alert: OperationalAlertItem) => void,
): () => void {
  const token = localStorage.getItem('token') || '';
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  const streamPath = cleanBase ? `${cleanBase}/alerts/stream` : '/alerts/stream';
  const url = `${streamPath}?token=${encodeURIComponent(token)}`;

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as OperationalAlertItem;
      onAlert(parsed);
    } catch {
      // Ignorar fallo de parseo
    }
  };

  return () => {
    eventSource.close();
  };
}

export async function getAlertConfig(): Promise<AlertConfig> {
  const { data } = await api.get<AlertConfig>('/alerts/config');
  return data;
}

export async function updateAlertConfig(config: UpdateAlertConfigInput): Promise<AlertConfig> {
  const { data } = await api.put<AlertConfig>('/alerts/config', config);
  return data;
}

export async function sendTestAlert(): Promise<TestAlertResult> {
  const { data } = await api.post<TestAlertResult>('/alerts/test');
  return data;
}

export async function getRecentAlerts(): Promise<RecentAlertsResponse> {
  const { data } = await api.get<RecentAlertsResponse>('/alerts/recent');
  return data;
}

export async function downloadConsolidatedReport(params?: {
  days?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  const response = await api.get('/reports/consolidated/export', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = params?.startDate || new Date().toISOString().split('T')[0];
  a.download = `reporte-consolidado-prisma-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
