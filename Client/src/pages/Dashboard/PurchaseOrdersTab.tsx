import React, { useState } from 'react';
import type { PurchaseOrder } from '../../types';
import { Truck, Search, Filter, Plus } from 'lucide-react';

interface PurchaseOrdersTabProps {
  purchaseOrders: PurchaseOrder[];
  onOpenModal: () => void;
  onUpdateStatus: (id: number, status: 'Pending' | 'Approved' | 'Received') => void;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({ purchaseOrders, onOpenModal, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>Purchase Order Requisitions</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Issue vendor purchase orders, track raw material deliveries, and manage supplier accounts</p>
        </div>
        <button onClick={onOpenModal} className="erp-btn erp-btn-primary">
          <Plus size={16} /> Issue Purchase Order
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="erp-input with-icon"
            placeholder="Search PO #, supplier, or item description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Received">Received</option>
          </select>
        </div>
      </div>

      <div className="db-table-card">
        <table className="db-user-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Supplier / Vendor</th>
              <th>Item / Material</th>
              <th>Quantity</th>
              <th>Unit Cost ($ USD)</th>
              <th>Total Requisition</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No purchase orders found matching search.
                </td>
              </tr>
            ) : (
              filtered.map(po => (
                <tr key={po.id}>
                  <td><code style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{po.poNumber}</code></td>
                  <td style={{ fontWeight: 600 }}>{po.supplierName}</td>
                  <td>{po.itemName}</td>
                  <td>{po.quantity}</td>
                  <td>${po.unitPrice.toFixed(2)}</td>
                  <td style={{ fontWeight: 700 }}>${po.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`badge-pill badge-${po.status.toLowerCase()}`}>
                      ● {po.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <select
                      className="erp-select-sm"
                      value={po.status}
                      onChange={(e) => onUpdateStatus(po.id, e.target.value as 'Pending' | 'Approved' | 'Received')}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approve PO</option>
                      <option value="Received">Mark Received</option>
                    </select>
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
