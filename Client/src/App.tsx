import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { apiService } from './services/api';
import type { Invoice, InventoryItem, PurchaseOrder, ShopifyOrder, AuditLog } from './types';

// Layout & Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatbotWidget } from './components/ChatbotWidget';

// Modals
import { InvoiceModal } from './components/Modals/InvoiceModal';
import { InventoryModal } from './components/Modals/InventoryModal';
import { PurchaseOrderModal } from './components/Modals/PurchaseOrderModal';
import { ShopifyOrderModal } from './components/Modals/ShopifyOrderModal';
import { ShopifyOrderDetailsModal } from './components/Modals/ShopifyOrderDetailsModal';
import { ShopifyOrderStatusModal } from './components/Modals/ShopifyOrderStatusModal';

// Pages & Tabs
import { AuthPage } from './pages/AuthPage';
import { OverviewTab } from './pages/Dashboard/OverviewTab';
import { InvoicesTab } from './pages/Dashboard/InvoicesTab';
import { InventoryTab } from './pages/Dashboard/InventoryTab';
import { PurchaseOrdersTab } from './pages/Dashboard/PurchaseOrdersTab';
import { ShopifyOrdersTab } from './pages/Dashboard/ShopifyOrdersTab';
import { AuditLogsTab } from './pages/Dashboard/AuditLogsTab';

const DashboardContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState('overview');

  // ERP State Data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [shopifyOrders, setShopifyOrders] = useState<ShopifyOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal Controls
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  // Shopify Modal Controls
  const [isShopifyModalOpen, setIsShopifyModalOpen] = useState(false);
  const [selectedShopifyOrderDetails, setSelectedShopifyOrderDetails] = useState<ShopifyOrder | null>(null);
  const [selectedShopifyOrderStatus, setSelectedShopifyOrderStatus] = useState<ShopifyOrder | null>(null);

  // Load Data on Auth
  useEffect(() => {
    if (isAuthenticated) {
      loadAllErpData();
    }
  }, [isAuthenticated]);

  const loadAllErpData = async () => {
    const [inv, stock, pos, shopify, logs] = await Promise.all([
      apiService.getInvoices(),
      apiService.getInventory(),
      apiService.getPurchaseOrders(),
      apiService.getShopifyOrders(),
      apiService.getAuditLogs()
    ]);

    setInvoices(inv);
    setInventory(stock);
    setPurchaseOrders(pos);
    setShopifyOrders(shopify);
    setAuditLogs(logs);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Handlers
  const handleCreateInvoice = async (invoiceData: Partial<Invoice>) => {
    const newInv = await apiService.createInvoice(invoiceData);
    setInvoices(prev => [newInv, ...prev]);
    showToast(`Invoice ${newInv.invoiceNumber} created successfully!`, 'success');
  };

  const handleUpdateInvoiceStatus = async (id: number, status: 'Paid' | 'Pending' | 'Overdue') => {
    await apiService.updateInvoiceStatus(id, status);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    showToast(`Invoice status updated to ${status}.`, 'info');
  };

  const handleSaveInventory = async (itemData: Partial<InventoryItem>) => {
    if (editingInventoryItem) {
      await apiService.updateInventoryItem(editingInventoryItem.id, itemData);
      showToast(`Updated product "${itemData.name}".`, 'info');
    } else {
      const newItem = await apiService.createInventoryItem(itemData);
      showToast(`Product "${newItem.name}" added to catalog!`, 'success');
    }
    const updatedStock = await apiService.getInventory();
    setInventory(updatedStock);
    setEditingInventoryItem(null);
  };

  const handleCreatePo = async (poData: Partial<PurchaseOrder>) => {
    const newPo = await apiService.createPurchaseOrder(poData);
    setPurchaseOrders(prev => [newPo, ...prev]);
    showToast(`Purchase Order ${newPo.poNumber} issued!`, 'success');
  };

  const handleUpdatePoStatus = async (id: number, status: 'Pending' | 'Approved' | 'Received') => {
    await apiService.updatePoStatus(id, status);
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status } : po));
    showToast(`PO status updated to ${status}.`, 'info');
  };

  const handleCreateShopifyOrder = async (orderData: Partial<ShopifyOrder>) => {
    const newOrd = await apiService.createShopifyOrder(orderData);
    setShopifyOrders(prev => [newOrd, ...prev]);
    showToast(`Shopify Order ${newOrd.orderNumber} ingested!`, 'success');
  };

  const handleUpdateShopifyOrderStatus = async (id: number, status: { financialStatus?: string; fulfillmentStatus?: string }) => {
    await apiService.updateShopifyOrderStatus(id, status);
    setShopifyOrders(prev => prev.map(ord => ord.id === id ? {
      ...ord,
      financialStatus: status.financialStatus || ord.financialStatus,
      fulfillmentStatus: status.fulfillmentStatus || ord.fulfillmentStatus
    } : ord));
    showToast(`Shopify order status updated.`, 'info');
  };

  const handleDeleteShopifyOrder = async (id: number) => {
    await apiService.deleteShopifyOrder(id);
    setShopifyOrders(prev => prev.filter(o => o.id !== id));
    showToast(`Shopify order deleted.`, 'info');
  };

  const handleClearAllShopifyOrders = async () => {
    await apiService.clearAllShopifyOrders();
    setShopifyOrders([]);
    showToast(`Shopify orders history cleared.`, 'info');
  };

  const handleDeleteAuditLog = async (id: number) => {
    await apiService.deleteAuditLog(id);
    setAuditLogs(prev => prev.filter(l => l.id !== id));
    showToast(`Audit log removed.`, 'info');
  };

  const handleClearAllAuditLogs = async () => {
    await apiService.clearAllAuditLogs();
    setAuditLogs([]);
    showToast(`Audit logs history cleared.`, 'info');
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="db-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      <div className="db-main">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenModal={(type) => {
            if (type === 'invoice') setIsInvoiceModalOpen(true);
            if (type === 'inventory') { setEditingInventoryItem(null); setIsInventoryModalOpen(true); }
            if (type === 'po') setIsPoModalOpen(true);
            if (type === 'shopify') setIsShopifyModalOpen(true);
          }}
        />

        <main className="db-content">
          {activeTab === 'overview' && (
            <OverviewTab
              invoices={invoices}
              inventory={inventory}
              purchaseOrders={purchaseOrders}
              shopifyOrders={shopifyOrders}
              onOpenModal={(type) => {
                if (type === 'invoice') setIsInvoiceModalOpen(true);
                if (type === 'inventory') { setEditingInventoryItem(null); setIsInventoryModalOpen(true); }
                if (type === 'po') setIsPoModalOpen(true);
                if (type === 'shopify') setIsShopifyModalOpen(true);
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesTab
              invoices={invoices}
              onOpenModal={() => setIsInvoiceModalOpen(true)}
              onUpdateStatus={handleUpdateInvoiceStatus}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              onOpenModal={(item) => {
                setEditingInventoryItem(item || null);
                setIsInventoryModalOpen(true);
              }}
            />
          )}

          {activeTab === 'purchase-orders' && (
            <PurchaseOrdersTab
              purchaseOrders={purchaseOrders}
              onOpenModal={() => setIsPoModalOpen(true)}
              onUpdateStatus={handleUpdatePoStatus}
            />
          )}

          {activeTab === 'shopify' && (
            <ShopifyOrdersTab
              shopifyOrders={shopifyOrders}
              onOpenModal={() => setIsShopifyModalOpen(true)}
              onViewDetails={(order) => setSelectedShopifyOrderDetails(order)}
              onOpenStatusModal={(order) => setSelectedShopifyOrderStatus(order)}
              onDeleteOrder={handleDeleteShopifyOrder}
              onClearAllOrders={handleClearAllShopifyOrders}
            />
          )}

          {activeTab === 'audits' && (
            <AuditLogsTab
              auditLogs={auditLogs}
              onDeleteLog={handleDeleteAuditLog}
              onClearAllLogs={handleClearAllAuditLogs}
            />
          )}
        </main>
      </div>

      <ChatbotWidget onNavigateTab={setActiveTab} />

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSave={handleCreateInvoice}
      />

      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onSave={handleSaveInventory}
        editItem={editingInventoryItem}
      />

      <PurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        onSave={handleCreatePo}
      />

      <ShopifyOrderModal
        isOpen={isShopifyModalOpen}
        onClose={() => setIsShopifyModalOpen(false)}
        onSave={handleCreateShopifyOrder}
      />

      <ShopifyOrderDetailsModal
        isOpen={!!selectedShopifyOrderDetails}
        onClose={() => setSelectedShopifyOrderDetails(null)}
        order={selectedShopifyOrderDetails}
      />

      <ShopifyOrderStatusModal
        isOpen={!!selectedShopifyOrderStatus}
        onClose={() => setSelectedShopifyOrderStatus(null)}
        onSave={handleUpdateShopifyOrderStatus}
        order={selectedShopifyOrderStatus}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </AuthProvider>
  );
}
