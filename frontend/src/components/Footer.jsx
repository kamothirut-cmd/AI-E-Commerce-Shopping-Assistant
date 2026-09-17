import React from 'react';
import { ShoppingBag, Sparkles, Shield, Cpu, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          <div>
            <div className="brand-logo" style={{ marginBottom: '1rem' }}>
              <div className="brand-icon">
                <ShoppingBag size={18} />
              </div>
              <span>Nova<span className="gradient-text">Mart</span></span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Next-generation e-commerce shopping experience empowered by an intelligent AI assistant that curates personalized tech recommendations.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>Technology Architecture</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={15} color="#6366f1" /> React 19 + Vite Frontend
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={15} color="#10b981" /> Express.js + SQLite Database
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={15} color="#ec4899" /> AI Shopping Assistant (Gemini / OpenAI)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={15} color="#06b6d4" /> JWT Authentication & Role-Based Access
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>Demo Accounts</h4>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.825rem' }}>
              <p style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: '0.35rem' }}>Admin Access:</p>
              <p style={{ color: 'var(--text-secondary)' }}>Email: <code>admin@example.com</code></p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Password: <code>admin123</code></p>
              <p style={{ color: '#34d399', fontWeight: 600, marginBottom: '0.35rem' }}>Customer Access:</p>
              <p style={{ color: 'var(--text-secondary)' }}>Email: <code>user@example.com</code></p>
              <p style={{ color: 'var(--text-secondary)' }}>Password: <code>user123</code></p>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p>© {new Date().getFullYear()} NovaMart AI Store. Assignment 3 - Full Stack Web Development with AI.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>REST API Verified</span>
            <span>Stock Real-Time Tracking</span>
            <span>AI Catalog Grounded</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
