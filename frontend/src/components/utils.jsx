import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OrderStatusTag({ status }) {
  const labels = {
    placed: 'Order Placed', confirmed: 'Confirmed', preparing: 'Preparing',
    dispatched: 'Dispatched', out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered', cancelled: 'Cancelled'
  };
  return <span className={`tag tag-${status}`}>{labels[status] || status}</span>;
}

export function PaymentStatusTag({ status }) {
  const labels = { paid: 'Paid', partially_paid: 'Partial', pending: 'Pending', failed: 'Failed' };
  return <span className={`tag tag-${status}`}>{labels[status] || status}</span>;
}

export function StockBadge({ stock, minStock }) {
  if (stock <= 0) return <span className="product-badge product-badge-out">Out of Stock</span>;
  if (stock < minStock) return <span className="product-badge product-badge-low">Low Stock</span>;
  return <span className="product-badge product-badge-stock">In Stock</span>;
}

export function BrickImage({ src, name, style = {} }) {
  if (src && (src.startsWith('http') || src.startsWith('/'))) {
    return <img src={src.startsWith('http') ? src : src.startsWith('/uploads') ? `http://localhost:5000${src}` : src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
  }
  const fallback = name?.toLowerCase().includes('wirecut') ? '/wirecut-brick.jpg' : '/table-mould-brick.jpg';
  return <img src={fallback} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
}

export function Spinner({ size = 40 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

export function LoadingPage() {
  return (
    <div className="loading-page">
      <Spinner size={48} />
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  );
}

export function EmptyState({ icon = '📦', title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {action}
    </div>
  );
}
