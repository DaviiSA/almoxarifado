import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Inventory } from '@/pages/Inventory';
import { Materials } from '@/pages/Materials';
import { Works } from '@/pages/Works';
import { Entries } from '@/pages/Entries';
import { Outputs } from '@/pages/Outputs';
import { FieldApplications } from '@/pages/FieldApplications';
import { UsersPage } from '@/pages/Users';
import { NotFound } from '@/pages/NotFound';
import { Loader2 } from 'lucide-react';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );
}

function Protected({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.perfil !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/estoque" element={<Inventory />} />
        <Route path="/materiais" element={<Materials />} />
        <Route path="/obras" element={<Works />} />
        <Route
          path="/entradas"
          element={
            <Protected adminOnly>
              <Entries />
            </Protected>
          }
        />
        <Route path="/saidas" element={<Outputs />} />
        <Route path="/aplicacoes" element={<FieldApplications />} />
        <Route
          path="/usuarios"
          element={
            <Protected adminOnly>
              <UsersPage />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
