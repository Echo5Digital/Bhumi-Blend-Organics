// The shapes the backend sends (backend/README.md lists every endpoint).

export type OrderStatus = "pending" | "processing" | "shipped" | "completed" | "cancelled" | "refunded" | "failed";
export type TargetStatus = "processing" | "shipped" | "completed" | "cancelled" | "refunded";

export type Paged<T> = { items: T[]; page: number; limit: number; total: number; pages: number };

export type Address = {
  firstName: string;
  lastName: string;
  country: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
};

export type OrderRow = {
  number: number;
  createdAt: string;
  status: OrderStatus;
  total: number;
  currency: string;
  customerName: string;
  email: string;
  customerId?: string;
  itemCount: number;
  items: { name: string; qty: number }[];
};
export type OrderList = Paged<OrderRow> & { counts: Record<"all" | OrderStatus, number> };

export type OrderNote = { id: string; text: string; author: string; customerNote: boolean; createdAt: string };
export type OrderDetail = {
  id: string;
  number: number;
  createdAt: string;
  email: string;
  customerId?: string;
  status: OrderStatus;
  paymentStatus: string;
  fulfilmentStatus: string;
  items: { slug: string; name: string; image?: string; size?: string; unitPrice: number; regularPrice?: number; qty: number; lineTotal: number }[];
  shipping: Address;
  billing: Address;
  billingSameAsShipping: boolean;
  note?: string;
  coupon?: { code: string; discount: number };
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  paymentMethod: string;
  paidAt?: string;
  tracking?: { carrier?: string; trackingNumber: string; shippedAt?: string };
  payment: { provider: string; razorpayOrderId?: string; razorpayPaymentId?: string; lastError?: string };
  stockReduced: boolean;
  notes: OrderNote[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  price: number;
  regularPrice?: number;
  image: { url: string; publicId?: string };
  hoverImage?: { url: string; publicId?: string };
  rating?: number;
  weight?: string;
  categories: { category: string; position: number }[];
  collections: { key: string; position: number }[];
  position: number;
  inStock: boolean;
  stockQuantity?: number;
  isActive: boolean;
  details: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};
export type ProductList = Paged<Product> & { counts: { all: number; active: number; hidden: number } };

export type Category = { id: string; slug: string; name: string; description?: string; /** The photo on its card in the shop's Category menu. */ image?: { url: string; publicId?: string }; position: number; isActive: boolean };

export type Coupon = {
  id: string;
  code: string;
  description?: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount?: number;
  minSubtotal: number;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
};

export type CustomerRow = {
  id?: string;
  type: "registered" | "guest";
  name: string;
  email: string;
  registeredAt?: string;
  lastActive?: string;
  orders: number;
  totalSpend: number;
  averageOrderValue: number;
  country?: string;
  city?: string;
  state?: string;
  postcode?: string;
};

export type Settings = {
  storeName: string;
  address: { line1: string; line2: string; city: string; state: string; pin: string; country: string };
  contactEmail: string;
  contactPhone: string;
  couponsEnabled: boolean;
  lowStockThreshold: number;
};

export type SalesReport = {
  from: string;
  to: string;
  groupBy: "day" | "month";
  summary: {
    grossSales: number;
    netSales: number;
    orders: number;
    items: number;
    refunds: { count: number; amount: number };
    shipping: number;
    couponDiscounts: number;
    averageGrossPerDay: number;
    averageOrdersPerDay: number;
  };
  series: { date: string; grossSales: number; netSales: number; orders: number }[];
};

export type StockItem = { slug: string; name: string; sku?: string; stockQuantity?: number; inStock: boolean };
export type StockReport = { lowStockThreshold: number; productsWithStockCount: number; low: StockItem[]; out: StockItem[]; most: StockItem[] };

export type ReviewStatus = "pending" | "approved" | "rejected";
/** A customer's review of a product, as the admin's Reviews screen lists it. */
export type ReviewRow = {
  id: string;
  productSlug: string;
  productName: string;
  /** 1 to 5; missing when the reviewer only wrote text. */
  rating?: number;
  review: string;
  name: string;
  email: string;
  status: ReviewStatus;
  createdAt: string;
};
export type ReviewList = Paged<ReviewRow> & { counts: { all: number; pending: number; approved: number; rejected: number } };

/** A message a visitor sent through the "Leave a Reply" form under a blog article. */
export type MessageRow = {
  id: string;
  /** The article it was sent from: its address on the storefront. */
  postSlug: string;
  name: string;
  email: string;
  /** Empty when left blank. */
  website: string;
  comment: string;
  isRead: boolean;
  createdAt: string;
};
export type MessageList = Paged<MessageRow> & { counts: { all: number; new: number; read: number } };
