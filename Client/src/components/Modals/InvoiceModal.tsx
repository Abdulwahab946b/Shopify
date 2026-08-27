import React, { useState } from 'react';
import type { Invoice } from '../../types';
import { X, FileText } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Partial<Invoice>) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSave }) => {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    onSave({
      invoiceNumber: invoiceNum,
      customerName,
      amount: parseFloat(amount),
      status,
      description
    });

    setCustomerName('');
    setAmount('');
    setStatus('Pending');
    setDescription('');
    onClose();
  };

  return (
    <div className="erp-modal-overlay">
      <div className="erp-modal-card">
        <div className="erp-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={20} style={{ color: '#4f46e5' }} />
            <h3>Create Customer Invoice</h3>
          </div>
          <button className="erp-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="erp-form">
          <div className="erp-input-group">
            <label>Customer / Enterprise Name *</label>
            <input
              type="text"
              className="erp-input"
              required
              placeholder="e.g. Apex Global Trading"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="erp-grid-half">
            <div className="erp-input-group">
              <label>Amount ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="erp-input"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="erp-input-group">
              <label>Payment Status</label>
              <select
                className="erp-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Paid' | 'Pending' | 'Overdue')}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="erp-input-group">
            <label>Invoice Description / Services</label>
            <textarea
              className="erp-textarea"
              rows={3}
              placeholder="Provide invoice line item details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="erp-modal-actions">
            <button type="button" className="erp-btn erp-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="erp-btn erp-btn-primary">Generate Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
};
