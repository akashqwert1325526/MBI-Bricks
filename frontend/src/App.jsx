import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';

// Customer pages
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin pages
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminOrderDetail from './admin/AdminOrderDetail';
import AdminProducts from './admin/AdminProducts';
import AdminInventory from './admin/AdminInventory';
import AdminCustomers from './admin/AdminCustomers';
import AdminCustomerDetail from './admin/AdminCustomerDetail';
import AdminPayments from './admin/AdminPayments';
import AdminInvoices from './admin/AdminInvoices';
import AdminDeliveries from './admin/AdminDeliveries';
import AdminExpenses from './admin/AdminExpenses';
import AdminReports from './admin/AdminReports';
import AdminSettings from './admin/AdminSettings';

function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner"/></div>;
  if (!user || user.role !== 'customer') return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner"/></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}

function CustomerLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e1e', color: '#f5f5f5', border: '1px solid #333' }, duration: 3000 }} />
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<CustomerLayout><HomePage /></CustomerLayout>} />
              <Route path="/products" element={<CustomerLayout><ProductsPage /></CustomerLayout>} />
              <Route path="/product/:id" element={<CustomerLayout><ProductDetailPage /></CustomerLayout>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cart" element={<CustomerRoute><CustomerLayout><CartPage /></CustomerLayout></CustomerRoute>} />
              <Route path="/checkout" element={<CustomerRoute><CustomerLayout><CheckoutPage /></CustomerLayout></CustomerRoute>} />
              <Route path="/order-confirm/:id" element={<CustomerRoute><CustomerLayout><OrderConfirmPage /></CustomerLayout></CustomerRoute>} />
              <Route path="/orders" element={<CustomerRoute><CustomerLayout><OrdersPage /></CustomerLayout></CustomerRoute>} />
              <Route path="/orders/:id" element={<CustomerRoute><CustomerLayout><OrderDetailPage /></CustomerLayout></CustomerRoute>} />
              <Route path="/profile" element={<CustomerRoute><CustomerLayout><ProfilePage /></CustomerLayout></CustomerRoute>} />
              <Route path="/wishlist" element={<CustomerRoute><CustomerLayout><WishlistPage /></CustomerLayout></CustomerRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="customers/:id" element={<AdminCustomerDetail />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="expenses" element={<AdminExpenses />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
