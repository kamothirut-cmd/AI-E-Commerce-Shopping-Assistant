import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setAdding(true);
    await addToCart(product, 1);
    setTimeout(() => setAdding(false), 400);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.product_id}`} style={{ display: 'block' }}>
        <div className="product-image-wrap">
          <img
            src={product.image_url}
            alt={product.name}
            className="product-img"
            loading="lazy"
          />
          <div className="product-badge-overlay">
            {isOutOfStock ? (
              <span className="badge badge-out">Out of Stock</span>
            ) : isLowStock ? (
              <span className="badge badge-low">Only {product.stock} Left</span>
            ) : (
              <span className="badge badge-stock">In Stock ({product.stock})</span>
            )}
          </div>
        </div>
      </Link>

      <div className="product-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span className="product-category">{product.category_name || 'Tech'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#fbbf24' }}>
            <Star size={13} fill="#fbbf24" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.rating || 4.5}</span>
          </div>
        </div>

        <Link to={`/product/${product.product_id}`}>
          <h3 className="product-name" title={product.name}>{product.name}</h3>
        </Link>
        <p className="product-desc">{product.description}</p>

        <div className="product-footer">
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Price (INR)</span>
            <span className="product-price">{formatINR(product.price)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/product/${product.product_id}`}
              className="btn btn-secondary btn-sm"
              title="View Product Details"
              style={{ padding: '0.5rem 0.65rem' }}
            >
              <Eye size={15} />
            </Link>
            <button
              id={`add-to-cart-${product.product_id}`}
              onClick={handleAdd}
              disabled={isOutOfStock || adding}
              className={`btn btn-sm ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
              style={{ opacity: isOutOfStock ? 0.6 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
            >
              <ShoppingCart size={15} />
              <span>{isOutOfStock ? 'Sold Out' : adding ? 'Added...' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

