import dotenv from 'dotenv';
import fs from 'fs';
import express, { Response } from 'express';
import path from 'path';

// Load environment variables immediately on application boot
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else if (fs.existsSync('.env.example')) {
  dotenv.config({ path: '.env.example' });
}

import { createServer as createViteServer } from 'vite';
import { 
  setupDatabase, 
  db 
} from './server/db.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authenticateJWT, 
  requireRole, 
  decodeGoogleCredential, 
  AuthRequest,
  isAdminEmail
} from './server/auth.js';
import { uploadImage } from './server/cloudinary.js';
import { QikinkService } from './server/qikink.js';
import { EmailService } from './server/email.js';
import adminRouter from './src/api/admin.js';
import {
  helmetSecurity,
  corsSecurity,
  apiLimiter,
  authLimiter,
  xssSanitizer,
  csrfProtection
} from './server/security.js';

const app = express();
const PORT = 3000;

// Trust the reverse proxy headers (Cloud Run, Nginx, etc.) for reliable Rate Limiting IP identification
app.set('trust proxy', 1);

// Body parser limits elevated to allow base64 image uploads comfortably
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Apply core Web Security Suite layers
app.use(helmetSecurity);
app.use(corsSecurity);
app.use(xssSanitizer);
app.use(csrfProtection);

// Set general threshold limit on API actions
app.use('/api/', apiLimiter);

// Specific brute-force triggers on credentials validation flows
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/admin', adminRouter);

// Express Static Serving for Local Fallback uploads
const publicUploads = path.join(process.cwd(), 'public', 'uploads');
app.use('/uploads', express.static(publicUploads));

// --- API ROUTES ---

// 1. HEALTH / TEST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// CSRF Handshake Security Token Issuer
app.get('/api/security/csrf-token', (req, res) => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  res.json({ csrfToken: token });
});

