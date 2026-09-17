import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Local storage cart for guest
      const localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      setItems(localCart);
      const total = localCart.reduce((acc, i) => acc + i.quantity, 0);
      const sum = localCart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      setTotalItems(total);
      setSubtotal(parseFloat(sum.toFixed(2)));
      return;
    }

    try {
      setLoading(true);
      // Auto-migrate any existing guest cart items to the user's server cart
      const guestCartRaw = localStorage.getItem('guest_cart');
      if (guestCartRaw) {
        try {
          const guestItems = JSON.parse(guestCartRaw);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            for (const item of guestItems) {
              await cartAPI.addToCart(item.product_id, item.quantity).catch(() => {});
            }
          }
        } catch (e) {
          console.error('Error migrating guest cart:', e);
        } finally {
          localStorage.removeItem('guest_cart');
        }
      }

      const data = await cartAPI.getCart();
      setItems(data.items || []);
      setTotalItems(data.totalItems || 0);
      setSubtotal(data.subtotal || 0);
    } catch (err) {
      console.error('Failed to fetch user cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    if (!product || product.stock <= 0) {
      addToast('Sorry, this product is out of stock!', 'error');
      return;
    }

    if (!isAuthenticated) {
      // Guest cart handling
      const localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      const existingIndex = localCart.findIndex(i => i.product_id === product.product_id);

      if (existingIndex > -1) {
        const newQty = localCart[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          addToast(`Cannot add more. Only ${product.stock} units available in stock.`, 'error');
          return;
        }
        localCart[existingIndex].quantity = newQty;
      } else {
        if (quantity > product.stock) {
          addToast(`Cannot add ${quantity}. Only ${product.stock} available.`, 'error');
          return;
        }
        localCart.push({
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
          quantity
        });
      }

      localStorage.setItem('guest_cart', JSON.stringify(localCart));
      fetchCart();
      addToast(`Added "${product.name}" to cart!`, 'success');
      setIsCartOpen(true);
      return;
    }

    try {
      const updated = await cartAPI.addToCart(product.product_id, quantity);
      setItems(updated.items || []);
      setTotalItems(updated.totalItems || 0);
      setSubtotal(updated.subtotal || 0);
      addToast(`Added "${product.name}" to cart!`, 'success');
      setIsCartOpen(true);
    } catch (err) {
      addToast(err.message || 'Failed to add item to cart', 'error');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) {
      let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      if (quantity <= 0) {
        localCart = localCart.filter(i => i.product_id !== productId);
      } else {
        const item = localCart.find(i => i.product_id === productId);
        if (item) {
          if (quantity > item.stock) {
            addToast(`Requested quantity exceeds available stock (${item.stock} available)`, 'error');
            return;
          }
          item.quantity = quantity;
        }
      }
      localStorage.setItem('guest_cart', JSON.stringify(localCart));
      fetchCart();
      return;
    }

    try {
      const updated = await cartAPI.updateQuantity(productId, quantity);
      setItems(updated.items || []);
      setTotalItems(updated.totalItems || 0);
      setSubtotal(updated.subtotal || 0);
    } catch (err) {
      addToast(err.message || 'Failed to update quantity', 'error');
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) {
      const localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      const filtered = localCart.filter(i => i.product_id !== productId);
      localStorage.setItem('guest_cart', JSON.stringify(filtered));
      fetchCart();
      addToast('Item removed from cart', 'info');
      return;
    }

    try {
      const updated = await cartAPI.removeFromCart(productId);
      setItems(updated.items || []);
      setTotalItems(updated.totalItems || 0);
      setSubtotal(updated.subtotal || 0);
      addToast('Item removed from cart', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to remove item', 'error');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      localStorage.removeItem('guest_cart');
      fetchCart();
      return;
    }

    try {
      await cartAPI.clearCart();
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
    } catch (err) {
      console.error('Failed to clear cart:', err.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
