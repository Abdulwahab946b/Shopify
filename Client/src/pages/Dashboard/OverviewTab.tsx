import React from 'react';
import type { Invoice, InventoryItem, PurchaseOrder, ShopifyOrder } from '../../types';
import { DollarSign, Clock, Package, Truck, TrendingUp, AlertTriangle } from 'lucide-react';

interface OverviewTabProps {
  invoices: Invoice[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  shopifyOrders: ShopifyOrder[];
  onOpenModal: (type: 'invoice' | 'inventory' | 'po' | 'shopify') => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  invoices,
  inventory,
  purchaseOrders,
  shopifyOrders,
  onOpenModal,
  onNavigateTab
}) => {
  const totalSalesRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingReceivables = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPoCosts = purchaseOrders.reduce((sum, po) => sum + po.totalCost, 0);
  const totalShopifySales = shopifyOrders.reduce((sum, s) => sum + s.totalAmount, 0);
  const lowStockItems = inventory.filter(i => i.quantity <= 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Welcome Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>
            Enterprise Resource Planning Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Real-time analytics, revenue flow, inventory health, and Shopify store performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onOpenModal('shopify')} className="erp-btn erp-btn-secondary">
            🛒 Simulate Order Webhook
          </button>
          <button onClick={() => onOpenModal('invoice')} className="erp-btn erp-btn-primary">
            + New Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="db-stats-grid">
        <div className="db-stat-card" onClick={() => onNavigateTab('invoices')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div className="db-stat-label">Total Invoiced Sales</div>
            <div className="db-stat-value">${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="db-stat-change positive">
              <TrendingUp size={12} /> {invoices.filter(i => i.status === 'Paid').length} Paid Invoices
            </div>
          </div>
        </div>

        <div className="db-stat-card" onClick={() => onNavigateTab('invoices')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="db-stat-label">Pending Receivables</div>
            <div className="db-stat-value">${pendingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="db-stat-change negative">
              {invoices.filter(i => i.status !== 'Paid').length} Pending / Overdue
            </div>
          </div>
        </div>

        <div className="db-stat-card" onClick={() => onNavigateTab('shopify')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="db-stat-label">Shopify Gross Sales</div>
            <div className="db-stat-value">${totalShopifySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="db-stat-change positive">
              {shopifyOrders.length} Store Orders Synced
            </div>
          </div>
        </div>

        <div className="db-stat-card" onClick={() => onNavigateTab('inventory')} style={{ cursor: 'pointer' }}>
          <div className="db-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Package size={22} />
          </div>
          <div>
            <div className="db-stat-label">Catalog Products</div>
            <div className="db-stat-value">{inventory.reduce((sum, item) => sum + item.quantity, 0)} Units</div>
            <div className="db-stat-change" style={{ color: lowStockItems.length > 0 ? '#ef4444' : '#10b981' }}>
              {lowStockItems.length > 0 ? `⚠️ ${lowStockItems.length} Low Stock Items` : '✓ Stock Levels Healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* SVG Performance Revenue Chart */}
        <div className="db-table-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Monthly Revenue vs Procurement Expenses</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>Live System Data</span>
          </div>

          <div style={{ width: '100%', height: 240, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="190" x2="600" y2="190" stroke="rgba(255,255,255,0.1)" />

              {/* Area 1 Revenue */}
              <path d="M 0 160 Q 150 70 300 90 T 600 30 L 600 190 L 0 190 Z" fill="url(#gradRevenue)" />
              <path d="M 0 160 Q 150 70 300 90 T 600 30" fill="none" stroke="#10b981" strokeWidth="3" />

              {/* Area 2 Expenses */}
              <path d="M 0 180 Q 150 140 300 150 T 600 110 L 600 190 L 0 190 Z" fill="url(#gradExpenses)" />
              <path d="M 0 180 Q 150 140 300 150 T 600 110" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" />
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }}></span>
              <span>Sales Revenue (${(totalSalesRevenue + totalShopifySales).toFixed(2)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }}></span>
              <span>PO Procurement Expenses (${totalPoCosts.toFixed(2)})</span>
            </div>
          </div>
        </div>

        {/* Capacity & Low Stock Card */}
        <div className="db-table-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Warehouse Capacity & Health</h3>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span>Storage Utilization:</span>
                <strong>68.4% Occupied</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '68.4%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 4 }}></div>
              </div>
            </div>

            <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Low Stock Inventory Warnings</h4>

            {lowStockItems.length === 0 ? (
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.85rem' }}>
                ✓ All catalog products maintain healthy stock margins.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lowStockItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                      <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>{item.quantity} units left</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => onNavigateTab('inventory')} className="erp-btn erp-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Manage Inventory Stock
          </button>
        </div>
      </div>
    </div>
  );
};
