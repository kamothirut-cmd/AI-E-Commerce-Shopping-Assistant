import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AiShoppingAssistant from './components/AiShoppingAssistant';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar onOpenAiAssistant={() => setIsAiOpen(true)} />

      {/* Main Routed Page Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage onOpenAiAssistant={() => setIsAiOpen(true)} />} />
          <Route path="/product/:id" element={<ProductDetailPage onOpenAiAssistant={() => setIsAiOpen(true)} />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer />

      {/* Interactive AI Shopping Assistant Drawer */}
      <AiShoppingAssistant
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />

      {/* Persistent Floating AI Assistant Launcher */}
      <button
        id="floating-ai-btn"
        className="ai-floating-trigger"
        onClick={() => setIsAiOpen(true)}
        aria-label="Open AI Shopping Assistant"
      >
        <Sparkles size={19} />
        <span>Ask AI Assistant</span>
      </button>

      {/* Footer */}
      <Footer />
    </div>
  );
}
