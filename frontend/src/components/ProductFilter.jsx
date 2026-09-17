import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { formatINR } from '../utils/format';

export default function ProductFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onInStockChange,
  sortBy,
  onSortChange,
  onResetFilters
}) {
  return (
    <div className="card" style={{ marginBottom: '2.5rem' }}>
      {/* Top row: Search and Sort */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            id="product-search-input"
            type="text"
            placeholder="Search products by title or keyword (e.g. RTX, wireless, laptop)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="form-input"
            style={{ width: 'auto', padding: '0.7rem 1rem', cursor: 'pointer' }}
          >
            <option value="">Featured Ranking</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Highest Rated (★)</option>
            <option value="newest">Newest Arrivals</option>
          </select>

          <button
            onClick={onResetFilters}
            className="btn btn-secondary"
            title="Reset Filters"
            style={{ padding: '0.7rem' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            onClick={() => onSelectCategory('')}
            className={`btn btn-sm ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => onSelectCategory(cat.category_id.toString())}
              className={`btn btn-sm ${selectedCategory === cat.category_id.toString() ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {cat.name} ({cat.product_count || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: Max price slider and In-stock toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.875rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Max Budget: <strong style={{ color: '#ffffff' }}>{formatINR(maxPrice)}</strong>
          </span>
          <input
            id="price-range-slider"
            type="range"
            min="2000"
            max="250000"
            step="2000"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            userSelect: 'none'
          }}
        >
          <input
            id="in-stock-checkbox"
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockChange(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <span>In-Stock Only</span>
        </label>
      </div>
    </div>
  );
}

