// ============================================================================
// IMS 2.0 - Mock Data Context
// ============================================================================
// Provides editable, workable mock data for all modules
// This can be replaced with real API calls when backend is connected

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  Customer,
  Order,
  OrderStatus,
  PaymentStatus,
  Payment,
  WorkshopJob,
  JobStatus,
  JobPriority,
  StockUnit,
  Product,
  ProductCategory,
  Prescription,
  Task,
  TaskPriority,
  TaskStatus,
  Attendance,
  Leave,
} from '../types';

// ============================================================================
// Initial Mock Data
// ============================================================================

const initialCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    customerType: 'B2C',
    address: { line1: '123 Park Street', city: 'Kolkata', state: 'West Bengal', pincode: '700001', country: 'India' },
    patients: [
      { id: 'pat-001', customerId: 'cust-001', name: 'Rajesh Kumar', relation: 'Self' },
      { id: 'pat-002', customerId: 'cust-001', name: 'Meera Kumar', relation: 'Wife' },
    ],
    createdAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'cust-002',
    name: 'Sunita Sharma',
    phone: '9988776655',
    email: 'sunita@example.com',
    customerType: 'B2C',
    address: { line1: '45 Lake Gardens', city: 'Kolkata', state: 'West Bengal', pincode: '700045', country: 'India' },
    patients: [
      { id: 'pat-003', customerId: 'cust-002', name: 'Sunita Sharma', relation: 'Self' },
    ],
    createdAt: '2024-08-20T14:30:00Z',
  },
  {
    id: 'cust-003',
    name: 'Vikram Mehta',
    phone: '9123456789',
    email: 'vikram@bizco.com',
    customerType: 'B2B',
    gst: { gstin: '19AABCU9603R1ZM', legalName: 'Bizco Enterprises' },
    address: { line1: 'Office 301, Commerce House', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
    patients: [],
    createdAt: '2024-10-05T09:15:00Z',
  },
  {
    id: 'cust-004',
    name: 'Priya Patel',
    phone: '9234567890',
    email: 'priya.patel@gmail.com',
    customerType: 'B2C',
    address: { line1: '78 Salt Lake', city: 'Kolkata', state: 'West Bengal', pincode: '700091', country: 'India' },
    patients: [
      { id: 'pat-004', customerId: 'cust-004', name: 'Priya Patel', relation: 'Self' },
      { id: 'pat-005', customerId: 'cust-004', name: 'Rohan Patel', relation: 'Son' },
    ],
    createdAt: '2024-11-10T16:45:00Z',
  },
];

