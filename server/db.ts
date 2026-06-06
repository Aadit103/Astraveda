import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Support loading local configuration files in non-deployed environments
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else if (fs.existsSync('.env.example')) {
  dotenv.config({ path: '.env.example' });
}

// Retain database URL string after clearing bracket wraps
let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  // Common issue repair: strip square brackets from passwords copied from online templates
  connectionString = connectionString.replace(/:\[([^\]]+)\]@/, ':$1@');
}

// Let's configure the pool if DATABASE_URL exists.
let pool: pg.Pool | null = null;
const usePostgres = !!connectionString && !connectionString.includes('pos...ue') && !connectionString.includes('[YOUR-PASSWORD]');

if (usePostgres) {
  try {
    pool = new pg.Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }
    });
    console.log('PostgreSQL (Supabase) Database Manager Initialized.');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool, falling back to JSON-file database:', err);
    pool = null;
  }
} else {
  console.log('No active Postgres DATABASE_URL provided. Operating with high-fidelity JSON-file database persistence.');
}

// Fallback JSON-based DB path
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Mock/Local Seed Data
const defaultCategories = [
  { id: 'cat-1', name: 'T-Shirts', slug: 't-shirts', description: 'Premium 100% organic heavy cotton t-shirts', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800' },
  { id: 'cat-2', name: 'Hoodies', slug: 'hoodies', description: 'Warm & heavy premium organic hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800' }
];

const defaultProducts = [
  {
    id: 'prod-1',
    name: 'Minimalist Cotton Tee',
    description: 'Crafted from 100% organic combed cotton, this t-shirt is designed for daily comfort with an elegant silhouette, double-row needle lock stitching, and premium neck tape.',
    category: 'T-Shirts',
    price: 1499,
    compare_at_price: 1999,
    stock: 150,
    sku: 'TEE-COT-MIN',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800'
    ],
    variants: [
      { id: 'v-1', name: 'Small / Premium White', stock: 25 },
      { id: 'v-2', name: 'Medium / Premium White', stock: 30 },
      { id: 'v-3', name: 'Large / Premium White', stock: 25 },
      { id: 'v-1b', name: 'Small / Midnight Black', stock: 20 },
      { id: 'v-2b', name: 'Medium / Midnight Black', stock: 25 },
      { id: 'v-3b', name: 'Large / Midnight Black', stock: 15 },
      { id: 'v-1c', name: 'Small / Crimson Red', stock: 10 },
      { id: 'v-2c', name: 'Medium / Crimson Red', stock: 15 },
      { id: 'v-3c', name: 'Large / Crimson Red', stock: 10 }
    ],
    seo_title: 'Minimalist Cotton Tee - Premium Fabric',
    seo_description: 'Buy the Premium Minimalist Cotton Tee. Made from organic premium grade cotton.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Astraveda Signature Hoodie',
    description: 'Crafted from heavyweight 450 GSM organic cotton terry. Designed with a slouchy, drop-shoulder aesthetic and a double-lined hood for absolute multi-seasonal comfort.',
    category: 'Hoodies',
    price: 3499,
    compare_at_price: 4500,
    stock: 90,
    sku: 'HOD-AST-SIG',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
      'https://images.unsplash.com/photo-1609873814058-a8928924184a?w=800'
    ],
    variants: [
      { id: 'v-4', name: 'Small / Midnight Black', stock: 15 },
      { id: 'v-5', name: 'Medium / Midnight Black', stock: 15 },
      { id: 'v-6', name: 'Large / Midnight Black', stock: 15 },
      { id: 'v-4b', name: 'Small / Sage Grey', stock: 10 },
      { id: 'v-5b', name: 'Medium / Sage Grey', stock: 12 },
      { id: 'v-6b', name: 'Large / Sage Grey', stock: 8 },
      { id: 'v-4c', name: 'Small / Sand Beige', stock: 10 },
      { id: 'v-5c', name: 'Medium / Sand Beige', stock: 12 },
      { id: 'v-6c', name: 'Large / Sand Beige', stock: 8 }
    ],
    seo_title: 'Astraveda Signature Hoodie - Ultra Heavyweight Terry',
    seo_description: 'Buy the Astraveda Signature Hoodie. Made from ultra heavyweight organic French terry cotton.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Vintage Oversized Graphic Tee',
    description: 'Designed with a faded wash and premium vintage screenprint. Made from 240 GSM heavy combed cotton for a perfect boxy retro street fit.',
    category: 'T-Shirts',
    price: 1799,
    compare_at_price: 2499,
    stock: 110,
    sku: 'TEE-VNT-OVS',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
      'https://images.unsplash.com/photo-1503341509153-d83b7303349e?w=800'
    ],
    variants: [
      { id: 'v-7', name: 'Small / Off-Black', stock: 20 },
      { id: 'v-7b', name: 'Medium / Off-Black', stock: 25 },
      { id: 'v-8', name: 'Large / Off-Black', stock: 25 },
      { id: 'v-9', name: 'Small / Cadet Blue', stock: 15 },
      { id: 'v-10', name: 'Medium / Cadet Blue', stock: 15 },
      { id: 'v-11', name: 'Large / Cadet Blue', stock: 10 }
    ],
    seo_title: 'Vintage Oversized Graphic Tee - Aesthetic Comfort',
    seo_description: 'Buy the Astraveda Vintage Oversized Graphic Tee. Pure premium heavy combed cotton street wear.',
    created_at: new Date().toISOString()
  }
];

