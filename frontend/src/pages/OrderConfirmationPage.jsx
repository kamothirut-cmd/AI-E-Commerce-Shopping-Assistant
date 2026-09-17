import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  MapPin,
  CreditCard,
  Printer,
  ShoppingBag,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ordersAPI } from '../services/api';
import { formatINR } from '../utils/format';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Trigger celebration confetti on mount
    try {
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b', '#ec4899']
      });
    } catch (e) {
      // Ignore confetti errors if canvas is not ready
    }

    // If order was not passed in location state, fetch it from API
    if (!order && id) {
      async function fetchOrder() {
        try {
          setLoading(true);
          const data = await ordersAPI.getOrderById(id);
          setOrder(data);
        } catch (err) {
          console.error('Failed to load order confirmation:', err);
        } finally {
          setLoading(false);
        }
      }
      fetchOrder();
    }
  }, [id]);

  const handleCopyOrderId = () => {
    if (!order) return;
    const orderRef = `ORD-${String(order.order_id).padStart(5, '0')}`;
    navigator.clipboard.writeText(orderRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Loading Order Confirmation...
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Preparing your official receipt and tracking details.</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', padding: '3rem 2rem' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Details Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            We could not retrieve this order's confirmation. Please check your order history.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/orders" className="btn btn-primary">
              View Order History
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderIdFormatted = `#ORD-${String(order.order_id).padStart(5, '0')}`;
  const trackingNumber = order.tracking_id || `BD-IND-${String(order.order_id).padStart(6, '0')}`;
  const carrier = order.carrier || 'Blue Dart Express';

  // Calculate estimated delivery if not present (3 days from created_at)
  const createdDate = order.created_at ? new Date(order.created_at) : new Date();
  const estDate = new Date(createdDate);
  estDate.setDate(estDate.getDate() + 3);
  const estimatedDeliveryText = order.estimated_delivery || estDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const subtotal = order.subtotal || (order.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || order.total_amount);
  const gst = order.gst !== undefined ? order.gst : Math.round(subtotal * 0.18);
  const shipping = order.shipping !== undefined ? order.shipping : (subtotal > 999 ? 0 : 99);
  const grandTotal = order.total_amount;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '960px' }}>
      {/* Top Breadcrumb & Back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ← Continue Shopping
        </Link>
        <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Printer size={16} />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Hero Confirmation Card */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '3rem 2rem 2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(17, 24, 39, 0.6) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Pulsing Checkmark Badge */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.55)',
            border: '3px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <CheckCircle2 size={44} color="#ffffff" strokeWidth={2.5} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          <Sparkles size={14} />
          <span>Payment Verified • Order Confirmed</span>
        </div>

        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ffffff' }}>
          Thank You! Your Order is Placed.
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.75rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
          We have received your order. Our fulfillment team is preparing your package for priority dispatch.
        </p>

        {/* Quick Reference Chips */}
        <div
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '0.85rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order Reference:</span>
            <strong style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '1rem' }}>{orderIdFormatted}</strong>
            <button
              onClick={handleCopyOrderId}
              style={{ background: 'none', border: 'none', color: copied ? '#10b981' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
              title="Copy Order Reference"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div style={{ width: '1px', background: 'var(--border-subtle)', alignSelf: 'stretch' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Est. Delivery:</span>
            <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>{estimatedDeliveryText}</strong>
          </div>
        </div>
      </div>

      {/* Fulfillment Progress Stepper Card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} color="var(--accent-primary)" />
              Fulfillment Status & Timeline
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Carrier: <strong>{carrier}</strong> • Tracking ID: <strong style={{ fontFamily: 'monospace' }}>{trackingNumber}</strong>
            </p>
          </div>

          <Link to="/orders" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Track in Order History</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 5-Step Visual Progress Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', position: 'relative' }}>
          {[
            { step: '1', title: 'Order Placed', desc: 'Received in system', state: 'completed' },
            { step: '2', title: 'Confirmed', desc: 'Inventory allocated', state: 'active' },
            { step: '3', title: 'Packed', desc: 'Ready for courier', state: 'upcoming' },
            { step: '4', title: 'Out for Delivery', desc: 'Local delivery hub', state: 'upcoming' },
            { step: '5', title: 'Delivered', desc: 'Handed over', state: 'upcoming' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: item.state === 'completed' ? 'rgba(16, 185, 129, 0.12)' : item.state === 'active' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary)',
                border: `1px solid ${item.state === 'completed' ? 'rgba(16, 185, 129, 0.4)' : item.state === 'active' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: item.state === 'completed' ? '#10b981' : item.state === 'active' ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem'
                }}
              >
                {item.state === 'completed' ? '✓' : item.step}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: item.state === 'upcoming' ? 'var(--text-muted)' : '#ffffff' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Order Items & Delivery/Billing Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Left: Items Summary */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageCheck size={20} color="var(--accent-primary)" />
            Purchased Items ({order.items?.length || 0})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.items?.map((item) => (
              <div
                key={item.item_id || item.product_id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80'}
                  alt={item.name}
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Qty: <strong>{item.quantity}</strong> × {formatINR(item.price)}
                  </div>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  {formatINR(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.25rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Items Subtotal</span>
              <span style={{ color: '#ffffff' }}>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Estimated GST (18%)</span>
              <span>{formatINR(gst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Standard Logistics Delivery</span>
              <span style={{ color: shipping === 0 ? '#10b981' : '#ffffff', fontWeight: shipping === 0 ? 600 : 400 }}>
                {shipping === 0 ? 'FREE' : formatINR(shipping)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              <span>Total Paid</span>
              <span className="gradient-text">{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Right: Shipping, Payment & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Delivery Address Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--accent-primary)" />
              Shipping Destination
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {order.shipping_address}
            </p>
          </div>

          {/* Payment Method Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--accent-primary)" />
              Payment Information
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Method Selected:</span>
              <strong style={{ color: '#ffffff' }}>{order.payment_method || 'UPI (Google Pay / PhonePe)'}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} /> Paid & Authorized
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Link
              to="/orders"
              className="btn btn-primary btn-lg"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.95rem' }}
            >
              <Truck size={20} />
              <span>Track in Order History</span>
            </Link>

            <Link
              to="/"
              className="btn btn-secondary btn-lg"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.95rem' }}
            >
              <ShoppingBag size={20} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
