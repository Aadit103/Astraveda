-- Astraveda Production-Grade PostgreSQL Database Schema & Migration
-- Fully compatible with Supabase and Standard PostgreSQL deployments.
-- Includes table schemas, sequential migrations, indexing strategies, and initial seed structures.

-- Enable UUID Extension if desired
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================================================
-- 1. USERS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer', -- 'customer', 'admin'
  full_name VARCHAR(150),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for user queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =======================================================================
-- 2. ADDRESSES TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'shipping', -- 'shipping', 'billing'
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for address lookups
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- =======================================================================
-- 3. CATEGORIES TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================================
-- 4. PRODUCTS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  images TEXT[],
  variants JSONB DEFAULT '[]'::jsonb, -- e.g. [{"id": "v-1", "name": "M / Red", "stock": 50}]
  seo_title VARCHAR(255),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for fast catalog querying
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- =======================================================================
-- 5. COUPONS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for code search
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- =======================================================================
-- 6. ORDERS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'Placed', -- 'Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out For Delivery', 'Delivered', 'Cancelled'
  total NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  shipping_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  coupon_code VARCHAR(50),
  shipping_address JSONB NOT NULL, -- JSON formatted address
  payment_method VARCHAR(50) DEFAULT 'COD', -- 'COD', 'Prepaid'
  payment_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed'
  qikink_order_id VARCHAR(100), -- Qikink Fulfilment identifier
  qikink_tracking_id VARCHAR(100), -- Shipping Tracking ID (AWB)
  qikink_tracking_url TEXT, -- Carrier track route links
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order optimization indices
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_qikink_id ON orders(qikink_order_id);

-- =======================================================================
-- 7. ORDER_ITEMS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100),
  variant_id VARCHAR(100),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =======================================================================
-- 8. REVIEWS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_name VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- =======================================================================
-- 9. WISHLIST TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_product UNIQUE(user_id, product_id)
);

-- =======================================================================
-- 10. BANNERS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(100) PRIMARY KEY,
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  subtitle TEXT,
  link VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================================
-- 11. RETURNS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Requested', -- 'Requested', 'Approved', 'Rejected', 'Completed'
  refund_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Processed', 'N/A'
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================================
-- SEED INITIAL DATA (DEFAULT STORE SETUP MIGRATION)
-- =======================================================================

-- 1. Default Core Store Administrator (Credential: admin@premium.com / password: admin123)
INSERT INTO users (id, email, password_hash, role, full_name, phone)
VALUES (
  'user-admin', 
  'admin@premium.com', 
  '$2a$10$wTInF6k3S46A8l6T76yGJu7K5KMyYFp252ZkQ3F.VqG7FpP676v4K', 
  'admin', 
  'Store Administrator', 
  '+919999999999'
) ON CONFLICT DO NOTHING;

-- 2. Seed Default Product Categories
INSERT INTO categories (id, name, slug, description, image)
VALUES 
  ('cat-1', 'T-Shirts', 't-shirts', 'Premium 100% organic heavy cotton t-shirts', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'),
  ('cat-2', 'Hoodies', 'hoodies', 'Warm & heavy premium organic hoodies', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Default Astraveda Collection Products
INSERT INTO products (id, name, description, category, price, compare_at_price, stock, sku, images, variants, seo_title, seo_description)
VALUES 
  (
    'prod-1', 
    'Minimalist Cotton Tee', 
    'Crafted from 100% organic cotton, this t-shirt is designed for daily comfort with an elegant silhouette.',
    'T-Shirts', 
    1499, 
    1999, 
    120, 
    'TEE-COT-MIN', 
    ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
    '[{"id": "v-1", "name": "Small / White", "stock": 40}, {"id": "v-2", "name": "Medium / White", "stock": 40}, {"id": "v-3", "name": "Large / White", "stock": 40}]'::jsonb,
    'Minimalist Cotton Tee - Premium Fabric', 
    'Buy the Premium Minimalist Cotton Tee. Made from organic premium grade cotton.'
  ),
  (
    'prod-2', 
    'Astraveda Signature Hoodie', 
    'Crafted from heavyweight 450 GSM organic cotton terry. Designed with a slouchy, drop-shoulder aesthetic and a double-lined hood for absolute comfort.',
    'Hoodies', 
    3499, 
    4500, 
    45, 
    'HOD-AST-SIG', 
    ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'],
    '[{"id": "v-4", "name": "Small / Midnight Black", "stock": 15}, {"id": "v-5", "name": "Medium / Midnight Black", "stock": 15}, {"id": "v-6", "name": "Large / Midnight Black", "stock": 15}]'::jsonb,
    'Astraveda Signature Hoodie - Ultra Heavyweight Terry', 
    'Buy the Astraveda Signature Hoodie. Made from ultra heavyweight organic French terry cotton.'
  ),
  (
    'prod-3', 
    'Vintage Oversized Graphic Tee', 
    'Designed with a faded wash and premium vintage screenprint. Made from 240 GSM heavy combed cotton for a perfect boxy retro fit.',
    'T-Shirts', 
    1799, 
    2499, 
    80, 
    'TEE-VNT-OVS', 
    ARRAY['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800', 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'],
    '[{"id": "v-7", "name": "Medium / Off-Black", "stock": 40}, {"id": "v-8", "name": "Large / Off-Black", "stock": 40}]'::jsonb,
    'Vintage Oversized Graphic Tee - Aesthetic Comfort', 
    'Buy the Astraveda Vintage Oversized Graphic Tee. Pure premium heavy combed cotton street wear.'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Marketing Banners
INSERT INTO banners (id, image_url, title, subtitle, link, active)
VALUES 
  ('ban-1', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1600', 'Signature Blank Tees', 'Elevate your style with structural minimalist heavy cotton t-shirts.', '/shop?category=T-Shirts', true),
  ('ban-2', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600', 'Signature Hoodies', 'Heavyweight organic French terry hoodies styled for comfort.', '/shop?category=Hoodies', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Core Promo Offer Coupons
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, active)
VALUES 
  ('coup-1', 'WELCOME10', 'percentage', 10, 0, true),
  ('coup-2', 'FREESHIP', 'fixed', 500, 4999, true)
ON CONFLICT (id) DO NOTHING;