const defaultCoupons = [
  { id: 'coup-1', code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, min_order_value: 0, active: true },
  { id: 'coup-2', code: 'FREESHIP', discount_type: 'fixed', discount_value: 500, min_order_value: 4999, active: true }
];

const defaultBanners = [
  { id: 'ban-1', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1600', title: 'Signature Blank Tees', subtitle: 'Elevate your style with structural minimalist heavy cotton t-shirts.', link: '/shop?category=T-Shirts', active: true },
  { id: 'ban-2', image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600', title: 'Signature Hoodies', subtitle: 'Heavyweight organic French terry hoodies styled for comfort.', link: '/shop?category=Hoodies', active: true }
];

// Memory/JSON DB representation
interface JsonDbSchema {
  users: any[];
  addresses: any[];
  products: any[];
  categories: any[];
  coupons: any[];
  orders: any[];
  order_items: any[];
  reviews: any[];
  wishlist: any[];
  banners: any[];
  returns: any[];
  sent_emails?: any[];
}

function loadJsonDb(): JsonDbSchema {
  if (!fs.existsSync(DB_FILE_PATH)) {
    const freshDb: JsonDbSchema = {
      users: [
        {
          id: 'user-admin',
          email: 'admin@premium.com',
          password_hash: '$2b$10$NM28pHI1c4X4MjA226aFvux3Afh6PjiJNE82nXdx9VpgDOlDBpXSu', // password is "admin123"
          role: 'admin',
          full_name: 'Store Administrator',
          phone: '+919999999999',
          created_at: new Date().toISOString()
        }
      ],
      addresses: [],
      products: defaultProducts,
      categories: defaultCategories,
      coupons: defaultCoupons,
      orders: [],
      order_items: [],
      reviews: [],
      wishlist: [],
      banners: defaultBanners,
      returns: [],
      sent_emails: []
    };
    saveJsonDb(freshDb);
    return freshDb;
  }
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    let dirty = false;
    if (!parsed.users) { parsed.users = []; dirty = true; }
    if (!parsed.addresses) { parsed.addresses = []; dirty = true; }
    if (!parsed.products) { parsed.products = defaultProducts; dirty = true; }
    if (!parsed.categories) { parsed.categories = defaultCategories; dirty = true; }
    if (!parsed.coupons) { parsed.coupons = defaultCoupons; dirty = true; }
    if (!parsed.orders) { parsed.orders = []; dirty = true; }
    if (!parsed.order_items) { parsed.order_items = []; dirty = true; }
    if (!parsed.reviews) { parsed.reviews = []; dirty = true; }
    if (!parsed.wishlist) { parsed.wishlist = []; dirty = true; }
    if (!parsed.banners) { parsed.banners = defaultBanners; dirty = true; }
    if (!parsed.returns) { parsed.returns = []; dirty = true; }
    if (!parsed.sent_emails) { parsed.sent_emails = []; dirty = true; }
    
    if (dirty) {
      saveJsonDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading JSON DB file, returning empty state:', err);
    return {
      users: [],
      addresses: [],
      products: defaultProducts,
      categories: defaultCategories,
      coupons: defaultCoupons,
      orders: [],
      order_items: [],
      reviews: [],
      wishlist: [],
      banners: defaultBanners,
      returns: [],
      sent_emails: []
    };
  }
}

function saveJsonDb(db: JsonDbSchema) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to JSON DB file:', err);
  }
}

