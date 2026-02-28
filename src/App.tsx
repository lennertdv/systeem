import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isFirebaseConfigured } from './lib/firebase';
import SetupScreen from './pages/SetupScreen';
import CustomerView from './pages/Customer/CustomerView';
import KitchenView from './pages/Kitchen/KitchenView';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerView />} />
        <Route path="/kitchen" element={<KitchenView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
