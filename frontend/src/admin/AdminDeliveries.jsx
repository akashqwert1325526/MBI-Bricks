import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Plus, X } from 'lucide-react';
import { LoadingPage, formatDate } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

const DELIVERY_STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'failed'];

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ order_id:'', driver_name:'', vehicle:'', expected_date:'', notes:'' });

  const load = () => {
    setLoading(true);
    const p = filter ? `?status=${filter}` : '';
    Promise.all([
      api.get(`/deliveries${p}`),
      api.get('/orders/admin/all?status=confirmed&limit=100'),
    ]).then(([d, o]) => {
      setDeliveries(d.data);
      setOrders(o.data.orders || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const submit = async () => {
    if (!form.order_id || !form.driver_name) { toast.error('Fill required fields'); return; }
    try {
      await api.post('/deliveries', { ...form });
      toast.success('Delivery assigned!');
      setModal(false);
      setForm({ order_id:'', driver_name:'', vehicle:'', expected_date:'', notes:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/deliveries/${id}`, { status });
      toast.success('Status updated');
      load();
    } catch (err) { toast.error('Error'); }
  };

  return (
    <div className="admin-page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <h1 className="admin-page-title">Deliveries</h1>
          <p className="admin-page-subtitle">Manage brick deliveries and drivers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16}/> Assign Delivery</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {['', ...DELIVERY_STATUSES].map(s => (
          <button key={s} className={`chip ${filter===s?'active':''}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Driver</th><th>Vehicle</th><th>Expected</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>No deliveries found</td></tr>
              ) : deliveries.map(d => (
                <tr key={d.id}>
                  <td><Link to={`/admin/orders/${d.order_id}`} style={{ fontWeight:800, color:'var(--primary)' }}>{d.order_number}</Link></td>
                  <td>
                    <div style={{ fontWeight:600 }}>{d.customer_name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{d.delivery_city}, {d.delivery_state}</div>
                  </td>
                  <td style={{ fontWeight:600 }}>{d.driver_name || '—'}</td>
                  <td style={{ fontSize:13 }}>{d.vehicle || '—'}</td>
                  <td style={{ fontSize:13, color:'var(--text-muted)' }}>{formatDate(d.expected_date)}</td>
                  <td>
                    <span className={`tag ${d.status==='delivered'?'tag-delivered':d.status==='in_transit'?'tag-dispatched':d.status==='failed'?'tag-cancelled':'tag-pending'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <select className="form-input form-select" style={{ padding:'6px 10px', fontSize:12, width:'auto' }}
                      value={d.status} onChange={e => updateStatus(d.id, e.target.value)}>
                      {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Assign Delivery</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Order *</label>
                <select className="form-input form-select" value={form.order_id} onChange={e => setForm(f=>({...f,order_id:e.target.value}))}>
                  <option value="">Select order...</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} — {o.customer_name}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">Driver Name *</label>
                  <input className="form-input" value={form.driver_name} onChange={e => setForm(f=>({...f,driver_name:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle No.</label>
                  <input className="form-input" value={form.vehicle} onChange={e => setForm(f=>({...f,vehicle:e.target.value}))} placeholder="KA XX XX XXXX" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input type="date" className="form-input" value={form.expected_date} onChange={e => setForm(f=>({...f,expected_date:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}><Truck size={14}/> Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
