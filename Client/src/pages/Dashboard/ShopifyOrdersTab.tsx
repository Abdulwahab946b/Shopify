import React, { useState } from 'react';
import type { ShopifyOrder } from '../../types';
import { ShoppingCart, Search, Filter, Plus, Eye, RefreshCw, Trash2, ShieldCheck, DollarSign, Clock } from 'lucide-react';

interface ShopifyOrdersTabProps {
  shopifyOrders: ShopifyOrder[];
  onOpenModal: () => void;
  onViewDetails: (order: ShopifyOrder) => void;
  onOpenStatusModal: (order: ShopifyOrder) => void;
  onDeleteOrder: (id: number) => void;
  onClearAllOrders: () => void;
}

export const ShopifyOrdersTab: React.FC<ShopifyOrdersTabProps> = ({
  shopifyOrders,
  onOpenModal,
  onViewDetails,
  onOpenStatusModal,
  onDeleteOrder,
  onClearAllOrders
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('All');

  const filtered = shopifyOrders.filter(ord => {
    const matchesSearch = ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ord.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFulfillment = fulfillmentFilter === 'All' || ord.fulfillmentStatus === fulfillmentFilter;
    return matchesSearch && matchesFulfillment;
  });

  const totalSales = shopifyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidSales = shopifyOrders.filter(o => o.financialStatus === 'Paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const unfulfilledCount = shopifyOrders.filter(o => o.fulfillmentStatus === 'Unfulfilled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>Shopify Store Webhook & Orders</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Real-time webhook ingestion for Shopify store transactions, line items, and fulfillment
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {shopifyOrders.length > 0 && (
            <button onClick={onClearAllOrders} className="erp-btn erp-btn-secondary" style={{ color: '#ef4444' }}>
              <Trash2 size={15} /> Clear All Orders
            </button>
          )}
          <button onClick={onOpenModal} className="erp-btn erp-btn-primary">
            <Plus size={16} /> Simulate Webhook Order
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Shopify Sales</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>${totalSales.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid Revenue Collected</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>${paidSales.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fulfillment Queue</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{unfulfilledCount} Unfulfilled</div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Webhooks Processed</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{shopifyOrders.length} Orders</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="erp-input with-icon"
            placeholder="Search order #, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="erp-select" value={fulfillmentFilter} onChange={(e) => setFulfillmentFilter(e.target.value)}>
            <option value="All">All Fulfillment</option>
            <option value="Unfulfilled">Unfulfilled</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      <div className="db-table-card">
        <table className="db-user-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Order Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No Shopify orders recorded.
                </td>
              </tr>
            ) : (
              filtered.map(ord => (
                <tr key={ord.id}>
                  <td><code style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{ord.orderNumber}</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customerEmail}</div>
                  </td>
                  <td>{ord.orderItems ? ord.orderItems.length : 0} items</td>
                  <td style={{ fontWeight: 700 }}>${ord.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className={`badge-pill badge-${ord.financialStatus.toLowerCase()}`}>
                      ● {ord.financialStatus}
                    </span>
                  </td>
                  <td>
                    <span className="badge-pill" style={{
                      background: ord.fulfillmentStatus === 'Fulfilled' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: ord.fulfillmentStatus === 'Fulfilled' ? '#10b981' : '#3b82f6'
                    }}>
                      ● {ord.fulfillmentStatus}
                    </span>
                  </td>
                  <td>{ord.createdDate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => onViewDetails(ord)} className="erp-icon-btn" title="View Order Details">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => onOpenStatusModal(ord)} className="erp-icon-btn" title="Update Status">
                        <RefreshCw size={15} />
                      </button>
                      <button onClick={() => onDeleteOrder(ord.id)} className="erp-icon-btn" style={{ color: '#ef4444' }} title="Delete Order">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
