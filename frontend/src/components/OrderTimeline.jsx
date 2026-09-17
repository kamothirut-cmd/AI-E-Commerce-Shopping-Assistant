import React, { useState } from 'react';
import {
  Check,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const FULFILLMENT_STAGES = [
  {
    key: 'Pending',
    label: 'Order Placed',
    sublabel: 'Payment authorized',
    icon: Clock,
    hub: 'Order Management Gateway'
  },
  {
    key: 'Processing',
    label: 'Confirmed & Packed',
    sublabel: 'Quality verified at warehouse',
    icon: PackageCheck,
    hub: 'Bengaluru Fulfillment Center Hub #4'
  },
  {
    key: 'Shipped',
    label: 'Dispatched in Transit',
    sublabel: 'In transit via Blue Dart Air Cargo',
    icon: Truck,
    hub: 'Bengaluru Airport Logistics Terminal'
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    sublabel: 'Handed over to customer',
    icon: CheckCircle2,
    hub: 'Recipient Delivery Destination'
  }
];

export default function OrderTimeline({ status, order, onStatusUpdate }) {
  const { addToast } = useToast();
  const [showLogs, setShowLogs] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (status === 'Cancelled') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          fontSize: '0.9rem',
          fontWeight: 600,
          margin: '1rem 0'
        }}
      >
        <AlertTriangle size={18} />
        <span>This order was cancelled. Stock has been replenished.</span>
      </div>
    );
  }

  const currentIdx = FULFILLMENT_STAGES.findIndex(s => s.key === status);
  const activeIndex = currentIdx === -1 ? 0 : currentIdx;

  const orderId = order?.order_id || 1;
  const trackingNumber = order?.tracking_id || `BD-IND-${String(orderId).padStart(6, '0')}`;
  const carrier = order?.carrier || 'Blue Dart Express';

  // Calculate estimated delivery
  const createdDate = order?.created_at ? new Date(order.created_at) : new Date();
  const estDate = new Date(createdDate);
  estDate.setDate(estDate.getDate() + 3);
  const estDeliveryFormatted = order?.estimated_delivery || estDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live simulation: Advance status through the timeline
  const handleAdvanceStatus = async () => {
    if (!order) return;
    try {
      setUpdating(true);
      const sequence = ['Pending', 'Processing', 'Shipped', 'Delivered'];
      const nextIndex = (sequence.indexOf(status) + 1) % sequence.length;
      const nextStatus = sequence[nextIndex];

      await ordersAPI.updateOrderStatus(order.order_id, nextStatus);
      addToast(`Fulfillment stage advanced to "${nextStatus}"!`, 'success');
      if (onStatusUpdate) {
        onStatusUpdate(order.order_id, nextStatus);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update order fulfillment status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Generate milestone checkpoint timestamps based on created_at
  const formatTimeOffset = (hoursOffset) => {
    const d = new Date(createdDate);
    d.setHours(d.getHours() + hoursOffset);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const milestones = [
    {
      title: 'Order Placed & Payment Authorized',
      location: 'Online Checkout Gateway',
      time: formatTimeOffset(0),
      desc: 'Customer placed order. Inventory reserved and digital invoice generated.',
      completed: true
    },
    {
      title: 'Order Confirmed & Processed',
      location: 'Central Fulfillment Hub, Bengaluru',
      time: formatTimeOffset(3),
      desc: 'Items picked, scanned, and double-checked for quality inspection.',
      completed: activeIndex >= 1
    },
    {
      title: 'Package Sealed & Handed Over to Logistics',
      location: 'Blue Dart Air Cargo Hub',
      time: formatTimeOffset(12),
      desc: `Manifest created under Tracking AWB #${trackingNumber}.`,
      completed: activeIndex >= 2
    },
    {
      title: 'Dispatched for Final Mile Delivery',
      location: 'Regional Distribution Center',
      time: formatTimeOffset(36),
      desc: 'Package reached local facility. Delivery associate assigned.',
      completed: activeIndex >= 3
    },
    {
      title: 'Order Delivered Successfully',
      location: order?.shipping_address?.split(',')[0] || 'Recipient Address',
      time: formatTimeOffset(52),
      desc: 'Consignment handed over to customer. OTP verified.',
      completed: activeIndex >= 3 && status === 'Delivered'
    }
  ];

  return (
    <div
      style={{
        margin: '1.25rem 0',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Tracking Metadata Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carrier:</span>
            <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{carrier}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AWB / Tracking:</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#a5b4fc',
                background: 'rgba(99, 102, 241, 0.12)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid rgba(99, 102, 241, 0.25)'
              }}
            >
              {trackingNumber}
            </span>
            <button
              onClick={handleCopyTracking}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
              title="Copy tracking number"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Est. Arrival:</span>
            <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>{estDeliveryFormatted}</strong>
          </div>
        </div>

        {/* Action Controls: Live Simulation Button & View Confirmation Receipt */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleAdvanceStatus}
            disabled={updating}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.785rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(99, 102, 241, 0.15)',
              borderColor: 'var(--accent-primary)',
              color: '#c7d2fe'
            }}
            title="Click to simulate moving this order to the next fulfillment milestone"
          >
            <RefreshCw size={13} className={updating ? 'spin' : ''} />
            <span>{updating ? 'Updating...' : '⚡ Advance Stage'}</span>
          </button>

          <Link
            to={`/order-confirmation/${orderId}`}
            state={{ order }}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.785rem',
              padding: '0.4rem 0.75rem'
            }}
          >
            <ExternalLink size={13} />
            <span>View Receipt</span>
          </Link>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div style={{ position: 'relative', margin: '1rem 0.5rem 1.5rem' }}>
        {/* Background track line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '35px',
            right: '35px',
            height: '4px',
            background: 'var(--border-subtle)',
            borderRadius: '2px',
            zIndex: 1
          }}
        />

        {/* Active progress fill line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '35px',
            width: `${(activeIndex / (FULFILLMENT_STAGES.length - 1)) * 82}%`,
            height: '4px',
            background: 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)',
            borderRadius: '2px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}
        />

        {/* Stepper Nodes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2
          }}
        >
          {FULFILLMENT_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const Icon = stage.icon;

            return (
              <div
                key={stage.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  maxWidth: '120px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isCompleted
                      ? '#10b981'
                      : isCurrent
                      ? 'var(--accent-primary)'
                      : 'var(--bg-card)',
                    border: `2px solid ${
                      isCompleted
                        ? '#10b981'
                        : isCurrent
                        ? '#818cf8'
                        : 'var(--border-subtle)'
                    }`,
                    color: isCompleted || isCurrent ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.6rem',
                    boxShadow: isCurrent
                      ? '0 0 18px rgba(99, 102, 241, 0.7)'
                      : isCompleted
                      ? '0 0 10px rgba(16, 185, 129, 0.4)'
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isCompleted ? <Check size={20} strokeWidth={2.5} /> : <Icon size={20} />}
                </div>

                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCurrent ? '#ffffff' : isCompleted ? '#34d399' : 'var(--text-muted)',
                    marginBottom: '0.2rem'
                  }}
                >
                  {stage.label}
                </div>

                <div
                  style={{
                    fontSize: '0.7rem',
                    color: isCurrent ? '#c7d2fe' : 'var(--text-secondary)',
                    lineHeight: 1.3
                  }}
                >
                  {stage.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Tracking Activity Log Accordion */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-subtle)' }}>
        <button
          onClick={() => setShowLogs(!showLogs)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.25rem 0',
            width: '100%',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Navigation size={15} />
            {showLogs ? 'Hide Detailed Fulfillment Log' : `View Live Fulfillment Checkpoints (${milestones.filter(m => m.completed).length} of ${milestones.length} completed)`}
          </span>
          {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showLogs && (
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.25rem',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {milestones.map((m, mIdx) => (
              <div
                key={mIdx}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  opacity: m.completed ? 1 : 0.45
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: m.completed ? '#10b981' : 'var(--bg-card)',
                    border: `1px solid ${m.completed ? '#10b981' : 'var(--border-subtle)'}`,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {m.completed ? '✓' : mIdx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: m.completed ? '#ffffff' : 'var(--text-muted)' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {m.time}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: '#a5b4fc', marginTop: '0.15rem' }}>
                    <MapPin size={12} />
                    <span>{m.location}</span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
