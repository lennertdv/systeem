import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isFirebaseConfigured } from './lib/firebase';
import { RestaurantProvider } from './context/RestaurantContext';
import ImpersonationBanner from './components/ImpersonationBanner';
import SetupScreen from './pages/SetupScreen';
import CustomerView from './pages/Customer/CustomerView';
import KitchenView from './pages/Kitchen/KitchenView';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';
import SuperAdminLayout from './pages/SuperAdmin/Layout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import RestaurantManagement from './pages/SuperAdmin/Restaurants';
import RestaurantDetail from './pages/SuperAdmin/RestaurantDetail';
import AuditLog from './pages/SuperAdmin/AuditLog';
import SuperAdminLogin from './pages/SuperAdmin/Login';

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <BrowserRouter>
      <ImpersonationBanner />
      <RestaurantProvider>
        <Routes>
          <Route path="/" element={<CustomerView />} />
          <Route path="/kitchen" element={<KitchenView />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/super-admin" element={<SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout>} />
          <Route path="/super-admin/restaurants" element={<SuperAdminLayout><RestaurantManagement /></SuperAdminLayout>} />
          <Route path="/super-admin/restaurants/:slug" element={<SuperAdminLayout><RestaurantDetail /></SuperAdminLayout>} />
          <Route path="/super-admin/audit-log" element={<SuperAdminLayout><AuditLog /></SuperAdminLayout>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RestaurantProvider>
    </BrowserRouter>
  );
}
