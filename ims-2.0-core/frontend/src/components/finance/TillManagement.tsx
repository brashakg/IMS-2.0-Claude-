// ============================================================================
// IMS 2.0 - Till Management Component
// Cash drawer management with opening/closing balance, denominations
// ============================================================================

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface Denomination {
  value: number;
  label: string;
  count: number;
}

interface TillSession {
  id: string;
  store_id: string;
  store_name: string;
  cashier_id: string;
  cashier_name: string;
  terminal_id: string;
  opening_time: string;
  closing_time?: string;
  opening_balance: number;
  expected_closing_balance: number;
  actual_closing_balance: number;
  cash_sales: number;
  cash_received: number;
  cash_refunds: number;
  petty_cash_out: number;
  petty_cash_in: number;
  variance: number;
  variance_reason?: string;
  status: 'open' | 'closed' | 'pending_approval';
  opening_denominations: Denomination[];
  closing_denominations: Denomination[];
  transactions: TillTransaction[];
}

interface TillTransaction {
  id: string;
  time: string;
  type: 'sale' | 'refund' | 'petty_cash_in' | 'petty_cash_out' | 'float_adjustment';
  reference: string;
  amount: number;
  description: string;
  approved_by?: string;
}

interface Props {
  storeId: string;
  terminalId?: string;
  cashierId: string;
  cashierName: string;
}

const DENOMINATIONS: { value: number; label: string }[] = [
  { value: 2000, label: '₹2000' },
  { value: 500, label: '₹500' },
  { value: 200, label: '₹200' },
  { value: 100, label: '₹100' },
  { value: 50, label: '₹50' },
  { value: 20, label: '₹20' },
  { value: 10, label: '₹10' },
  { value: 5, label: '₹5' },
  { value: 2, label: '₹2' },
  { value: 1, label: '₹1' }
];

