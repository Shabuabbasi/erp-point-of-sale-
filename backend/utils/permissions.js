// All available permissions in the system
const PERMISSIONS = {
  manage_users: 'Manage staff accounts',
  manage_products: 'Create, edit, delete products',
  view_products: 'View products',
  manage_categories: 'Manage categories',
  manage_inventory: 'View inventory & stock alerts',
  manage_customers: 'Create, edit, delete customers',
  view_customers: 'View customers',
  manage_suppliers: 'Manage suppliers',
  manage_purchases: 'Record purchases',
  create_sales: 'Create sales (POS)',
  view_all_sales: 'View all sales',
  view_own_sales: 'View own sales only',
  process_returns: 'Process sale returns',
  view_reports: 'View sales & product reports',
  view_dashboard: 'View dashboard',
};

const ROLE_PERMISSIONS = {
  admin: Object.keys(PERMISSIONS),
  cashier: [
    'view_products',
    'view_customers',
    'create_sales',
    'view_own_sales',
    'process_returns',
    'view_dashboard',
  ],
};

const ALL_PERMISSION_KEYS = Object.keys(PERMISSIONS);

const sanitizePermissions = (list) => {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((p) => ALL_PERMISSION_KEYS.includes(p)))];
};

const getUserPermissions = (user) => {
  if (!user) return [];
  const custom = sanitizePermissions(user.permissions);
  if (custom.length > 0) return custom;
  return ROLE_PERMISSIONS[user.role] || [];
};

const hasPermission = (user, permission) => {
  return getUserPermissions(user).includes(permission);
};

const formatPermissions = (ids) =>
  ids.map((id) => ({ id, label: PERMISSIONS[id] }));

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  sanitizePermissions,
  getUserPermissions,
  hasPermission,
  formatPermissions,
};
