import React, { useState, useEffect } from 'react';
import type { InventoryItem } from '../../types';
import { X, Package } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>) => void;
  editItem?: InventoryItem | null;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onSave, editItem }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setSku(editItem.sku);
      setCategory(editItem.category);
      setQuantity(editItem.quantity.toString());
      setUnitPrice(editItem.unitPrice.toString());
    } else {
      setName('');
      setSku('');
      setCategory('Electronics');
      setQuantity('');
      setUnitPrice('');
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !unitPrice) return;

    onSave({
      id: editItem ? editItem.id : undefined,
      sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      category,
      quantity: parseInt(quantity, 10),
      unitPrice: parseFloat(unitPrice)
    });

    onClose();
  };

  return (
    <div className="erp-modal-overlay">
      <div className="erp-modal-card">
        <div className="erp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Package size={20} style={{ color: '#10b981' }} />
            <h3>{editItem ? 'Edit Inventory Product' : 'Add New Inventory Product'}</h3>
          </div>
          <button className="erp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="erp-form">
          <div className="erp-input-group">
            <label>Product Title / Name *</label>
            <input
              type="text"
              className="erp-input"
              required
              placeholder="e.g. Wireless Ergonomic Mouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                className="erp-input"
                placeholder="PROD-APX-105"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div className="erp-input-group">
              <label>Category</label>
              <select
                className="erp-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Electronics">Electronics</option>
                <option value="Audio">Audio</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Apparel">Apparel</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>Available Stock Units *</label>
              <input
                type="number"
                min="0"
                className="erp-input"
                required
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="erp-input-group">
              <label>Unit Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="erp-input"
                required
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="erp-modal-actions">
            <button type="button" className="erp-btn erp-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="erp-btn erp-btn-primary">
              {editItem ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