export const TillManagement: React.FC<Props> = ({
  storeId,
  terminalId = 'T1',
  cashierId,
  cashierName
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'reports'>('current');
  const [currentSession, setCurrentSession] = useState<TillSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<TillSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Till opening/closing state
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [denominations, setDenominations] = useState<Denomination[]>(
    DENOMINATIONS.map(d => ({ ...d, count: 0 }))
  );
  const [varianceReason, setVarianceReason] = useState('');

  // Petty cash state
  const [showPettyCash, setShowPettyCash] = useState(false);
  const [pettyCashType, setPettyCashType] = useState<'in' | 'out'>('out');
  const [pettyCashAmount, setPettyCashAmount] = useState('');
  const [pettyCashReason, setPettyCashReason] = useState('');

  useEffect(() => {
    loadCurrentSession();
    loadSessionHistory();
  }, [storeId, terminalId]);

  const loadCurrentSession = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/finance/till/current?store_id=${storeId}&terminal_id=${terminalId}`);
      setCurrentSession(response.data);
    } catch (error) {
      // Mock data - no active session
      setCurrentSession(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionHistory = async () => {
    try {
      const response = await apiClient.get(`/finance/till/history?store_id=${storeId}&terminal_id=${terminalId}`);
      setSessionHistory(response.data || []);
    } catch (error) {
      // Mock data
      setSessionHistory([
        {
          id: 'TILL001',
          store_id: storeId,
          store_name: 'Mumbai Central',
          cashier_id: 'EMP001',
          cashier_name: 'Rajesh Kumar',
          terminal_id: 'T1',
          opening_time: '2024-02-01T09:00:00',
          closing_time: '2024-02-01T21:00:00',
          opening_balance: 5000,
          expected_closing_balance: 45750,
          actual_closing_balance: 45700,
          cash_sales: 42500,
          cash_received: 43000,
          cash_refunds: 1500,
          petty_cash_out: 750,
          petty_cash_in: 0,
          variance: -50,
          variance_reason: 'Minor counting error',
          status: 'closed',
          opening_denominations: [],
          closing_denominations: [],
          transactions: []
        },
        {
          id: 'TILL002',
          store_id: storeId,
          store_name: 'Mumbai Central',
          cashier_id: 'EMP002',
          cashier_name: 'Priya Sharma',
          terminal_id: 'T1',
          opening_time: '2024-01-31T09:00:00',
          closing_time: '2024-01-31T21:00:00',
          opening_balance: 5000,
          expected_closing_balance: 38200,
          actual_closing_balance: 38200,
          cash_sales: 35000,
          cash_received: 35200,
          cash_refunds: 1000,
          petty_cash_out: 1000,
          petty_cash_in: 0,
          variance: 0,
          status: 'closed',
          opening_denominations: [],
          closing_denominations: [],
          transactions: []
        }
      ]);
    }
  };

  const calculateTotal = (denoms: Denomination[]): number => {
    return denoms.reduce((sum, d) => sum + (d.value * d.count), 0);
  };

  const handleDenominationChange = (value: number, count: number) => {
    setDenominations(prev =>
      prev.map(d => d.value === value ? { ...d, count: Math.max(0, count) } : d)
    );
  };

  const handleOpenTill = async () => {
    const openingBalance = calculateTotal(denominations);

    if (openingBalance <= 0) {
      alert('Please enter the opening cash count');
      return;
    }

    try {
      const response = await apiClient.post('/finance/till/open', {
        store_id: storeId,
        terminal_id: terminalId,
        cashier_id: cashierId,
        opening_balance: openingBalance,
        opening_denominations: denominations.filter(d => d.count > 0)
      });

      setCurrentSession({
        id: response.data?.id || `TILL${Date.now()}`,
        store_id: storeId,
        store_name: 'Store',
        cashier_id: cashierId,
        cashier_name: cashierName,
        terminal_id: terminalId,
        opening_time: new Date().toISOString(),
        opening_balance: openingBalance,
        expected_closing_balance: openingBalance,
        actual_closing_balance: 0,
        cash_sales: 0,
        cash_received: 0,
        cash_refunds: 0,
        petty_cash_out: 0,
        petty_cash_in: 0,
        variance: 0,
        status: 'open',
        opening_denominations: denominations.filter(d => d.count > 0),
        closing_denominations: [],
        transactions: []
      });

      setIsOpening(false);
      setDenominations(DENOMINATIONS.map(d => ({ ...d, count: 0 })));
    } catch (error) {
      console.error('Failed to open till:', error);
    }
  };

  const handleCloseTill = async () => {
    if (!currentSession) return;

    const closingBalance = calculateTotal(denominations);
    const variance = closingBalance - currentSession.expected_closing_balance;

    if (Math.abs(variance) > 0 && !varianceReason) {
      alert('Please provide a reason for the variance');
      return;
    }

    try {
      await apiClient.post('/finance/till/close', {
        session_id: currentSession.id,
        actual_closing_balance: closingBalance,
        closing_denominations: denominations.filter(d => d.count > 0),
        variance_reason: varianceReason
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        closing_time: new Date().toISOString(),
        actual_closing_balance: closingBalance,
        closing_denominations: denominations.filter(d => d.count > 0),
        variance: variance,
        variance_reason: varianceReason,
        status: 'closed'
      } : null);

      setIsClosing(false);
      setDenominations(DENOMINATIONS.map(d => ({ ...d, count: 0 })));
      setVarianceReason('');
      loadSessionHistory();
    } catch (error) {
      console.error('Failed to close till:', error);
    }
  };

  const handlePettyCash = async () => {
    if (!currentSession || !pettyCashAmount || !pettyCashReason) return;

    const amount = parseFloat(pettyCashAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await apiClient.post('/finance/till/petty-cash', {
        session_id: currentSession.id,
        type: pettyCashType,
        amount: amount,
        reason: pettyCashReason
      });

      const transaction: TillTransaction = {
        id: `TXN${Date.now()}`,
        time: new Date().toISOString(),
        type: pettyCashType === 'out' ? 'petty_cash_out' : 'petty_cash_in',
        reference: `PC-${Date.now()}`,
        amount: amount,
        description: pettyCashReason
      };

      setCurrentSession(prev => {
        if (!prev) return null;
        const newPettyOut = pettyCashType === 'out' ? prev.petty_cash_out + amount : prev.petty_cash_out;
        const newPettyIn = pettyCashType === 'in' ? prev.petty_cash_in + amount : prev.petty_cash_in;
        const newExpected = prev.opening_balance + prev.cash_received - prev.cash_refunds - newPettyOut + newPettyIn;

        return {
          ...prev,
          petty_cash_out: newPettyOut,
          petty_cash_in: newPettyIn,
          expected_closing_balance: newExpected,
          transactions: [...prev.transactions, transaction]
        };
      });

      setShowPettyCash(false);
      setPettyCashAmount('');
      setPettyCashReason('');
    } catch (error) {
      console.error('Failed to record petty cash:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDenominationInput = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Cash Denomination Count</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {denominations.map(denom => (
          <div key={denom.value} className="bg-gray-50 p-3 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {denom.label}
            </label>
            <input
              type="number"
              min="0"
              value={denom.count || ''}
              onChange={(e) => handleDenominationChange(denom.value, parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              = {formatCurrency(denom.value * denom.count)}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-blue-900">Total Cash Count</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(calculateTotal(denominations))}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCurrentSession = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    // Till Opening Screen
    if (isOpening) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Open Till</h3>
            <button
              onClick={() => setIsOpening(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              Count the cash in the drawer and enter the denomination breakdown below.
              This will be your opening float for the day.
            </p>
          </div>

          {renderDenominationInput()}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsOpening(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleOpenTill}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Open Till
            </button>
          </div>
        </div>
      );
    }

    // Till Closing Screen
    if (isClosing && currentSession) {
      const closingBalance = calculateTotal(denominations);
      const variance = closingBalance - currentSession.expected_closing_balance;

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Close Till</h3>
            <button
              onClick={() => setIsClosing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Expected Balance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Expected Cash Balance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Opening Float</span>
                <p className="font-medium">{formatCurrency(currentSession.opening_balance)}</p>
              </div>
              <div>
                <span className="text-blue-600">Cash Received</span>
                <p className="font-medium text-green-600">+{formatCurrency(currentSession.cash_received)}</p>
              </div>
              <div>
                <span className="text-blue-600">Refunds/Petty</span>
                <p className="font-medium text-red-600">
                  -{formatCurrency(currentSession.cash_refunds + currentSession.petty_cash_out)}
                </p>
              </div>
              <div>
                <span className="text-blue-600">Expected Total</span>
                <p className="font-bold text-blue-700">{formatCurrency(currentSession.expected_closing_balance)}</p>
              </div>
            </div>
          </div>

          {renderDenominationInput()}

          {/* Variance */}
          {closingBalance > 0 && (
            <div className={`p-4 rounded-lg ${
              variance === 0 ? 'bg-green-50 border border-green-200' :
              variance > 0 ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {variance === 0 ? 'Perfect Match!' :
                   variance > 0 ? 'Cash Surplus' : 'Cash Shortage'}
                </span>
                <span className={`text-xl font-bold ${
                  variance === 0 ? 'text-green-600' :
                  variance > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                </span>
              </div>

              {variance !== 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Variance *
                  </label>
                  <input
                    type="text"
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    placeholder="Explain the variance..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsClosing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseTill}
              disabled={closingBalance <= 0 || (Math.abs(variance) > 0 && !varianceReason)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              Close Till
            </button>
          </div>
        </div>
      );
    }

    // No Active Session
    if (!currentSession || currentSession.status === 'closed') {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💵</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Till Session</h3>
          <p className="text-gray-500 mb-6">
            Open the till to start recording cash transactions for the day.
          </p>
          <button
            onClick={() => setIsOpening(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Open Till
          </button>
        </div>
      );
    }

    // Active Session Dashboard
    return (
      <div className="space-y-6">
        {/* Session Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h3 className="text-lg font-semibold text-gray-900">Till Active</h3>
            </div>
            <p className="text-sm text-gray-500">
              Opened at {formatDateTime(currentSession.opening_time)} by {currentSession.cashier_name}
            </p>
          </div>
          <button
            onClick={() => setIsClosing(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Close Till
          </button>
        </div>

        {/* Cash Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm text-gray-500">Opening Float</span>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(currentSession.opening_balance)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm text-gray-500">Cash Sales</span>
            <p className="text-xl font-bold text-green-600">
              +{formatCurrency(currentSession.cash_received)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm text-gray-500">Refunds/Out</span>
            <p className="text-xl font-bold text-red-600">
              -{formatCurrency(currentSession.cash_refunds + currentSession.petty_cash_out)}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <span className="text-sm text-blue-600">Expected Balance</span>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(currentSession.expected_closing_balance)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPettyCashType('out');
              setShowPettyCash(true);
            }}
            className="flex-1 px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100"
          >
            📤 Petty Cash Out
          </button>
          <button
            onClick={() => {
              setPettyCashType('in');
              setShowPettyCash(true);
            }}
            className="flex-1 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100"
          >
            📥 Petty Cash In
          </button>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Today's Transactions</h4>
          {currentSession.transactions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No transactions recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {currentSession.transactions.map(txn => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      txn.type === 'sale' || txn.type === 'petty_cash_in'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {txn.type === 'sale' ? '💰' :
                       txn.type === 'petty_cash_in' ? '📥' :
                       txn.type === 'petty_cash_out' ? '📤' : '↩️'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(txn.time)}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${
                    txn.type === 'sale' || txn.type === 'petty_cash_in'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {txn.type === 'sale' || txn.type === 'petty_cash_in' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Petty Cash Modal */}
        {showPettyCash && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {pettyCashType === 'out' ? 'Petty Cash Out' : 'Petty Cash In'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={pettyCashAmount}
                    onChange={(e) => setPettyCashAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <input
                    type="text"
                    value={pettyCashReason}
                    onChange={(e) => setPettyCashReason(e.target.value)}
                    placeholder={pettyCashType === 'out' ? 'e.g., Stationery purchase' : 'e.g., Returned change'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPettyCash(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePettyCash}
                  disabled={!pettyCashAmount || !pettyCashReason}
                  className={`px-4 py-2 text-white rounded-lg disabled:bg-gray-300 ${
                    pettyCashType === 'out'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {pettyCashType === 'out' ? 'Record Cash Out' : 'Record Cash In'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Session History</h3>

      {sessionHistory.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No previous sessions found</p>
      ) : (
        <div className="space-y-3">
          {sessionHistory.map(session => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      session.status === 'closed'
                        ? session.variance === 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status === 'closed'
                        ? session.variance === 0 ? 'Balanced' : 'Variance'
                        : 'Open'}
                    </span>
                    <span className="text-sm text-gray-500">{session.id}</span>
                  </div>
                  <p className="font-medium text-gray-900 mt-1">{session.cashier_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(session.opening_time)}
                    {session.closing_time && ` - ${formatDateTime(session.closing_time)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(session.actual_closing_balance || session.expected_closing_balance)}
                  </p>
                  {session.variance !== 0 && (
                    <p className={`text-sm ${session.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {session.variance > 0 ? '+' : ''}{formatCurrency(session.variance)} variance
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Opening</span>
                  <p className="font-medium">{formatCurrency(session.opening_balance)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cash Sales</span>
                  <p className="font-medium text-green-600">+{formatCurrency(session.cash_received)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Refunds</span>
                  <p className="font-medium text-red-600">-{formatCurrency(session.cash_refunds)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Petty Cash</span>
                  <p className="font-medium text-orange-600">-{formatCurrency(session.petty_cash_out)}</p>
                </div>
              </div>

              {session.variance_reason && (
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  Variance Reason: {session.variance_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Till Reports</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Daily Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Sessions</span>
              <span className="font-medium">{sessionHistory.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Cash Collected</span>
              <span className="font-medium text-green-600">
                {formatCurrency(sessionHistory.reduce((sum, s) => sum + s.cash_received, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Refunds</span>
              <span className="font-medium text-red-600">
                {formatCurrency(sessionHistory.reduce((sum, s) => sum + s.cash_refunds, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Petty Cash Used</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(sessionHistory.reduce((sum, s) => sum + s.petty_cash_out, 0))}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-700">Net Variance</span>
              <span className={`font-bold ${
                sessionHistory.reduce((sum, s) => sum + s.variance, 0) >= 0
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(sessionHistory.reduce((sum, s) => sum + s.variance, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Variance Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Variance Analysis</h4>
          <div className="space-y-3">
            {sessionHistory.filter(s => s.variance !== 0).length === 0 ? (
              <p className="text-sm text-green-600">All sessions balanced perfectly!</p>
            ) : (
              sessionHistory.filter(s => s.variance !== 0).map(s => (
                <div key={s.id} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{s.cashier_name}</span>
                    <span className={s.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                      {s.variance > 0 ? '+' : ''}{formatCurrency(s.variance)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{s.variance_reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Till Management</h2>
        <p className="text-gray-600">Terminal {terminalId} • {cashierName}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'current', label: 'Current Session' },
          { id: 'history', label: 'History' },
          { id: 'reports', label: 'Reports' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'current' && renderCurrentSession()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  );
};
