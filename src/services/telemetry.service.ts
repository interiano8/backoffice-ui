import api, { getHubURL } from '../infrastructure/api/api-client';

export interface StationHealthRecord {
  storeCode: string;
  storeName: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  fusionStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  pendingSyncCount: number;
  posVersion?: string;
  ipAddress?: string;
  lastPingAt: string | null;
  secondsSinceLastPing: number;
  metadata?: Record<string, any>;
}

export interface TelemetrySummaryResponse {
  total: number;
  online: number;
  degraded: number;
  offline: number;
  stations: StationHealthRecord[];
}

export const telemetryService = {
  getStatuses: async (): Promise<TelemetrySummaryResponse> => {
    const hub = getHubURL();
    const res = await api.get(`${hub}/telemetry/status`);
    return res.data;
  },
};