const initialOrders: Order[] = [
  {
    id: 'ord-001',
    orderNumber: 'BV-KOL-001-2501-0001',
    storeId: 'BV-KOL-001',
    customerId: 'cust-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '9876543210',
    patientId: 'pat-001',
    patientName: 'Rajesh Kumar',
    items: [
      { id: 'item-001', itemType: 'FRAME', productId: 'prod-001', productName: 'Ray-Ban RB5154 Clubmaster', sku: 'RB5154-BLK', quantity: 1, unitPrice: 6890, discountPercent: 0, discountAmount: 0, finalPrice: 6890 },
      { id: 'item-002', itemType: 'OPTICAL_LENS', productId: 'prod-002', productName: 'Essilor Crizal Prevencia (Pair)', sku: 'ESS-CRZ-PRV', quantity: 1, unitPrice: 7000, discountPercent: 0, discountAmount: 0, finalPrice: 7000, prescriptionId: 'rx-001' },
    ],
    payments: [
      { id: 'pay-001', mode: 'CARD', amount: 15210, reference: 'TXN123456', paidAt: '2025-01-18T10:35:00Z' },
    ],
    subtotal: 13890,
    totalDiscount: 1000,
    taxAmount: 2320,
    grandTotal: 15210,
    amountPaid: 15210,
    balanceDue: 0,
    orderStatus: 'DELIVERED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    createdBy: 'user-001',
    createdAt: '2025-01-18T10:30:00Z',
    deliveredAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'ord-002',
    orderNumber: 'BV-KOL-001-2501-0002',
    storeId: 'BV-KOL-001',
    customerId: 'cust-002',
    customerName: 'Sunita Sharma',
    customerPhone: '9988776655',
    patientId: 'pat-003',
    patientName: 'Sunita Sharma',
    items: [
      { id: 'item-003', itemType: 'OPTICAL_LENS', productId: 'prod-003', productName: 'Zeiss DriveSafe (Pair)', sku: 'ZSS-DRV-SF', quantity: 1, unitPrice: 15000, discountPercent: 10, discountAmount: 1500, finalPrice: 13500, prescriptionId: 'rx-002' },
      { id: 'item-004', itemType: 'FRAME', productId: 'prod-004', productName: 'Titan Frame Premium', sku: 'TIT-PRM-001', quantity: 1, unitPrice: 8500, discountPercent: 5, discountAmount: 425, finalPrice: 8075 },
    ],
    payments: [
      { id: 'pay-002', mode: 'CASH', amount: 10000, paidAt: '2025-01-19T15:50:00Z' },
    ],
    subtotal: 23500,
    totalDiscount: 2000,
    taxAmount: 3870,
    grandTotal: 25370,
    amountPaid: 10000,
    balanceDue: 15370,
    orderStatus: 'READY' as OrderStatus,
    paymentStatus: 'PARTIAL' as PaymentStatus,
    createdBy: 'user-002',
    createdAt: '2025-01-19T15:45:00Z',
  },
  {
    id: 'ord-003',
    orderNumber: 'BV-KOL-001-2501-0003',
    storeId: 'BV-KOL-001',
    customerId: 'cust-003',
    customerName: 'Vikram Mehta',
    customerPhone: '9123456789',
    items: [
      { id: 'item-005', itemType: 'WATCH', productId: 'prod-005', productName: 'Apple Watch Series 9', sku: 'APL-WCH-S9', quantity: 1, unitPrice: 42900, discountPercent: 0, discountAmount: 0, finalPrice: 42900 },
    ],
    payments: [
      { id: 'pay-003', mode: 'UPI', amount: 50622, reference: 'UPI/123/456', paidAt: '2025-01-20T11:05:00Z' },
    ],
    subtotal: 42900,
    totalDiscount: 0,
    taxAmount: 7722,
    grandTotal: 50622,
    amountPaid: 50622,
    balanceDue: 0,
    orderStatus: 'DELIVERED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    createdBy: 'user-001',
    createdAt: '2025-01-20T11:00:00Z',
    deliveredAt: '2025-01-20T11:30:00Z',
  },
  {
    id: 'ord-004',
    orderNumber: 'BV-KOL-001-2501-0004',
    storeId: 'BV-KOL-001',
    customerId: 'cust-004',
    customerName: 'Priya Patel',
    customerPhone: '9234567890',
    patientId: 'pat-004',
    patientName: 'Priya Patel',
    items: [
      { id: 'item-006', itemType: 'FRAME', productId: 'prod-006', productName: 'Oakley Holbrook', sku: 'OAK-HLB-001', quantity: 1, unitPrice: 12500, discountPercent: 0, discountAmount: 0, finalPrice: 12500 },
      { id: 'item-007', itemType: 'OPTICAL_LENS', productId: 'prod-007', productName: 'Hoya Blue Control (Pair)', sku: 'HOY-BC-001', quantity: 1, unitPrice: 5500, discountPercent: 0, discountAmount: 0, finalPrice: 5500, prescriptionId: 'rx-003' },
    ],
    payments: [],
    subtotal: 18000,
    totalDiscount: 0,
    taxAmount: 3240,
    grandTotal: 21240,
    amountPaid: 0,
    balanceDue: 21240,
    orderStatus: 'IN_PROGRESS' as OrderStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    createdBy: 'user-002',
    createdAt: '2025-01-21T09:00:00Z',
  },
];

