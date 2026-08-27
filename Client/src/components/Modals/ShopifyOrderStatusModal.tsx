import React, { useState, useEffect } from 'react';
import type { ShopifyOrder } from '../../types';
import { X, RefreshCw } from 'lucide-react';

interface ShopifyOrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, status: { financialStatus?: string; fulfillmentStatus?: string }) => void;
  order: ShopifyOrder | null;
}

export const ShopifyOrderStatusModal: React.FC<ShopifyOrderStatusModalProps> = ({ isOpen, onClose, onSave, order }) => {
  const [financialStatus, setFinancialStatus] = useState('Paid');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('Unfulfilled');

  useEffect(() => {
    if (order) {
      setFinancialStatus(order.financialStatus);
      setFulfillmentStatus(order.fulfillmentStatus);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(order.id, { financialStatus, fulfillmentStatus });
    onClose();
  };

  return (
    <div className="erp-modal-overlay">
      <div className="erp-modal-card">
        <div className="erp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RefreshCw size={20} style={{ color: '#06b6d4' }} />
            <h3>Update Status for {order.orderNumber}</h3>
          </div>
          <button className="erp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="erp-form">
          <div className="erp-input-group">
            <label>Payment / Financial Status</label>
            <select
              className="erp-select"
              value={financialStatus}
              onChange={(e) => setFinancialStatus(e.target.value)}
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="Voided">Voided</option>
            </select>
          </div>

          <div className="erp-input-group">
            <label>Fulfillment Status</label>
            <select
              className="erp-select"
              value={fulfillmentStatus}
              onChange={(e) => setFulfillmentStatus(e.target.value)}
            >
              <option value="Unfulfilled">Unfulfilled</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Restocked">Restocked</option>
            </select>
          </div>

          <div className="erp-modal-actions">
            <button type="button" className="erp-btn erp-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="erp-btn erp-btn-primary">Update Order Status</button>
          </div>
        </form>
      </div>
    </div>
  );
};
