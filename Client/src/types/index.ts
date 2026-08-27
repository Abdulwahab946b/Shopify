export interface User {
  id?: number;
  username: string;
  email?: string;
  role?: string;
  authMethod?: string;
  createdDate?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  connectedStore: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  createdDate: string;
  description?: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lastUpdated?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  status: 'Pending' | 'Approved' | 'Received';
  orderDate: string;
}

export interface ShopifyOrderItem {
  id?: number;
  shopifyOrderId?: number;
  sku: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface ShopifyOrder {
  id: number;
  orderNumber: string;
  shopifyDomain: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  city: string;
  province: string;
  country: string;
  zipCode: string;
  subtotal: number;
  shippingCost: number;
  taxCost: number;
  totalAmount: number;
  financialStatus: string;
  fulfillmentStatus: string;
  orderNotes?: string;
  createdDate: string;
  orderItems: ShopifyOrderItem[];
}

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickActions?: { label: string; targetTab: string }[];
}

export interface ChatbotResponse {
  answer: string;
  quickActions?: { label: string; targetTab: string }[];
}
