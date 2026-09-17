import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  LogOut,
  ShieldCheck,
  Package,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar({ onOpenAiAssistant }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <ShoppingBag size={20} />
          </div>
          <span>Nova<span className="gradient-text">Mart</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links" style={{ display: 'flex' }}>
          <Link to="/" className="nav-link">Catalog</Link>
          {isAuthenticated && (
            <Link to="/orders" className="nav-link">
              <Package size={16} />
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="nav-link" style={{ color: '#a5b4fc', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* AI Assistant Quick Launcher */}
          <button
            id="nav-ai-btn"
            className="ai-nav-btn"
            onClick={onOpenAiAssistant}
            title="Ask AI Shopping Assistant"
          >
            <Sparkles size={16} color="#c7d2fe" />
            <span>AI Assistant</span>
          </button>

          {/* Cart Trigger */}
          <button
            id="nav-cart-btn"
            className="cart-icon-btn"
            onClick={openCart}
            title="View Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={19} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>

          {/* User Profile / Auth */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-card)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isAdmin ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
                {isAdmin && (
                  <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '0.15rem 0.45rem', fontSize: '0.65rem' }}>
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
                style={{ padding: '0.5rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
