// Simple role-based permissions (easy to explain in interview)
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
  admin: [
    'manage_users',
    'manage_products',
    'manage_categories',
    'manage_inventory',
    'manage_customers',
    'manage_suppliers',
    'manage_purchases',
    'create_sales',
    'view_all_sales',
    'process_returns',
    'view_reports',
    'view_dashboard',
  ],
  cashier: [
    'view_products',
    'view_customers',
    'create_sales',
    'view_own_sales',
    'process_returns',
    'view_dashboard',
  ],
};

const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

module.exports = { PERMISSIONS, ROLE_PERMISSIONS, hasPermission };
