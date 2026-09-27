import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FiscalAuditModal } from './FiscalAuditModal';
import api from '../infrastructure/api/api-client';

vi.mock('../infrastructure/api/api-client', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('FiscalAuditModal', () => {
  let currentMockReport: any = null;

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/reconciliation/fiscal-gaps') {
        return Promise.resolve({ data: currentMockReport });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders contiguous sequence confirmation when there are no gaps', async () => {
    currentMockReport = {
      storeCode: '001',
      totalInvoicesScanned: 150,
      totalGapsDetected: 0,
      totalMissingInvoices: 0,
      hasGaps: false,
      gaps: [],
      checkedAt: '2026-09-25T20:00:00.000Z',
    };

    render(
      <FiscalAuditModal
        open={true}
        onOpenChange={() => {}}
        storeCode="001"
      />
    );

    expect(screen.getByText(/Auditoría de Correlativos SAR/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Conformidad Fiscal SAR Garantizada/i)).toBeInTheDocument();
      expect(screen.getByText(/Secuencia Íntegra/i)).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('renders gap details and discrepancy count when gaps are detected', async () => {
    currentMockReport = {
      storeCode: '001',
      totalInvoicesScanned: 45,
      totalGapsDetected: 1,
      totalMissingInvoices: 2,
      hasGaps: true,
      gaps: [
        {
          storeCode: '001',
          prefix: '000-001-01',
          missingFrom: '00000011',
          missingTo: '00000012',
          missingCount: 2,
          missingDocNos: ['000-001-01-00000011', '000-001-01-00000012'],
        },
      ],
      checkedAt: '2026-09-25T20:00:00.000Z',
    };

    render(
      <FiscalAuditModal
        open={true}
        onOpenChange={() => {}}
        storeCode="001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Discrepancia SAR/i)).toBeInTheDocument();
      expect(screen.getByText(/000-001-01-00000011/)).toBeInTheDocument();
      expect(screen.getByText(/Atención: Se identificaron saltos de correlativos/i)).toBeInTheDocument();
    });
  });
});