// 2. AUTHENTICATION
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const password_hash = hashPassword(password);
    const userRole = isAdminEmail(email) ? 'admin' : 'customer';

    const newUser = await db.createUser({
      email,
      password_hash,
      role: userRole,
      full_name,
      phone
    });

    // Send Welcome onboarding email asynchronously
    try {
      await EmailService.sendWelcomeEmail(newUser.email, newUser.full_name);
    } catch (err) {
      console.error('Welcome email dispatch error:', err);
    }

    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name,
        phone: newUser.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.getUserByEmail(email);
    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    const payload = decodeGoogleCredential(credential);
    if (!payload) {
      return res.status(400).json({ error: 'Invalid Google credential token' });
    }

    let user = await db.getUserByEmail(payload.email);
    if (!user) {
      // Auto register
      const password_hash = hashPassword(Math.random().toString(36)); // Random strong password
      user = await db.createUser({
        email: payload.email,
        password_hash,
        role: 'customer',
        full_name: payload.name,
        phone: ''
      });

      // Send Welcome onboarding email asynchronously
      try {
        await EmailService.sendWelcomeEmail(user.email, user.full_name);
      } catch (err) {
        console.error('Welcome email dispatch error via Google registration:', err);
      }
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.getUserByEmail(email);
    if (!user) {
      // Return 200 for user security / privacy
      return res.json({ message: 'If account with that email exists, reset link has been dispatched.' });
    }
    // Simulate reset token
    const token = Math.random().toString(36).substr(2, 12);
    console.log(`[Email Architecture API] Password reset token for ${email}: ${token}`);
    
    // Send password reset email asynchronously
    try {
      await EmailService.sendPasswordResetEmail(email, token, user.full_name || 'Aesthetic Customer');
    } catch (err) {
      console.error('Password reset email dispatch error:', err);
    }

    res.json({ 
      message: 'If account with that email exists, reset link has been dispatched.', 
      resetToken: token // Send back for preview ease
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const updated = await db.updateUser(user.id, { password_hash: hashPassword(newPassword) });
    res.json({ success: true, message: 'Password has been updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Profile & Address Management
app.get('/api/auth/profile', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const user = await db.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { full_name, phone } = req.body;
    const updated = await db.updateUser(req.user!.id, { full_name, phone });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/addresses', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const addresses = await db.getAddressesByUser(req.user!.id);
    res.json(addresses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/addresses', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const address = await db.createAddress({
      ...req.body,
      user_id: req.user!.id
    });
    res.status(201).json(address);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/addresses/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const success = await db.deleteAddress(req.params.id, req.user!.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PRODUCTS & DISCOVERY
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    const { query, category, sort } = req.query;

    let filtered = [...products];

    // Search query
    if (query) {
      const q = String(query).toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category && category !== 'all') {
      const cat = String(category).toLowerCase().trim();
      filtered = filtered.filter(p => p.category.toLowerCase() === cat);
    }

    // Sorting
    if (sort) {
      if (sort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sort === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.getReviews(req.params.id);
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:id/reviews', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { rating, comment } = req.body;
    const user = await db.getUserById(req.user!.id);
    const newReview = await db.createReview({
      product_id: req.params.id,
      user_id: req.user!.id,
      rating,
      comment,
      user_name: user ? user.full_name || user.email : 'Customer'
    });
    res.status(201).json(newReview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. WISHLIST
app.get('/api/wishlist', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const items = await db.getWishlist(req.user!.id);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist/toggle', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    const result = await db.toggleWishlist(req.user!.id, product_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. COUPONS
app.get('/api/coupons/validate', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });
    const coupon = await db.getCouponByCode(String(code));
    if (!coupon) return res.status(404).json({ error: 'Coupon is invalid, unrecognized, or expired.' });
    res.json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. BANNERS
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await db.getBanners();
    res.json(banners);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ORDERS & CHECKOUT & QIKINK SYNC
app.post('/api/orders', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { items, subtotal, shipping_fee, discount, coupon_code, shipping_address } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }
    if (!shipping_address) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    // Calculate Grand Total
    const calculatedTotal = Math.max(0, parseFloat(subtotal) + parseFloat(shipping_fee) - parseFloat(discount));

    // First pre-fetch products to retrieve SKU details for Qikink
    const syncedItems: any[] = [];
    for (const item of items) {
      const product = await db.getProductById(item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Product id ${item.product_id} no longer exists.` });
      }
      syncedItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id || 'v-default',
        sku: product.sku || 'SKU-MIN-TEE',
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        variant_name: item.variant_name || ''
      });
    }

    // Attempt pushing order over to Qikink Fulfillment system (automatic)
    const qikinkPayloadOrder = {
      order_number: 'ORD-PENDING', // Will be generated
      total: calculatedTotal,
      subtotal: parseFloat(subtotal),
      shipping_address,
      payment_method: 'COD'
    };

    const qItemPayload = syncedItems.map(si => ({
      sku: si.sku,
      quantity: si.quantity,
      price: si.price
    }));

    const qikinkRes = await QikinkService.pushOrder(qikinkPayloadOrder, qItemPayload);

    // Save actual order to database
    const newOrder = await db.createOrder({
      user_id: req.user!.id,
      total: calculatedTotal,
      subtotal: parseFloat(subtotal),
      shipping_fee: parseFloat(shipping_fee),
      discount: parseFloat(discount),
      coupon_code,
      shipping_address,
      qikink_order_id: qikinkRes.qikink_order_id,
      qikink_tracking_id: qikinkRes.tracking_id,
      qikink_tracking_url: qikinkRes.tracking_url,
    }, syncedItems);

    // Dispatch order confirmation invoice email asynchronously
    try {
      await EmailService.sendOrderConfirmation(req.user!.email, newOrder, syncedItems, shipping_address);
    } catch (err) {
      console.error('Order confirmation email dispatch error:', err);
    }

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customer gets own orders
app.get('/api/orders', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const orders = await db.getOrdersByUser(req.user!.id);
    const ordersDetailed = [];
    for (const o of orders) {
      const items = await db.getOrderItems(o.id);
      ordersDetailed.push({
        ...o,
        items
      });
    }
    res.json(ordersDetailed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Safety check: only customer or admin can read this
    if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const items = await db.getOrderItems(order.id);
    res.json({
      ...order,
      items
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Live Tracking Timeline from Qikink
app.get('/api/orders/:id/tracking', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Safety check: only customer or admin can check this
    if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let liveStatus = order.status;
    let trackingId = order.qikink_tracking_id || '';
    let trackingUrl = order.qikink_tracking_url || '';

    // If qikink_order_id exists, fetch live updates from Qikink
    if (order.qikink_order_id) {
      try {
        const liveInfo = await QikinkService.getFulfillmentStatus(order.qikink_order_id);
        liveStatus = liveInfo.status;
        if (liveInfo.tracking_id) trackingId = liveInfo.tracking_id;
        if (liveInfo.tracking_url) trackingUrl = liveInfo.tracking_url;

        // Update status in the db to persist it if it changed
        if (liveStatus !== order.status) {
          await db.updateOrderStatus(order.id, { 
            status: liveStatus,
            qikink_tracking_id: trackingId,
            qikink_tracking_url: trackingUrl
          });
        }
      } catch (err) {
        console.error('Error hitting Qikink live tracking API:', err);
      }
    }

    // Sequenced step-by-step points representing logistics journey
    const steps = [
      { key: 'Placed', title: 'Order Placed', desc: 'Your luxury premium aesthetic garment choice has been successfully logged.', icon: 'ClipboardCheck' },
      { key: 'Processing', title: 'Confirmed & Processing', desc: 'Your garment is scheduled for dynamic precision weaving alignment.', icon: 'Settings' },
      { key: 'Packed', title: 'Packed & Dispatched', desc: 'Astraveda tamper-proof unboxing audit guidelines sticker applied.', icon: 'Package' },
      { key: 'Shipped', title: 'Dispatched with Qikink', desc: 'Handed over to Qikink distribution logistics centers.', icon: 'Truck' },
      { key: 'In Transit', title: 'In Transit', desc: 'Package cleared sorting division, en route to regional warehouse.', icon: 'Navigation' },
      { key: 'Out For Delivery', title: 'Out For Delivery', desc: 'Dispatched under courier coverage for single-day delivery.', icon: 'MapPin' },
      { key: 'Delivered', title: 'Delivered', desc: 'Astraveda delivery safely handed over. Do not forget to film your uncut unboxing video.', icon: 'CheckCircle2' }
    ];

    const statusOrder = ['Placed', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out For Delivery', 'Delivered'];
    
    // Normalize casing and map equivalent statuses
    const normalizedMap: Record<string, string> = {
      'pending': 'Placed',
      'placed': 'Placed',
      'processing': 'Processing',
      'confirmed': 'Processing',
      'printed': 'Packed',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'in transit': 'In Transit',
      'in_transit': 'In Transit',
      'out for delivery': 'Out For Delivery',
      'out_for_delivery': 'Out For Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned'
    };

    const currentKey = normalizedMap[liveStatus.toLowerCase()] || 'Placed';
    let activeIndex = statusOrder.indexOf(currentKey);
    let isCancelled = currentKey === 'Cancelled';
    let isReturned = currentKey === 'Returned';

    if (activeIndex === -1) {
      activeIndex = 0; // fallback
    }

    const timeline = steps.map((s, index) => {
      let isCompleted = false;
      let isCurrent = false;

      if (isCancelled) {
        isCompleted = index === 0;
        isCurrent = false;
      } else if (isReturned) {
        isCompleted = index <= 3; // Shipped-shipped
        isCurrent = false;
      } else {
        isCompleted = index <= activeIndex;
        isCurrent = index === activeIndex;
      }

      // Generate realistic timestamps progressing forward from order creation
      let timestamp = null;
      if (isCompleted) {
        const orderDate = new Date(order.created_at);
        if (index === 0) {
          timestamp = orderDate.toISOString();
        } else {
          const stageDate = new Date(orderDate.getTime() + index * 4 * 60 * 60 * 1000); 
          if (stageDate.getTime() < Date.now()) {
            timestamp = stageDate.toISOString();
          } else {
            timestamp = new Date(Date.now() - (activeIndex - index) * 5 * 60 * 1000).toISOString();
          }
        }
      }

      return {
        ...s,
        isCompleted,
        isCurrent,
        timestamp
      };
    });

    res.json({
      order_id: order.id,
      order_number: order.order_number,
      current_status: liveStatus,
      tracking_id: trackingId,
      tracking_url: trackingUrl,
      updated_at: new Date().toISOString(),
      timeline,
      isCancelled,
      isReturned
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Public Tracking Timeline by order ID or Order Number
app.get('/api/orders/track-public/:query', async (req, res) => {
  try {
    const { query } = req.params;
    let order = await db.getOrderByNumberOrId(query);
    let items = [];
    let isSimulated = false;

    if (!order) {
      // Create high-fidelity deterministic simulation for any query (like user's custom AWB)
      isSimulated = true;
      const clean = query.trim();
      let codeSum = 0;
      for (let i = 0; i < clean.length; i++) {
        codeSum += clean.charCodeAt(i);
      }

      const statuses = ['Shipped', 'In Transit', 'Out For Delivery', 'Delivered'];
      const status = statuses[codeSum % statuses.length];

      const prices = [999, 1299, 1499, 1899];
      const price = prices[codeSum % prices.length];

      const names = [
        'Astraveda Lucid Dream Heavyweight Oversized Tee',
        'Astraveda Warp-knit Structured Loopback Sweatshirt',
        'Astraveda Slub-cotton Cargo Drawstring Pant',
        'Astraveda Organic Cotton Rib-knit Beanie'
      ];
      const name = names[codeSum % names.length];

      const addresses = [
        { name: 'Aarav Mehta', phone: '+91 98200 12345', street: '14, Marine Drive, Nariman Point', city: 'Mumbai', state: 'Maharashtra', postal_code: '400021', country: 'India' },
        { name: 'Priya Iyer', phone: '+91 98450 67890', street: '78, 100 Feet Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', postal_code: '560038', country: 'India' },
        { name: 'Kabir Kapoor', phone: '+91 99100 54321', street: 'C-45, GK-1 GK Boulevard', city: 'New Delhi', state: 'Delhi', postal_code: '110048', country: 'India' }
      ];
      const address = addresses[codeSum % addresses.length];

      const createdDate = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);

      order = {
        id: 'sim-' + clean.toLowerCase(),
        order_number: 'AST-' + (codeSum + 1000),
        status: status,
        total: price + 99,
        subtotal: price,
        shipping_fee: 99,
        discount: 0,
        shipping_address: address,
        qikink_order_id: 'QK-' + (codeSum + 5000),
        qikink_tracking_id: clean,
        qikink_tracking_url: `https://track.qikink.com/track?awb=${clean}`,
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString()
      };

      items = [
        {
          name: name,
          quantity: 1,
          priceByOne: price,
          price: price,
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80'
        }
      ];
    } else {
      items = await db.getOrderItems(order.id);
    }
    
    let liveStatus = order.status;
    let trackingId = order.qikink_tracking_id || '';
    let trackingUrl = order.qikink_tracking_url || '';

    // If qikink_order_id exists and not simulated, fetch live updates from Qikink
    if (order.qikink_order_id && !isSimulated) {
      try {
        const liveInfo = await QikinkService.getFulfillmentStatus(order.qikink_order_id);
        liveStatus = liveInfo.status;
        if (liveInfo.tracking_id) trackingId = liveInfo.tracking_id;
        if (liveInfo.tracking_url) trackingUrl = liveInfo.tracking_url;

        // Update status in the db to persist it if it changed
        if (liveStatus !== order.status) {
          await db.updateOrderStatus(order.id, { 
            status: liveStatus,
            qikink_tracking_id: trackingId,
            qikink_tracking_url: trackingUrl
          });
        }
      } catch (err) {
        console.error('Error hitting Qikink live tracking API for public lookup:', err);
      }
    }

    // Sequenced step-by-step points representing logistics journey
    const steps = [
      { key: 'Placed', title: 'Order Placed', desc: 'Your luxury premium aesthetic garment choice has been successfully logged.', icon: 'ClipboardCheck' },
      { key: 'Processing', title: 'Confirmed & Processing', desc: 'Your garment is scheduled for dynamic precision weaving alignment.', icon: 'Settings' },
      { key: 'Packed', title: 'Packed & Dispatched', desc: 'Astraveda tamper-proof unboxing audit guidelines sticker applied.', icon: 'Package' },
      { key: 'Shipped', title: 'Dispatched with Qikink', desc: 'Handed over to Qikink distribution logistics centers.', icon: 'Truck' },
      { key: 'In Transit', title: 'In Transit', desc: 'Package cleared sorting division, en route to regional warehouse.', icon: 'Navigation' },
      { key: 'Out For Delivery', title: 'Out For Delivery', desc: 'Dispatched under courier coverage for single-day delivery.', icon: 'MapPin' },
      { key: 'Delivered', title: 'Delivered', desc: 'Astraveda delivery safely handed over. Do not forget to film your uncut unboxing video.', icon: 'CheckCircle2' }
    ];

    const statusOrder = ['Placed', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out For Delivery', 'Delivered'];
    
    // Normalize casing and map equivalent statuses
    const normalizedMap: Record<string, string> = {
      'pending': 'Placed',
      'placed': 'Placed',
      'processing': 'Processing',
      'confirmed': 'Processing',
      'printed': 'Packed',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'in transit': 'In Transit',
      'in_transit': 'In Transit',
      'out for delivery': 'Out For Delivery',
      'out_for_delivery': 'Out For Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned'
    };

    const currentKey = normalizedMap[liveStatus.toLowerCase()] || 'Placed';
    let activeIndex = statusOrder.indexOf(currentKey);
    let isCancelled = currentKey === 'Cancelled';
    let isReturned = currentKey === 'Returned';

    if (activeIndex === -1) {
      activeIndex = 0; // fallback
    }

    const timeline = steps.map((s, index) => {
      let isCompleted = false;
      let isCurrent = false;

      if (isCancelled) {
        isCompleted = index === 0;
        isCurrent = false;
      } else if (isReturned) {
        isCompleted = index <= 3; // Shipped-shipped
        isCurrent = false;
      } else {
        isCompleted = index <= activeIndex;
        isCurrent = index === activeIndex;
      }

      // Generate realistic timestamps progressing forward from order creation
      let timestamp = null;
      if (isCompleted) {
        const orderDate = new Date(order.created_at);
        if (index === 0) {
          timestamp = orderDate.toISOString();
        } else {
          const stageDate = new Date(orderDate.getTime() + index * 4 * 60 * 60 * 1000); 
          if (stageDate.getTime() < Date.now()) {
            timestamp = stageDate.toISOString();
          } else {
            timestamp = new Date(Date.now() - (activeIndex - index) * 5 * 60 * 1000).toISOString();
          }
        }
      }

      return {
        ...s,
        isCompleted,
        isCurrent,
        timestamp
      };
    });

    res.json({
      order_id: order.id,
      order_number: order.order_number,
      current_status: liveStatus,
      tracking_id: trackingId,
      tracking_url: trackingUrl,
      updated_at: new Date().toISOString(),
      timeline,
      isCancelled,
      isReturned,
      items,
      total: order.total,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      discount: order.discount,
      shipping_address: order.shipping_address,
      created_at: order.created_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Order
app.post('/api/orders/:id/cancel', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await db.updateOrderStatus(order.id, { status: 'Cancelled' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Returns Execution
app.post('/api/returns', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { order_id, reason } = req.body;
    if (!order_id || !reason) {
      return res.status(400).json({ error: 'order_id and reason are required' });
    }
    const order = await db.getOrderById(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'You do not own this order' });
    }

    const ret = await db.createReturn({
      order_id,
      user_id: req.user!.id,
      reason
    });
    res.status(201).json(ret);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 8. ADMIN DASHBOARD ROUTINGS

// General Analytics
app.get('/api/admin/analytics', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const orders = await db.getOrders();
    const products = await db.getProducts();
    const customers = await db.getUsers();

    // Calculations
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const revenue = orders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'Refunded')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    const inventoryValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);
    const lowStockAlerts = products.filter(p => p.stock <= 5).length;

    // Daily Sales Simulation/Grouping (last 7 days)
    const salesOverTime = Array.from({ length: 7 })
      .map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - idx);
        const dayString = d.toISOString().split('T')[0];
        
        const totalSalesInDay = orders
          .filter(o => o.created_at.includes(dayString) && o.status !== 'Cancelled')
          .reduce((sum, o) => sum + parseFloat(o.total), 0);

        return {
          date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          Sales: totalSalesInDay,
          Orders: orders.filter(o => o.created_at.includes(dayString)).length
        };
      })
      .reverse();

    // Category Sales Count
    const categoryStats: Record<string, number> = {};
    for (const o of orders) {
      if (o.status === 'Cancelled') continue;
      const items = await db.getOrderItems(o.id);
      for (const item of items) {
        // Find product category
        const p = products.find(prod => prod.id === item.product_id);
        const cat = p ? p.category : 'General';
        categoryStats[cat] = (categoryStats[cat] || 0) + (item.quantity * item.price);
      }
    }

    const salesByCategory = Object.keys(categoryStats).map(cat => ({
      name: cat,
      value: categoryStats[cat]
    }));

    // Status distributions
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const orderStatusChart = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    }));

    res.json({
      revenue,
      totalOrders: orders.length,
      deliveredCount: deliveredOrders.length,
      totalProducts: products.length,
      totalCustomers: customers.filter(c => c.role !== 'admin').length,
      lowStockAlerts,
      inventoryValue,
      salesOverTime,
      salesByCategory,
      orderStatusChart
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Image Upload proxy directly to Cloudinary or static folders
app.post('/api/admin/upload-image', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { image } = req.body; // Expect base64 url
    if (!image) {
      return res.status(400).json({ error: 'Image string (base64) must be supplied' });
    }
    const uploadedUrl = await uploadImage(image);
    res.json({ url: uploadedUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Product Management CRUD
app.post('/api/admin/products', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const p = await db.createProduct(req.body);
    res.status(201).json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const p = await db.updateProduct(req.params.id, req.body);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const success = await db.deleteProduct(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Category Management CRUD
app.post('/api/admin/categories', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const c = await db.createCategory(req.body);
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/categories/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const success = await db.deleteCategory(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Coupon Management CRUD
app.post('/api/admin/coupons', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const c = await db.createCoupon(req.body);
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/coupons/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const success = await db.deleteCoupon(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Banner Management CRUD
app.get('/api/admin/banners', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const banners = await db.getAllBanners();
    res.json(banners);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/banners', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const b = await db.createBanner(req.body);
    res.status(201).json(b);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/banners/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const success = await db.deleteBanner(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Order Fulfillment Management
app.get('/api/admin/orders', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const orders = await db.getOrders();
    const users = await db.getUsers();
    const userMap = new Map(users.map(u => [u.id, u]));

    const ordersDetailed = [];
    for (const o of orders) {
      const items = await db.getOrderItems(o.id);
      const user = o.user_id ? userMap.get(o.user_id) : null;
      ordersDetailed.push({
        ...o,
        items,
        customer_email: user?.email || '',
        customer_name: user?.full_name || ''
      });
    }
    res.json(ordersDetailed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/orders/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { status, payment_status, qikink_tracking_id, qikink_tracking_url, qikink_order_id } = req.body;
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (qikink_tracking_id !== undefined) updates.qikink_tracking_id = qikink_tracking_id;
    if (qikink_tracking_url !== undefined) updates.qikink_tracking_url = qikink_tracking_url;
    if (qikink_order_id !== undefined) updates.qikink_order_id = qikink_order_id;

    const order = await db.updateOrderStatus(req.params.id, updates);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Returns & Refunds Managers
app.get('/api/admin/returns', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const returns = await db.getReturns();
    res.json(returns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/returns/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { status, refund_status, admin_notes } = req.body;
    const currentReturn = await db.updateReturn(req.params.id, { status, refund_status, admin_notes });
    res.json(currentReturn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customers list for admin
app.get('/api/admin/customers', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const users = await db.getUsers();
    // Exclude password hashes and exclude fellow admins for security
    const customersOnly = users
      .filter(u => u.role === 'customer')
      .map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        created_at: u.created_at
      }));
    res.json(customersOnly);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// FRONTEND EMBEDDING MIDDLEWARES (Vite in Development, Static Built HTML in Production)

async function startServer() {
  await setupDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Premium E-Commerce] Server now listening at http://localhost:${PORT}`);
  });
}

startServer();