const initialWorkshopJobs: WorkshopJob[] = [
  {
    id: 'job-001',
    jobNumber: 'JOB-2501-0001',
    jobType: 'FITTING',
    orderId: 'ord-001',
    orderNumber: 'BV-KOL-001-2501-0001',
    customerId: 'cust-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '9876543210',
    storeId: 'BV-KOL-001',
    frameBarcode: 'RB5154-001',
    frameName: 'Ray-Ban RB5154 Clubmaster',
    prescriptionId: 'rx-001',
    status: 'DELIVERED' as JobStatus,
    priority: 'NORMAL' as JobPriority,
    assignedTo: 'user-003',
    assignedName: 'Workshop Tech 1',
    expectedDate: '2025-01-20',
    promisedDate: '2025-01-20',
    completedAt: '2025-01-20T12:00:00Z',
    deliveredAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'job-002',
    jobNumber: 'JOB-2501-0002',
    jobType: 'FITTING',
    orderId: 'ord-002',
    orderNumber: 'BV-KOL-001-2501-0002',
    customerId: 'cust-002',
    customerName: 'Sunita Sharma',
    customerPhone: '9988776655',
    storeId: 'BV-KOL-001',
    frameBarcode: 'TIT-PRM-001',
    frameName: 'Titan Frame Premium',
    prescriptionId: 'rx-002',
    status: 'READY' as JobStatus,
    priority: 'EXPRESS' as JobPriority,
    assignedTo: 'user-003',
    assignedName: 'Workshop Tech 1',
    expectedDate: '2025-01-21',
    promisedDate: '2025-01-21',
    completedAt: '2025-01-21T10:00:00Z',
  },
  {
    id: 'job-003',
    jobNumber: 'JOB-2501-0003',
    jobType: 'FITTING',
    orderId: 'ord-004',
    orderNumber: 'BV-KOL-001-2501-0004',
    customerId: 'cust-004',
    customerName: 'Priya Patel',
    customerPhone: '9234567890',
    storeId: 'BV-KOL-001',
    frameBarcode: 'OAK-HLB-001',
    frameName: 'Oakley Holbrook',
    prescriptionId: 'rx-003',
    status: 'IN_PROGRESS' as JobStatus,
    priority: 'NORMAL' as JobPriority,
    assignedTo: 'user-004',
    assignedName: 'Workshop Tech 2',
    expectedDate: '2025-01-22',
    promisedDate: '2025-01-22',
  },
];

const initialProducts: Product[] = [
  { id: 'prod-001', sku: 'RB5154-BLK', category: 'FRAME', brand: 'Ray-Ban', model: 'RB5154', variant: 'Black', name: 'Ray-Ban RB5154 Clubmaster', description: 'Classic clubmaster frame', mrp: 7990, offerPrice: 6890, discountCategory: 'PREMIUM', hsnCode: '9004', gstRate: 18, attributes: { color: 'Black', size: '51-21-145' }, images: [], isActive: true, createdAt: '2024-01-01' },
  { id: 'prod-002', sku: 'ESS-CRZ-PRV', category: 'OPTICAL_LENS', brand: 'Essilor', model: 'Crizal', variant: 'Prevencia', name: 'Essilor Crizal Prevencia (Pair)', description: 'Blue light protection lens', mrp: 8000, offerPrice: 7000, discountCategory: 'PREMIUM', hsnCode: '9001', gstRate: 18, attributes: { index: '1.56' }, images: [], isActive: true, createdAt: '2024-01-01' },
  { id: 'prod-003', sku: 'ZSS-DRV-SF', category: 'OPTICAL_LENS', brand: 'Zeiss', model: 'DriveSafe', variant: 'Standard', name: 'Zeiss DriveSafe (Pair)', description: 'Driving optimized lens', mrp: 18000, offerPrice: 15000, discountCategory: 'LUXURY', hsnCode: '9001', gstRate: 18, attributes: { index: '1.60' }, images: [], isActive: true, createdAt: '2024-01-01' },
  { id: 'prod-004', sku: 'TIT-PRM-001', category: 'FRAME', brand: 'Titan', model: 'Premium', variant: 'Gold', name: 'Titan Frame Premium', description: 'Premium titanium frame', mrp: 9500, offerPrice: 8500, discountCategory: 'PREMIUM', hsnCode: '9004', gstRate: 18, attributes: { color: 'Gold', material: 'Titanium' }, images: [], isActive: true, createdAt: '2024-01-01' },
  { id: 'prod-005', sku: 'APL-WCH-S9', category: 'WATCH', brand: 'Apple', model: 'Watch', variant: 'Series 9', name: 'Apple Watch Series 9', description: 'Latest Apple Watch', mrp: 45000, offerPrice: 42900, discountCategory: 'LUXURY', hsnCode: '9102', gstRate: 18, attributes: { size: '45mm' }, images: [], isActive: true, createdAt: '2024-01-01' },
  { id: 'prod-006', sku: 'OAK-HLB-001', category: 'FRAME', brand: 'Oakley', model: 'Holbrook', variant: 'Matte Black', name: 'Oakley Holbrook', description: 'Sports performance frame', mrp: 14000, offerPrice: 12500, discountCategory: 'PREMIUM', hsnCode: '9004', gstRate: 18, attributes: { color: 'Matte Black' }, images: [], isActive: true, createdAt: '2024-01-01' },
  { id: 'prod-007', sku: 'HOY-BC-001', category: 'OPTICAL_LENS', brand: 'Hoya', model: 'Blue Control', variant: 'Standard', name: 'Hoya Blue Control (Pair)', description: 'Blue light filter lens', mrp: 6500, offerPrice: 5500, discountCategory: 'MASS', hsnCode: '9001', gstRate: 18, attributes: { index: '1.56' }, images: [], isActive: true, createdAt: '2024-01-01' },
];

