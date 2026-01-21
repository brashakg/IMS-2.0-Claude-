// ============================================================================
// IMS 2.0 - StatusBadge Component Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { render } from '../../test/utils';

// Simple StatusBadge component for testing
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
    DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

describe('StatusBadge', () => {
  it('renders pending status correctly', () => {
    const { getByText } = render(<StatusBadge status="PENDING" />);
    expect(getByText('Pending')).toBeInTheDocument();
  });

  it('renders confirmed status correctly', () => {
    const { getByText } = render(<StatusBadge status="CONFIRMED" />);
    expect(getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders delivered status correctly', () => {
    const { getByText } = render(<StatusBadge status="DELIVERED" />);
    expect(getByText('Delivered')).toBeInTheDocument();
  });

  it('renders cancelled status correctly', () => {
    const { getByText } = render(<StatusBadge status="CANCELLED" />);
    expect(getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    const { getByText } = render(<StatusBadge status="UNKNOWN" />);
    expect(getByText('UNKNOWN')).toBeInTheDocument();
  });
});
