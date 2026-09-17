import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus
} from 'lucide-react';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';

export default function ProductDetailPage({ onOpenAiAssistant }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await productsAPI.getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product details:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
          Loading product details...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          The product you are looking for does not exist or has been removed.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    await addToCart(product, quantity);
    setTimeout(() => setAdding(false), 500);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Breadcrumb / Back button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        {/* Product Image Column */}
        <div
          className="card"
          style={{
            padding: '1rem',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-card)'
          }}
        >
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: '100%',
              maxHeight: '480px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)'
            }}
          />
        </div>

        {/* Product Details Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-category">
              {product.category_name || 'Electronics'}
            </span>
            {isOutOfStock ? (
              <span className="badge badge-out">Out of Stock</span>
            ) : isLowStock ? (
              <span className="badge badge-low">Only {product.stock} units remaining</span>
            ) : (
              <span className="badge badge-stock">In Stock ({product.stock} units)</span>
            )}
          </div>

          <h1 style={{ fontSize: '2.25rem', marginBottom: '1rem', lineHeight: '1.2' }}>
            {product.name}
          </h1>

          {/* Rating & Reviews */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', color: '#fbbf24' }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(product.rating || 4.5) ? '#fbbf24' : 'none'}
                  color="#fbbf24"
                />
              ))}
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{product.rating || 4.5}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>(Verified Buyer Reviews)</span>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '1.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block' }}>Special Price (Incl. of all taxes)</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              {formatINR(product.price)}
            </span>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#ffffff' }}>Overview & Features</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>

          {/* Quantity & Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
            {!isOutOfStock && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.35rem 0.5rem'
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.4rem' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: quantity >= product.stock ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                    padding: '0.4rem'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            <button
              id="detail-add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className={`btn btn-lg ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1, minWidth: '200px', opacity: isOutOfStock ? 0.6 : 1 }}
            >
              <ShoppingCart size={18} />
              <span>{isOutOfStock ? 'Out of Stock' : adding ? 'Added to Cart!' : 'Add to Cart'}</span>
            </button>

            {/* AI Shortcut Button */}
            <button
              onClick={onOpenAiAssistant}
              className="btn btn-secondary btn-lg"
              title="Ask AI Assistant about this item"
            >
              <Sparkles size={18} color="#818cf8" />
              <span>Ask AI</span>
            </button>
          </div>

          {/* Value props */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Truck size={18} color="#6366f1" />
              <span>Fast Express Dispatch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <RotateCcw size={18} color="#10b981" />
              <span>30-Day Easy Returns</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={18} color="#06b6d4" />
              <span>1-Year Official Warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