const initialTasks: Task[] = [
  {
    id: 'task-001',
    taskNumber: 'TSK-2501-0001',
    type: 'FOLLOW_UP',
    priority: 'P2' as TaskPriority,
    title: 'Collect balance payment from Sunita Sharma',
    description: 'Order BV-KOL-001-2501-0002 has pending balance of ₹15,370',
    storeId: 'BV-KOL-001',
    assignedTo: 'user-001',
    assignedName: 'Amit Sales',
    createdBy: 'system',
    createdByName: 'System',
    dueDate: '2025-01-22',
    status: 'PENDING' as TaskStatus,
    linkedEntityType: 'ORDER',
    linkedEntityId: 'ord-002',
    escalationLevel: 0,
    escalationHistory: [],
    isSystemGenerated: true,
    createdAt: '2025-01-21T08:00:00Z',
    updatedAt: '2025-01-21T08:00:00Z',
  },
  {
    id: 'task-002',
    taskNumber: 'TSK-2501-0002',
    type: 'DELIVERY',
    priority: 'P1' as TaskPriority,
    title: 'Notify customer: Order ready for pickup',
    description: 'Job JOB-2501-0002 is ready. Call customer to collect.',
    storeId: 'BV-KOL-001',
    assignedTo: 'user-002',
    assignedName: 'Priya Sales',
    createdBy: 'system',
    createdByName: 'System',
    dueDate: '2025-01-21',
    status: 'PENDING' as TaskStatus,
    linkedEntityType: 'JOB',
    linkedEntityId: 'job-002',
    escalationLevel: 0,
    escalationHistory: [],
    isSystemGenerated: true,
    createdAt: '2025-01-21T10:05:00Z',
    updatedAt: '2025-01-21T10:05:00Z',
  },
];

// ============================================================================
// Context Type Definition
// ============================================================================

interface MockDataContextType {
  // Data
  customers: Customer[];
  orders: Order[];
  workshopJobs: WorkshopJob[];
  products: Product[];
  tasks: Task[];

  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  searchCustomers: (query: string) => Customer[];

  // Order CRUD
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addPaymentToOrder: (orderId: string, payment: Omit<Payment, 'id' | 'paidAt'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrderById: (id: string) => Order | undefined;

  // Workshop CRUD
  addWorkshopJob: (job: Omit<WorkshopJob, 'id' | 'jobNumber'>) => WorkshopJob;
  updateWorkshopJob: (id: string, updates: Partial<WorkshopJob>) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  getJobById: (id: string) => WorkshopJob | undefined;

  // Product operations
  getProductByBarcode: (barcode: string) => Product | undefined;
  searchProducts: (query: string, category?: string) => Product[];

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'taskNumber' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;

  // Statistics
  getStats: () => {
    todayOrders: number;
    todaySales: number;
    pendingPayments: number;
    pendingJobs: number;
    pendingTasks: number;
  };
}

// ============================================================================
// Context Creation
// ============================================================================

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [workshopJobs, setWorkshopJobs] = useState<WorkshopJob[]>(initialWorkshopJobs);
  const [products] = useState<Product[]>(initialProducts);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Counter for generating IDs
  const [orderCounter, setOrderCounter] = useState(5);
  const [jobCounter, setJobCounter] = useState(4);
  const [taskCounter, setTaskCounter] = useState(3);