// PostgreSQL Schemas Setup
export async function setupDatabase() {
  if (!usePostgres || !pool) {
    // If not using Postgres, make sure default files are seeded
    loadJsonDb();
    return;
  }

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database. Directing CRUD to JSON persistence:', err);
    pool = null; // force JSON fallback
    loadJsonDb();
    return;
  }

  try {
    await client.query('BEGIN');

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        full_name VARCHAR(150),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) DEFAULT 'shipping',
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
    `);

    await client.query(`
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
        variants JSONB DEFAULT '[]'::jsonb,
        seo_title VARCHAR(255),
        seo_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL,
        discount_value NUMERIC NOT NULL,
        min_order_value NUMERIC DEFAULT 0,
        active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) REFERENCES users(id),
        order_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'Placed',
        total NUMERIC NOT NULL,
        subtotal NUMERIC NOT NULL,
        shipping_fee NUMERIC DEFAULT 0,
        discount NUMERIC DEFAULT 0,
        coupon_code VARCHAR(50),
        shipping_address JSONB NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        payment_status VARCHAR(50) DEFAULT 'Pending',
        qikink_order_id VARCHAR(100),
        qikink_tracking_id VARCHAR(100),
        qikink_tracking_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(100),
        variant_id VARCHAR(100),
        quantity INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(100) PRIMARY KEY,
        product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
        user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        user_name VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(100) PRIMARY KEY,
        image_url TEXT NOT NULL,
        title VARCHAR(255),
        subtitle TEXT,
        link VARCHAR(255),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
        user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Requested',
        refund_status VARCHAR(50) DEFAULT 'Pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sent_emails (
        id VARCHAR(100) PRIMARY KEY,
        recipient VARCHAR(150) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'delivered',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Let's seed initial products and categories if they are empty
    // First, ensure the administrators are always seeded
    await client.query(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone)
      VALUES ('user-admin', 'admin@premium.com', '$2b$10$NM28pHI1c4X4MjA226aFvux3Afh6PjiJNE82nXdx9VpgDOlDBpXSu', 'admin', 'Store Administrator', '+919999999999')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `);

    const checkProducts = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(checkProducts.rows[0].count, 10) === 0) {
      console.log('Postgres tables empty. Seeding defaults...');

      for (const cat of defaultCategories) {
        await client.query(`
          INSERT INTO categories (id, name, slug, description, image)
          VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;
        `, [cat.id, cat.name, cat.slug, cat.description, cat.image]);
      }

      for (const prod of defaultProducts) {
        await client.query(`
          INSERT INTO products (id, name, description, category, price, compare_at_price, stock, sku, images, variants, seo_title, seo_description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT DO NOTHING;
        `, [
          prod.id, prod.name, prod.description, prod.category, prod.price,
          prod.compare_at_price, prod.stock, prod.sku, prod.images,
          JSON.stringify(prod.variants), prod.seo_title, prod.seo_description
        ]);
      }

      for (const cop of defaultCoupons) {
        await client.query(`
          INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, active)
          VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING;
        `, [cop.id, cop.code, cop.discount_type, cop.discount_value, cop.min_order_value, cop.active]);
      }

      for (const ban of defaultBanners) {
        await client.query(`
          INSERT INTO banners (id, image_url, title, subtitle, link, active)
          VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING;
        `, [ban.id, ban.image_url, ban.title, ban.subtitle, ban.link, ban.active]);
      }
    }

    await client.query('COMMIT');
    console.log('PostgreSQL (Supabase) Setup/Verification completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to provision PostgreSQL database. Directing CRUD to JSON persistence.', error);
    pool = null; // force JSON fallback
  } finally {
    client.release();
  }
}

// Database helper operations
export const db = {
  // --- USERS ---
  async getUsers(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.rows;
    }
    const store = loadJsonDb();
    return store.users;
  },

  async getUserById(id: string): Promise<any | null> {
    if (pool) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const store = loadJsonDb();
    return store.users.find(u => u.id === id) || null;
  },

  async getUserByEmail(email: string): Promise<any | null> {
    if (pool) {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    }
    const store = loadJsonDb();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser(user: any): Promise<any> {
    const freshUser = {
      id: user.id || 'u-' + Math.random().toString(36).substr(2, 9),
      email: user.email,
      password_hash: user.password_hash,
      role: user.role || 'customer',
      full_name: user.full_name || '',
      phone: user.phone || '',
      created_at: new Date().toISOString()
    };
    if (pool) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, full_name, phone, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [freshUser.id, freshUser.email, freshUser.password_hash, freshUser.role, freshUser.full_name, freshUser.phone, freshUser.created_at]
      );
      return freshUser;
    }
    const store = loadJsonDb();
    store.users.push(freshUser);
    saveJsonDb(store);
    return freshUser;
  },

  async updateUser(id: string, updates: any): Promise<any> {
    if (pool) {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const res = await pool.query(
        `UPDATE users SET ${sets} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      return res.rows[0];
    }
    const store = loadJsonDb();
    const idx = store.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      store.users[idx] = { ...store.users[idx], ...updates };
      saveJsonDb(store);
      return store.users[idx];
    }
    return null;
  },

  // --- ADDRESSES ---
  async getAddressesByUser(userId: string): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [userId]);
      return res.rows;
    }
    const store = loadJsonDb();
    return store.addresses.filter(a => a.user_id === userId);
  },

  async createAddress(addr: any): Promise<any> {
    const freshAddr = {
      id: 'addr-' + Math.random().toString(36).substr(2, 9),
      user_id: addr.user_id,
      type: addr.type || 'shipping',
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country || 'India',
      is_default: addr.is_default || false,
      created_at: new Date().toISOString()
    };

    if (pool) {
      if (freshAddr.is_default) {
        await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [freshAddr.user_id]);
      }
      await pool.query(
        `INSERT INTO addresses (id, user_id, type, name, phone, street, city, state, postal_code, country, is_default, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [freshAddr.id, freshAddr.user_id, freshAddr.type, freshAddr.name, freshAddr.phone, freshAddr.street, freshAddr.city, freshAddr.state, freshAddr.postal_code, freshAddr.country, freshAddr.is_default, freshAddr.created_at]
      );
      return freshAddr;
    }

    const store = loadJsonDb();
    if (freshAddr.is_default) {
      store.addresses.forEach(a => {
        if (a.user_id === freshAddr.user_id) a.is_default = false;
      });
    }
    store.addresses.push(freshAddr);
    saveJsonDb(store);
    return freshAddr;
  },

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    if (pool) {
      const res = await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
      return (res.rowCount ?? 0) > 0;
    }
    const store = loadJsonDb();
    const before = store.addresses.length;
    store.addresses = store.addresses.filter(a => !(a.id === id && a.user_id === userId));
    saveJsonDb(store);
    return store.addresses.length < before;
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.rows.map(p => ({
        ...p,
        price: parseFloat(p.price),
        compare_at_price: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
        variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants
      }));
    }
    const store = loadJsonDb();
    return store.products;
  },

  async getProductById(id: string): Promise<any | null> {
    if (pool) {
      const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (!res.rows[0]) return null;
      const p = res.rows[0];
      return {
        ...p,
        price: parseFloat(p.price),
        compare_at_price: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
        variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants
      };
    }
    const store = loadJsonDb();
    return store.products.find(p => p.id === id) || null;
  },

  async createProduct(prod: any): Promise<any> {
    const freshProd = {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      name: prod.name,
      description: prod.description || '',
      category: prod.category,
      price: parseFloat(prod.price),
      compare_at_price: prod.compare_at_price ? parseFloat(prod.compare_at_price) : null,
      stock: parseInt(prod.stock, 10) || 0,
      sku: prod.sku || 'SKU-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      images: prod.images || [],
      variants: prod.variants || [],
      seo_title: prod.seo_title || prod.name,
      seo_description: prod.seo_description || prod.description || '',
      created_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO products (id, name, description, category, price, compare_at_price, stock, sku, images, variants, seo_title, seo_description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          freshProd.id, freshProd.name, freshProd.description, freshProd.category,
          freshProd.price, freshProd.compare_at_price, freshProd.stock, freshProd.sku,
          freshProd.images, JSON.stringify(freshProd.variants), freshProd.seo_title,
          freshProd.seo_description, freshProd.created_at
        ]
      );
      return freshProd;
    }

    const store = loadJsonDb();
    store.products.push(freshProd);
    saveJsonDb(store);
    return freshProd;
  },

  async updateProduct(id: string, updates: any): Promise<any> {
    if (pool) {
      const dbUpdates = { ...updates };
      if (dbUpdates.price !== undefined) dbUpdates.price = parseFloat(dbUpdates.price);
      if (dbUpdates.compare_at_price !== undefined) dbUpdates.compare_at_price = dbUpdates.compare_at_price ? parseFloat(dbUpdates.compare_at_price) : null;
      if (dbUpdates.stock !== undefined) dbUpdates.stock = parseInt(dbUpdates.stock, 10);
      if (dbUpdates.variants !== undefined) dbUpdates.variants = JSON.stringify(dbUpdates.variants);

      const fields = Object.keys(dbUpdates);
      const values = Object.values(dbUpdates);
      const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const res = await pool.query(
        `UPDATE products SET ${sets} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      if (!res.rows[0]) return null;
      const p = res.rows[0];
      return {
        ...p,
        price: parseFloat(p.price),
        compare_at_price: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
        variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants
      };
    }

    const store = loadJsonDb();
    const idx = store.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const item = store.products[idx];
      store.products[idx] = {
        ...item,
        ...updates,
        price: updates.price !== undefined ? parseFloat(updates.price) : item.price,
        compare_at_price: updates.compare_at_price !== undefined ? (updates.compare_at_price ? parseFloat(updates.compare_at_price) : null) : item.compare_at_price,
        stock: updates.stock !== undefined ? parseInt(updates.stock, 10) : item.stock
      };
      saveJsonDb(store);
      return store.products[idx];
    }
    return null;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (pool) {
      const res = await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const store = loadJsonDb();
    const before = store.products.length;
    store.products = store.products.filter(p => p.id !== id);
    saveJsonDb(store);
    return store.products.length < before;
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM categories ORDER BY name ASC');
      return res.rows;
    }
    const store = loadJsonDb();
    return store.categories;
  },

  async createCategory(cat: any): Promise<any> {
    const freshCat = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: cat.description || '',
      image: cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      created_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, description, image, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [freshCat.id, freshCat.name, freshCat.slug, freshCat.description, freshCat.image, freshCat.created_at]
      );
      return freshCat;
    }

    const store = loadJsonDb();
    store.categories.push(freshCat);
    saveJsonDb(store);
    return freshCat;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (pool) {
      const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const store = loadJsonDb();
    const before = store.categories.length;
    store.categories = store.categories.filter(c => c.id !== id);
    saveJsonDb(store);
    return store.categories.length < before;
  },

  // --- COUPONS ---
  async getCoupons(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
      return res.rows.map(c => ({
        ...c,
        discount_value: parseFloat(c.discount_value),
        min_order_value: parseFloat(c.min_order_value)
      }));
    }
    const store = loadJsonDb();
    return store.coupons;
  },

  async getCouponByCode(code: string): Promise<any | null> {
    const formattedCode = code.toUpperCase().trim();
    if (pool) {
      const res = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = $1 AND active = true', [formattedCode]);
      if (!res.rows[0]) return null;
      const c = res.rows[0];
      return {
        ...c,
        discount_value: parseFloat(c.discount_value),
        min_order_value: parseFloat(c.min_order_value)
      };
    }
    const store = loadJsonDb();
    return store.coupons.find(c => c.code.toUpperCase() === formattedCode && c.active) || null;
  },

  async createCoupon(c: any): Promise<any> {
    const freshC = {
      id: 'coup-' + Math.random().toString(36).substr(2, 9),
      code: c.code.toUpperCase().trim(),
      discount_type: c.discount_type || 'percentage',
      discount_value: parseFloat(c.discount_value),
      min_order_value: parseFloat(c.min_order_value || 0),
      active: c.active !== undefined ? c.active : true,
      expires_at: c.expires_at || null,
      created_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, active, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [freshC.id, freshC.code, freshC.discount_type, freshC.discount_value, freshC.min_order_value, freshC.active, freshC.expires_at, freshC.created_at]
      );
      return freshC;
    }

    const store = loadJsonDb();
    store.coupons.push(freshC);
    saveJsonDb(store);
    return freshC;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    if (pool) {
      const res = await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const store = loadJsonDb();
    const before = store.coupons.length;
    store.coupons = store.coupons.filter(c => c.id !== id);
    saveJsonDb(store);
    return store.coupons.length < before;
  },

  // --- REVIEWS ---
  async getReviews(productId: string): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC', [productId]);
      return res.rows;
    }
    const store = loadJsonDb();
    return store.reviews.filter(r => r.product_id === productId);
  },

  async createReview(rev: any): Promise<any> {
    const freshRev = {
      id: 'rev-' + Math.random().toString(36).substr(2, 9),
      product_id: rev.product_id,
      user_id: rev.user_id,
      rating: parseInt(rev.rating, 10),
      comment: rev.comment || '',
      user_name: rev.user_name || 'Anonymous Customer',
      created_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO reviews (id, product_id, user_id, rating, comment, user_name, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [freshRev.id, freshRev.product_id, freshRev.user_id, freshRev.rating, freshRev.comment, freshRev.user_name, freshRev.created_at]
      );
      return freshRev;
    }

    const store = loadJsonDb();
    store.reviews.push(freshRev);
    saveJsonDb(store);
    return freshRev;
  },

  // --- WISHLIST ---
  async getWishlist(userId: string): Promise<any[]> {
    if (pool) {
      const res = await pool.query(
        `SELECT w.id, w.product_id, p.name, p.price, p.compare_at_price, p.images[1] as image, p.stock
         FROM wishlist w
         JOIN products p ON w.product_id = p.id
         WHERE w.user_id = $1`,
        [userId]
      );
      return res.rows.map(r => ({
        ...r,
        price: parseFloat(r.price),
        compare_at_price: r.compare_at_price ? parseFloat(r.compare_at_price) : null
      }));
    }
    const store = loadJsonDb();
    const userWishlist = store.wishlist.filter(w => w.user_id === userId);
    return userWishlist.map(w => {
      const p = store.products.find(prod => prod.id === w.product_id);
      return {
        id: w.id,
        product_id: w.product_id,
        name: p ? p.name : 'Unknown Product',
        price: p ? p.price : 0,
        compare_at_price: p ? p.compare_at_price : null,
        image: p && p.images && p.images[0] ? p.images[0] : '',
        stock: p ? p.stock : 0
      };
    });
  },

  async toggleWishlist(userId: string, productId: string): Promise<{ active: boolean }> {
    if (pool) {
      const check = await pool.query('SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2', [userId, productId]);
      if (check.rows.length > 0) {
        await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        return { active: false };
      } else {
        const id = 'wish-' + Math.random().toString(36).substr(2, 9);
        await pool.query('INSERT INTO wishlist (id, user_id, product_id) VALUES ($1, $2, $3)', [id, userId, productId]);
        return { active: true };
      }
    }

    const store = loadJsonDb();
    const existingIdx = store.wishlist.findIndex(w => w.user_id === userId && w.product_id === productId);
    if (existingIdx !== -1) {
      store.wishlist.splice(existingIdx, 1);
      saveJsonDb(store);
      return { active: false };
    } else {
      store.wishlist.push({
        id: 'wish-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        product_id: productId,
        created_at: new Date().toISOString()
      });
      saveJsonDb(store);
      return { active: true };
    }
  },

  // --- BANNERS ---
  async getBanners(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM banners WHERE active = true ORDER BY created_at DESC');
      return res.rows;
    }
    const store = loadJsonDb();
    return store.banners.filter(b => b.active);
  },

  async getAllBanners(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM banners ORDER BY created_at DESC');
      return res.rows;
    }
    const store = loadJsonDb();
    return store.banners;
  },

  async createBanner(ban: any): Promise<any> {
    const freshBan = {
      id: 'ban-' + Math.random().toString(36).substr(2, 9),
      image_url: ban.image_url,
      title: ban.title || '',
      subtitle: ban.subtitle || '',
      link: ban.link || '#',
      active: ban.active !== undefined ? ban.active : true,
      created_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO banners (id, image_url, title, subtitle, link, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [freshBan.id, freshBan.image_url, freshBan.title, freshBan.subtitle, freshBan.link, freshBan.active, freshBan.created_at]
      );
      return freshBan;
    }

    const store = loadJsonDb();
    store.banners.push(freshBan);
    saveJsonDb(store);
    return freshBan;
  },

  async deleteBanner(id: string): Promise<boolean> {
    if (pool) {
      const res = await pool.query('DELETE FROM banners WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const store = loadJsonDb();
    const before = store.banners.length;
    store.banners = store.banners.filter(b => b.id !== id);
    saveJsonDb(store);
    return store.banners.length < before;
  },

  // --- ORDERS ---
  async getOrders(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.rows.map(o => ({
        ...o,
        total: parseFloat(o.total),
        subtotal: parseFloat(o.subtotal),
        shipping_fee: parseFloat(o.shipping_fee || 0),
        discount: parseFloat(o.discount || 0),
        shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
      }));
    }
    const store = loadJsonDb();
    return store.orders;
  },

  async getOrdersByUser(userId: string): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.rows.map(o => ({
        ...o,
        total: parseFloat(o.total),
        subtotal: parseFloat(o.subtotal),
        shipping_fee: parseFloat(o.shipping_fee || 0),
        discount: parseFloat(o.discount || 0),
        shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
      }));
    }
    const store = loadJsonDb();
    return store.orders.filter(o => o.user_id === userId);
  },

  async getOrderById(id: string): Promise<any | null> {
    if (pool) {
      const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (!res.rows[0]) return null;
      const o = res.rows[0];
      return {
        ...o,
        total: parseFloat(o.total),
        subtotal: parseFloat(o.subtotal),
        shipping_fee: parseFloat(o.shipping_fee || 0),
        discount: parseFloat(o.discount || 0),
        shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
      };
    }
    const store = loadJsonDb();
    return store.orders.find(o => o.id === id) || null;
  },

  async getOrderByNumberOrId(identifier: string): Promise<any | null> {
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM orders WHERE id = $1 OR order_number = $1 OR qikink_tracking_id = $1',
        [identifier]
      );
      if (!res.rows[0]) return null;
      const o = res.rows[0];
      return {
        ...o,
        total: parseFloat(o.total),
        subtotal: parseFloat(o.subtotal),
        shipping_fee: parseFloat(o.shipping_fee || 0),
        discount: parseFloat(o.discount || 0),
        shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
      };
    }
    const store = loadJsonDb();
    const cleanId = identifier.trim().toLowerCase();
    const o = store.orders.find(ord => 
      ord.id.toLowerCase() === cleanId || 
      ord.order_number.toLowerCase() === cleanId || 
      (ord.qikink_tracking_id && ord.qikink_tracking_id.toLowerCase() === cleanId)
    );
    return o || null;
  },

  async getOrderItems(orderId: string): Promise<any[]> {
    if (pool) {
      const res = await pool.query(
        `SELECT oi.*, p.name, p.images[1] as image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [orderId]
      );
      return res.rows.map(oi => ({
        ...oi,
        price: parseFloat(oi.price)
      }));
    }
    const store = loadJsonDb();
    const items = store.order_items.filter(oi => oi.order_id === orderId);
    return items.map(oi => {
      const p = store.products.find(prod => prod.id === oi.product_id);
      return {
        ...oi,
        name: p ? p.name : 'Unknown Product',
        image: p && p.images && p.images[0] ? p.images[0] : ''
      };
    });
  },

  async createOrder(order: any, items: any[]): Promise<any> {
    const id = 'ord-' + Math.random().toString(36).substr(2, 9);
    const orderNumber = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
    const freshOrder = {
      id,
      user_id: order.user_id,
      order_number: orderNumber,
      status: 'Placed',
      total: parseFloat(order.total),
      subtotal: parseFloat(order.subtotal),
      shipping_fee: parseFloat(order.shipping_fee || 0),
      discount: parseFloat(order.discount || 0),
      coupon_code: order.coupon_code || null,
      shipping_address: order.shipping_address,
      payment_method: 'COD',
      payment_status: 'Pending',
      qikink_order_id: order.qikink_order_id || null,
      qikink_tracking_id: order.qikink_tracking_id || null,
      qikink_tracking_url: order.qikink_tracking_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO orders (id, user_id, order_number, status, total, subtotal, shipping_fee, discount, coupon_code, shipping_address, payment_method, payment_status, qikink_order_id, qikink_tracking_id, qikink_tracking_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          freshOrder.id, freshOrder.user_id, freshOrder.order_number, freshOrder.status,
          freshOrder.total, freshOrder.subtotal, freshOrder.shipping_fee, freshOrder.discount,
          freshOrder.coupon_code, JSON.stringify(freshOrder.shipping_address), freshOrder.payment_method,
          freshOrder.payment_status, freshOrder.qikink_order_id, freshOrder.qikink_tracking_id, freshOrder.qikink_tracking_url,
          freshOrder.created_at, freshOrder.updated_at
        ]
      );

      for (const item of items) {
        const item_id = 'oi-' + Math.random().toString(36).substr(2, 9);
        await pool.query(
          `INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item_id, freshOrder.id, item.product_id, item.variant_id, item.quantity, parseFloat(item.price)]
        );

        // Deduct inventory
        await pool.query(
          `UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
      return freshOrder;
    }

    const store = loadJsonDb();
    store.orders.push(freshOrder);

    for (const item of items) {
      const item_id = 'oi-' + Math.random().toString(36).substr(2, 9);
      store.order_items.push({
        id: item_id,
        order_id: freshOrder.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: parseInt(item.quantity, 10),
        price: parseFloat(item.price),
        created_at: new Date().toISOString()
      });

      // Deduct local stock
      const pIdx = store.products.findIndex(p => p.id === item.product_id);
      if (pIdx !== -1) {
        store.products[pIdx].stock = Math.max(0, store.products[pIdx].stock - item.quantity);
      }
    }

    saveJsonDb(store);
    return freshOrder;
  },

  async updateOrderStatus(id: string, updates: { status?: string; payment_status?: string; qikink_tracking_id?: string; qikink_tracking_url?: string }): Promise<any> {
    if (pool) {
      const keys = Object.keys(updates);
      const vals = Object.values(updates);
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const res = await pool.query(
        `UPDATE orders SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, ...vals]
      );
      if (!res.rows[0]) return null;
      const o = res.rows[0];
      return {
        ...o,
        total: parseFloat(o.total),
        subtotal: parseFloat(o.subtotal),
        shipping_fee: parseFloat(o.shipping_fee || 0),
        discount: parseFloat(o.discount || 0),
        shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
      };
    }

    const store = loadJsonDb();
    const idx = store.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      store.orders[idx] = { ...store.orders[idx], ...updates, updated_at: new Date().toISOString() };
      saveJsonDb(store);
      return store.orders[idx];
    }
    return null;
  },

  // --- RETURNS ---
  async getReturns(): Promise<any[]> {
    if (pool) {
      const res = await pool.query(
        `SELECT r.*, o.order_number, u.email as user_email
         FROM returns r
         JOIN orders o ON r.order_id = o.id
         JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC`
      );
      return res.rows;
    }
    const store = loadJsonDb();
    return store.returns.map(r => {
      const o = store.orders.find(ord => ord.id === r.order_id);
      const u = store.users.find(usr => usr.id === r.user_id);
      return {
        ...r,
        order_number: o ? o.order_number : 'N/A',
        user_email: u ? u.email : 'N/A'
      };
    });
  },

  async createReturn(ret: { order_id: string; user_id: string; reason: string }): Promise<any> {
    const id = 'ret-' + Math.random().toString(36).substr(2, 9);
    const freshRet = {
      id,
      order_id: ret.order_id,
      user_id: ret.user_id,
      reason: ret.reason,
      status: 'Requested',
      refund_status: 'Pending',
      admin_notes: '',
      created_at: new Date().toISOString()
    };

    if (pool) {
      await pool.query(
        `INSERT INTO returns (id, order_id, user_id, reason, status, refund_status, admin_notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [freshRet.id, freshRet.order_id, freshRet.user_id, freshRet.reason, freshRet.status, freshRet.refund_status, freshRet.admin_notes, freshRet.created_at]
      );
      // Mark order as Return Requested
      await pool.query(`UPDATE orders SET status = 'Return Requested' WHERE id = $1`, [ret.order_id]);
      return freshRet;
    }

    const store = loadJsonDb();
    store.returns.push(freshRet);
    const oIdx = store.orders.findIndex(ord => ord.id === ret.order_id);
    if (oIdx !== -1) {
      store.orders[oIdx].status = 'Return Requested';
    }
    saveJsonDb(store);
    return freshRet;
  },

  async updateReturn(id: string, updates: { status?: string; refund_status?: string; admin_notes?: string }): Promise<any> {
    if (pool) {
      const keys = Object.keys(updates);
      const vals = Object.values(updates);
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const res = await pool.query(
        `UPDATE returns SET ${sets} WHERE id = $1 RETURNING *`,
        [id, ...vals]
      );

      // If status accepted/rejected or refunded updates, change order status correspondingly
      const updatedRet = res.rows[0];
      if (updatedRet) {
        let orderStatus = '';
        if (updatedRet.status === 'Approved') orderStatus = 'Returned';
        if (updatedRet.status === 'Rejected') orderStatus = 'Delivered'; // Reverts
        if (updatedRet.refund_status === 'Refunded') orderStatus = 'Refunded';

        if (orderStatus) {
          await pool.query(`UPDATE orders SET status = $1 WHERE id = $2`, [orderStatus, updatedRet.order_id]);
        }
      }
      return updatedRet;
    }

    const store = loadJsonDb();
    const idx = store.returns.findIndex(r => r.id === id);
    if (idx !== -1) {
      store.returns[idx] = { ...store.returns[idx], ...updates };

      let orderStatus = '';
      if (store.returns[idx].status === 'Approved') orderStatus = 'Returned';
      if (store.returns[idx].status === 'Rejected') orderStatus = 'Delivered';
      if (store.returns[idx].refund_status === 'Refunded') orderStatus = 'Refunded';

      if (orderStatus) {
        const oIdx = store.orders.findIndex(ord => ord.id === store.returns[idx].order_id);
        if (oIdx !== -1) {
          store.orders[oIdx].status = orderStatus;
        }
      }

      saveJsonDb(store);
      return store.returns[idx];
    }
    return null;
  },

  async logSentEmail(emailRecord: { recipient: string; subject: string; body: string; type: string; status: string }): Promise<any> {
    const id = 'em-' + Math.random().toString(36).substr(2, 9);
    const freshEmail = {
      id,
      recipient: emailRecord.recipient,
      subject: emailRecord.subject,
      body: emailRecord.body,
      type: emailRecord.type,
      status: emailRecord.status,
      created_at: new Date().toISOString()
    };
    if (pool) {
      await pool.query(
        `INSERT INTO sent_emails (id, recipient, subject, body, type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [freshEmail.id, freshEmail.recipient, freshEmail.subject, freshEmail.body, freshEmail.type, freshEmail.status, freshEmail.created_at]
      );
      return freshEmail;
    }
    const store = loadJsonDb();
    if (!store.sent_emails) store.sent_emails = [];
    store.sent_emails.push(freshEmail);
    saveJsonDb(store);
    return freshEmail;
  },

  async getSentEmails(): Promise<any[]> {
    if (pool) {
      const res = await pool.query('SELECT * FROM sent_emails ORDER BY created_at DESC');
      return res.rows;
    }
    const store = loadJsonDb();
    return store.sent_emails || [];
  }
};
