// ============================================================================
// IMS 2.0 - Employee Onboarding Component
// ============================================================================
// Complete employee onboarding workflow with all required fields

import { useState } from 'react';
import {
  UserPlus,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Shield,
  Calendar,
  IndianRupee,
  Clock,
  Camera,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Save,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { UserRole } from '../../types';

// Employee Data Structure
interface EmployeeOnboardingData {
  // Step 1: Basic Info
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;

  // Step 2: Address
  address: string;
  city: string;
  state: string;
  pincode: string;

  // Step 3: Employment Details
  joiningDate: string;
  probationEndDate: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  department: string;
  designation: string;
  reportingTo: string;

  // Step 4: Store & Role Assignment
  primaryStore: string;
  roles: UserRole[];
  defaultRole: UserRole;

  // Step 5: Shift & Attendance
  defaultShift: string;
  weeklyOff: string[];
  requiresGeoAttendance: boolean;

  // Step 6: Salary & Bank
  basicSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  pfNumber: string;
  esiNumber: string;
  uanNumber: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  panNumber: string;

  // Step 7: Documents
  photoUrl?: string;
  aadharNumber: string;
  documentsVerified: boolean;
}

// Initial State
const initialData: EmployeeOnboardingData = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'MALE',
  phone: '',
  email: '',
  emergencyContact: '',
  emergencyPhone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  joiningDate: new Date().toISOString().split('T')[0],
  probationEndDate: '',
  employmentType: 'FULL_TIME',
  department: '',
  designation: '',
  reportingTo: '',
  primaryStore: '',
  roles: [],
  defaultRole: 'SALES_STAFF',
  defaultShift: '',
  weeklyOff: ['SUNDAY'],
  requiresGeoAttendance: true,
  basicSalary: 0,
  hra: 0,
  conveyance: 0,
  specialAllowance: 0,
  pfNumber: '',
  esiNumber: '',
  uanNumber: '',
  bankName: '',
  bankAccount: '',
  ifscCode: '',
  panNumber: '',
  aadharNumber: '',
  documentsVerified: false,
};

// Available Roles
const availableRoles: { role: UserRole; label: string }[] = [
  { role: 'SALES_STAFF', label: 'Sales Staff' },
  { role: 'SALES_CASHIER', label: 'Sales Cashier' },
  { role: 'OPTOMETRIST', label: 'Optometrist' },
  { role: 'WORKSHOP_STAFF', label: 'Workshop Staff' },
  { role: 'STORE_MANAGER', label: 'Store Manager' },
  { role: 'AREA_MANAGER', label: 'Area Manager' },
  { role: 'ACCOUNTANT', label: 'Accountant' },
  { role: 'CATALOG_MANAGER', label: 'Catalog Manager' },
  { role: 'ADMIN', label: 'Admin' },
];

// Mock Data
const mockStores = [
  { id: 'store-1', name: 'Mumbai Central' },
  { id: 'store-2', name: 'Andheri West' },
  { id: 'store-3', name: 'Thane' },
];

const mockShifts = [
  { id: 'shift-1', name: 'Morning Shift (9AM - 5PM)' },
  { id: 'shift-2', name: 'Afternoon Shift (1PM - 9PM)' },
  { id: 'shift-3', name: 'Full Day (10AM - 8PM)' },
];

const mockManagers = [
  { id: 'mgr-1', name: 'Rajesh Kumar (Store Manager)' },
  { id: 'mgr-2', name: 'Priya Sharma (Area Manager)' },
];

// Step Component
interface StepProps {
  data: EmployeeOnboardingData;
  onChange: (field: keyof EmployeeOnboardingData, value: any) => void;
}

