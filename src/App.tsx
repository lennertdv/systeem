import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isFirebaseConfigured } from './lib/firebase';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import ImpersonationBanner from './components/ImpersonationBanner';
import SetupScreen from './pages/SetupScreen';
import LandingPage from './pages/LandingPage';
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

function AppRoutes() {
  const { isRootDomain, isAdminSubdomain, restaurantSlug } = useRestaurant();

  // 1. Root Domain (Landing Page & Super Admin)
  if (isRootDomain) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin" element={<SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout>} />
        <Route path="/super-admin/restaurants" element={<SuperAdminLayout><RestaurantManagement /></SuperAdminLayout>} />
        <Route path="/super-admin/restaurants/:slug" element={<SuperAdminLayout><RestaurantDetail /></SuperAdminLayout>} />
        <Route path="/super-admin/audit-log" element={<SuperAdminLayout><AuditLog /></SuperAdminLayout>} />
        
        {/* Fallback for path-based access from root */}
        <Route path="/r/:slug" element={<CustomerView />} />
        <Route path="/r/:slug/menukaart" element={<CustomerView />} />
        <Route path="/r/:slug/kitchen" element={<KitchenView />} />
        <Route path="/r/:slug/admin" element={<AdminDashboard />} />
        <Route path="/r/:slug/admin/login" element={<AdminLogin />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 2. Admin Subdomain (e.g. restaurant.admin.domain.com)
  if (isAdminSubdomain) {
    return (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 3. Restaurant Subdomain (e.g. restaurant.domain.com)
  if (restaurantSlug) {
    return (
      <Routes>
        <Route path="/" element={<CustomerView />} />
        <Route path="/menukaart" element={<CustomerView />} />
        <Route path="/kitchen" element={<KitchenView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Support for /r/slug even on subdomain */}
        <Route path="/r/:slug" element={<CustomerView />} />
        <Route path="/r/:slug/admin" element={<AdminDashboard />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <BrowserRouter>
      <RestaurantProvider>
        <ImpersonationBanner />
        <AppRoutes />
      </RestaurantProvider>
    </BrowserRouter>
  );
}
