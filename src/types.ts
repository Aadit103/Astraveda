export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string;
  images: string[];
  variants: ProductVariant[];
  seo_title?: string;
  seo_description?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'shipping' | 'billing';
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  active: boolean;
  expires_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'Placed' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'In Transit' | 'Out For Delivery' | 'Delivered' | 'Cancelled' | 'Return Requested' | 'Returned' | 'Refunded';
  total: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  coupon_code: string | null;
  shipping_address: Address;
  payment_method: 'COD';
  payment_status: 'Pending' | 'Paid';
  qikink_order_id: string | null;
  qikink_tracking_id: string | null;
  qikink_tracking_url: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer_email?: string;
  customer_name?: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_number: string;
  user_id: string;
  user_email: string;
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected';
  refund_status: 'Pending' | 'Refunded';
  admin_notes?: string;
  created_at: string;
}

export interface Banner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  link: string;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  full_name?: string;
  phone?: string;
}
