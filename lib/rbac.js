export const ROLES = ['SUPER_ADMIN', 'MANAGER', 'ATTENDANT', 'ACCOUNTANT'];

export const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Sales Manager',
  ATTENDANT: 'Pump Attendant',
  ACCOUNTANT: 'Accountant',
};

export const roleSubtitles = {
  SUPER_ADMIN: 'Full access',
  MANAGER: 'Sales & approvals',
  ATTENDANT: 'Station operations',
  ACCOUNTANT: 'Finance & reports',
};

export const roleInitials = {
  SUPER_ADMIN: 'SA',
  MANAGER: 'SM',
  ATTENDANT: 'PA',
  ACCOUNTANT: 'AC',
};

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦', path: '/dashboard' },
  { key: 'fuel', label: 'Fuel entry', icon: '＋', path: '/fuel' },
  { key: 'approvals', label: 'Approvals', icon: '✓', path: '/approvals' },
  { key: 'customers', label: 'Customers', icon: '♙', path: '/customers' },
  { key: 'reports', label: 'Reports', icon: '▤', path: '/reports' },
  { key: 'access', label: 'Access control', icon: '◇', path: '/access' },
  { key: 'audit', label: 'Audit log', icon: '☰', path: '/audit' },
];

const roleNav = {
  SUPER_ADMIN: ['dashboard', 'fuel', 'approvals', 'customers', 'reports', 'access', 'audit'],
  MANAGER: ['dashboard', 'fuel', 'approvals', 'customers', 'reports'],
  ATTENDANT: ['dashboard', 'fuel'],
  ACCOUNTANT: ['dashboard', 'approvals', 'customers', 'reports'],
};

export function navForRole(role) {
  const allowed = roleNav[role] || [];
  return NAV_ITEMS.filter(item => allowed.includes(item.key));
}

export function canAccessPage(role, pageKey) {
  return (roleNav[role] || []).includes(pageKey);
}

const actionRoles = {
  createFuelEntry: ['SUPER_ADMIN', 'MANAGER', 'ATTENDANT'],
  decideApproval: ['SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'],
  manageCustomers: ['SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'],
  viewReports: ['SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'],
  manageUsers: ['SUPER_ADMIN'],
  viewAuditLog: ['SUPER_ADMIN'],
};

export function can(role, action) {
  return (actionRoles[action] || []).includes(role);
}
