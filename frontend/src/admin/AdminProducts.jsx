import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { LoadingPage } from '../components/utils';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct
} from '../services/firebaseService';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | productObj
  const [form, setForm] = useState({
    name: '',
    pricePerBrick: '',
    stockQuantity: '',
    unit: 'piece',
    description: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getProducts();
      setProducts(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setForm({
      name: '',
      pricePerBrick: '9.00',
      stockQuantity: '10000',
      unit: 'piece',
      description: '',
      active: true
    });
    setModal('add');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      pricePerBrick: p.pricePerBrick || p.price || 0,
      stockQuantity: p.stockQuantity || p.stock || 0,
      unit: p.unit || 'piece',
      description: p.description || '',
      active: p.active !== undefined ? p.active : true
    });
    setModal(p);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.pricePerBrick) {
      toast.error('Product name and price are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await addProduct(form);
        toast.success('Product created!');
      } else {
        await updateProduct(modal.id, form);
        toast.success('Product updated!');
      }
      setModal(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await updateProduct(p.id, { active: !p.active });
      toast.success(p.active ? 'Product deactivated' : 'Product activated');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error toggling product active status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">Manage Brick Products & Firestore Pricing</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price per Brick</th>
                <th>Stock Quantity</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        🧱
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent)', fontSize: 16 }}>
                      ₹{Number(p.pricePerBrick || p.price || 0).toFixed(2)}
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> / {p.unit || 'piece'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {(p.stockQuantity || p.stock || 0).toLocaleString('en-IN')} pcs
                    </div>
                    {(p.stockQuantity || p.stock || 0) < 5000 && (
                      <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>⚠ Low Stock</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    {p.unit || 'piece'}
                  </td>
                  <td>
                    <span className={`tag ${p.active ? 'tag-delivered' : 'tag-cancelled'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                        <Edit size={14} /> Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(p)} title={p.active ? 'Deactivate' : 'Activate'}>
                        {p.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? 'Add Brick Product' : `Edit Product: ${modal.name}`}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Wirecut Brick or Table Mould Brick"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price per Brick (₹) *</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    value={form.pricePerBrick}
                    onChange={e => setForm(f => ({ ...f, pricePerBrick: e.target.value }))}
                    placeholder="e.g. 9.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity (pieces) *</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.stockQuantity}
                    onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    className="form-input"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="piece"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Enter brick product specification or notes"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input form-select"
                    value={form.active ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
