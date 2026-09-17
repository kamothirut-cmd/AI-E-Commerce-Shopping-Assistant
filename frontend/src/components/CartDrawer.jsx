import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';

export default function CartDrawer() {
  const {
    items,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const gst = Math.round(subtotal * 0.18);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = Math.round(subtotal + gst + shipping);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="ai-drawer-overlay" onClick={closeCart}>
      <div
        className="ai-drawer"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Your Shopping Cart</h3>
            <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={closeCart}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="ai-drawer-messages" style={{ padding: '1rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: 'var(--text-muted)'
                }}
              >
                <ShoppingBag size={32} />
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#ffffff' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Explore our catalog and find the best tech essentials!
              </p>
              <button onClick={closeCart} className="btn btn-primary btn-sm">
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem'
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', lineHeight: '1.3' }}>
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px' }}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                      {formatINR(item.price)} each
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.2rem'
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '3px' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '22px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: (item.stock !== undefined && item.quantity >= item.stock) ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: (item.stock !== undefined && item.quantity >= item.stock) ? 'not-allowed' : 'pointer',
                            padding: '3px'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={clearCart}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div
            style={{
              padding: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(20, 27, 45, 0.7)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ color: '#ffffff' }}>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated GST (18%)</span>
                <span>{formatINR(gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>{shipping === 0 ? <span style={{ color: '#10b981', fontWeight: 600 }}>FREE (above ₹999)</span> : formatINR(shipping)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                <span>Total</span>
                <span className="gradient-text">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <button
              id="cart-checkout-btn"
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
