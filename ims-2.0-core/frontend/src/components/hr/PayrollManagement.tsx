/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================================
// IMS 2.0 - Payroll Management Component
// ============================================================================
// Monthly payroll processing with attendance, incentives, and deductions

import { useState } from 'react';
import {
  IndianRupee,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Download,
  AlertTriangle,
  Eye,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';

// Types
type PayrollStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSED' | 'PAID';

interface PayrollEmployee {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  presentDays: number;
  workingDays: number;
  leaveDays: number;
  lateDays: number;
  overtimeHours: number;
  salesTarget?: number;
  salesAchieved?: number;
  incentive: number;
  deductions: {
    pf: number;
    esi: number;
    tds: number;
    lateDeduction: number;
    other: number;
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

interface Payroll {
  id: string;
  month: string; // YYYY-MM
  status: PayrollStatus;
  employees: PayrollEmployee[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
}

interface PayrollManagementProps {
  currentPayroll?: Payroll;
  previousPayrolls: Payroll[];
  onGeneratePayroll: (month: string) => void;
  onApprovePayroll: (payrollId: string) => void;
  onProcessPayroll: (payrollId: string) => void;
  onExport: (payrollId: string, format: 'excel' | 'pdf') => void;
}

// Status config
const statusConfig: Record<PayrollStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  PROCESSED: { label: 'Processed', color: 'bg-purple-100 text-purple-700' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-700' },
};

// Employee Payroll Row
function EmployeePayrollRow({
  employee,
  expanded,
  onToggle,
}: {
  employee: PayrollEmployee;
  expanded: boolean;
  onToggle: () => void;
}) {
  const attendancePercent = Math.round((employee.presentDays / employee.workingDays) * 100);
  const targetPercent = employee.salesTarget
    ? Math.round((employee.salesAchieved! / employee.salesTarget) * 100)
    : null;

  return (
    <>
      <tr
        className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            <div>
              <p className="font-medium text-gray-900">{employee.employeeName}</p>
              <p className="text-xs text-gray-500">{employee.role}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-center">
          <span className={clsx(
            'text-sm font-medium',
            attendancePercent >= 90 ? 'text-green-600' :
            attendancePercent >= 75 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {employee.presentDays}/{employee.workingDays}
          </span>
        </td>
        <td className="px-3 py-3 text-right text-sm text-gray-600">
          ₹{employee.basicSalary.toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-3 text-right text-sm text-green-600">
          ₹{employee.incentive.toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-3 text-right text-sm text-red-600">
          -₹{employee.totalDeductions.toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-3 text-right font-bold text-gray-900">
          ₹{employee.netSalary.toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-3 text-center">
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            employee.status === 'PAID' && 'bg-green-100 text-green-700',
            employee.status === 'APPROVED' && 'bg-blue-100 text-blue-700',
            employee.status === 'PENDING' && 'bg-yellow-100 text-yellow-700'
          )}>
            {employee.status}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-6 text-sm">
              {/* Earnings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Earnings</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Basic Salary</span>
                    <span>₹{employee.basicSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HRA</span>
                    <span>₹{employee.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Other Allowances</span>
                    <span>₹{employee.otherAllowances.toLocaleString('en-IN')}</span>
                  </div>
                  {employee.incentive > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Sales Incentive</span>
                      <span>₹{employee.incentive.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
                    <span>Gross Salary</span>
                    <span>₹{employee.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Deductions</h4>
                <div className="space-y-1 text-red-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500">PF (12%)</span>
                    <span>-₹{employee.deductions.pf.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ESI</span>
                    <span>-₹{employee.deductions.esi.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TDS</span>
                    <span>-₹{employee.deductions.tds.toLocaleString('en-IN')}</span>
                  </div>
                  {employee.deductions.lateDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Late Penalty ({employee.lateDays} days)</span>
                      <span>-₹{employee.deductions.lateDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
                    <span className="text-gray-900">Total Deductions</span>
                    <span>-₹{employee.totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Attendance & Target */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Attendance & Target</h4>
                <div className="space-y-3">
                  {/* Attendance */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Attendance</span>
                      <span>{attendancePercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full',
                          attendancePercent >= 90 ? 'bg-green-500' :
                          attendancePercent >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${attendancePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {employee.presentDays} present, {employee.leaveDays} leave, {employee.lateDays} late
                    </p>
                  </div>

                  {/* Sales Target */}
                  {targetPercent !== null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Sales Target</span>
                        <span>{targetPercent}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            targetPercent >= 100 ? 'bg-green-500' :
                            targetPercent >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                          style={{ width: `${Math.min(targetPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{employee.salesAchieved!.toLocaleString('en-IN')} / ₹{employee.salesTarget!.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function PayrollManagement({
  currentPayroll,
  previousPayrolls,
  onGeneratePayroll,
  onApprovePayroll,
  onProcessPayroll,
  onExport,
}: PayrollManagementProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Get month options (last 12 months)
  const monthOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    monthOptions.push({ value, label });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payroll Management</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field"
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {!currentPayroll && (
            <button
              onClick={() => onGeneratePayroll(selectedMonth)}
              className="btn-primary"
            >
              Generate Payroll
            </button>
          )}
        </div>
      </div>

      {/* Current Payroll */}
      {currentPayroll ? (
        <div className="card">
          {/* Summary */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-bv-red-100 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-bv-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {new Date(currentPayroll.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[currentPayroll.status].color)}>
                    {statusConfig[currentPayroll.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{currentPayroll.employees.length} employees</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onExport(currentPayroll.id, 'excel')}
                className="btn-outline text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {currentPayroll.status === 'DRAFT' && (
                <button
                  onClick={() => onApprovePayroll(currentPayroll.id)}
                  className="btn-primary text-sm"
                >
                  Submit for Approval
                </button>
              )}
              {currentPayroll.status === 'APPROVED' && (
                <button
                  onClick={() => onProcessPayroll(currentPayroll.id)}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  Process Payment
                </button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Gross</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{currentPayroll.totalGross.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Deductions</p>
              <p className="text-xl font-bold text-red-600">
                -₹{currentPayroll.totalDeductions.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">Net Payable</p>
              <p className="text-xl font-bold text-green-600">
                ₹{currentPayroll.totalNet.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Employee Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">Employee</th>
                  <th className="px-3 py-2 text-center text-gray-500">Days</th>
                  <th className="px-3 py-2 text-right text-gray-500">Basic</th>
                  <th className="px-3 py-2 text-right text-gray-500">Incentive</th>
                  <th className="px-3 py-2 text-right text-gray-500">Deductions</th>
                  <th className="px-3 py-2 text-right text-gray-500">Net Pay</th>
                  <th className="px-3 py-2 text-center text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPayroll.employees.map(emp => (
                  <EmployeePayrollRow
                    key={emp.employeeId}
                    employee={emp}
                    expanded={expandedEmployee === emp.employeeId}
                    onToggle={() => setExpandedEmployee(
                      expandedEmployee === emp.employeeId ? null : emp.employeeId
                    )}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No payroll generated for selected month</p>
          <p className="text-sm">Click "Generate Payroll" to create one</p>
        </div>
      )}

      {/* Previous Payrolls */}
      {previousPayrolls.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Previous Payrolls</h3>
          <div className="space-y-2">
            {previousPayrolls.slice(0, 6).map(payroll => (
              <div key={payroll.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(payroll.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">{payroll.employees.length} employees</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-medium text-gray-900">
                    ₹{payroll.totalNet.toLocaleString('en-IN')}
                  </p>
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[payroll.status].color)}>
                    {statusConfig[payroll.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollManagement;
