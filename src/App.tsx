import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MapPin, 
  ShoppingBag, 
  Check, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  Truck, 
  CornerUpLeft, 
  Star, 
  Sparkles, 
  Percent, 
  MessageCircle,
  HelpCircle,
  X,
  CreditCard,
  User,
  ExternalLink,
  Instagram
} from 'lucide-react';
import { Product, Category, Banner, Address, Coupon, Order, User as UserType } from './types';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import ProductCard from './components/ProductCard';
import ReviewsList from './components/ReviewsList';
import AdminDashboard from './components/AdminDashboard';
import ProductDetailsView from './components/ProductDetailsView';
import OrdersView from './components/OrdersView';
import AuthFlowView from './components/AuthFlowView';
import PolicyModal from './components/PolicyModal';

export default function App() {
  // Theme State
  const [dark, setDark] = useState(false);

  // Rotating Premium Announcements Strip
  const announcements = [
    "✨ Free Express Shipping on order values exceeding ₹4,999",
    "⚡ Secure Cash On Delivery (COD) supported across India with unboxing unedited video protections",
    "🛍️ Curated Contemporary Apparels, high-end Comfort Footwear, & Travel Daypacks",
    "💫 Authentic and trackable consignments synced with dynamic logistics logs"
  ];
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  useEffect(() => {
    const annInterval = setInterval(() => {
      setAnnouncementIdx(prev => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(annInterval);
  }, []);

  // Policy Modal States
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<'terms' | 'policy' | 'privacy'>('terms');

  const openPolicyModal = (tab: 'terms' | 'policy' | 'privacy') => {
    setPolicyInitialTab(tab);
    setIsPolicyOpen(true);
  };

  // Authenticated State
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Global Lists States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  
  // Shopping Cart State (Local & Session persisted)
  const [cart, setCart] = useState<Array<{ product: Product; variantId: string; quantity: number }>>([]);
  const [saveForLater, setSaveForLater] = useState<Array<{ product: Product; variantId: string }>>([]);

  // Navigational states
  const [currentView, setCurrentView] = useState<string>('home'); // home, shop, details, cart, wishlist, checkout, orders, addresses, login, register, forgot-password, reset-password, admin
  const [viewArgument, setViewArgument] = useState<string | null>(null);

  // Checkout calculation helper states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  // Create / Manage Address Forms
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false
  });

  // Newsletter subscription email
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isJoinedEliteCircle, setIsJoinedEliteCircle] = useState(false);
  const [registeredVipEmail, setRegisteredVipEmail] = useState('');
  const [vipCardCode, setVipCardCode] = useState('');

  // UI Toast indicators
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch / Sync core states on load
  const loadCoreCollections = async () => {
    try {
      const [rProd, rCat, rBan] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/banners')
      ]);

      if (rProd.ok) setProducts(await rProd.json());
      if (rCat.ok) setCategories(await rCat.json());
      if (rBan.ok) setBanners(await rBan.json());
    } catch (err) {
      console.error('Failed to load initial collections:', err);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auth synchronization check
  const syncUserSession = async (userToken: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const uProfile = await res.json();
        setUser(uProfile);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        
        // Load user-bound profiles
        syncUserBoundStates(userToken);
      } else {
        // Stale session
        handleLogout();
      }
    } catch (err) {
      console.error('Error establishing user credentials:', err);
    }
  };

  const syncUserBoundStates = async (userToken: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${userToken}` };
      const [rWish, rAdd] = await Promise.all([
        fetch('/api/wishlist', { headers }),
        fetch('/api/auth/addresses', { headers })
      ]);

      if (rWish.ok) setWishlist(await rWish.json());
      if (rAdd.ok) {
        const addrList = await rAdd.json();
        setAddresses(addrList);
        const def = addrList.find((a: Address) => a.is_default);
        if (def) setSelectedAddress(def);
        else if (addrList.length > 0) setSelectedAddress(addrList[0]);
      }
    } catch (err) {
      console.error('Failed syncing user data keys:', err);
    }
  };

  useEffect(() => {
    loadCoreCollections();

    // Check localStorage credentials
    const cachedToken = localStorage.getItem('token');
    if (cachedToken) {
      syncUserSession(cachedToken);
    }

    // Persist cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (p) { console.error(p); }
    }
    const savedLater = localStorage.getItem('savelater');
    if (savedLater) {
      try { setSaveForLater(JSON.parse(savedLater)); } catch (p) { console.error(p); }
    }
  }, []);

  // Update localStorage when cart updates
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('savelater', JSON.stringify(saveForLater));
  }, [saveForLater]);

  // Dark/Light Mode toggle helper
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setWishlist([]);
    setAddresses([]);
    setSelectedAddress(null);
    setAppliedCoupon(null);
    localStorage.removeItem('token');
    showNotification('Disconnected successfully.', 'success');
    setCurrentView('home');
  };

  // GENERAL WORKFLOW CONTROLLERS
  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      setCurrentView('login');
      return;
    }

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });

      if (res.ok) {
        const { active } = await res.json();
        showNotification(
          active ? 'Item added to wishlist favorites!' : 'Item removed from wishlist.',
          'success'
        );
        // Sync wishlist state
        const syncRes = await fetch('/api/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (syncRes.ok) setWishlist(await syncRes.json());
      }
    } catch (err) {
      showNotification('Network issue adding details to favorite wishlist.', 'error');
    }
  };

  const handleAddToCart = (productId: string, variantId?: string, qty = 1) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.stock === 0) {
      showNotification('Apologies! Item is entirely out of stock currently.', 'error');
      return;
    }

    const selectedVar = variantId || prod.variants?.[0]?.id || 'v-default';

    setCart(prev => {
      const exists = prev.findIndex(item => item.product.id === productId && item.variantId === selectedVar);
      if (exists !== -1) {
        const updated = [...prev];
        const newQty = updated[exists].quantity + qty;
        if (newQty > prod.stock) {
          showNotification(`Only ${prod.stock} stock units available at our warehouse.`, 'error');
          return prev;
        }
        updated[exists].quantity = newQty;
        showNotification(`Updated item quantity in cart!`, 'success');
        return updated;
      } else {
        showNotification(`${prod.name} successfully packed inside cart!`, 'success');
        return [...prev, { product: prod, variantId: selectedVar, quantity: qty }];
      }
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    showNotification('Item extracted from your cart.', 'success');
  };

  const handleSaveForLater = (index: number) => {
    const item = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    setSaveForLater(prev => {
      const exists = prev.some(l => l.product.id === item.product.id && l.variantId === item.variantId);
      if (exists) return prev;
      return [...prev, { product: item.product, variantId: item.variantId }];
    });
    showNotification('Item set aside for later consideration.', 'success');
  };

  const handleMoveToCart = (index: number) => {
    const item = saveForLater[index];
    setSaveForLater(prev => prev.filter((_, i) => i !== index));
    handleAddToCart(item.product.id, item.variantId, 1);
  };

  const syncAddresses = async () => {
    try {
      const res = await fetch('/api/auth/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setAddresses(list);
        if (!selectedAddress && list.length > 0) setSelectedAddress(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });
      if (res.ok) {
        showNotification('Fulfillment address registered in records!', 'success');
        setAddressForm({
          name: '', phone: '', street: '', city: '', state: '', postal_code: '', country: 'India', is_default: false
        });
        setShowAddressForm(false);
        syncAddresses();
      }
    } catch (err) {
      showNotification('Failed creating address.', 'error');
    }
  };

  // Google Sign-In Simulation
  const handleGoogleMockIn = async (customEmail?: string, customName?: string) => {
    try {
      // Simulate OAuth decoding
      const finalEmail = customEmail || 'cartoontoday.333@gmail.com';
      const finalName = customName || 'Cartoon Today';
      const sampleToken = 'header.' + btoa(JSON.stringify({
        email: finalEmail,
        name: finalName,
        sub: 'g-' + Math.random().toString(36).substr(2, 9)
      })) + '.signature';

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: sampleToken })
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        syncUserBoundStates(data.token);
        showNotification('Connected securely with Google!', 'success');
        setCurrentView('home');
      }
    } catch (err) {
      showNotification('Google Authentication unaligned.', 'error');
    }
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingFee = cartSubtotal >= 100 || cartSubtotal === 0 ? 0 : 15;
  const eligibleDiscount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? parseFloat(((appliedCoupon.discount_value / 100) * cartSubtotal).toFixed(2))
      : appliedCoupon.discount_value
    : 0;

  const orderTotal = Math.max(0, cartSubtotal + shippingFee - eligibleDiscount);

  // Validate coupon
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.toUpperCase().trim()}`);
      if (res.ok) {
        const coupon: Coupon = await res.json();
        if (cartSubtotal < coupon.min_order_value) {
          showNotification(`Minimum card value required for this code is ₹${coupon.min_order_value}.`, 'error');
          return;
        }
        setAppliedCoupon(coupon);
        showNotification('Promo Coupon successfully enabled on invoice!', 'success');
      } else {
        showNotification('Coupon code is invalid or unrecognized.', 'error');
      }
    } catch (e) {
      showNotification('Network checking coupon error.', 'error');
    }
  };

  // Checkout order placement (Cash on Delivery)
  const handlePlaceOrderCOD = async () => {
    if (!selectedAddress) {
      showNotification('An authorized shipping address is required.', 'error');
      return;
    }

    try {
      const orderPayload = {
        items: cart.map(item => ({
          product_id: item.product.id,
          variant_id: item.variantId,
          quantity: item.quantity
        })),
        subtotal: cartSubtotal,
        shipping_fee: shippingFee,
        discount: eligibleDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        shipping_address: selectedAddress
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const orderSummary = await res.json();
        showNotification('Purchase Completed! COD registered dynamically with Qikink Logistics.', 'success');
        setCart([]); // Clear Cart
        setAppliedCoupon(null);
        setCouponCode('');
        // Route to tracking details of this order!
        setCurrentView('orders');
        setViewArgument(orderSummary.id);
      } else {
        showNotification('Fulfillment sync issue. Please retry checkout.', 'error');
      }
    } catch (err) {
      showNotification('Network errors routing COD shipment.', 'error');
    }
  };

  // Newsletter Section Handle
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      const randomCode = 'ASTRA-ELITE-' + Math.floor(1000 + Math.random() * 9000);
      setRegisteredVipEmail(newsletterEmail.trim());
      setVipCardCode(randomCode);
      setIsJoinedEliteCircle(true);
      showNotification('Welcome to Astraveda Elite! Your VIP membership has been generated.', 'success');
      setNewsletterEmail('');
    }
  };


  // --- VIEW RENDERING ENGINE ---

  // A. HOMEPAGE VIEW
  const renderHome = () => {
    return (
      <div className="space-y-16 pb-16 animate-fade-in" id="homepage-viewport">
        
        {/* Banner slides */}
        <HeroBanner banners={banners} onNavigate={onNavigate} />

        {/* Categories Discovery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
                Category Collections
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Engineered essentials matching your lifestyle and creation routines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {categories.map(cat => {
              const matchedCount = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate('shop', `category:${cat.name}`)}
                  className="relative aspect-video rounded-3xl overflow-hidden cursor-pointer group shadow-sm border border-zinc-200/50 dark:border-zinc-850/80"
                >
                  <img
                    src={cat.image}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.6] group-hover:scale-105 transition-transform duration-700"
                    alt={cat.name}
                  />
                  {/* Subtle hover backlight vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/20 to-zinc-950/20 group-hover:opacity-90 transition duration-305"></div>
                  
                  {/* Absolute Badge showing dynamic number of designs */}
                  <span className="absolute top-4 right-4 bg-white/10 dark:bg-zinc-900/40 backdrop-blur-md text-white border border-white/20 dark:border-zinc-800/60 font-mono text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-xl select-none font-bold">
                    {matchedCount > 0 ? `${matchedCount} Designs` : 'Curated'}
                  </span>

                  <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                    <h3 className="text-lg font-display font-extrabold capitalize tracking-tight flex items-center gap-1.5 group-hover:text-emerald-450 transition">
                      {cat.name}
                      <span className="text-zinc-400 group-hover:translate-x-1 transition-transform duration-200">&rarr;</span>
                    </h3>
                    <p className="text-[11px] text-zinc-300 font-medium mt-1 line-clamp-1">{cat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
                Trending Essentials
              </h2>
              <p className="text-zinc-500 text-sm mt-1">Special selections matching our premium criteria.</p>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline"
            >
              Browse All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.slice(0, 3).map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                isWishlisted={wishlist.some(w => w.product_id === prod.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onViewDetails={(pid) => onNavigate('details', pid)}
              />
            ))}
          </div>
        </div>

        {/* Brand Core Badges Section */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border-y border-zinc-200/50 dark:border-zinc-800/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex gap-4 items-center text-left">
              <span className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Truck className="h-6 w-6" />
              </span>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-155">Free Shipping Coverage</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Complimentary express dispatch on all order bills over ₹4999.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center text-left">
              <span className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-155">Real COD Logistics</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Place order risk-free. Complete your transaction upon physical parcels handovers.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center text-left">
              <span className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <CornerUpLeft className="h-6 w-6" />
              </span>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-155">7-Day Return Cycles</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Unhappy with size details? File a Return Request easily in purchase histories.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Big Newsletter Form - Astraveda Elite Club */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[40px] overflow-hidden border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 p-8 sm:p-12 lg:p-16">
            
            {/* Design accents - soft premium light leak glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Premium Pitch */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.25em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Astraveda Elite Circle
                </span>

                <h2 className="text-3xl sm:text-4.5xl font-display font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
                  Unlock the Future of <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Elite Performance</span>
                </h2>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                  Join a community of athletes, creators, and pioneers. Membership activates private capsule releases, certified tamper-proof shipping benefits, and direct tracking integrations.
                </p>

                {/* Exclusive Benefit Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 mt-0.5 p-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-mono">First-Drop Private Access</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Reserve new designs before general releases.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 mt-0.5 p-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Truck className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Elite Courier Privileges</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Free insured transit on all order baskets.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 mt-0.5 p-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-mono">15% Welcome Blessing</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">A welcome code credited automatically to checkout.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 mt-0.5 p-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Personalized Support</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Direct routing to our sizing and logistics board.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Golden/Platinum VIP Card */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center">
                
                {isJoinedEliteCircle ? (
                  /* GORGEOUS PREMIUM MEMBERSHIP CARD */
                  <div className="w-full max-w-[360px] aspect-[1.58/1] rounded-3xl bg-zinc-950 p-6 flex flex-col justify-between border border-zinc-800 shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden select-none hover:rotate-1 hover:scale-103 transition duration-500 group">
                    {/* Glowing holographic backlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-zinc-950 to-zinc-900" />
                    {/* Diagonal shine line */}
                    <div className="absolute -inset-full rotate-45 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-extrabold tracking-[0.25em] text-emerald-400 font-mono block">ELITE MEMBER</span>
                        <div className="font-serif tracking-tighter text-white font-extrabold text-xl">ASTRAVEDA</div>
                      </div>
                      {/* Premium gold microchip */}
                      <div className="w-9 h-7 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border border-amber-200/55 shadow-inner flex flex-col justify-between p-1.5 gap-1 select-none pointer-events-none opacity-90">
                        <div className="h-full w-full border-t border-b border-amber-700/30 grid grid-cols-3 gap-0.5">
                          <div className="border-r border-amber-700/30" />
                          <div className="border-r border-amber-700/30" />
                          <div />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 my-4 text-left">
                      {/* VIP Code */}
                      <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">EXCLUSIVE PASS</span>
                      <span className="text-lg font-mono text-zinc-100 tracking-[0.2em] font-black uppercase shadow-xs">
                        {vipCardCode}
                      </span>
                    </div>

                    <div className="relative z-10 flex justify-between items-end">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">REGISTERED APPLICANT</span>
                        <span className="text-[11px] font-mono text-zinc-300 font-medium line-clamp-1 max-w-[180px]">
                          {registeredVipEmail}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          LVL 01 ACTIVATED
                        </span>
                      </div>
                    </div>

                    {/* Unsubscribe / Re-enter trigger */}
                    <button 
                      onClick={() => setIsJoinedEliteCircle(false)}
                      className="absolute bottom-2 right-4 text-[9px] text-zinc-600 hover:text-zinc-500 transition cursor-pointer shrink-0"
                    >
                      Reset Invite
                    </button>
                  </div>
                ) : (
                  /* NEWSLETTER INPUT FORM & PREVIEW */
                  <div className="w-full max-w-[360px] space-y-6">
                    {/* Card Preview placeholder */}
                    <div className="aspect-[1.58/1] rounded-3xl bg-zinc-900/40 dark:bg-zinc-950/20 border-2 border-dashed border-zinc-200/60 dark:border-zinc-800/80 p-6 flex flex-col justify-between relative overflow-hidden select-none opacity-80">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[8px] font-extrabold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-mono block">MEMBER PASS</span>
                          <div className="font-serif tracking-tighter text-zinc-400 dark:text-zinc-550 font-extrabold text-xl">A</div>
                        </div>
                        <div className="w-9 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-700" />
                      </div>
                      <div className="text-center py-2">
                        <span className="text-[10px] font-mono tracking-widest text-zinc-400 dark:text-zinc-550 block font-bold uppercase">AWAITING CREDENTIALS</span>
                      </div>
                      <div className="flex justify-between items-end text-left">
                        <span className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase font-mono font-bold">STEREOTYPE: NOT VERIFIED</span>
                        <span className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase font-mono font-bold">STATUS: LOCKED</span>
                      </div>
                    </div>

                    {/* Simple Premium Form */}
                    <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="Insert your premium email address..."
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 rounded-2xl px-5 py-3.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition shadow-inner"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-extrabold transition shadow-md shadow-zinc-900/15 text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer min-h-0"
                      >
                        Claim Invitation <Sparkles className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-500 animate-pulse" />
                      </button>
                    </form>
                  </div>
                )}

              </div>

            </div>
          </div>
        </div>

      </div>
    );
  };

  // B. PRODUCTS SHOP ENGINE WITH SMART SEARCHES
  const renderShop = () => {
    // Collect specific constraints from nav logic
    let filterCategory = 'all';
    let filterSearch = '';

    if (viewArgument) {
      if (viewArgument.startsWith('category:')) {
        filterCategory = viewArgument.split('category:')[1];
      } else if (viewArgument.startsWith('search:')) {
        filterSearch = viewArgument.split('search:')[1];
      }
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left" id="shopping-viewport">
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-805">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
              {filterCategory !== 'all' ? `${filterCategory}` : filterSearch ? `Matches for: "${filterSearch}"` : 'Browse Shop Catalog'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Smart discovery engine sorting premium, authentic, trackable apparel and essentials.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('shop')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition ${
                filterCategory === 'all' && !filterSearch 
                  ? 'bg-zinc-900 text-white dark:bg-emerald-500 border-transparent' 
                  : 'bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigate('shop', `category:${cat.name}`)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition capitalize ${
                  filterCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-zinc-900 text-white dark:bg-emerald-500 border-transparent'
                    : 'bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* List Grid */}
        <div className="mt-8">
          {products.filter(p => {
            if (filterCategory !== 'all' && p.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
            if (filterSearch) {
              const qs = filterSearch.toLowerCase();
              return p.name.toLowerCase().includes(qs) || p.description.toLowerCase().includes(qs) || p.category.toLowerCase().includes(qs);
            }
            return true;
          }).length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/50">
              <p className="text-zinc-500 font-medium">We couldn't trace any catalog items matching your filter query.</p>
              <button onClick={() => onNavigate('shop')} className="mt-4 px-4 py-2 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-bold rounded-xl">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products
                .filter(p => {
                  if (filterCategory !== 'all' && p.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
                  if (filterSearch) {
                    const qs = filterSearch.toLowerCase();
                    return p.name.toLowerCase().includes(qs) || p.description.toLowerCase().includes(qs) || p.category.toLowerCase().includes(qs);
                  }
                  return true;
                })
                .map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isWishlisted={wishlist.some(w => w.product_id === prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(pid) => onNavigate('details', pid)}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // C. DETAILED SINGLE PRODUCT VIEW
  const renderDetails = () => {
    return (
      <ProductDetailsView
        products={products}
        viewArgument={viewArgument}
        onNavigate={onNavigate}
        handleAddToCart={handleAddToCart}
        handleToggleWishlist={handleToggleWishlist}
        wishlist={wishlist}
        user={user}
      />
    );
  };

  // D. SHOPPING CART VIEW
  const renderCart = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left" id="cart-viewport">
        <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-800">
          Shopping Cart ({cart.length})
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 mt-8">
            <p className="text-zinc-400 font-medium text-sm">Your shopping bag is completely empty.</p>
            <button
              onClick={() => onNavigate('shop')}
              className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-white text-xs rounded-xl transition"
            >
              Browse Shop Collections
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            
            {/* Left Column: Cart list */}
            <div className="lg:col-span-8 space-y-4">
              {cart.map((item, idx) => {
                const primaryImage = item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120';
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img src={primaryImage} referrerPolicy="no-referrer" className="h-16 w-16 object-cover rounded-xl bg-zinc-50" />
                      <div>
                        <h4 className="font-semibold text-base text-zinc-900 dark:text-white">{item.product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.product.category}</span>
                          <span className="text-zinc-200 dark:text-zinc-700">|</span>
                          <span className="text-[10px] font-mono text-emerald-500 font-bold">Variant ID: {item.variantId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-sm text-zinc-500">Unit Price</p>
                        <p className="font-bold text-base text-zinc-900 dark:text-white">₹{item.product.price}</p>
                      </div>

                      {/* Display Qty info */}
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-sm text-zinc-505">Qty</p>
                        <p className="font-mono font-bold text-base text-zinc-800 dark:text-zinc-200">x{item.quantity}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveForLater(idx)}
                          className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-500 text-[11px] font-bold rounded-xl border border-zinc-200 dark:border-zinc-750 transition min-h-0"
                        >
                          Save later
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}

              {/* SAVE FOR LATER SUB-PANELS */}
              {saveForLater.length > 0 && (
                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-white mb-4">
                    Items Set Aside For Later ({saveForLater.length})
                  </h3>
                  <div className="space-y-3">
                    {saveForLater.map((lItem, idx) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img src={lItem.product.images?.[0]} className="h-10 w-10 object-cover rounded-md" />
                          <div className="text-left">
                            <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{lItem.product.name}</h4>
                            <p className="text-[10px] text-zinc-400">Variant: {lItem.variantId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMoveToCart(idx)}
                            className="px-3.5 py-1 text-xs font-bold bg-emerald-500 text-white rounded-lg min-h-0"
                          >
                            Move to Bag
                          </button>
                          <button
                            onClick={() => setSaveForLater(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-zinc-400 hover:text-red-500 min-h-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Invoice Calculation & Code Checkouts */}
            <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-900/60 p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 h-fit space-y-6">
              <h3 className="text-lg font-bold font-display text-zinc-900 dark:text-white">Checkout invoice</h3>
              
              <div className="space-y-3 border-b border-zinc-200 dark:border-zinc-805 pb-4">
                <div className="flex justify-between text-sm text-zinc-650 dark:text-zinc-300">
                  <span>Cart Items sum</span>
                  <span className="font-mono font-semibold">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-650 dark:text-zinc-300">
                  <span>Shipping Fee</span>
                  <span className="font-mono font-semibold">{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-emerald-500 font-medium">
                    <span>Coupon Value ({appliedCoupon.code})</span>
                    <span className="font-mono font-bold">-₹{eligibleDiscount}</span>
                  </div>
                )}
              </div>

              {/* Coupon inputs bar */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Apply promotion coupon</label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs uppercase"
                  />
                  <button
                    onClick={handleValidateCoupon}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-semibold min-h-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display">Grand Total (COD):</span>
                <span className="text-2xl font-bold font-display text-zinc-900 dark:text-white">₹{orderTotal}</span>
              </div>

              {user ? (
                <button
                  onClick={() => onNavigate('checkout')}
                  className="w-full px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-extrabold text-sm rounded-xl transition shadow-md shadow-emerald-500/10 text-center"
                >
                  Proceed to Secure Checkout
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="w-full px-5 py-3.5 bg-zinc-900 text-white rounded-xl text-sm font-bold transition text-center"
                >
                  Sign In to Check Out
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    );
  };

  // E. CHECKOUT COD PANEL
  const renderCheckout = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left" id="checkout-viewport">
        <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-800">
          Delivery Configuration
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 mt-8">
          
          {/* Left Side: Address Selection */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-xl font-bold font-display text-zinc-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="h-5 w-5 text-emerald-500" />
              1. Delivery Address Selection
            </h3>

            {addresses.length === 0 ? (
              <div className="p-6 bg-amber-50 dark:bg-amber-950/25 border border-amber-200/50 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-2xl text-sm font-medium">
                No delivery addresses registered on profile database. Proceed with adding a new delivery coordinate below to complete checking out.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAddress(a)}
                    className={`p-4 rounded-2xl border cursor-pointer select-none relative transition flex flex-col justify-between text-left ${
                      selectedAddress?.id === a.id
                        ? 'border-emerald-500 bg-emerald-500/[0.02]'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{a.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{a.phone}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2.5 leading-relaxed">{a.street}</p>
                      <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-0.5">{a.city}, {a.state} - {a.postal_code}</p>
                    </div>

                    {selectedAddress?.id === a.id && (
                      <span className="absolute top-4 right-4 h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* In-Line Address creation toggle */}
            {!showAddressForm ? (
              <button
                onClick={() => setShowAddressForm(true)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 transition"
              >
                Add Delivery Address Coordinate +
              </button>
            ) : (
              <form onSubmit={handleCreateAddress} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-250 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <h4 className="text-sm font-bold font-display text-zinc-900 dark:text-white md:col-span-2">New Delivery Contact</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Contact Name</label>
                  <input
                    type="text" required placeholder="Full Name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Mobile Line</label>
                  <input
                    type="text" required placeholder="Phone Number"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Street coordinate details</label>
                  <input
                    type="text" required placeholder="Building, Block, Area, Street Address"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">City</label>
                  <input
                    type="text" required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">State</label>
                  <input
                    type="text" required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Postal Code (ZIP)</label>
                  <input
                    type="text" required
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Country</label>
                  <input
                    type="text" required disabled
                    value={addressForm.country}
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl p-2 text-xs"
                  />
                </div>

                <div className="md:col-span-2 flex gap-3 justify-end pt-3 text-xs">
                  <button type="button" onClick={() => setShowAddressForm(false)} className="font-semibold text-zinc-550">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold">Register Coordinates</button>
                </div>
              </form>
            )}
          </div>

          {/* Right Side: Invoice breakdown + COD Checkbox */}
          <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl h-fit space-y-6">
            <h3 className="text-xl font-bold font-display text-zinc-900 dark:text-white flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              2. Transaction Invoice
            </h3>

            {/* Calculations summaries */}
            <div className="space-y-3.5 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-zinc-650 dark:text-zinc-400">
                  <span className="line-clamp-1">{item.product.name} (x{item.quantity})</span>
                  <span className="font-mono">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 text-xs text-zinc-550 dark:text-zinc-500">
              <div className="flex justify-between">
                <span>Subtotal Items</span>
                <span className="font-mono">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Dispatch Cost</span>
                <span className="font-mono">{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Coupon deduction</span>
                  <span className="font-mono">-₹{eligibleDiscount}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold uppercase font-display text-zinc-900 dark:text-white">Amount Due COD:</span>
              <span className="text-2xl font-bold font-display text-zinc-900 dark:text-white">₹{orderTotal}</span>
            </div>

            {/* Solid Verified COD Badge */}
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl flex items-start gap-3 border border-emerald-500/10">
              <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3" />
              </span>
              <div className="text-left font-sans select-none">
                <h4 className="font-bold text-xs">Premium Cash On Delivery (COD)</h4>
                <p className="text-[10px] text-zinc-500 dark:text-emerald-400/80 leading-relaxed mt-1">
                  Waybills and delivery routes are automatically compiled with Qikink Logistics APIs immediately upon purchase completion. No digital pre-payment required.
                </p>
              </div>
            </div>

            <button
              onClick={handlePlaceOrderCOD}
              disabled={!selectedAddress}
              className="w-full px-5 py-4 bg-emerald-500 disabled:opacity-40 text-zinc-950 font-extrabold text-sm rounded-xl transition shadow-lg shadow-emerald-500/10 text-center uppercase tracking-wide"
            >
              Confirm Cash On Delivery Order
            </button>
          </div>

        </div>
      </div>
    );
  };

  // F. TRANSACTION HISTORY / PARCELS TRACKING STATE
  const renderOrders = () => {
    return (
      <OrdersView
        token={token}
        showNotification={showNotification}
        onOpenPolicy={openPolicyModal}
      />
    );
  };

  // G. AUTH FLOW VIEWS
  const renderAuth = (viewType: 'login' | 'register' | 'forgot-password') => {
    return (
      <AuthFlowView
        viewType={viewType}
        onNavigate={onNavigate}
        setToken={setToken}
        setUser={setUser}
        syncUserBoundStates={syncUserBoundStates}
        showNotification={showNotification}
        handleGoogleMockIn={handleGoogleMockIn}
      />
    );
  };

  // H. ADDRESS BOOK VIEW (CUSTOMER PROFILE SETTING)
  const renderAddressBook = () => {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-left" id="addressbook-viewport">
        <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-805">
          Delivery coordinates Book
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {addresses.map(a => (
            <div key={a.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl relative">
              <h4 className="font-bold text-sm text-zinc-905 dark:text-zinc-150 uppercase tracking-tight">{a.name}</h4>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{a.phone}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-350 mount-line mt-3 leading-relaxed">{a.street}</p>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-0.5">{a.city}, {a.state} - {a.postal_code}</p>
              
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/auth/addresses/${a.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                      showNotification('Delivery coordinate removed.', 'success');
                      syncAddresses();
                    }
                  } catch (e) {
                    showNotification('Error deleting address coordinate.', 'error');
                  }
                }}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 rounded-lg min-h-0"
                title="Delete coordinates"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Form add coordinate inline */}
        <div className="mt-8 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Register Delivery Address</h3>
          <form onSubmit={handleCreateAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Contact Name</label>
              <input
                type="text" required placeholder="Full Name details"
                value={addressForm.name}
                onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Mobile Details</label>
              <input
                type="text" required placeholder="Mobile Contact"
                value={addressForm.phone}
                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Line Address</label>
              <input
                type="text" required placeholder="Apartment, Street and Area coordinate info"
                value={addressForm.street}
                onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">City</label>
              <input
                type="text" required
                value={addressForm.city}
                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">State</label>
              <input
                type="text" required
                value={addressForm.state}
                onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Zip / postal code</label>
              <input
                type="text" required
                value={addressForm.postal_code}
                onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs animate-fade-in"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Country</label>
              <input
                type="text" required disabled
                value={addressForm.country}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-400 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="sm:col-span-2 pt-3 flex justify-end">
              <button type="submit" className="px-5 py-3.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-bold text-sm">
                Register Coordinates
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // I. WISHLIST VIEW
  const renderWishlist = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left" id="wishlist-viewport">
        <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-800">
          Saved Favorites ({wishlist.length})
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 mt-8">
            <p className="text-zinc-400 font-medium text-sm">No details loaded in wishlist folder.</p>
            <button
              onClick={() => onNavigate('shop')}
              className="mt-6 px-6 py-2.5 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
            >
              Trace Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {wishlist.map(item => {
              // Map to Product template format for <ProductCard />
              const dummyProd: Product = {
                id: item.product_id,
                name: item.name,
                description: '',
                category: 'T-Shirts',
                price: item.price,
                compare_at_price: item.compare_at_price,
                stock: item.stock,
                sku: '',
                images: [item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
                variants: [],
                created_at: ''
              };
              return (
                <ProductCard
                  key={dummyProd.id}
                  product={dummyProd}
                  isWishlisted={true}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={handleAddToCart}
                  onViewDetails={(pid) => onNavigate('details', pid)}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };


  // Central navigational router
  function onNavigate(view: string, arg?: string) {
    setCurrentView(view);
    if (arg) setViewArgument(arg);
    else setViewArgument(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-150 transition-colors duration-250 font-sans flex flex-col justify-between">
      
      {/* Toast Notification bar */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 dark:bg-emerald-500 text-white font-semibold text-sm py-4 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-zinc-850">
          <Sparkles className="h-4.5 w-4.5 text-amber-400" />
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:text-red-400 min-h-0"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Rotating Dynamic Header Announcement Strip */}
      <div className="bg-zinc-950 dark:bg-zinc-900 text-[10.5px] uppercase tracking-widest font-bold font-mono text-zinc-300 dark:text-zinc-400 py-2.5 px-4 text-center border-b border-zinc-900/60 transition-all duration-300 select-none flex items-center justify-center gap-2">
        <span className="inline-block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
        <span className="transition-all duration-500 transform font-semibold truncate max-w-full">
          {announcements[announcementIdx]}
        </span>
      </div>

      {/* Primary Sticky Navbar */}
      <Navbar
        user={user}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        dark={dark}
        setDark={setDark}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      {/* Central View Router */}
      <main className="flex-grow">
        {currentView === 'home' && renderHome()}
        {currentView === 'shop' && renderShop()}
        {currentView === 'details' && renderDetails()}
        {currentView === 'cart' && renderCart()}
        {currentView === 'wishlist' && renderWishlist()}
        {currentView === 'checkout' && renderCheckout()}
        {currentView === 'orders' && renderOrders()}
        {currentView === 'addresses' && renderAddressBook()}
        {currentView === 'login' && renderAuth('login')}
        {currentView === 'register' && renderAuth('register')}
        {currentView === 'forgot-password' && renderAuth('forgot-password')}
        
        {currentView === 'admin' && (
          user?.role === 'admin' ? (
            <AdminDashboard 
              onNavigate={onNavigate} 
              onShowNotification={showNotification} 
            />
          ) : (
            <div className="max-w-md mx-auto py-20 px-4 text-center animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-xl">
                <ShieldCheck className="h-16 w-16 mx-auto text-emerald-500" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Console Access</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  This console is strictly restricted to authorized store administrators. Please log in using your verified administrator account credentials.
                </p>
                <button
                  onClick={() => {
                    setCurrentView('login');
                  }}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold rounded-xl transition text-xs uppercase tracking-wider block"
                >
                  Go to Secure Login Page
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer block */}
      <footer className="bg-black text-zinc-400 border-t border-zinc-900 py-12 md:py-16 text-left relative overflow-hidden select-none animate-fade-in">
        
        {/* Soft dark corner glows to elevate premium look */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
          
          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <div 
              onClick={() => onNavigate('home')} 
              className="flex items-center gap-3 cursor-pointer select-none group"
              id="footer-logo"
            >
              <div className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-transparent to-teal-500/20 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-serif tracking-tighter text-emerald-400 font-extrabold text-2xl group-hover:scale-110 transition-transform duration-300">
                  A
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-widest text-white leading-tight font-display">
                  ASTRAVEDA
                </span>
                <span className="text-[7.5px] font-extrabold tracking-[0.3em] text-emerald-400 uppercase mt-0.5 font-mono leading-none">
                  PREMIUM ATHLETICS
                </span>
              </div>
            </div>

            <p className="text-[12px] text-zinc-500 leading-relaxed max-w-sm">
              Sleek contemporary outdoor and athletic catalog engineered with premium comfort footwear, functional apparel, and reliable delivery routing.
            </p>

            <div className="pt-2">
              <a 
                href="https://www.instagram.com/astraveda_3/?__pwa=1#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-400 border border-zinc-800 text-[11px] font-semibold tracking-wider transition-all duration-300 group select-none cursor-pointer"
              >
                <Instagram className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Follow us @astraveda_3</span>
              </a>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-mono">Shop</h4>
            <ul className="text-xs space-y-2.5 select-none">
              <li>
                <button 
                  onClick={() => onNavigate('shop')} 
                  className="text-zinc-500 hover:text-white transition duration-200 cursor-pointer text-left min-h-0"
                >
                  Browse Catalog
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('wishlist')} 
                  className="text-zinc-500 hover:text-white transition duration-200 cursor-pointer text-left min-h-0"
                >
                  My wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Portal Operations */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-mono">Orders</h4>
            <ul className="text-xs space-y-2.5 select-none text-zinc-550">
              <li>
                <button 
                  onClick={() => onNavigate('orders')} 
                  className="text-zinc-500 hover:text-white transition duration-200 cursor-pointer text-left min-h-0"
                >
                  Track Purchase
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('addresses')} 
                  className="text-zinc-500 hover:text-white transition duration-200 cursor-pointer text-left min-h-0"
                >
                  Saved Addresses
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Assurance */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-mono">Assurance</h4>
            <ul className="text-xs space-y-2.5 select-none">
              <li>
                <button 
                  type="button"
                  onClick={() => openPolicyModal('policy')} 
                  className="text-zinc-500 hover:text-white transition duration-200 cursor-pointer text-left min-h-0"
                >
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => openPolicyModal('privacy')} 
                  className="text-zinc-500 hover:text-white transition duration-200 cursor-pointer text-left min-h-0"
                >
                  Privacy Framework
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Outer bottom copyright strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-905 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-zinc-600">
          <p>© 2026 Astraveda. Secured Payment Protections Integrated.</p>
          <div className="flex gap-4 font-semibold shrink-0">
            <button type="button" onClick={() => openPolicyModal('terms')} className="hover:text-zinc-350 transition cursor-pointer min-h-0">Terms</button>
            <button type="button" onClick={() => openPolicyModal('policy')} className="hover:text-zinc-350 transition cursor-pointer min-h-0">Returns</button>
            <button type="button" onClick={() => openPolicyModal('privacy')} className="hover:text-zinc-350 transition cursor-pointer min-h-0">Privacy</button>
          </div>
        </div>
      </footer>

      {/* Global Assurance Policy Modal */}
      <PolicyModal 
        isOpen={isPolicyOpen} 
        onClose={() => setIsPolicyOpen(false)} 
        initialTab={policyInitialTab} 
      />

    </div>
  );
}
