import React, { useState, useEffect } from 'react';
import {
  Package,
  FolderTree,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { productsAPI, categoriesAPI, ordersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/format';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'orders'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    image_url: '',
    rating: 4.5,
    description: ''
  });

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData, ordersData] = await Promise.all([
        productsAPI.getProducts(),
        categoriesAPI.getCategories(),
        ordersAPI.getAllOrders()
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setOrders(ordersData);
    } catch (err) {
      addToast(err.message || 'Failed to load admin dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  // Open modal for Create or Edit Product
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category_id: product.category_id || '',
        price: product.price,
        stock: product.stock,
        image_url: product.image_url,
        rating: product.rating,
        description: product.description || ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category_id: categories[0]?.category_id || '',
        price: '',
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
        rating: 4.5,
        description: ''
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsAPI.updateProduct(editingProduct.product_id, productForm);
        addToast(`Product "${productForm.name}" updated successfully!`, 'success');
      } else {
        await productsAPI.createProduct(productForm);
        addToast(`Product "${productForm.name}" created successfully!`, 'success');
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await productsAPI.deleteProduct(productId);
      addToast(`Product "${name}" deleted`, 'info');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await categoriesAPI.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      addToast(`Category "${newCatName}" created!`, 'success');
      setNewCatName('');
      setNewCatDesc('');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will become unassigned.`)) return;
    try {
      await categoriesAPI.deleteCategory(categoryId);
      addToast(`Category deleted`, 'info');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete category', 'error');
    }
  };

  // Order Status Update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      addToast(`Order #${orderId} status changed to ${newStatus}`, 'success');
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
          Admin <span className="gradient-text">Management Portal</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage catalog inventory, add or edit products and categories, and track customer orders.
        </p>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Products</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{products.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 245, 160, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f5a0' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue (INR)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{formatINR(totalRevenue)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{orders.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Low Stock Alert</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: lowStockCount > 0 ? '#fbbf24' : '#ffffff' }}>
              {lowStockCount} items
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('products')}
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Package size={16} />
          <span>Products Inventory ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FolderTree size={16} />
          <span>Categories ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ShoppingBag size={16} />
          <span>Customer Orders ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS INVENTORY */}
      {activeTab === 'products' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Product Catalog CRUD</h3>
            <button
              id="admin-add-product-btn"
              onClick={() => handleOpenProductModal(null)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Inventory</th>
                  <th>Rating</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.product_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={p.image_url}
                          alt={p.name}
                          style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{p.product_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                        {p.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>
                      {formatINR(p.price)}
                    </td>
                    <td>
                      {p.stock <= 0 ? (
                        <span className="badge badge-out">0 (Out of stock)</span>
                      ) : p.stock <= 5 ? (
                        <span className="badge badge-low">{p.stock} (Low Stock)</span>
                      ) : (
                        <span className="badge badge-stock">{p.stock} units</span>
                      )}
                    </td>
                    <td>★ {p.rating || 4.5}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenProductModal(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.65rem' }}
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.product_id, p.name)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.35rem 0.65rem' }}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES CRUD */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Create Category Form */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Add New Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Smart Home Devices"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Brief description of products in this category..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows="3"
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} />
                <span>Create Category</span>
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Existing Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {categories.map((cat) => (
                <div
                  key={cat.category_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>{cat.name}</h5>
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                      {cat.product_count || 0} products linked • slug: <code>{cat.slug}</code>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.category_id, cat.name)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.35rem 0.65rem' }}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS & STATUS TRACKING */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>All Customer Orders & Status Workflow</h3>

          <div className="table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      #ORD-{String(order.order_id).padStart(5, '0')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{order.user_name || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {order.items?.length || 0} items
                    </td>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>
                      {formatINR(order.total_amount)}
                    </td>
                    <td>
                      <span className={`badge-status status-${(order.status || 'pending').toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                        className="form-input"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto', cursor: 'pointer' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="ai-drawer-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '90%',
              margin: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>
                {editingProduct ? `Edit Product (#${editingProduct.product_id})` : 'Create New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  className="form-input"
                  placeholder="e.g. Ultra Gaming Headset Pro"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹ INR) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    className="form-input"
                    placeholder="14999"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                    className="form-input"
                    placeholder="25"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating (0 to 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={productForm.rating}
                    onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                    className="form-input"
                    placeholder="4.8"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-input"
                  placeholder="Key features, specifications, and details..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
