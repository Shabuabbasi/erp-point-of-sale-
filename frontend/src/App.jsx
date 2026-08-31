import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Spinner from './components/Spinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ProtectedRoute permission="view_dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute permission="create_sales"><POS /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute permission={['view_products', 'manage_products']}><Products /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute permission="manage_categories"><Categories /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute permission="manage_inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute permission={['view_customers', 'manage_customers']}><Customers /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute permission="manage_suppliers"><Suppliers /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute permission="manage_purchases"><Purchases /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute permission={['view_all_sales', 'view_own_sales']}><Sales /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute permission="view_reports"><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute permission="manage_users"><Users /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
