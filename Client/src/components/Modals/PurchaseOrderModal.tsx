import React, { useState } from 'react';
import type { PurchaseOrder } from '../../types';
import { X, Truck } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (po: Partial<PurchaseOrder>) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ isOpen, onClose, onSave }) => {
  const [supplierName, setSupplierName] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Received'>('Pending');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !itemName || !quantity || !unitPrice) return;

    const poNum = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qty = parseInt(quantity, 10);
    const price = parseFloat(unitPrice);

    onSave({
      poNumber: poNum,
      supplierName,
      itemName,
      quantity: qty,
      unitPrice: price,
      totalCost: qty * price,
      status
    });

    setSupplierName('');
    setItemName('');
    setQuantity('');
    setUnitPrice('');
    setStatus('Pending');
    onClose();
  };

  return (
    <div className="erp-modal-overlay">
      <div className="erp-modal-card">
        <div className="erp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Truck size={20} style={{ color: '#06b6d4' }} />
            <h3>Issue Purchase Order Requisition</h3>
          </div>
          <button className="erp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="erp-form">
          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>Supplier / Vendor Name *</label>
              <input
                type="text"
                className="erp-input"
                required
                placeholder="e.g. DisplayTech Global"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
            <div className="erp-input-group">
              <label>Order Requisition Status</label>
              <select
                className="erp-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Pending' | 'Approved' | 'Received')}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Received">Received</option>
              </select>
            </div>
          </div>

          <div className="erp-input-group">
            <label>Item / Material Description *</label>
            <input
              type="text"
              className="erp-input"
              required
              placeholder="e.g. 27 IPS Display Panels"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                className="erp-input"
                required
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="erp-input-group">
              <label>Unit Cost ($ USD) *</label>
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
            <button type="submit" className="erp-btn erp-btn-primary">Submit Purchase Order</button>
          </div>
        </form>
      </div>
    </div>
  );
};
