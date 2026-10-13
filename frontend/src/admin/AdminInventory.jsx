import { useState, useEffect } from 'react';
import { Plus, Minus, AlertTriangle, Layers, Warehouse } from 'lucide-react';
import { LoadingPage } from '../components/utils';
import {
  getProducts,
  updateProductStock,
  addStock
} from '../services/firebaseService';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState('add'); // 'add' | 'adjust'
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getProducts();
      setProducts(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openStockModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setQuantity('');
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity');
      return;
    }

    setSaving(true);
    try {
      if (modalType === 'add') {
        await addStock(selectedProduct.id, qty);
        toast.success(`Added ${qty.toLocaleString('en-IN')} pcs to ${selectedProduct.name} stock!`);
      } else {
        const current = selectedProduct.stockQuantity || selectedProduct.stock || 0;
        const newStock = current - qty;
        if (newStock < 0) {
          toast.error('Stock quantity cannot be negative!');
          return;
        }
        await updateProductStock(selectedProduct.id, newStock);
        toast.success(`Deducted ${qty.toLocaleString('en-IN')} pcs from ${selectedProduct.name} stock!`);
      }
      setSelectedProduct(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  const wirecut = products.find(p => p.name?.toLowerCase().includes('wirecut')) || products[0];
  const tableMould = products.find(p => p.name?.toLowerCase().includes('table mould')) || products[1];

  const wirecutStock = wirecut ? (wirecut.stockQuantity || wirecut.stock || 0) : 0;
  const tableMouldStock = tableMould ? (tableMould.stockQuantity || tableMould.stock || 0) : 0;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Inventory Management</h1>
      <p className="admin-page-subtitle">Track and update stockQuantity for Wirecut and Table Mould Bricks in Cloud Firestore</p>

      {/* Stock Cards Highlight */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Warehouse size={24} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Wirecut Brick Stock</span>
          </div>
          <div className="stat-value" style={{ color: wirecutStock < 5000 ? 'var(--warning)' : 'var(--success)' }}>
            {wirecutStock.toLocaleString('en-IN')} pcs
          </div>
          <div className="stat-label">Product Field: <code>stockQuantity</code></div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Layers size={24} color="#0ea5e9" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Table Mould Brick Stock</span>
          </div>
          <div className="stat-value" style={{ color: tableMouldStock < 5000 ? 'var(--warning)' : 'var(--success)' }}>
            {tableMouldStock.toLocaleString('en-IN')} pcs
          </div>
          <div className="stat-label">Product Field: <code>stockQuantity</code></div>
        </div>
      </div>

      {(wirecutStock < 5000 || tableMouldStock < 5000) && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} />
          <span>Low stock warning: Please replenish brick inventory to avoid order rejection.</span>
        </div>
      )}

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Brick Product</th>
                <th>Current stockQuantity</th>
                <th>Price per Brick</th>
                <th>Status</th>
                <th>Stock Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const stock = product.stockQuantity || product.stock || 0;
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unit: {product.unit || 'piece'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 900, fontSize: 18, color: stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                        {stock.toLocaleString('en-IN')} pcs
                      </div>
                    </td>
                    <td>₹{Number(product.pricePerBrick || product.price || 0).toFixed(2)}</td>
                    <td>
                      <span className={`tag ${stock > 5000 ? 'tag-delivered' : stock > 0 ? 'tag-confirmed' : 'tag-cancelled'}`}>
                        {stock > 5000 ? 'IN STOCK' : stock > 0 ? 'LOW STOCK' : 'OUT OF STOCK'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-success btn-sm" onClick={() => openStockModal(product, 'add')}>
                          <Plus size={14} /> Add Stock
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => openStockModal(product, 'adjust')}>
                          <Minus size={14} /> Reduce Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Update Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'add' ? `Add Stock: ${selectedProduct.name}` : `Reduce Stock: ${selectedProduct.name}`}
              </h3>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Current stockQuantity in Firestore: <strong>{(selectedProduct.stockQuantity || 0).toLocaleString('en-IN')} pcs</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {modalType === 'add' ? 'Quantity to Add (pieces) *' : 'Quantity to Deduct (pieces) *'}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setSelectedProduct(null)}>Cancel</button>
                <button className={`btn ${modalType === 'add' ? 'btn-success' : 'btn-danger'}`} type="submit" disabled={saving}>
                  {saving ? 'Updating Firestore...' : modalType === 'add' ? 'Confirm Add Stock' : 'Confirm Reduce Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
