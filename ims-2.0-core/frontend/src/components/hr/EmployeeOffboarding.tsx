// ============================================================================
// IMS 2.0 - Employee Offboarding Component
// Exit workflow with stock count, access revocation, settlement calculation
// ============================================================================

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface OffboardingChecklist {
  stock_handover: boolean;
  asset_return: boolean;
  access_revoked: boolean;
  tasks_reassigned: boolean;
  knowledge_transfer: boolean;
  exit_interview: boolean;
  clearance_finance: boolean;
  clearance_hr: boolean;
  clearance_it: boolean;
  clearance_store: boolean;
}

interface SettlementDetails {
  pending_salary: number;
  leave_encashment: number;
  bonus_pending: number;
  pf_settlement: number;
  gratuity: number;
  notice_period_recovery: number;
  asset_recovery: number;
  loan_outstanding: number;
  other_deductions: number;
  net_settlement: number;
}

interface AssignedAsset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  assigned_date: string;
  returned: boolean;
  condition: string;
  remarks: string;
}

interface PendingTask {
  task_id: string;
  task_name: string;
  priority: string;
  due_date: string;
  reassigned_to: string;
}

interface OffboardingData {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  store_id: string;
  store_name: string;
  joining_date: string;
  last_working_day: string;
  resignation_date: string;
  exit_type: 'resignation' | 'termination' | 'retirement' | 'contract_end' | 'absconding';
  exit_reason: string;
  notice_period_days: number;
  notice_period_served: number;
  notice_period_waived: boolean;
  checklist: OffboardingChecklist;
  settlement: SettlementDetails;
  assets: AssignedAsset[];
  pending_tasks: PendingTask[];
  remarks: string;
  status: 'initiated' | 'in_progress' | 'pending_clearance' | 'completed' | 'cancelled';
}

