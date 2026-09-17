import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  Banknote
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ordersAPI } from '../services/api';
import { formatINR } from '../utils/format';

export default function CheckoutPage() {
  const { items, subtotal, totalItems, clearCart } = useCart();
  const { user, isAuthenticated, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || 'Rahul Sharma',
    email: user?.email || 'user@example.com',
    street: 'Plot 42, 14th Main, HSR Layout Sector 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    zip: '560102',
    phone: '+91 98765 43210'
  });

  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay / PhonePe)');
  const [submitting, setSubmitting] = useState(false);

  const gst = Math.round(subtotal * 0.18);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = Math.round(subtotal + gst + shipping);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuickLogin = async () => {
    try {
      await login('user@example.com', 'user123');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      addToast('Your cart is empty', 'error');
      return;
    }

    const fullAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip} (Phone: ${formData.phone})`;

    try {
      setSubmitting(true);

      // If user is guest, automatically log in with demo account so order can be persisted and tracked
      if (!isAuthenticated) {
        try {
          await login('user@example.com', 'user123');
          addToast('Signed in with Demo Account to record your order', 'info');
        } catch (authErr) {
          addToast('Please login to place your order', 'error');
          setSubmitting(false);
          return;
        }
      }

      const res = await ordersAPI.createOrder({
        shipping_address: fullAddress,
        payment_method: paymentMethod,
        items: items
      });

      // Celebration effect
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      addToast('🎉 Order confirmed successfully!', 'success');
      await clearCart();
      navigate(`/order-confirmation/${res.order.order_id}`, {
        state: { order: res.order }
      });
    } catch (err) {
      addToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
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
        <h2 style={{ marginBottom: '0.75rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Add products to your cart before proceeding to checkout.
        </p>
        <Link to="/" className="btn btn-primary">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
        Secure <span className="gradient-text">Checkout</span>
      </h1>

      {/* Guest Warning Banner if not logged in */}
      {!isAuthenticated && (
        <div
          className="card"
          style={{
            marginBottom: '2rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderColor: 'var(--border-highlight)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h4 style={{ color: '#a5b4fc', marginBottom: '0.25rem' }}>Authentication Required for Order History</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Log in to record this order to your account and track fulfillment status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleQuickLogin} className="btn btn-primary btn-sm">
              ⚡ 1-Click Demo Login
            </button>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Standard Login
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {/* Left Column: Forms */}
        <div>
          <form onSubmit={handleSubmitOrder}>
            {/* Delivery Details */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} color="var(--accent-primary)" />
                Shipping & Delivery Address
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="var(--accent-primary)" />
                Payment Method
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div
                  onClick={() => setPaymentMethod('UPI (Google Pay / PhonePe)')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${paymentMethod.includes('UPI') ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: paymentMethod.includes('UPI') ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <Smartphone size={24} color={paymentMethod.includes('UPI') ? '#34d399' : 'var(--text-muted)'} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>UPI / QR Pay</div>
                </div>

                <div
                  onClick={() => setPaymentMethod('RuPay / Cards')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${paymentMethod.includes('Cards') ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: paymentMethod.includes('Cards') ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <CreditCard size={24} color={paymentMethod.includes('Cards') ? '#34d399' : 'var(--text-muted)'} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>RuPay / Cards</div>
                </div>

                <div
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${paymentMethod === 'Cash on Delivery' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: paymentMethod === 'Cash on Delivery' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <Banknote size={24} color={paymentMethod === 'Cash on Delivery' ? '#34d399' : 'var(--text-muted)'} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cash on Delivery</div>
                </div>
              </div>

              {paymentMethod.includes('Cards') && (
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div className="form-group">
                    <label className="form-label">RuPay / Visa / Master Card Number (Simulated)</label>
                    <input type="text" defaultValue="•••• •••• •••• 5842" className="form-input" readOnly />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Valid Thru</label>
                      <input type="text" defaultValue="09/29" className="form-input" readOnly />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">CVV</label>
                      <input type="text" defaultValue="729" className="form-input" readOnly />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod.includes('UPI') && (
                <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label className="form-label">Virtual Payment Address (UPI ID)</label>
                  <input type="text" defaultValue="user@okhdfcbank" className="form-input" readOnly />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    Supported: Google Pay, PhonePe, Paytm, BHIM, and all bank UPI apps.
                  </p>
                </div>
              )}
            </div>

            <button
              id="confirm-order-btn"
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                padding: '1.1rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              <CheckCircle2 size={20} />
              <span>
                {submitting
                  ? 'Verifying & Confirming Order...'
                  : `Confirm Order • Pay ${formatINR(grandTotal)}`}
              </span>
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              🔒 100% Secure Checkout & Instant Order Confirmation
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              Order Review ({totalItems} items)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '360px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.25rem' }}>
              {items.map(item => (
                <div key={item.product_id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </h5>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Qty: {item.quantity} × {formatINR(item.price)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                    {formatINR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ color: '#ffffff' }}>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>GST (18%)</span>
                <span>{formatINR(gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Standard Delivery</span>
                <span>{shipping === 0 ? <span style={{ color: '#10b981', fontWeight: 600 }}>FREE (above ₹999)</span> : formatINR(shipping)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff'
                }}
              >
                <span>Grand Total</span>
                <span className="gradient-text">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Real-time inventory verification & encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
