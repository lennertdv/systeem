import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isFirebaseConfigured } from './lib/firebase';
import SetupScreen from './pages/SetupScreen';

// Homepage
import HomePage from './pages/HomePage';

// Restaurant routes (per slug)
import RestaurantLogin from './pages/Restaurant/RestaurantLogin';
import CustomerView from './pages/Customer/CustomerView';
import KitchenView from './pages/Kitchen/KitchenView';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { RestaurantProvider } from './context/RestaurantContext';

// Super Admin routes
import SuperAdminLayout from './pages/SuperAdmin/Layout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import RestaurantManagement from './pages/SuperAdmin/Restaurants';
import RestaurantDetail from './pages/SuperAdmin/RestaurantDetail';
import SuperAdminLogin from './pages/SuperAdmin/Login';
import AuditLog from './pages/SuperAdmin/AuditLog';

// Shared components
import ImpersonationBanner from './components/ImpersonationBanner';

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <BrowserRouter>
      <ImpersonationBanner />
      <Routes>
        {/* Homepage — landingspagina van het softwarebedrijf */}
        <Route path="/" element={<HomePage />} />

        {/* Restaurant routes — allemaal onder /r/:slug/ */}
        <Route path="/r/:slug" element={<RestaurantProvider><CustomerView /></RestaurantProvider>} />
        <Route path="/r/:slug/login" element={<RestaurantProvider><RestaurantLogin /></RestaurantProvider>} />
        <Route path="/r/:slug/admin" element={<RestaurantProvider><AdminDashboard /></RestaurantProvider>} />
        <Route path="/r/:slug/kitchen" element={<RestaurantProvider><KitchenView /></RestaurantProvider>} />

        {/* Super Admin routes */}
        <Route path="/super-admin" element={<SuperAdminLogin />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout>} />
        <Route path="/super-admin/restaurants" element={<SuperAdminLayout><RestaurantManagement /></SuperAdminLayout>} />
        <Route path="/super-admin/restaurants/:slug" element={<SuperAdminLayout><RestaurantDetail /></SuperAdminLayout>} />
        <Route path="/super-admin/audit-log" element={<SuperAdminLayout><AuditLog /></SuperAdminLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
