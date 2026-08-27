import React, { useState } from 'react';
import type { Invoice } from '../../types';
import { FileText, Search, Filter, Plus } from 'lucide-react';

interface InvoicesTabProps {
  invoices: Invoice[];
  onOpenModal: () => void;
  onUpdateStatus: (id: number, status: 'Paid' | 'Pending' | 'Overdue') => void;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ invoices, onOpenModal, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv.description && inv.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>Sales & Accounts Receivables</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Manage sales invoices, customer billing status, and accounts receivables</p>
        </div>
        <button onClick={onOpenModal} className="erp-btn erp-btn-primary">
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="erp-input with-icon"
            placeholder="Search invoice # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="db-table-card">
        <table className="db-user-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer / Enterprise</th>
              <th>Description</th>
              <th>Issue Date</th>
              <th>Amount ($ USD)</th>
              <th>Payment Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No invoices matching your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id}>
                  <td><code style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{inv.invoiceNumber}</code></td>
                  <td style={{ fontWeight: 600 }}>{inv.customerName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{inv.description || 'N/A'}</td>
                  <td>{inv.createdDate}</td>
                  <td style={{ fontWeight: 700 }}>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`badge-pill badge-${inv.status.toLowerCase()}`}>
                      ● {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <select
                      className="erp-select-sm"
                      value={inv.status}
                      onChange={(e) => onUpdateStatus(inv.id, e.target.value as 'Paid' | 'Pending' | 'Overdue')}
                    >
                      <option value="Pending">Mark Pending</option>
                      <option value="Paid">Mark Paid</option>
                      <option value="Overdue">Mark Overdue</option>
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
