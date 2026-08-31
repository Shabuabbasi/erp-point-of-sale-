import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children, adminOnly = false, permission }) {
  const { user, loading, isAdmin, hasPermission } = useAuth();

  if (loading) return <Spinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;

  if (permission) {
    const required = Array.isArray(permission) ? permission : [permission];
    if (!hasPermission(...required)) return <Navigate to="/dashboard" replace />;
  } else if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
