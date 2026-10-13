import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { LoadingPage, formatDate } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['raw_materials','transport','labor','utilities','maintenance','rent','miscellaneous'];

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title:'', amount:'', category:'raw_materials', vendor:'', expense_date: new Date().toISOString().split('T')[0], notes:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const p = filter ? `?category=${filter}` : '';
    Promise.all([api.get(`/expenses${p}`), api.get('/expenses/stats')]).then(([e, s]) => {
      setExpenses(e.data);
      setStats(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const submit = async () => {
    if (!form.title || !form.amount) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense recorded!');
      setModal(false);
      setForm({ title:'', amount:'', category:'raw_materials', vendor:'', expense_date: new Date().toISOString().split('T')[0], notes:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="admin-page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <h1 className="admin-page-title">Expenses</h1>
          <p className="admin-page-subtitle">Track business expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16}/> Add Expense</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:32 }}>
        {[
          { label:"Today's Expenses", value:`₹${(stats.today||0).toLocaleString('en-IN')}`, color:'#ef4444' },
          { label:"This Month", value:`₹${(stats.this_month||0).toLocaleString('en-IN')}`, color:'#f59e0b' },
          { label:"Total Expenses", value:`₹${(stats.total||0).toLocaleString('en-IN')}`, color:'#a855f7' },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        <button className={`chip ${!filter?'active':''}`} onClick={()=>setFilter('')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`chip ${filter===c?'active':''}`} onClick={()=>setFilter(c)}>
            {c.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Title</th><th>Category</th><th>Vendor</th><th>Amount</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>No expenses recorded</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize:13, color:'var(--text-muted)' }}>{formatDate(e.expense_date)}</td>
                  <td style={{ fontWeight:600 }}>{e.title}</td>
                  <td><span className="badge badge-neutral" style={{ fontSize:11 }}>{e.category?.replace(/_/g,' ')}</span></td>
                  <td style={{ fontSize:13 }}>{e.vendor || '—'}</td>
                  <td style={{ fontWeight:800, color:'var(--error)' }}>₹{e.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize:13, color:'var(--text-muted)', maxWidth:200 }}>{e.notes || '—'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color:'var(--error)' }} onClick={() => del(e.id)}><Trash2 size={14}/></button>
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
              <h3 className="modal-title">Add Expense</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Clay purchase, Transport..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor/Supplier</label>
                  <input className="form-input" value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.expense_date} onChange={e=>setForm(f=>({...f,expense_date:e.target.value}))} />
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ minHeight:72 }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving?'Saving...':'Add Expense'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