  // ============================================================================
  // Customer Operations
  // ============================================================================

  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCustomerById = useCallback((id: string) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const searchCustomers = useCallback((query: string) => {
    const q = query.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [customers]);

  // ============================================================================
  // Order Operations
  // ============================================================================

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order => {
    const num = String(orderCounter).padStart(4, '0');
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `BV-KOL-001-2501-${num}`,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [...prev, newOrder]);
    setOrderCounter(c => c + 1);
    return newOrder;
  }, [orderCounter]);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const addPaymentToOrder = useCallback((orderId: string, payment: Omit<Payment, 'id' | 'paidAt'>) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const newPayment: Payment = {
        ...payment,
        id: `pay-${Date.now()}`,
        paidAt: new Date().toISOString(),
      };

      const newPayments = [...order.payments, newPayment];
      const newAmountPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
      const newBalanceDue = order.grandTotal - newAmountPaid;

      let newPaymentStatus: PaymentStatus = 'PENDING';
      if (newBalanceDue <= 0) newPaymentStatus = 'PAID';
      else if (newAmountPaid > 0) newPaymentStatus = 'PARTIAL';

      return {
        ...order,
        payments: newPayments,
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        paymentStatus: newPaymentStatus,
      };
    }));
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updates: Partial<Order> = { orderStatus: status };
      if (status === 'DELIVERED') {
        updates.deliveredAt = new Date().toISOString();
      }
      return { ...o, ...updates };
    }));
  }, []);

  const getOrderById = useCallback((id: string) => {
    return orders.find(o => o.id === id);
  }, [orders]);

  // ============================================================================
  // Workshop Operations
  // ============================================================================

  const addWorkshopJob = useCallback((jobData: Omit<WorkshopJob, 'id' | 'jobNumber'>): WorkshopJob => {
    const num = String(jobCounter).padStart(4, '0');
    const newJob: WorkshopJob = {
      ...jobData,
      id: `job-${Date.now()}`,
      jobNumber: `JOB-2501-${num}`,
    };
    setWorkshopJobs(prev => [...prev, newJob]);
    setJobCounter(c => c + 1);
    return newJob;
  }, [jobCounter]);

  const updateWorkshopJob = useCallback((id: string, updates: Partial<WorkshopJob>) => {
    setWorkshopJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const updateJobStatus = useCallback((id: string, status: JobStatus) => {
    setWorkshopJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const updates: Partial<WorkshopJob> = { status };
      if (status === 'READY' || status === 'QC_PASSED') {
        updates.completedAt = new Date().toISOString();
      }
      if (status === 'DELIVERED') {
        updates.deliveredAt = new Date().toISOString();
      }
      return { ...j, ...updates };
    }));
  }, []);

  const getJobById = useCallback((id: string) => {
    return workshopJobs.find(j => j.id === id);
  }, [workshopJobs]);

  // ============================================================================
  // Product Operations
  // ============================================================================

  const getProductByBarcode = useCallback((barcode: string) => {
    return products.find(p => p.sku === barcode);
  }, [products]);

  const searchProducts = useCallback((query: string, category?: string) => {
    const q = query.toLowerCase();
    return products.filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
      const matchesCategory = !category || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products]);

  // ============================================================================
  // Task Operations
  // ============================================================================

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'taskNumber' | 'createdAt' | 'updatedAt'>): Task => {
    const num = String(taskCounter).padStart(4, '0');
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      taskNumber: `TSK-2501-${num}`,
      createdAt: now,
      updatedAt: now,
    };
    setTasks(prev => [...prev, newTask]);
    setTaskCounter(c => c + 1);
    return newTask;
  }, [taskCounter]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: 'COMPLETED' as TaskStatus,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  // ============================================================================
  // Statistics
  // ============================================================================

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = orders.filter(o => o.createdAt.startsWith(today)).length;
    const todaySales = orders
      .filter(o => o.createdAt.startsWith(today))
      .reduce((sum, o) => sum + o.grandTotal, 0);
    const pendingPayments = orders
      .filter(o => o.balanceDue > 0)
      .reduce((sum, o) => sum + o.balanceDue, 0);
    const pendingJobs = workshopJobs.filter(j =>
      j.status !== 'DELIVERED' && j.status !== 'CANCELLED'
    ).length;
    const pendingTasks = tasks.filter(t =>
      t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    ).length;

    return {
      todayOrders,
      todaySales,
      pendingPayments,
      pendingJobs,
      pendingTasks,
    };
  }, [orders, workshopJobs, tasks]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: MockDataContextType = {
    customers,
    orders,
    workshopJobs,
    products,
    tasks,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    searchCustomers,
    addOrder,
    updateOrder,
    addPaymentToOrder,
    updateOrderStatus,
    getOrderById,
    addWorkshopJob,
    updateWorkshopJob,
    updateJobStatus,
    getJobById,
    getProductByBarcode,
    searchProducts,
    addTask,
    updateTask,
    completeTask,
    getStats,
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}

export default MockDataContext;
