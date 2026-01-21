// ============================================================================
// IMS 2.0 - Role Switcher Component
// Multi-role switching UI for users with multiple assigned roles
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../../types';

interface UserRoleInfo {
  role: UserRole;
  display_name: string;
  icon: string;
  color: string;
  permissions: string[];
  stores?: string[]; // Stores accessible with this role
}

interface Props {
  currentRole: UserRole;
  assignedRoles: UserRole[];
  defaultRole: UserRole;
  userName: string;
  onRoleChange: (role: UserRole) => void;
  className?: string;
}

const ROLE_CONFIG: Record<UserRole, { display_name: string; icon: string; color: string; description: string }> = {
  SUPERADMIN: {
    display_name: 'Super Admin',
    icon: '👑',
    color: 'bg-purple-600',
    description: 'Full system access'
  },
  ADMIN: {
    display_name: 'Admin',
    icon: '⚙️',
    color: 'bg-indigo-600',
    description: 'Administrative access'
  },
  AREA_MANAGER: {
    display_name: 'Area Manager',
    icon: '🏢',
    color: 'bg-blue-600',
    description: 'Multi-store management'
  },
  STORE_MANAGER: {
    display_name: 'Store Manager',
    icon: '🏪',
    color: 'bg-teal-600',
    description: 'Single store management'
  },
  ACCOUNTANT: {
    display_name: 'Accountant',
    icon: '📊',
    color: 'bg-green-600',
    description: 'Financial operations'
  },
  CATALOG_MANAGER: {
    display_name: 'Catalog Manager',
    icon: '📦',
    color: 'bg-amber-600',
    description: 'Product catalog management'
  },
  OPTOMETRIST: {
    display_name: 'Optometrist',
    icon: '👁️',
    color: 'bg-cyan-600',
    description: 'Eye examinations'
  },
  SALES_CASHIER: {
    display_name: 'Sales Cashier',
    icon: '💵',
    color: 'bg-emerald-600',
    description: 'Billing & payments'
  },
  SALES_STAFF: {
    display_name: 'Sales Staff',
    icon: '🛒',
    color: 'bg-orange-600',
    description: 'Customer sales'
  },
  WORKSHOP_STAFF: {
    display_name: 'Workshop Staff',
    icon: '🔧',
    color: 'bg-gray-600',
    description: 'Job card processing'
  }
};

// Role hierarchy for sorting
const ROLE_HIERARCHY: UserRole[] = [
  'SUPERADMIN',
  'ADMIN',
  'AREA_MANAGER',
  'STORE_MANAGER',
  'ACCOUNTANT',
  'CATALOG_MANAGER',
  'OPTOMETRIST',
  'SALES_CASHIER',
  'SALES_STAFF',
  'WORKSHOP_STAFF'
];

export const RoleSwitcher: React.FC<Props> = ({
  currentRole,
  assignedRoles,
  defaultRole,
  userName,
  onRoleChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sort roles by hierarchy
  const sortedRoles = [...assignedRoles].sort((a, b) =>
    ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b)
  );

  // Filter roles by search query
  const filteredRoles = sortedRoles.filter(role =>
    ROLE_CONFIG[role].display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (event.key === 'Enter' && filteredRoles.length === 1) {
      handleRoleSelect(filteredRoles[0]);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    if (role !== currentRole) {
      onRoleChange(role);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const currentConfig = ROLE_CONFIG[currentRole];

  // If only one role, show static display
  if (assignedRoles.length === 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 ${className}`}>
        <span className="text-lg">{currentConfig.icon}</span>
        <span className="text-sm font-medium text-gray-700">{currentConfig.display_name}</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Current Role Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isOpen ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        } ${currentConfig.color} text-white hover:opacity-90`}
      >
        <span className="text-lg">{currentConfig.icon}</span>
        <div className="text-left">
          <span className="text-sm font-medium block">{currentConfig.display_name}</span>
          <span className="text-xs opacity-80">{userName}</span>
        </div>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Switch Role</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {assignedRoles.length} roles assigned
            </p>
          </div>

          {/* Search (show if more than 4 roles) */}
          {assignedRoles.length > 4 && (
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search roles..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Role List */}
          <div className="max-h-64 overflow-y-auto py-2">
            {filteredRoles.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No roles match your search
              </div>
            ) : (
              filteredRoles.map(role => {
                const config = ROLE_CONFIG[role];
                const isActive = role === currentRole;
                const isDefault = role === defaultRole;

                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Role Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color} text-white`}>
                      <span className="text-lg">{config.icon}</span>
                    </div>

                    {/* Role Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {config.display_name}
                        </span>
                        {isDefault && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{config.description}</span>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Current: <span className="font-medium">{currentConfig.display_name}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for header/navbar use
export const RoleSwitcherCompact: React.FC<Props> = ({
  currentRole,
  assignedRoles,
  defaultRole,
  userName,
  onRoleChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortedRoles = [...assignedRoles].sort((a, b) =>
    ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    if (role !== currentRole) {
      onRoleChange(role);
    }
    setIsOpen(false);
  };

  const currentConfig = ROLE_CONFIG[currentRole];

  if (assignedRoles.length === 1) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-sm">{currentConfig.icon}</span>
        <span className="text-xs font-medium text-gray-600">{currentConfig.display_name}</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        title="Switch Role"
      >
        <span className="text-sm">{currentConfig.icon}</span>
        <span className="text-xs font-medium text-gray-700">{currentConfig.display_name}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            Switch Role
          </div>
          {sortedRoles.map(role => {
            const config = ROLE_CONFIG[role];
            const isActive = role === currentRole;

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-sm">{config.icon}</span>
                <span className={`text-sm ${isActive ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                  {config.display_name}
                </span>
                {isActive && (
                  <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Role Badge (read-only display)
export const RoleBadge: React.FC<{ role: UserRole; size?: 'sm' | 'md' | 'lg' }> = ({
  role,
  size = 'md'
}) => {
  const config = ROLE_CONFIG[role];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.color} text-white ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      <span className="font-medium">{config.display_name}</span>
    </span>
  );
};

// Multi-role display for admin views
export const MultiRoleDisplay: React.FC<{ roles: UserRole[]; defaultRole?: UserRole }> = ({
  roles,
  defaultRole
}) => {
  const sortedRoles = [...roles].sort((a, b) =>
    ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {sortedRoles.map(role => {
        const config = ROLE_CONFIG[role];
        const isDefault = role === defaultRole;

        return (
          <div
            key={role}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
              isDefault ? 'ring-2 ring-blue-500 ring-offset-1' : ''
            } ${config.color} text-white`}
          >
            <span className="text-sm">{config.icon}</span>
            <span className="text-xs font-medium">{config.display_name}</span>
            {isDefault && (
              <span className="text-xs opacity-75">(Default)</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
