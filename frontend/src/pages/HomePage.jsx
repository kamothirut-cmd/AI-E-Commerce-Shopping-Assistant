import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';

export default function HomePage({ onOpenAiAssistant }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(250000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await categoriesAPI.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    }
    loadCategories();
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const params = {
          search: searchTerm,
          category: selectedCategory,
          maxPrice: maxPrice,
          inStock: inStockOnly ? 'true' : '',
          sort: sortBy
        };
        const data = await productsAPI.getProducts(params);
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err.message);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm, maxPrice, inStockOnly, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setMaxPrice(250000);
    setInStockOnly(false);
    setSortBy('');
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={15} color="#818cf8" />
          <span>Next-Gen AI Shopping Experience</span>
        </div>

        <h1 className="hero-title">
          Smart Tech Store Curated by <span className="gradient-text">Artificial Intelligence</span>
        </h1>

        <p className="hero-subtitle">
          Discover high-performance laptops, crystal-clear audio, wearables, and smart tech gear.
          Let our conversational AI assistant find your perfect match.
        </p>

        {/* Interactive AI Banner Prompt */}
        <div
          onClick={onOpenAiAssistant}
          style={{
            maxWidth: '620px',
            margin: '0 auto 2.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-full)',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.2s'
          }}
          className="card-hover"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <Sparkles size={16} />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Looking for something specific? Ask our AI assistant...
            </span>
          </div>
          <span className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-full)' }}>
            Ask AI
          </span>
        </div>
      </section>

      {/* Product Catalog Controls */}
      <ProductFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        inStockOnly={inStockOnly}
        onInStockChange={setInStockOnly}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
      />

      {/* Product Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>
            {selectedCategory
              ? categories.find(c => c.category_id.toString() === selectedCategory)?.name || 'Category Products'
              : 'All Available Products'}
          </h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing {products.length} items
          </span>
        </div>

        {loading ? (
          <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
              Loading curated products...
            </div>
          </div>
        ) : products.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px', margin: '2rem auto' }}
          >
            <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              We couldn't find any products matching your active filters. Try adjusting your search or budget.
            </p>
            <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
