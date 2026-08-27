import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Package, Truck, ShoppingCart, ShieldAlert, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Sales & Invoices', icon: FileText },
    { id: 'inventory', label: 'Inventory Catalog', icon: Package },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: Truck },
    { id: 'shopify', label: 'Shopify Store Orders', icon: ShoppingCart },
    { id: 'audits', label: 'System Audit Logs', icon: ShieldAlert }
  ];

  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-brand" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>
          🛒
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>Copilot ERP</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Shopify Operating System</span>
        </div>
      </div>

      <div style={{ padding: '0 1rem 1rem 1rem' }}>
        <div className="db-user-badge" style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username || 'Admin'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email || 'admin@copilot.erp'}</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '0 0.75rem' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`db-sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          JWT Auth Session Active
        </div>
        <button onClick={logout} className="erp-btn erp-btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
