import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, ShoppingBag, Plus } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenModal: (type: 'invoice' | 'inventory' | 'po' | 'shopify') => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onOpenModal }) => {
  const { connectedStore } = useAuth();

  return (
    <header className="db-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
          <ShoppingBag size={15} style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Connected Store:</span>
          <strong style={{ color: 'var(--text-bright)' }}>{connectedStore}</strong>
          <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginLeft: 4 }}></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => onOpenModal('invoice')} className="erp-btn erp-btn-secondary" style={{ fontSize: '0.85rem' }}>
          <Plus size={15} /> New Invoice
        </button>
        <button onClick={() => onOpenModal('inventory')} className="erp-btn erp-btn-secondary" style={{ fontSize: '0.85rem' }}>
          <Plus size={15} /> Add Product
        </button>

        <button onClick={onToggleTheme} className="erp-icon-btn" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
