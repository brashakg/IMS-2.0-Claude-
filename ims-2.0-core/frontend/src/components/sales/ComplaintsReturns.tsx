// ============================================================================
// IMS 2.0 - Complaints & Returns Component
// Customer complaint tracking and return/exchange processing
// ============================================================================

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface Complaint {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  order_id: string;
  order_number: string;
  product_name: string;
  product_sku: string;
  complaint_type: 'quality' | 'service' | 'delivery' | 'wrong_product' | 'damaged' | 'other';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  resolution_type?: 'refund' | 'replacement' | 'repair' | 'exchange' | 'no_action';
  resolution_notes?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  attachments?: string[];
  timeline: ComplaintEvent[];
}

interface ComplaintEvent {
  id: string;
  timestamp: string;
  action: string;
  by: string;
  notes?: string;
}

interface ReturnRequest {
  id: string;
  return_number: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  items: ReturnItem[];
  return_type: 'return' | 'exchange';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed';
  refund_amount?: number;
  refund_method?: string;
  exchange_order_id?: string;
  created_at: string;
  processed_at?: string;
  notes?: string;
}

interface ReturnItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  condition: 'good' | 'damaged' | 'defective';
  accepted: boolean;
}

interface Props {
  storeId?: string;
}

export const ComplaintsReturns: React.FC<Props> = ({ storeId }) => {
  const [activeTab, setActiveTab] = useState<'complaints' | 'returns'>('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected items
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New complaint modal
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    customer_phone: '',
    order_number: '',
    complaint_type: 'quality' as Complaint['complaint_type'],
    priority: 'P2' as Complaint['priority'],
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [complaintsRes, returnsRes] = await Promise.all([
        apiClient.get(`/sales/complaints?store_id=${storeId || ''}`),
        apiClient.get(`/sales/returns?store_id=${storeId || ''}`)
      ]);
      setComplaints(complaintsRes.data || []);
      setReturns(returnsRes.data || []);
    } catch (error) {
      // Mock data
      setComplaints([
        {
          id: 'CMP001',
          ticket_number: 'TKT-2024-0125',
          customer_id: 'CUST001',
          customer_name: 'Ramesh Agarwal',
          customer_phone: '9876543210',
          order_id: 'ORD001',
          order_number: 'ORD/2024/1234',
          product_name: 'Ray-Ban Aviator Classic',
          product_sku: 'RB3025-001',
          complaint_type: 'quality',
          priority: 'P1',
          description: 'Frame hinge is loose after just 2 weeks of use. Customer is unhappy with quality.',
          status: 'in_progress',
          assigned_to: 'EMP001',
          assigned_to_name: 'Rajesh Kumar',
          created_at: '2024-02-18T10:30:00',
          updated_at: '2024-02-19T14:20:00',
          timeline: [
            { id: 'E1', timestamp: '2024-02-18T10:30:00', action: 'Complaint registered', by: 'System' },
            { id: 'E2', timestamp: '2024-02-18T10:35:00', action: 'Assigned to Rajesh Kumar', by: 'Store Manager' },
            { id: 'E3', timestamp: '2024-02-19T14:20:00', action: 'Customer contacted, arranging inspection', by: 'Rajesh Kumar' }
          ]
        },
        {
          id: 'CMP002',
          ticket_number: 'TKT-2024-0118',
          customer_id: 'CUST002',
          customer_name: 'Sunita Verma',
          customer_phone: '9988776655',
          order_id: 'ORD002',
          order_number: 'ORD/2024/1189',
          product_name: 'Essilor Progressive Lenses',
          product_sku: 'ESS-PRO-001',
          complaint_type: 'service',
          priority: 'P2',
          description: 'Prescription was entered incorrectly, causing discomfort. Needs to be remade.',
          status: 'resolved',
          resolution_type: 'replacement',
          resolution_notes: 'Lenses remade with correct prescription at no charge. Customer satisfied.',
          assigned_to: 'EMP002',
          assigned_to_name: 'Priya Sharma',
          created_at: '2024-02-15T09:00:00',
          updated_at: '2024-02-17T16:00:00',
          resolved_at: '2024-02-17T16:00:00',
          timeline: [
            { id: 'E1', timestamp: '2024-02-15T09:00:00', action: 'Complaint registered', by: 'System' },
            { id: 'E2', timestamp: '2024-02-15T09:15:00', action: 'Assigned to Priya Sharma', by: 'Store Manager' },
            { id: 'E3', timestamp: '2024-02-15T11:00:00', action: 'Prescription verified - error confirmed', by: 'Priya Sharma' },
            { id: 'E4', timestamp: '2024-02-16T10:00:00', action: 'Replacement order placed', by: 'Priya Sharma' },
            { id: 'E5', timestamp: '2024-02-17T16:00:00', action: 'Resolved - customer collected new lenses', by: 'Priya Sharma' }
          ]
        },
        {
          id: 'CMP003',
          ticket_number: 'TKT-2024-0130',
          customer_id: 'CUST003',
          customer_name: 'Vikram Singh',
          customer_phone: '9111222333',
          order_id: 'ORD003',
          order_number: 'ORD/2024/1456',
          product_name: 'Delivery Service',
          product_sku: '-',
          complaint_type: 'delivery',
          priority: 'P0',
          description: 'Order not delivered despite promised date. Customer waiting for 5 days.',
          status: 'escalated',
          assigned_to: 'EMP003',
          assigned_to_name: 'Store Manager',
          created_at: '2024-02-20T08:00:00',
          updated_at: '2024-02-20T10:00:00',
          timeline: [
            { id: 'E1', timestamp: '2024-02-20T08:00:00', action: 'Complaint registered', by: 'System' },
            { id: 'E2', timestamp: '2024-02-20T08:15:00', action: 'Priority escalated to P0', by: 'System' },
            { id: 'E3', timestamp: '2024-02-20T10:00:00', action: 'Escalated to Area Manager', by: 'Store Manager' }
          ]
        }
      ]);

      setReturns([
        {
          id: 'RTN001',
          return_number: 'RTN-2024-0045',
          order_id: 'ORD004',
          order_number: 'ORD/2024/1350',
          customer_id: 'CUST004',
          customer_name: 'Anita Desai',
          customer_phone: '9444555666',
          items: [
            { product_id: 'PRD001', product_name: 'Vogue Cat-Eye Frame', sku: 'VOG-CAT-001', quantity: 1, unit_price: 5500, condition: 'good', accepted: true }
          ],
          return_type: 'exchange',
          reason: 'Size does not fit properly. Customer wants to exchange for a different size.',
          status: 'approved',
          created_at: '2024-02-19T14:00:00',
          notes: 'Customer to bring item to store for exchange within 3 days'
        },
        {
          id: 'RTN002',
          return_number: 'RTN-2024-0042',
          order_id: 'ORD005',
          order_number: 'ORD/2024/1298',
          customer_id: 'CUST005',
          customer_name: 'Mohan Lal',
          customer_phone: '9333444555',
          items: [
            { product_id: 'PRD002', product_name: 'Titan Round Frame', sku: 'TIT-RND-002', quantity: 1, unit_price: 4200, condition: 'defective', accepted: true }
          ],
          return_type: 'return',
          reason: 'Frame broke within warranty period. Manufacturing defect.',
          status: 'completed',
          refund_amount: 4956,
          refund_method: 'Bank Transfer',
          created_at: '2024-02-15T11:00:00',
          processed_at: '2024-02-17T12:00:00'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async () => {
    try {
      await apiClient.post('/sales/complaints', newComplaint);
      loadData();
      setShowNewComplaint(false);
      setNewComplaint({
        customer_phone: '',
        order_number: '',
        complaint_type: 'quality',
        priority: 'P2',
        description: ''
      });
    } catch (error) {
      // Mock - add locally
      const mockComplaint: Complaint = {
        id: `CMP${Date.now()}`,
        ticket_number: `TKT-2024-${String(complaints.length + 1).padStart(4, '0')}`,
        customer_id: 'MOCK',
        customer_name: 'Customer',
        customer_phone: newComplaint.customer_phone,
        order_id: 'MOCK',
        order_number: newComplaint.order_number,
        product_name: 'Product',
        product_sku: 'SKU',
        complaint_type: newComplaint.complaint_type,
        priority: newComplaint.priority,
        description: newComplaint.description,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timeline: [
          { id: 'E1', timestamp: new Date().toISOString(), action: 'Complaint registered', by: 'System' }
        ]
      };
      setComplaints(prev => [mockComplaint, ...prev]);
      setShowNewComplaint(false);
      setNewComplaint({
        customer_phone: '',
        order_number: '',
        complaint_type: 'quality',
        priority: 'P2',
        description: ''
      });
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: Complaint['status']) => {
    try {
      await apiClient.patch(`/sales/complaints/${complaintId}`, { status: newStatus });
      setComplaints(prev => prev.map(c =>
        c.id === complaintId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      ));
    } catch (error) {
      setComplaints(prev => prev.map(c =>
        c.id === complaintId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      ));
    }
  };

  const handleProcessReturn = async (returnId: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/sales/returns/${returnId}/${action}`);
      setReturns(prev => prev.map(r =>
        r.id === returnId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
      ));
    } catch (error) {
      setReturns(prev => prev.map(r =>
        r.id === returnId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
      ));
    }
  };

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority: Complaint['priority']): string => {
    const colors: Record<string, string> = {
      'P0': 'bg-red-900 text-white',
      'P1': 'bg-red-600 text-white',
      'P2': 'bg-orange-500 text-white',
      'P3': 'bg-yellow-500 text-black'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const getStatusColor = (status: Complaint['status']): string => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      escalated: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getReturnStatusColor = (status: ReturnRequest['status']): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      processed: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredComplaints = complaints.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return c.customer_name.toLowerCase().includes(query) ||
             c.ticket_number.toLowerCase().includes(query) ||
             c.order_number.toLowerCase().includes(query);
    }
    return true;
  });

  const filteredReturns = returns.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.customer_name.toLowerCase().includes(query) ||
             r.return_number.toLowerCase().includes(query) ||
             r.order_number.toLowerCase().includes(query);
    }
    return true;
  });

  const renderComplaints = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search complaints..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button
          onClick={() => setShowNewComplaint(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Complaint
        </button>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No complaints found</div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map(complaint => (
            <div
              key={complaint.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                selectedComplaint?.id === complaint.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onClick={() => setSelectedComplaint(selectedComplaint?.id === complaint.id ? null : complaint)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{complaint.ticket_number}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{complaint.customer_name} • {complaint.customer_phone}</p>
                    <p className="text-sm text-gray-500">{complaint.product_name}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{formatDateTime(complaint.created_at)}</p>
                  {complaint.assigned_to_name && (
                    <p className="text-xs">Assigned: {complaint.assigned_to_name}</p>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedComplaint?.id === complaint.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{complaint.description}</p>
                  </div>

                  {complaint.resolution_notes && (
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-green-700 mb-1">Resolution</h4>
                      <p className="text-sm text-green-600">{complaint.resolution_notes}</p>
                    </div>
                  )}

                  {/* Timeline */}
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                  <div className="space-y-2">
                    {complaint.timeline.map((event, idx) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{event.action}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(event.timestamp)} by {event.by}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {complaint.status !== 'closed' && complaint.status !== 'resolved' && (
                    <div className="flex gap-2 mt-4">
                      {complaint.status === 'open' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(complaint.id, 'in_progress'); }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Start Working
                        </button>
                      )}
                      {complaint.status === 'in_progress' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(complaint.id, 'resolved'); }}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(complaint.id, 'escalated'); }}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReturns = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search returns..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No return requests found</div>
      ) : (
        <div className="space-y-3">
          {filteredReturns.map(returnReq => (
            <div
              key={returnReq.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                selectedReturn?.id === returnReq.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onClick={() => setSelectedReturn(selectedReturn?.id === returnReq.id ? null : returnReq)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{returnReq.return_number}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getReturnStatusColor(returnReq.status)}`}>
                      {returnReq.status}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      returnReq.return_type === 'return' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {returnReq.return_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{returnReq.customer_name} • {returnReq.customer_phone}</p>
                  <p className="text-sm text-gray-500">Order: {returnReq.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatDateTime(returnReq.created_at)}</p>
                  {returnReq.refund_amount && (
                    <p className="font-medium text-green-600">{formatCurrency(returnReq.refund_amount)}</p>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedReturn?.id === returnReq.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {/* Items */}
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                  <div className="space-y-2 mb-4">
                    {returnReq.items.map(item => (
                      <div key={item.product_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku} • Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(item.unit_price)}</p>
                          <span className={`text-xs ${
                            item.condition === 'good' ? 'text-green-600' :
                            item.condition === 'damaged' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {item.condition}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reason */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Reason</h4>
                    <p className="text-sm text-gray-600">{returnReq.reason}</p>
                  </div>

                  {/* Actions */}
                  {returnReq.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProcessReturn(returnReq.id, 'approve'); }}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProcessReturn(returnReq.id, 'reject'); }}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Complaints & Returns</h2>
        <p className="text-gray-600">Manage customer complaints and return requests</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-sm text-red-600">Open Complaints</span>
          <p className="text-2xl font-bold text-red-700">
            {complaints.filter(c => c.status === 'open' || c.status === 'escalated').length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <span className="text-sm text-yellow-600">In Progress</span>
          <p className="text-2xl font-bold text-yellow-700">
            {complaints.filter(c => c.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-sm text-blue-600">Pending Returns</span>
          <p className="text-2xl font-bold text-blue-700">
            {returns.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-sm text-green-600">Resolved Today</span>
          <p className="text-2xl font-bold text-green-700">
            {complaints.filter(c =>
              c.status === 'resolved' &&
              c.resolved_at &&
              new Date(c.resolved_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => { setActiveTab('complaints'); setStatusFilter('all'); }}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'complaints'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Complaints ({complaints.length})
        </button>
        <button
          onClick={() => { setActiveTab('returns'); setStatusFilter('all'); }}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'returns'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Returns ({returns.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : (
          <>
            {activeTab === 'complaints' && renderComplaints()}
            {activeTab === 'returns' && renderReturns()}
          </>
        )}
      </div>

      {/* New Complaint Modal */}
      {showNewComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Register New Complaint</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    value={newComplaint.customer_phone}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, customer_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number *</label>
                  <input
                    type="text"
                    value={newComplaint.order_number}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, order_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={newComplaint.complaint_type}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, complaint_type: e.target.value as Complaint['complaint_type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="quality">Quality Issue</option>
                    <option value="service">Service Issue</option>
                    <option value="delivery">Delivery Issue</option>
                    <option value="wrong_product">Wrong Product</option>
                    <option value="damaged">Damaged Product</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, priority: e.target.value as Complaint['priority'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="P0">P0 - Critical</option>
                    <option value="P1">P1 - High</option>
                    <option value="P2">P2 - Medium</option>
                    <option value="P3">P3 - Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewComplaint(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateComplaint}
                disabled={!newComplaint.customer_phone || !newComplaint.order_number || !newComplaint.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Create Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
