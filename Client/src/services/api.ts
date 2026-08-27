import type { Invoice, InventoryItem, PurchaseOrder, ShopifyOrder, AuditLog, ChatbotResponse } from '../types';

const API_BASE_URL = '/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // --- Invoices ---
  async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const local = localStorage.getItem('erp_invoices');
    if (local) return JSON.parse(local);
    const mock: Invoice[] = [
      { id: 1, invoiceNumber: 'INV-2026-001', customerName: 'Apex Enterprise', amount: 4850.00, status: 'Paid', createdDate: '2026-08-20', description: 'Monthly Shopify ERP SaaS Subscription' },
      { id: 2, invoiceNumber: 'INV-2026-002', customerName: 'Starlight Retail LLC', amount: 1290.50, status: 'Pending', createdDate: '2026-08-22', description: 'Inventory sync integration module' },
      { id: 3, invoiceNumber: 'INV-2026-003', customerName: 'Nexus Global Logistics', amount: 8400.00, status: 'Overdue', createdDate: '2026-08-24', description: 'Enterprise Multi-warehouse License' },
      { id: 4, invoiceNumber: 'INV-2026-004', customerName: 'Vanguard Traders', amount: 3100.00, status: 'Paid', createdDate: '2026-08-10', description: 'Custom Webhook Pipeline Setup' }
    ];
    localStorage.setItem('erp_invoices', JSON.stringify(mock));
    return mock;
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(invoice)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const current = await this.getInvoices();
    const newInv: Invoice = {
      id: Date.now(),
      invoiceNumber: invoice.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: invoice.customerName || 'New Customer',
      amount: invoice.amount || 0,
      status: invoice.status || 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
      description: invoice.description || ''
    };
    const updated = [newInv, ...current];
    localStorage.setItem('erp_invoices', JSON.stringify(updated));
    return newInv;
  }

  async updateInvoiceStatus(id: number, status: 'Paid' | 'Pending' | 'Overdue'): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${id}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getInvoices();
    const updated = current.map(inv => inv.id === id ? { ...inv, status } : inv);
    localStorage.setItem('erp_invoices', JSON.stringify(updated));
    return true;
  }

  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const local = localStorage.getItem('erp_inventory');
    if (local) return JSON.parse(local);
    const mock: InventoryItem[] = [
      { id: 1, sku: 'PROD-APX-101', name: 'Wireless Ergonomic Keyboard', category: 'Electronics', quantity: 142, unitPrice: 89.99, lastUpdated: '2026-08-25' },
      { id: 2, sku: 'PROD-APX-102', name: 'UltraHD 27" USB-C Monitor', category: 'Electronics', quantity: 18, unitPrice: 349.50, lastUpdated: '2026-08-24' },
      { id: 3, sku: 'PROD-APX-103', name: 'Noise-Canceling Bluetooth Headphones', category: 'Audio', quantity: 5, unitPrice: 199.00, lastUpdated: '2026-08-26' },
      { id: 4, sku: 'PROD-APX-104', name: 'Smart RGB Desk Lamp', category: 'Office Supplies', quantity: 87, unitPrice: 45.00, lastUpdated: '2026-08-21' }
    ];
    localStorage.setItem('erp_inventory', JSON.stringify(mock));
    return mock;
  }

  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const current = await this.getInventory();
    const newItem: InventoryItem = {
      id: Date.now(),
      sku: item.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: item.name || 'New Item',
      category: item.category || 'General',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...current];
    localStorage.setItem('erp_inventory', JSON.stringify(updated));
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InventoryItem>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(item)
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getInventory();
    const updated = current.map(inv => inv.id === id ? { ...inv, ...item, lastUpdated: new Date().toISOString().split('T')[0] } : inv);
    localStorage.setItem('erp_inventory', JSON.stringify(updated));
    return true;
  }

  // --- Purchase Orders ---
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/purchase-orders`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const local = localStorage.getItem('erp_purchase_orders');
    if (local) return JSON.parse(local);
    const mock: PurchaseOrder[] = [
      { id: 1, poNumber: 'PO-2026-0891', supplierName: 'TechComponents Co.', itemName: 'Wireless Keyboard Chips & Switches', quantity: 500, unitPrice: 24.50, totalCost: 12250.00, status: 'Approved', orderDate: '2026-08-18' },
      { id: 2, poNumber: 'PO-2026-0892', supplierName: 'DisplayTech Global', itemName: '27" IPS Display Panels', quantity: 50, unitPrice: 180.00, totalCost: 9000.00, status: 'Pending', orderDate: '2026-08-23' },
      { id: 3, poNumber: 'PO-2026-0893', supplierName: 'SoundWave Audio Ltd.', itemName: 'Bluetooth Audio Drivers', quantity: 200, unitPrice: 35.00, totalCost: 7000.00, status: 'Received', orderDate: '2026-08-12' }
    ];
    localStorage.setItem('erp_purchase_orders', JSON.stringify(mock));
    return mock;
  }

  async createPurchaseOrder(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(po)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const current = await this.getPurchaseOrders();
    const qty = po.quantity || 1;
    const price = po.unitPrice || 0;
    const newPo: PurchaseOrder = {
      id: Date.now(),
      poNumber: po.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: po.supplierName || 'New Supplier',
      itemName: po.itemName || 'Raw Materials',
      quantity: qty,
      unitPrice: price,
      totalCost: qty * price,
      status: po.status || 'Pending',
      orderDate: new Date().toISOString().split('T')[0]
    };
    const updated = [newPo, ...current];
    localStorage.setItem('erp_purchase_orders', JSON.stringify(updated));
    return newPo;
  }

  async updatePoStatus(id: number, status: 'Pending' | 'Approved' | 'Received'): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getPurchaseOrders();
    const updated = current.map(po => po.id === id ? { ...po, status } : po);
    localStorage.setItem('erp_purchase_orders', JSON.stringify(updated));
    return true;
  }

  // --- Shopify Orders ---
  async getShopifyOrders(): Promise<ShopifyOrder[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/shopify-orders`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const local = localStorage.getItem('erp_shopify_orders');
    if (local) return JSON.parse(local);
    const mock: ShopifyOrder[] = [
      {
        id: 1,
        orderNumber: '#SHPFY-1001',
        shopifyDomain: 'demo-store.myshopify.com',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah.jenkins@example.com',
        shippingAddress: '742 Evergreen Terrace',
        city: 'Springfield',
        province: 'OR',
        country: 'US',
        zipCode: '97477',
        subtotal: 289.00,
        shippingCost: 15.00,
        taxCost: 24.30,
        totalAmount: 328.30,
        financialStatus: 'Paid',
        fulfillmentStatus: 'Unfulfilled',
        createdDate: '2026-08-26',
        orderItems: [
          { sku: 'PROD-APX-101', itemName: 'Wireless Ergonomic Keyboard', quantity: 1, unitPrice: 89.99 },
          { sku: 'PROD-APX-103', itemName: 'Noise-Canceling Bluetooth Headphones', quantity: 1, unitPrice: 199.00 }
        ]
      },
      {
        id: 2,
        orderNumber: '#SHPFY-1002',
        shopifyDomain: 'demo-store.myshopify.com',
        customerName: 'Marcus Vance',
        customerEmail: 'marcus.v@techcorp.io',
        shippingAddress: '100 Market St Suite 400',
        city: 'San Francisco',
        province: 'CA',
        country: 'US',
        zipCode: '94105',
        subtotal: 699.00,
        shippingCost: 0.00,
        taxCost: 59.40,
        totalAmount: 758.40,
        financialStatus: 'Paid',
        fulfillmentStatus: 'Fulfilled',
        createdDate: '2026-08-25',
        orderItems: [
          { sku: 'PROD-APX-102', itemName: 'UltraHD 27" USB-C Monitor', quantity: 2, unitPrice: 349.50 }
        ]
      }
    ];
    localStorage.setItem('erp_shopify_orders', JSON.stringify(mock));
    return mock;
  }

  async createShopifyOrder(order: Partial<ShopifyOrder>): Promise<ShopifyOrder> {
    try {
      const res = await fetch(`${API_BASE_URL}/shopify-orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(order)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const current = await this.getShopifyOrders();
    const newOrd: ShopifyOrder = {
      id: Date.now(),
      orderNumber: order.orderNumber || `#SHPFY-${Math.floor(1000 + Math.random() * 9000)}`,
      shopifyDomain: order.shopifyDomain || 'store.myshopify.com',
      customerName: order.customerName || 'Customer',
      customerEmail: order.customerEmail || 'customer@example.com',
      shippingAddress: order.shippingAddress || '123 Main St',
      city: order.city || 'San Jose',
      province: order.province || 'CA',
      country: order.country || 'US',
      zipCode: order.zipCode || '95134',
      subtotal: order.subtotal || order.totalAmount || 0,
      shippingCost: order.shippingCost || 0,
      taxCost: order.taxCost || 0,
      totalAmount: order.totalAmount || 0,
      financialStatus: order.financialStatus || 'Paid',
      fulfillmentStatus: order.fulfillmentStatus || 'Unfulfilled',
      createdDate: new Date().toISOString().split('T')[0],
      orderItems: order.orderItems || []
    };
    const updated = [newOrd, ...current];
    localStorage.setItem('erp_shopify_orders', JSON.stringify(updated));
    return newOrd;
  }

  async updateShopifyOrderStatus(id: number, status: { financialStatus?: string; fulfillmentStatus?: string }): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/shopify-orders/${id}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(status)
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getShopifyOrders();
    const updated = current.map(ord => ord.id === id ? {
      ...ord,
      financialStatus: status.financialStatus || ord.financialStatus,
      fulfillmentStatus: status.fulfillmentStatus || ord.fulfillmentStatus
    } : ord);
    localStorage.setItem('erp_shopify_orders', JSON.stringify(updated));
    return true;
  }

  async deleteShopifyOrder(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/shopify-orders/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getShopifyOrders();
    const updated = current.filter(o => o.id !== id);
    localStorage.setItem('erp_shopify_orders', JSON.stringify(updated));
    return true;
  }

  async clearAllShopifyOrders(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/shopify-orders`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    localStorage.setItem('erp_shopify_orders', JSON.stringify([]));
    return true;
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/audit-logs`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    const local = localStorage.getItem('erp_audit_logs');
    if (local) return JSON.parse(local);
    const mock: AuditLog[] = [
      { id: 1, username: 'admin', action: 'User Sign In', details: 'User logged in successfully from IP 192.168.1.45', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, username: 'admin', action: 'Create Invoice', details: 'Issued invoice INV-2026-001 ($4,850.00) to Apex Enterprise', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 3, username: 'Shopify-Webhook', action: 'Shopify Order Sync', details: 'Ingested Shopify Order #SHPFY-1001 ($328.30)', timestamp: new Date(Date.now() - 14400000).toISOString() }
    ];
    localStorage.setItem('erp_audit_logs', JSON.stringify(mock));
    return mock;
  }

  async deleteAuditLog(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/audit-logs/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getAuditLogs();
    const updated = current.filter(l => l.id !== id);
    localStorage.setItem('erp_audit_logs', JSON.stringify(updated));
    return true;
  }

  async clearAllAuditLogs(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/audit-logs`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    localStorage.setItem('erp_audit_logs', JSON.stringify([]));
    return true;
  }

  // --- AI Chatbot ---
  async askChatbot(prompt: string): Promise<ChatbotResponse> {
    try {
      const res = await fetch(`/Chatbot/Ask`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const json = await res.json();
        return { answer: json.response || json.answer, quickActions: json.quickActions };
      }
    } catch {
      // Fallback
    }

    const p = prompt.toLowerCase();
    if (p.includes('invoice') || p.includes('bill') || p.includes('sales')) {
      return {
        answer: 'You have **4 invoices** on record totaling **$17,640.50**. **$7,950.00** has been paid, while **$9,690.50** is currently pending or overdue.',
        quickActions: [{ label: '📑 View Invoices', targetTab: 'invoices' }]
      };
    }
    if (p.includes('inventory') || p.includes('stock') || p.includes('product')) {
      return {
        answer: 'Your catalog contains **4 active items**. Attention: **Noise-Canceling Bluetooth Headphones** has low stock (5 units remaining).',
        quickActions: [{ label: '📦 Open Inventory', targetTab: 'inventory' }]
      };
    }
    if (p.includes('shopify') || p.includes('order')) {
      return {
        answer: 'You have **2 Shopify store orders** totaling **$1,086.70**. Order **#SHPFY-1001** is currently unfulfilled.',
        quickActions: [{ label: '🛒 Shopify Orders', targetTab: 'shopify' }]
      };
    }

    return {
      answer: `Here is the ERP summary for your query: "${prompt}". All modules are functioning normally. Feel free to navigate using the sidebar or quick actions below!`,
      quickActions: [
        { label: '📊 Overview', targetTab: 'overview' },
        { label: '📑 Sales Invoices', targetTab: 'invoices' }
      ]
    };
  }
}

export const apiService = new ApiService();