interface Props {
  employeeId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const EmployeeOffboarding: React.FC<Props> = ({
  employeeId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [offboardingData, setOffboardingData] = useState<OffboardingData>({
    employee_id: employeeId || '',
    employee_name: '',
    employee_code: '',
    designation: '',
    department: '',
    store_id: '',
    store_name: '',
    joining_date: '',
    last_working_day: '',
    resignation_date: new Date().toISOString().split('T')[0],
    exit_type: 'resignation',
    exit_reason: '',
    notice_period_days: 30,
    notice_period_served: 0,
    notice_period_waived: false,
    checklist: {
      stock_handover: false,
      asset_return: false,
      access_revoked: false,
      tasks_reassigned: false,
      knowledge_transfer: false,
      exit_interview: false,
      clearance_finance: false,
      clearance_hr: false,
      clearance_it: false,
      clearance_store: false
    },
    settlement: {
      pending_salary: 0,
      leave_encashment: 0,
      bonus_pending: 0,
      pf_settlement: 0,
      gratuity: 0,
      notice_period_recovery: 0,
      asset_recovery: 0,
      loan_outstanding: 0,
      other_deductions: 0,
      net_settlement: 0
    },
    assets: [],
    pending_tasks: [],
    remarks: '',
    status: 'initiated'
  });

  const steps = [
    { number: 1, title: 'Exit Details', description: 'Resignation/Termination info' },
    { number: 2, title: 'Stock & Assets', description: 'Handover inventory & assets' },
    { number: 3, title: 'Task Reassignment', description: 'Transfer pending work' },
    { number: 4, title: 'Clearances', description: 'Department approvals' },
    { number: 5, title: 'Settlement', description: 'Final settlement calculation' },
    { number: 6, title: 'Confirmation', description: 'Review & complete' }
  ];

  useEffect(() => {
    loadEmployees();
    loadStaffList();
  }, []);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeDetails(employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    calculateSettlement();
  }, [
    offboardingData.notice_period_served,
    offboardingData.notice_period_waived,
    offboardingData.assets
  ]);

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get('/hr/employees?status=active');
      setEmployees(response.data || []);
    } catch (error) {
      // Mock data for development
      setEmployees([
        { id: 'EMP001', name: 'Rajesh Kumar', code: 'EMP001', designation: 'Sales Staff', department: 'Sales', store_id: 'STR001', store_name: 'Mumbai Central', joining_date: '2022-03-15' },
        { id: 'EMP002', name: 'Priya Sharma', code: 'EMP002', designation: 'Optometrist', department: 'Clinical', store_id: 'STR001', store_name: 'Mumbai Central', joining_date: '2021-08-01' },
        { id: 'EMP003', name: 'Amit Patel', code: 'EMP003', designation: 'Store Manager', department: 'Operations', store_id: 'STR002', store_name: 'Delhi Connaught', joining_date: '2020-01-10' }
      ]);
    }
  };

  const loadStaffList = async () => {
    try {
      const response = await apiClient.get('/hr/employees?status=active');
      setStaffList(response.data || []);
    } catch (error) {
      setStaffList([
        { id: 'EMP004', name: 'Sunita Verma' },
        { id: 'EMP005', name: 'Vikram Singh' },
        { id: 'EMP006', name: 'Neha Gupta' }
      ]);
    }
  };

  const loadEmployeeDetails = async (empId: string) => {
    try {
      const response = await apiClient.get(`/hr/employees/${empId}`);
      const emp = response.data;

      setOffboardingData(prev => ({
        ...prev,
        employee_id: emp.id,
        employee_name: emp.name,
        employee_code: emp.code,
        designation: emp.designation,
        department: emp.department,
        store_id: emp.store_id,
        store_name: emp.store_name,
        joining_date: emp.joining_date
      }));

      // Load assets
      const assetsResponse = await apiClient.get(`/hr/employees/${empId}/assets`);
      setOffboardingData(prev => ({
        ...prev,
        assets: assetsResponse.data || []
      }));

      // Load pending tasks
      const tasksResponse = await apiClient.get(`/tasks?assigned_to=${empId}&status=pending`);
      setOffboardingData(prev => ({
        ...prev,
        pending_tasks: tasksResponse.data || []
      }));
    } catch (error) {
      // Mock data
      const mockAssets: AssignedAsset[] = [
        { asset_id: 'AST001', asset_name: 'Laptop Dell Latitude', asset_type: 'Electronics', assigned_date: '2022-03-15', returned: false, condition: '', remarks: '' },
        { asset_id: 'AST002', asset_name: 'ID Card', asset_type: 'ID', assigned_date: '2022-03-15', returned: false, condition: '', remarks: '' },
        { asset_id: 'AST003', asset_name: 'Store Keys', asset_type: 'Keys', assigned_date: '2022-03-15', returned: false, condition: '', remarks: '' }
      ];

      const mockTasks: PendingTask[] = [
        { task_id: 'TSK001', task_name: 'Monthly inventory audit', priority: 'P1', due_date: '2024-02-15', reassigned_to: '' },
        { task_id: 'TSK002', task_name: 'Customer follow-up calls', priority: 'P2', due_date: '2024-02-10', reassigned_to: '' }
      ];

      setOffboardingData(prev => ({
        ...prev,
        assets: mockAssets,
        pending_tasks: mockTasks
      }));
    }
  };

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setOffboardingData(prev => ({
        ...prev,
        employee_id: emp.id,
        employee_name: emp.name,
        employee_code: emp.code,
        designation: emp.designation,
        department: emp.department,
        store_id: emp.store_id,
        store_name: emp.store_name,
        joining_date: emp.joining_date
      }));
      loadEmployeeDetails(emp.id);
    }
  };

  const calculateSettlement = () => {
    // Mock calculation - in real implementation, fetch from backend
    const basicSalary = 25000; // Would come from employee data
    const daysInMonth = 30;

    const pendingSalary = (basicSalary / daysInMonth) * 15; // Assuming 15 days pending
    const leaveEncashment = (basicSalary / daysInMonth) * 10; // 10 days leave balance
    const bonusPending = 5000;
    const pfSettlement = basicSalary * 12 * 0.12; // 12% of annual basic

    // Gratuity: (Basic * 15 * Years of Service) / 26
    const yearsOfService = 2;
    const gratuity = yearsOfService >= 5 ? (basicSalary * 15 * yearsOfService) / 26 : 0;

    // Notice period recovery
    const noticeDaysShort = offboardingData.notice_period_waived ? 0 :
      Math.max(0, offboardingData.notice_period_days - offboardingData.notice_period_served);
    const noticeRecovery = (basicSalary / daysInMonth) * noticeDaysShort;

    // Asset recovery - calculate from unreturned assets
    const assetRecovery = offboardingData.assets
      .filter(a => !a.returned)
      .reduce((sum, a) => sum + (a.asset_type === 'Electronics' ? 5000 : 500), 0);

    const loanOutstanding = 0; // Would come from finance
    const otherDeductions = 0;

    const totalEarnings = pendingSalary + leaveEncashment + bonusPending + pfSettlement + gratuity;
    const totalDeductions = noticeRecovery + assetRecovery + loanOutstanding + otherDeductions;
    const netSettlement = totalEarnings - totalDeductions;

    setOffboardingData(prev => ({
      ...prev,
      settlement: {
        pending_salary: pendingSalary,
        leave_encashment: leaveEncashment,
        bonus_pending: bonusPending,
        pf_settlement: pfSettlement,
        gratuity: gratuity,
        notice_period_recovery: noticeRecovery,
        asset_recovery: assetRecovery,
        loan_outstanding: loanOutstanding,
        other_deductions: otherDeductions,
        net_settlement: netSettlement
      }
    }));
  };

  const handleAssetReturn = (assetId: string, returned: boolean, condition: string) => {
    setOffboardingData(prev => ({
      ...prev,
      assets: prev.assets.map(a =>
        a.asset_id === assetId
          ? { ...a, returned, condition }
          : a
      )
    }));
  };

  const handleTaskReassign = (taskId: string, reassignedTo: string) => {
    setOffboardingData(prev => ({
      ...prev,
      pending_tasks: prev.pending_tasks.map(t =>
        t.task_id === taskId
          ? { ...t, reassigned_to: reassignedTo }
          : t
      )
    }));
  };

  const handleChecklistChange = (key: keyof OffboardingChecklist, value: boolean) => {
    setOffboardingData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: value }
    }));
  };

  const getChecklistProgress = (): number => {
    const checklist = offboardingData.checklist;
    const total = Object.keys(checklist).length;
    const completed = Object.values(checklist).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!offboardingData.employee_id &&
               !!offboardingData.last_working_day &&
               !!offboardingData.exit_reason;
      case 2:
        return offboardingData.assets.every(a => a.returned || a.condition === 'lost');
      case 3:
        return offboardingData.pending_tasks.every(t => !!t.reassigned_to);
      case 4:
        return offboardingData.checklist.clearance_finance &&
               offboardingData.checklist.clearance_hr &&
               offboardingData.checklist.clearance_store;
      case 5:
        return true;
      case 6:
        return getChecklistProgress() === 100;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/hr/offboarding', offboardingData);

      // Revoke access
      await apiClient.post(`/hr/employees/${offboardingData.employee_id}/revoke-access`);

      // Process settlement
      await apiClient.post('/finance/settlement', {
        employee_id: offboardingData.employee_id,
        settlement: offboardingData.settlement
      });

      onComplete?.();
    } catch (error) {
      console.error('Offboarding failed:', error);
      // For demo, proceed anyway
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'P0': 'bg-red-900 text-white',
      'P1': 'bg-red-600 text-white',
      'P2': 'bg-orange-500 text-white',
      'P3': 'bg-yellow-500 text-black',
      'P4': 'bg-blue-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Exit Details</h3>

            {/* Employee Selection */}
            {!employeeId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee *
                </label>
                <select
                  value={offboardingData.employee_id}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee Info Card */}
            {offboardingData.employee_id && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Employee Code</span>
                    <p className="font-medium">{offboardingData.employee_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Name</span>
                    <p className="font-medium">{offboardingData.employee_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Designation</span>
                    <p className="font-medium">{offboardingData.designation}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Store</span>
                    <p className="font-medium">{offboardingData.store_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Department</span>
                    <p className="font-medium">{offboardingData.department}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Joining Date</span>
                    <p className="font-medium">{offboardingData.joining_date}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exit Type *
                </label>
                <select
                  value={offboardingData.exit_type}
                  onChange={(e) => setOffboardingData(prev => ({
                    ...prev,
                    exit_type: e.target.value as OffboardingData['exit_type']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="resignation">Resignation</option>
                  <option value="termination">Termination</option>
                  <option value="retirement">Retirement</option>
                  <option value="contract_end">Contract End</option>
                  <option value="absconding">Absconding</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resignation/Notice Date *
                </label>
                <input
                  type="date"
                  value={offboardingData.resignation_date}
                  onChange={(e) => setOffboardingData(prev => ({
                    ...prev,
                    resignation_date: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Working Day *
                </label>
                <input
                  type="date"
                  value={offboardingData.last_working_day}
                  onChange={(e) => setOffboardingData(prev => ({
                    ...prev,
                    last_working_day: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  value={offboardingData.notice_period_days}
                  onChange={(e) => setOffboardingData(prev => ({
                    ...prev,
                    notice_period_days: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notice Period Served (Days)
                </label>
                <input
                  type="number"
                  value={offboardingData.notice_period_served}
                  onChange={(e) => setOffboardingData(prev => ({
                    ...prev,
                    notice_period_served: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notice_waived"
                  checked={offboardingData.notice_period_waived}
                  onChange={(e) => setOffboardingData(prev => ({
                    ...prev,
                    notice_period_waived: e.target.checked
                  }))}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="notice_waived" className="ml-2 text-sm text-gray-700">
                  Notice Period Waived
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exit Reason *
              </label>
              <textarea
                value={offboardingData.exit_reason}
                onChange={(e) => setOffboardingData(prev => ({
                  ...prev,
                  exit_reason: e.target.value
                }))}
                rows={3}
                placeholder="Reason for leaving..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Stock & Asset Handover</h3>

            {/* Stock Count Verification */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800">Stock Count Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please ensure a complete stock count is performed for the employee's assigned inventory
                    before proceeding. Any discrepancies will be adjusted in the final settlement.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="stock_handover"
                checked={offboardingData.checklist.stock_handover}
                onChange={(e) => handleChecklistChange('stock_handover', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="stock_handover" className="ml-2 text-sm font-medium text-gray-700">
                Stock count completed and verified
              </label>
            </div>

            {/* Assets Table */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Assigned Assets</h4>
              {offboardingData.assets.length === 0 ? (
                <p className="text-gray-500 text-sm">No assets assigned to this employee.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {offboardingData.assets.map(asset => (
                        <tr key={asset.asset_id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {asset.asset_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {asset.asset_type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {asset.assigned_date}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={asset.returned ? 'returned' : (asset.condition === 'lost' ? 'lost' : 'pending')}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleAssetReturn(
                                  asset.asset_id,
                                  val === 'returned',
                                  val === 'lost' ? 'lost' : ''
                                );
                              }}
                              className="text-sm px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="pending">Pending</option>
                              <option value="returned">Returned</option>
                              <option value="lost">Lost/Damaged</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {asset.returned && (
                              <select
                                value={asset.condition}
                                onChange={(e) => handleAssetReturn(asset.asset_id, true, e.target.value)}
                                className="text-sm px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="">Select</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                              </select>
                            )}
                            {asset.condition === 'lost' && (
                              <span className="text-red-600 text-sm">Will be deducted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="asset_return"
                checked={offboardingData.checklist.asset_return}
                onChange={(e) => handleChecklistChange('asset_return', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="asset_return" className="ml-2 text-sm font-medium text-gray-700">
                All assets returned or accounted for
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Task Reassignment</h3>

            <p className="text-sm text-gray-600">
              Reassign all pending tasks to other team members before the employee's last working day.
            </p>

            {offboardingData.pending_tasks.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700">No pending tasks assigned to this employee.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {offboardingData.pending_tasks.map(task => (
                  <div key={task.task_id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Due: {task.due_date}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Reassign To</label>
                        <select
                          value={task.reassigned_to}
                          onChange={(e) => handleTaskReassign(task.task_id, e.target.value)}
                          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select --</option>
                          {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="tasks_reassigned"
                checked={offboardingData.checklist.tasks_reassigned}
                onChange={(e) => handleChecklistChange('tasks_reassigned', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="tasks_reassigned" className="ml-2 text-sm font-medium text-gray-700">
                All tasks have been reassigned
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="knowledge_transfer"
                checked={offboardingData.checklist.knowledge_transfer}
                onChange={(e) => handleChecklistChange('knowledge_transfer', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="knowledge_transfer" className="ml-2 text-sm font-medium text-gray-700">
                Knowledge transfer completed
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Clearances</h3>

            <p className="text-sm text-gray-600">
              Obtain clearance from all relevant departments before processing the final settlement.
            </p>

            <div className="space-y-4">
              {/* Store Clearance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Store Manager Clearance</h4>
                    <p className="text-sm text-gray-500">Stock, assets, and store-related dues</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="clearance_store"
                      checked={offboardingData.checklist.clearance_store}
                      onChange={(e) => handleChecklistChange('clearance_store', e.target.checked)}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="clearance_store" className="ml-2 text-sm font-medium">
                      {offboardingData.checklist.clearance_store ? 'Cleared' : 'Pending'}
                    </label>
                  </div>
                </div>
              </div>

              {/* IT Clearance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">IT Clearance</h4>
                    <p className="text-sm text-gray-500">System access, email, software licenses</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="clearance_it"
                      checked={offboardingData.checklist.clearance_it}
                      onChange={(e) => handleChecklistChange('clearance_it', e.target.checked)}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="clearance_it" className="ml-2 text-sm font-medium">
                      {offboardingData.checklist.clearance_it ? 'Cleared' : 'Pending'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Finance Clearance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Finance Clearance</h4>
                    <p className="text-sm text-gray-500">Loans, advances, expense claims</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="clearance_finance"
                      checked={offboardingData.checklist.clearance_finance}
                      onChange={(e) => handleChecklistChange('clearance_finance', e.target.checked)}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="clearance_finance" className="ml-2 text-sm font-medium">
                      {offboardingData.checklist.clearance_finance ? 'Cleared' : 'Pending'}
                    </label>
                  </div>
                </div>
              </div>

              {/* HR Clearance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">HR Clearance</h4>
                    <p className="text-sm text-gray-500">Exit interview, documentation, relieving letter</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="clearance_hr"
                      checked={offboardingData.checklist.clearance_hr}
                      onChange={(e) => handleChecklistChange('clearance_hr', e.target.checked)}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="clearance_hr" className="ml-2 text-sm font-medium">
                      {offboardingData.checklist.clearance_hr ? 'Cleared' : 'Pending'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Exit Interview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Exit Interview</h4>
                  <p className="text-sm text-blue-700">Conduct exit interview for feedback</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exit_interview"
                    checked={offboardingData.checklist.exit_interview}
                    onChange={(e) => handleChecklistChange('exit_interview', e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="exit_interview" className="ml-2 text-sm font-medium">
                    {offboardingData.checklist.exit_interview ? 'Completed' : 'Pending'}
                  </label>
                </div>
              </div>
            </div>

            {/* Access Revocation */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Access Revocation</h4>
                  <p className="text-sm text-red-700">
                    System access will be revoked on last working day
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="access_revoked"
                    checked={offboardingData.checklist.access_revoked}
                    onChange={(e) => handleChecklistChange('access_revoked', e.target.checked)}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="access_revoked" className="ml-2 text-sm font-medium">
                    {offboardingData.checklist.access_revoked ? 'Scheduled' : 'Pending'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Final Settlement Calculation</h3>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Earnings */}
              <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-green-800">Earnings</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Salary</span>
                  <span className="font-medium">{formatCurrency(offboardingData.settlement.pending_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leave Encashment</span>
                  <span className="font-medium">{formatCurrency(offboardingData.settlement.leave_encashment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonus Pending</span>
                  <span className="font-medium">{formatCurrency(offboardingData.settlement.bonus_pending)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PF Settlement</span>
                  <span className="font-medium">{formatCurrency(offboardingData.settlement.pf_settlement)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gratuity</span>
                  <span className="font-medium">{formatCurrency(offboardingData.settlement.gratuity)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium text-green-700">Total Earnings</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(
                      offboardingData.settlement.pending_salary +
                      offboardingData.settlement.leave_encashment +
                      offboardingData.settlement.bonus_pending +
                      offboardingData.settlement.pf_settlement +
                      offboardingData.settlement.gratuity
                    )}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 px-4 py-3 border-y border-gray-200">
                <h4 className="font-medium text-red-800">Deductions</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Notice Period Recovery</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(offboardingData.settlement.notice_period_recovery)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset Recovery</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(offboardingData.settlement.asset_recovery)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Outstanding</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(offboardingData.settlement.loan_outstanding)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Deductions</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(offboardingData.settlement.other_deductions)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium text-red-700">Total Deductions</span>
                  <span className="font-bold text-red-700">
                    -{formatCurrency(
                      offboardingData.settlement.notice_period_recovery +
                      offboardingData.settlement.asset_recovery +
                      offboardingData.settlement.loan_outstanding +
                      offboardingData.settlement.other_deductions
                    )}
                  </span>
                </div>
              </div>

              {/* Net Settlement */}
              <div className="bg-blue-50 px-4 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-blue-900">Net Settlement Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(offboardingData.settlement.net_settlement)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks / Notes
              </label>
              <textarea
                value={offboardingData.remarks}
                onChange={(e) => setOffboardingData(prev => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                placeholder="Any additional notes for settlement..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Offboarding Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Employee</span>
                  <p className="font-medium">{offboardingData.employee_code} - {offboardingData.employee_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Exit Type</span>
                  <p className="font-medium capitalize">{offboardingData.exit_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Working Day</span>
                  <p className="font-medium">{offboardingData.last_working_day}</p>
                </div>
                <div>
                  <span className="text-gray-500">Net Settlement</span>
                  <p className="font-medium text-blue-600">{formatCurrency(offboardingData.settlement.net_settlement)}</p>
                </div>
              </div>
            </div>

            {/* Checklist Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Checklist Progress</h4>
                <span className="text-sm font-medium text-gray-600">{getChecklistProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getChecklistProgress()}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(offboardingData.checklist).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                    value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {value ? '✓' : '○'}
                  </span>
                  <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                    {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
              ))}
            </div>

            {getChecklistProgress() < 100 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 text-sm">
                  <span className="font-medium">Warning:</span> Some checklist items are incomplete.
                  Please complete all items before finalizing the offboarding.
                </p>
              </div>
            )}

            {getChecklistProgress() === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  <span className="font-medium">Ready:</span> All checklist items are complete.
                  You can now finalize the offboarding process.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Employee Offboarding</h2>
        <p className="text-gray-600 mt-1">Complete exit workflow and settlement</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep > step.number
                    ? 'bg-green-600 text-white'
                    : currentStep === step.number
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <span className="text-xs mt-2 text-center font-medium text-gray-600">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || getChecklistProgress() < 100}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Complete Offboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
