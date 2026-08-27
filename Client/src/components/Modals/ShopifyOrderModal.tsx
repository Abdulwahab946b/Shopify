import React, { useState } from 'react';
import type { ShopifyOrder, ShopifyOrderItem } from '../../types';
import { X, ShoppingBag, Plus, Trash2 } from 'lucide-react';

interface ShopifyOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Partial<ShopifyOrder>) => void;
}

export const ShopifyOrderModal: React.FC<ShopifyOrderModalProps> = ({ isOpen, onClose, onSave }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [financialStatus, setFinancialStatus] = useState('Paid');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('Unfulfilled');
  const [items, setItems] = useState<Partial<ShopifyOrderItem>[]>([
    { sku: 'PROD-APX-101', itemName: 'Wireless Ergonomic Keyboard', quantity: 1, unitPrice: 89.99 }
  ]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems(prev => [...prev, { sku: 'PROD-NEW', itemName: 'Sample Product', quantity: 1, unitPrice: 49.99 }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;

    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitPrice || 0)), 0);
    const tax = subtotal * 0.08;
    const shipping = 10.00;
    const total = subtotal + tax + shipping;

    onSave({
      orderNumber: `#SHPFY-${Math.floor(1000 + Math.random() * 9000)}`,
      shopifyDomain: 'demo-store.myshopify.com',
      customerName,
      customerEmail,
      shippingAddress: shippingAddress || '742 Evergreen Terrace',
      city: 'Springfield',
      province: 'OR',
      country: 'US',
      zipCode: '97477',
      subtotal,
      shippingCost: shipping,
      taxCost: tax,
      totalAmount: total,
      financialStatus,
      fulfillmentStatus,
      createdDate: new Date().toISOString().split('T')[0],
      orderItems: items as ShopifyOrderItem[]
    });

    onClose();
  };

  return (
    <div className="erp-modal-overlay">
      <div className="erp-modal-card" style={{ maxWidth: 650 }}>
        <div className="erp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={20} style={{ color: '#10b981' }} />
            <h3>Simulate Shopify Order Webhook</h3>
          </div>
          <button className="erp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="erp-form">
          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>Customer Full Name *</label>
              <input
                type="text"
                className="erp-input"
                required
                placeholder="Sarah Jenkins"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="erp-input-group">
              <label>Customer Email *</label>
              <input
                type="email"
                className="erp-input"
                required
                placeholder="sarah@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="erp-input-group">
            <label>Shipping Address</label>
            <input
              type="text"
              className="erp-input"
              placeholder="742 Evergreen Terrace, Springfield OR"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </div>

          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>Financial Status</label>
              <select className="erp-select" value={financialStatus} onChange={(e) => setFinancialStatus(e.target.value)}>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <div className="erp-input-group">
              <label>Fulfillment Status</label>
              <select className="erp-select" value={fulfillmentStatus} onChange={(e) => setFulfillmentStatus(e.target.value)}>
                <option value="Unfulfilled">Unfulfilled</option>
                <option value="Fulfilled">Fulfilled</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Line Items</h4>
              <button type="button" onClick={addItem} className="erp-btn erp-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                <Plus size={12} /> Add Line Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="SKU"
                  className="erp-input"
                  style={{ width: 110, fontSize: '0.8rem' }}
                  value={item.sku}
                  onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Product Title"
                  className="erp-input"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  value={item.itemName}
                  onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  className="erp-input"
                  style={{ width: 60, fontSize: '0.8rem' }}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10))}
                />
                <input
                  type="number"
                  placeholder="Price"
                  className="erp-input"
                  style={{ width: 80, fontSize: '0.8rem' }}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value))}
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="erp-icon-btn" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="erp-modal-actions">
            <button type="button" className="erp-btn erp-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="erp-btn erp-btn-primary">Process Order Webhook</button>
          </div>
        </form>
      </div>
    </div>
  );
};
