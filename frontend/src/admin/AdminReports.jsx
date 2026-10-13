import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { LoadingPage } from '../components/utils';
import api from '../api';

const COLORS = ['#c2440f', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#0ea5e9'];

export default function AdminReports() {
  const [monthly, setMonthly] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('12');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/monthly-sales?months=${period}`),
      api.get('/reports/product-sales'),
      api.get('/reports/category-sales'),
      api.get('/reports/monthly-expenses'),
      api.get('/reports/top-customers'),
    ]).then(([m, p, c, e, t]) => {
      setMonthly(m.data.map(d => ({ ...d, month: d.month?.slice(5) || d.month })));
      setProducts(p.data);
      setCategories(c.data);
      setExpenses(e.data.map(d => ({ ...d, month: d.month?.slice(5) || d.month })));
      setTopCustomers(t.data);
    }).finally(() => setLoading(false));
  }, [period]);

  // Profit = sales - expenses by month
  const profitData = monthly.map(m => {
    const exp = expenses.find(e => e.month === m.month);
    return { month: m.month, profit: (m.sales || 0) - (exp?.total || 0), sales: m.sales, expenses: exp?.total || 0 };
  });

  return (
    <div className="admin-page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <h1 className="admin-page-title">Reports & Analytics</h1>
          <p className="admin-page-subtitle">Detailed business performance</p>
        </div>
        <select className="form-input form-select" style={{ width: 160 }} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
      </div>

      {loading ? <LoadingPage /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          {/* Sales vs Expenses */}
          <div className="card">
            <div className="card-header"><h3 className="modal-title">Sales vs Expenses</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize:12 }}/>
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize:12 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v, name) => [`₹${v?.toLocaleString('en-IN')}`, name]} contentStyle={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)' }}/>
                  <Bar dataKey="sales" fill="#c2440f" radius={[4,4,0,0]} name="Sales"/>
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Expenses" opacity={0.7}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Trend */}
          <div className="card">
            <div className="card-header"><h3 className="modal-title">Profit Trend</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize:12 }}/>
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize:12 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v) => [`₹${v?.toLocaleString('en-IN')}`, 'Profit']} contentStyle={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)' }}/>
                  <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2.5} dot={{ fill:'#22c55e', r:4 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product & Category Sales */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div className="card">
              <div className="card-header"><h3 className="modal-title">Sales by Product</h3></div>
              <div className="card-body">
                {products.map((p, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:16, alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700 }}>{p.product_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.total_quantity?.toLocaleString('en-IN')} pieces sold</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, color:COLORS[i] }}>₹{p.total_revenue?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.order_count} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="card">
              <div className="card-header"><h3 className="modal-title">Top Customers</h3></div>
              <div className="card-body">
                {topCustomers.slice(0, 8).map((c, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:COLORS[i%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:'white', flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{c.full_name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.total_orders} orders</div>
                      </div>
                    </div>
                    <div style={{ fontWeight:800, color:'var(--accent)' }}>₹{c.total_spent?.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
