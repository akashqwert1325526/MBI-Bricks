import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, CreditCard } from 'lucide-react';
import { LoadingPage } from '../components/utils';
import {
  getPayments,
  getOrders,
  recordPayment
} from '../services/firebaseService';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payList, orderList] = await Promise.all([
        getPayments(),
        getOrders()
      ]);
      setPayments(payList);
      setOrders(orderList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId) {
      toast.error('Please select an order');
      return;
    }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const selectedOrder = orders.find(o => o.id === form.orderId);

    setSaving(true);
    try {
      await recordPayment({
        orderId: form.orderId,
        customerId: selectedOrder ? selectedOrder.customerId : '',
        amount: amt,
        paymentMethod: form.paymentMethod,
        paymentStatus: 'paid',
        notes: form.notes
      });

      toast.success('Payment recorded and linked to order!');
      setModal(false);
      setForm({ orderId: '', amount: '', paymentMethod: 'cash', notes: '' });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error recording payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="admin-page-title">Payments</h1>
          <p className="admin-page-subtitle">Track payments & linked orders in Firestore</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#22c55e' }}>₹{totalReceived.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Payments Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{payments.length}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
      </div>

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No payment records found in Firestore.
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const linkedOrder = orders.find(o => o.id === p.orderId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/admin/orders/${p.orderId}`} style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {linkedOrder?.orderNumber || p.orderId?.slice(0, 8) || 'Order'}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{p.paymentMethod?.toUpperCase()}</span>
                      </td>
                      <td>
                        <span className="tag tag-delivered">
                          {(p.paymentStatus || 'PAID').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Select Order *</label>
                  <select
                    className="form-input form-select"
                    value={form.orderId}
                    onChange={e => {
                      const selected = orders.find(o => o.id === e.target.value);
                      setForm(f => ({
                        ...f,
                        orderId: e.target.value,
                        amount: selected ? selected.totalAmount : f.amount
                      }));
                    }}
                    required
                  >
                    <option value="">Choose an order...</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber || o.id.slice(0, 8)} — {o.customerName || 'Customer'} (Total: ₹{(o.totalAmount || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-input form-select"
                    value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Reference</label>
                  <input
                    className="form-input"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="UPI Ref ID, Cheque No, or Notes"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
