import React, { useState } from 'react';
import type { InventoryItem } from '../../types';
import { Package, Search, Filter, Plus, Edit2 } from 'lucide-react';

interface InventoryTabProps {
  inventory: InventoryItem[];
  onOpenModal: (item?: InventoryItem) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ inventory, onOpenModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(inventory.map(i => i.category)))];

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>Product Catalog & Inventory</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Monitor warehouse stock, valuation, SKUs, and category levels</p>
        </div>
        <button onClick={() => onOpenModal()} className="erp-btn erp-btn-primary">
          <Plus size={16} /> Add New Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="erp-input with-icon"
            placeholder="Search product title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="erp-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="db-table-card">
        <table className="db-user-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Title</th>
              <th>Category</th>
              <th>Available Stock</th>
              <th>Unit Price ($ USD)</th>
              <th>Total Valuation</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No inventory products found.
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const totalVal = item.quantity * item.unitPrice;
                const isLow = item.quantity <= 10;
                return (
                  <tr key={item.id}>
                    <td><code>{item.sku}</code></td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><span className="badge-pill" style={{ background: 'rgba(255,255,255,0.05)' }}>{item.category}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? '#ef4444' : '#10b981' }}>
                        {item.quantity} units {isLow && '⚠️'}
                      </span>
                    </td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => onOpenModal(item)} className="erp-icon-btn" title="Edit Item">
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
