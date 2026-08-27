import React, { useState } from 'react';
import type { AuditLog } from '../../types';
import { ShieldAlert, Search, Trash2, Clock } from 'lucide-react';

interface AuditLogsTabProps {
  auditLogs: AuditLog[];
  onDeleteLog: (id: number) => void;
  onClearAllLogs: () => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ auditLogs, onDeleteLog, onClearAllLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = auditLogs.filter(log => {
    return log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.details.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>System Activity & Security Audit Trail</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Real-time audit logging for user access, invoice creation, and Shopify integration events</p>
        </div>
        {auditLogs.length > 0 && (
          <button onClick={onClearAllLogs} className="erp-btn erp-btn-secondary" style={{ color: '#ef4444' }}>
            <Trash2 size={15} /> Clear Audit History
          </button>
        )}
      </div>

      <div className="input-icon-wrap">
        <Search size={18} className="input-icon" />
        <input
          type="text"
          className="erp-input with-icon"
          placeholder="Search activity, username, or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="db-table-card">
        <table className="db-user-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User / Source</th>
              <th>Action</th>
              <th>Activity Details</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No audit logs match your search.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td><code style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{log.username}</code></td>
                  <td><span className="badge-pill" style={{ background: 'rgba(255,255,255,0.05)' }}>{log.action}</span></td>
                  <td style={{ fontSize: '0.88rem' }}>{log.details}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => onDeleteLog(log.id)} className="erp-icon-btn" style={{ color: '#ef4444' }} title="Delete Log">
                      <Trash2 size={15} />
                    </button>
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
