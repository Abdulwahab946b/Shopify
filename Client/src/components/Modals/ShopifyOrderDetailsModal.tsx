import React from 'react';
import type { ShopifyOrder } from '../../types';
import { X, ShoppingBag, MapPin, Mail, Calendar, CreditCard, Truck } from 'lucide-react';

interface ShopifyOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ShopifyOrder | null;
}

export const ShopifyOrderDetailsModal: React.FC<ShopifyOrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="erp-modal-overlay">
      <div className="erp-modal-card" style={{ maxWidth: 650 }}>
        <div className="erp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={20} style={{ color: '#10b981' }} />
            <h3>Shopify Order {order.orderNumber}</h3>
          </div>
          <button className="erp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Customer Details</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.customerName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <Mail size={12} /> {order.customerEmail}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Shipping Address</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.85rem' }}>
                <MapPin size={14} style={{ marginTop: 2, color: 'var(--accent-cyan)' }} />
                <div>
                  {order.shippingAddress}<br />
                  {order.city}, {order.province} {order.zipCode}, {order.country}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> Order Date
              </div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{order.createdDate}</div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CreditCard size={12} /> Payment Status
              </div>
              <div style={{ fontWeight: 700, marginTop: 4, color: order.financialStatus === 'Paid' ? '#10b981' : '#f59e0b' }}>
                {order.financialStatus}
              </div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Truck size={12} /> Fulfillment
              </div>
              <div style={{ fontWeight: 700, marginTop: 4, color: order.fulfillmentStatus === 'Fulfilled' ? '#10b981' : '#3b82f6' }}>
                {order.fulfillmentStatus}
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700 }}>Order Items</h4>
          <table className="db-user-table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems && order.orderItems.map((item, idx) => (
                <tr key={idx}>
                  <td><code>{item.sku}</code></td>
                  <td>{item.itemName}</td>
                  <td>{item.quantity}</td>
                  <td>${item.unitPrice.toFixed(2)}</td>
                  <td>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: '0.88rem' }}>
            <div>Subtotal: <strong>${order.subtotal.toFixed(2)}</strong></div>
            <div>Shipping: <strong>${order.shippingCost.toFixed(2)}</strong></div>
            <div>Tax: <strong>${order.taxCost.toFixed(2)}</strong></div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
              Total: ${order.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="erp-modal-actions">
          <button type="button" className="erp-btn erp-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