// Step 1: Basic Info
function BasicInfoStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code *</label>
          <input
            type="text"
            value={data.employeeCode}
            onChange={(e) => onChange('employeeCode', e.target.value)}
            placeholder="EMP-001"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select
            value={data.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
          <input
            type="text"
            value={data.emergencyContact}
            onChange={(e) => onChange('emergencyContact', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
          <input
            type="tel"
            value={data.emergencyPhone}
            onChange={(e) => onChange('emergencyPhone', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Address
function AddressStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <textarea
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <input
            type="text"
            value={data.state}
            onChange={(e) => onChange('state', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
          <input
            type="text"
            value={data.pincode}
            onChange={(e) => onChange('pincode', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Employment Details
function EmploymentStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
          <input
            type="date"
            value={data.joiningDate}
            onChange={(e) => onChange('joiningDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Probation End Date</label>
          <input
            type="date"
            value={data.probationEndDate}
            onChange={(e) => onChange('probationEndDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
          <select
            value={data.employmentType}
            onChange={(e) => onChange('employmentType', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <select
            value={data.department}
            onChange={(e) => onChange('department', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Department</option>
            <option value="SALES">Sales</option>
            <option value="CLINICAL">Clinical</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="FINANCE">Finance</option>
            <option value="OPERATIONS">Operations</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
          <input
            type="text"
            value={data.designation}
            onChange={(e) => onChange('designation', e.target.value)}
            placeholder="e.g., Sales Executive"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reporting To *</label>
          <select
            value={data.reportingTo}
            onChange={(e) => onChange('reportingTo', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Manager</option>
            {mockManagers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 4: Store & Role
function StoreRoleStep({ data, onChange }: StepProps) {
  const toggleRole = (role: UserRole) => {
    const newRoles = data.roles.includes(role)
      ? data.roles.filter(r => r !== role)
      : [...data.roles, role];
    onChange('roles', newRoles);

    // Update default role if needed
    if (newRoles.length > 0 && !newRoles.includes(data.defaultRole)) {
      onChange('defaultRole', newRoles[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Store *</label>
        <select
          value={data.primaryStore}
          onChange={(e) => onChange('primaryStore', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select Store</option>
          {mockStores.map((store) => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Roles * (Select multiple)</label>
        <div className="grid grid-cols-2 gap-2">
          {availableRoles.map(({ role, label }) => (
            <label
              key={role}
              className={clsx(
                'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                data.roles.includes(role)
                  ? 'bg-bv-red-50 border-bv-red-300'
                  : 'hover:bg-gray-50'
              )}
            >
              <input
                type="checkbox"
                checked={data.roles.includes(role)}
                onChange={() => toggleRole(role)}
                className="rounded text-bv-red-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {data.roles.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Role</label>
          <select
            value={data.defaultRole}
            onChange={(e) => onChange('defaultRole', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {data.roles.map((role) => (
              <option key={role} value={role}>
                {availableRoles.find(r => r.role === role)?.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Employee will login with this role by default</p>
        </div>
      )}
    </div>
  );
}

// Step 5: Shift & Attendance
function ShiftStep({ data, onChange }: StepProps) {
  const weekDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  const toggleWeeklyOff = (day: string) => {
    const newDays = data.weeklyOff.includes(day)
      ? data.weeklyOff.filter(d => d !== day)
      : [...data.weeklyOff, day];
    onChange('weeklyOff', newDays);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Shift *</label>
        <select
          value={data.defaultShift}
          onChange={(e) => onChange('defaultShift', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select Shift</option>
          {mockShifts.map((shift) => (
            <option key={shift.id} value={shift.id}>{shift.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Off Days</label>
        <div className="flex flex-wrap gap-2">
          {weekDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleWeeklyOff(day)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                data.weeklyOff.includes(day)
                  ? 'bg-bv-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.requiresGeoAttendance}
            onChange={(e) => onChange('requiresGeoAttendance', e.target.checked)}
            className="rounded text-bv-red-600"
          />
          <span className="text-sm font-medium text-gray-700">Requires Geo-fenced Attendance</span>
        </label>
        <p className="text-xs text-gray-500 ml-6">Employee must be within store radius to check-in</p>
      </div>
    </div>
  );
}

// Step 6: Salary & Bank
function SalaryStep({ data, onChange }: StepProps) {
  const totalSalary = data.basicSalary + data.hra + data.conveyance + data.specialAllowance;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700">Total CTC: <span className="text-lg font-bold">₹{totalSalary.toLocaleString('en-IN')}</span> / month</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
          <input
            type="number"
            value={data.basicSalary || ''}
            onChange={(e) => onChange('basicSalary', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
          <input
            type="number"
            value={data.hra || ''}
            onChange={(e) => onChange('hra', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conveyance</label>
          <input
            type="number"
            value={data.conveyance || ''}
            onChange={(e) => onChange('conveyance', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Allowance</label>
          <input
            type="number"
            value={data.specialAllowance || ''}
            onChange={(e) => onChange('specialAllowance', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PF Number</label>
          <input
            type="text"
            value={data.pfNumber}
            onChange={(e) => onChange('pfNumber', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ESI Number</label>
          <input
            type="text"
            value={data.esiNumber}
            onChange={(e) => onChange('esiNumber', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UAN Number</label>
          <input
            type="text"
            value={data.uanNumber}
            onChange={(e) => onChange('uanNumber', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
            <input
              type="text"
              value={data.bankName}
              onChange={(e) => onChange('bankName', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
            <input
              type="text"
              value={data.bankAccount}
              onChange={(e) => onChange('bankAccount', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
            <input
              type="text"
              value={data.ifscCode}
              onChange={(e) => onChange('ifscCode', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
            <input
              type="text"
              value={data.panNumber}
              onChange={(e) => onChange('panNumber', e.target.value.toUpperCase())}
              placeholder="ABCPX1234X"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 7: Documents
function DocumentsStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number *</label>
        <input
          type="text"
          value={data.aadharNumber}
          onChange={(e) => onChange('aadharNumber', e.target.value)}
          placeholder="1234 5678 9012"
          maxLength={14}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 mb-2">Upload Employee Photo</p>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          Choose File
        </button>
        <p className="text-xs text-gray-500 mt-2">Max 2MB, JPG/PNG format</p>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">Required Documents Checklist</h4>
        <div className="space-y-2 text-sm text-yellow-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" /> Aadhar Card (Front & Back)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" /> PAN Card
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" /> Bank Passbook / Cancelled Cheque
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" /> Educational Certificates
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" /> Previous Employment Letter (if any)
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.documentsVerified}
            onChange={(e) => onChange('documentsVerified', e.target.checked)}
            className="rounded text-bv-red-600"
          />
          <span className="text-sm font-medium text-gray-700">All documents verified and collected</span>
        </label>
      </div>
    </div>
  );
}

// Main Component
export function EmployeeOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<EmployeeOnboardingData>(initialData);

  const steps = [
    { num: 1, title: 'Basic Info', icon: User },
    { num: 2, title: 'Address', icon: MapPin },
    { num: 3, title: 'Employment', icon: Building2 },
    { num: 4, title: 'Store & Role', icon: Shield },
    { num: 5, title: 'Shift', icon: Clock },
    { num: 6, title: 'Salary & Bank', icon: IndianRupee },
    { num: 7, title: 'Documents', icon: FileText },
  ];

  const handleChange = (field: keyof EmployeeOnboardingData, value: any) => {
    setData({ ...data, [field]: value });
  };

  const handleSubmit = () => {
    console.log('Submitting employee data:', data);
    alert('Employee onboarded successfully!');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BasicInfoStep data={data} onChange={handleChange} />;
      case 2: return <AddressStep data={data} onChange={handleChange} />;
      case 3: return <EmploymentStep data={data} onChange={handleChange} />;
      case 4: return <StoreRoleStep data={data} onChange={handleChange} />;
      case 5: return <ShiftStep data={data} onChange={handleChange} />;
      case 6: return <SalaryStep data={data} onChange={handleChange} />;
      case 7: return <DocumentsStep data={data} onChange={handleChange} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-bv-red-600" />
          Employee Onboarding
        </h1>
        <p className="text-gray-500 mt-1">Add a new employee to the system</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.num)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
                currentStep === step.num
                  ? 'bg-bv-red-600 text-white'
                  : currentStep > step.num
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {currentStep > step.num ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Step {currentStep}: {steps[currentStep - 1].title}
        </h2>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {currentStep < 7 ? (
          <button
            onClick={() => setCurrentStep(Math.min(7, currentStep + 1))}
            className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!data.documentsVerified}
            className={clsx(
              'flex items-center gap-2 px-6 py-2 rounded-lg transition-colors',
              data.documentsVerified
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4" />
            Complete Onboarding
          </button>
        )}
      </div>
    </div>
  );
}

export default EmployeeOnboarding;
