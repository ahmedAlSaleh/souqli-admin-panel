export const stats = [
  { label: 'Total Revenue', value: '$124,350', change: '+8.2% this month' },
  { label: 'Orders', value: '1,248', change: '+4.6% this week' },
  { label: 'Active Products', value: '420', change: '+12 new items' },
  { label: 'New Customers', value: '96', change: '+18 today' }
];

export const categories = [
  { id: 1, name: 'Electronics', slug: 'electronics', status: 'Active', products: 120 },
  { id: 2, name: 'Fashion', slug: 'fashion', status: 'Active', products: 84 },
  { id: 3, name: 'Home & Living', slug: 'home-living', status: 'Inactive', products: 32 }
];

export const products = [
  {
    id: 101,
    name: 'Souqli Pro Headphones',
    sku: 'SOU-HDP-001',
    price: '$149.00',
    stock: 34,
    status: 'Active'
  },
  {
    id: 102,
    name: 'Everyday Linen Shirt',
    sku: 'SOU-LIN-214',
    price: '$39.00',
    stock: 120,
    status: 'Active'
  },
  {
    id: 103,
    name: 'Minimal Desk Lamp',
    sku: 'SOU-LMP-812',
    price: '$52.00',
    stock: 0,
    status: 'Out of stock'
  }
];

export const orders = [
  { id: 9001, customer: 'Lina Ahmed', total: '$189.00', status: 'PENDING', date: '2026-02-21' },
  { id: 9002, customer: 'Omar Ali', total: '$59.00', status: 'PROCESSING', date: '2026-02-20' },
  { id: 9003, customer: 'Sara Yusuf', total: '$320.00', status: 'COMPLETED', date: '2026-02-19' }
];

export const users = [
  { id: 1, name: 'Admin User', email: 'admin@souqli.com', role: 'ADMIN', status: 'Active' },
  { id: 2, name: 'Maha Saleh', email: 'maha@souqli.com', role: 'EDITOR', status: 'Active' },
  { id: 3, name: 'Khaled Noor', email: 'khaled@souqli.com', role: 'VIEWER', status: 'Inactive' }
];

export const pages = [
  { id: 1, key: 'privacy_policy', title: 'Privacy Policy', updated: '2026-02-10' },
  { id: 2, key: 'terms', title: 'Terms & Conditions', updated: '2026-02-11' },
  { id: 3, key: 'about', title: 'About Souqli', updated: '2026-02-12' }
];

export const logs = [
  {
    id: 8001,
    actor: 'Admin User',
    action: 'CREATE_PRODUCT',
    entity: 'products',
    date: '2026-02-21 10:12'
  },
  {
    id: 8002,
    actor: 'Maha Saleh',
    action: 'UPDATE_PAGE',
    entity: 'pages',
    date: '2026-02-20 18:44'
  },
  {
    id: 8003,
    actor: 'Admin User',
    action: 'UPDATE_ORDER_STATUS',
    entity: 'orders',
    date: '2026-02-20 14:03'
  }
];
