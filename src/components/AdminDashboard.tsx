import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  FolderLock, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Edit3, 
  AlertTriangle, 
  Check, 
  X, 
  Image, 
  RefreshCw, 
  Truck,
  HeartHandshake,
  Tag,
  Search,
  Mail
} from 'lucide-react';
import { Product, Category, Coupon, Order, ReturnRequest, Banner } from '../types';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function AdminDashboard({ onNavigate, onShowNotification }: AdminDashboardProps) {
  // Sidebar Tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'coupons' | 'banners' | 'returns' | 'emails'>('analytics');

  // Core API State Data
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);

  // Form Modals / Expanders
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    compare_at_price: '',
    stock: '',
    sku: '',
    imagesStr: '', // comma-separated URLs
    variantsStr: '[{"id":"v-1","name":"Medium","stock":50}]',
    seo_title: '',
    seo_description: ''
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: ''
  });

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '',
    active: true
  });

  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    image_url: '',
    title: '',
    subtitle: '',
    link: '',
    active: true
  });

  // Manual tracking edits
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [tempTrackingId, setTempTrackingId] = useState('');
  const [tempTrackingUrl, setTempTrackingUrl] = useState('');
  const [tempQikinkOrderId, setTempQikinkOrderId] = useState('');

  // Uploading trigger
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dynamic inline restocking logic for persistent alerts
  const [restockQuantities, setRestockQuantities] = useState<Record<string, number>>({});
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(true);

  const token = localStorage.getItem('token');

  // Fetch all collections
  const loadAdminState = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel reads
      const [rAnal, rProd, rCat, rCoup, rBan, rOrd, rRet, rCust, rEmail] = await Promise.all([
        fetch('/api/admin/analytics', { headers }),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/coupons', { headers }),
        fetch('/api/admin/banners', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/returns', { headers }),
        fetch('/api/admin/customers', { headers }),
        fetch('/api/admin/emails', { headers })
      ]);

      if (rAnal.ok) setAnalytics(await rAnal.json());
      if (rProd.ok) setProducts(await rProd.json());
      if (rCat.ok) setCategories(await rCat.json());
      if (rCoup.ok) setCoupons(await rCoup.json());
      if (rBan.ok) setBanners(await rBan.json());
      if (rOrd.ok) setOrders(await rOrd.json());
      if (rRet.ok) setReturns(await rRet.json());
      if (rCust.ok) setCustomers(await rCust.json());
      if (rEmail.ok) setEmails(await rEmail.json());

    } catch (err) {
      onShowNotification('Error syncing admin console dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const restockProductOrVariant = async (product: Product, variantId?: string, qty: number = 50) => {
    try {
      let updatedVariants = [...(product.variants || [])];
      let updatedProductStock = product.stock;

      if (variantId) {
        updatedVariants = updatedVariants.map(v => 
          v.id === variantId ? { ...v, stock: qty } : v
        );
      } else {
        updatedProductStock = qty;
      }

      const payload = {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        compare_at_price: product.compare_at_price,
        stock: updatedProductStock,
        sku: product.sku,
        images: product.images,
        variants: updatedVariants,
        seo_title: product.seo_title,
        seo_description: product.seo_description
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onShowNotification(`Stock updated to ${qty} successfully!`, 'success');
        loadAdminState();
      } else {
        const errorData = await res.json();
        onShowNotification(errorData.error || 'Failed to update stock.', 'error');
      }
    } catch (err) {
      onShowNotification('Error during inline restock request.', 'error');
    }
  };

  useEffect(() => {
    loadAdminState();
  }, [activeTab]);

  // Handle Base64 Image Upload
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Str })
        });
        
        if (res.ok) {
          const data = await res.json();
          // Update corresponding form file inputs
          if (showProductModal) {
            setProductForm(prev => ({
              ...prev,
              imagesStr: prev.imagesStr ? `${prev.imagesStr},${data.url}` : data.url
            }));
          } else if (showCategoryModal) {
            setCategoryForm(prev => ({ ...prev, image: data.url }));
          } else if (showBannerForm) {
            setBannerForm(prev => ({ ...prev, image_url: data.url }));
          }
          onShowNotification('Selected asset uploaded successfully.', 'success');
        } else {
          onShowNotification('Failed to upload selected file.', 'error');
        }
      } catch (err) {
        onShowNotification('Connection failure uploading asset.', 'error');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // PRODUCTS SUB-CONTROLS
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      category: categories[0]?.name || '',
      price: '',
      compare_at_price: '',
      stock: '',
      sku: '',
      imagesStr: '',
      variantsStr: '[{"id":"v-1","name":"Medium","stock":50}]',
      seo_title: '',
      seo_description: ''
    });
    setShowProductModal(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description,
      category: prod.category,
      price: String(prod.price),
      compare_at_price: prod.compare_at_price ? String(prod.compare_at_price) : '',
      stock: String(prod.stock),
      sku: prod.sku,
      imagesStr: prod.images?.join(',') || '',
      variantsStr: JSON.stringify(prod.variants || []),
      seo_title: prod.seo_title || '',
      seo_description: prod.seo_description || ''
    });
    setShowProductModal(true);
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const payload = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category || categories[0]?.name || 'T-Shirts',
        price: parseFloat(productForm.price),
        compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
        stock: parseInt(productForm.stock, 10),
        sku: productForm.sku || undefined,
        images: productForm.imagesStr.split(',').map(s => s.trim()).filter(Boolean),
        variants: JSON.parse(productForm.variantsStr || '[]'),
        seo_title: productForm.seo_title,
        seo_description: productForm.seo_description
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onShowNotification(`Product ${editingProduct ? 'updated' : 'created'} successfully!`, 'success');
        setShowProductModal(false);
        loadAdminState();
      } else {
        const errorData = await res.json();
        onShowNotification(errorData.error || 'Failed to save product configs.', 'error');
      }
    } catch (err) {
      onShowNotification('Error submitting product form.', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this product catalog item?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onShowNotification('Product catalog deleted successfully.', 'success');
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Connection error deleting catalog item.', 'error');
    }
  };

  // CATEGORIES PANEL
  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        onShowNotification('New discovery category registered successfully!', 'success');
        setShowCategoryModal(false);
        setCategoryForm({ name: '', description: '', image: '' });
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Error creating category category.', 'error');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products assigned will remain on record.')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onShowNotification('Category removed successfully.', 'success');
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Error deleting category.', 'error');
    }
  };

  // COUPONS PANEL
  const submitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...couponForm,
          discount_value: parseFloat(couponForm.discount_value),
          min_order_value: parseFloat(couponForm.min_order_value || '0')
        })
      });
      if (res.ok) {
        onShowNotification('Promotion coupon key created successfully!', 'success');
        setShowCouponModal(false);
        setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '', active: true });
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Error publishing coupon promo key.', 'error');
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onShowNotification('Coupon disabled/removed.', 'success');
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Error handling coupon deletion.', 'error');
    }
  };

  // BANNERS PANEL
  const submitBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bannerForm)
      });
      if (res.ok) {
        onShowNotification('Banner posted to storefront!', 'success');
        setShowBannerForm(false);
        setBannerForm({ image_url: '', title: '', subtitle: '', link: '', active: true });
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Error posting slider banner.', 'error');
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onShowNotification('Slider banner removed.', 'success');
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Error handling banner delete.', 'error');
    }
  };

  // ORDERS FULFILLMENT STATUS SWITCH
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      let url = `/api/admin/orders/${orderId}`;
      let method = 'PUT';
      let body: any = { status };

      if (status === 'Confirmed') {
        url = `/api/admin/orders/${orderId}/confirm`;
        method = 'POST';
        body = {};
      } else if (status === 'Cancelled') {
        url = `/api/admin/orders/${orderId}/cancel`;
        method = 'POST';
        body = {};
      } else if (status === 'Shipped') {
        url = `/api/admin/orders/${orderId}/shipped`;
        method = 'POST';
        body = {};
      } else if (status === 'Delivered') {
        url = `/api/admin/orders/${orderId}/delivered`;
        method = 'POST';
        body = {};
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method === 'POST' ? undefined : JSON.stringify(body)
      });
      if (res.ok) {
        onShowNotification(`Order status updated to: ${status}`, 'success');
        loadAdminState();
      } else {
        const errJson = await res.json().catch(() => ({}));
        onShowNotification(errJson.error || `Failed to update status to: ${status}`, 'error');
      }
    } catch (err) {
      onShowNotification('Connection failure in fulfillment command.', 'error');
    }
  };

  const updatePaymentStatus = async (orderId: string, payment_status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status })
      });
      if (res.ok) {
        onShowNotification(`COD Payment Status updated to: ${payment_status}`, 'success');
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Connection failure updating payment status.', 'error');
    }
  };

  const saveManualTracking = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qikink_tracking_id: tempTrackingId,
          qikink_tracking_url: tempTrackingUrl,
          qikink_order_id: tempQikinkOrderId
        })
      });
      if (res.ok) {
        onShowNotification('Order tracking details updated manually!', 'success');
        setEditingTrackingOrderId(null);
        loadAdminState();
      } else {
        const errorData = await res.json().catch(() => ({}));
        onShowNotification(errorData.error || 'Failed to update tracking details.', 'error');
      }
    } catch (err) {
      onShowNotification('Connection failure in update tracking details.', 'error');
    }
  };

  // RETURNS APPROVE / REJECT
  const updateReturnStatus = async (retId: string, status: 'Approved' | 'Rejected', refund_status?: 'Pending' | 'Refunded') => {
    try {
      const res = await fetch(`/api/admin/returns/${retId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status, 
          refund_status: refund_status || 'Pending',
          admin_notes: 'Fulfillment processed via Admin Console.'
        })
      });
      if (res.ok) {
        onShowNotification(`Return request status updated: ${status}`, 'success');
        loadAdminState();
      }
    } catch (err) {
      onShowNotification('Connection failure handling return decision.', 'error');
    }
  };

  // --- ALERTS COMPUTATION ---
  const lowStockAlerts: Array<{
    type: 'product' | 'variant';
    key: string;
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    currentStock: number;
    productObj: Product;
  }> = [];

  products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        if (v.stock < 10) {
          lowStockAlerts.push({
            type: 'variant',
            key: `p-${p.id}-v-${v.id}`,
            productId: p.id,
            productName: p.name,
            variantId: v.id,
            variantName: v.name,
            currentStock: v.stock,
            productObj: p
          });
        }
      });
    } else {
      if (p.stock < 10) {
        lowStockAlerts.push({
          type: 'product',
          key: `p-${p.id}-v-main`,
          productId: p.id,
          productName: p.name,
          currentStock: p.stock,
          productObj: p
        });
      }
    }
  });

  const pendingOrdersAlerts = orders.filter(o => ['Placed', 'Confirmed', 'Processing'].includes(o.status));
  const pendingReturnsAlerts = returns.filter(r => r.status === 'Pending');
  const totalAlertsCount = lowStockAlerts.length + pendingOrdersAlerts.length + pendingReturnsAlerts.length;

  const filteredOrders = orders.filter(o => {
    if (!orderSearchQuery) return true;
    const q = orderSearchQuery.toLowerCase();
    
    const matchId = o.id?.toLowerCase().includes(q) || o.order_number?.toLowerCase().includes(q);
    const matchName = o.shipping_address?.name?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q);
    const matchEmail = o.customer_email?.toLowerCase().includes(q);
    const matchPhone = o.shipping_address?.phone?.toLowerCase().includes(q);
    const matchZip = o.shipping_address?.postal_code?.toLowerCase().includes(q);
    
    return Boolean(matchId || matchName || matchEmail || matchPhone || matchZip);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-200" id="admin-workspace">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-805">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FolderLock className="h-8 w-8 text-emerald-500" />
            Admin Console Workspace
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Secure, full-stack real-time channel for inventories, fulfillment, promo coupon codes, and system configurations.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-805 text-zinc-800 dark:text-zinc-200 text-sm font-semibold transition"
        >
          View Client Homepage
        </button>
      </div>

      {/* SYSTEM ALERTS & HEALTH PANEL */}
      <div className="mt-6 animate-fade-in" id="system-alerts-dashboard">
        {totalAlertsCount > 0 ? (
          <div className="bg-red-500/5 dark:bg-zinc-900/60 border border-red-500/10 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all duration-300">
            <div className="flex items-center justify-between border-b border-red-500/10 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 font-sans flex items-center gap-1.5">
                  Persistent Status Alerts Centre ({totalAlertsCount})
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsAlertsPanelOpen(!isAlertsPanelOpen)}
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200/55 dark:border-zinc-800 rounded-lg shadow-sm cursor-pointer transition"
              >
                {isAlertsPanelOpen ? 'Collapse Overview' : 'Expand Alerts'}
              </button>
            </div>

            {isAlertsPanelOpen && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 animate-fade-in">
                {/* Low Stock Alerts */}
                <div className="md:col-span-6 space-y-3">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Low-Stock Inventories ({lowStockAlerts.length})
                  </p>
                  
                  {lowStockAlerts.length === 0 ? (
                    <p className="text-xs text-zinc-505 dark:text-zinc-400 italic">No critical variant stock alerts reported.</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {lowStockAlerts.map(alert => {
                        const inputVal = restockQuantities[alert.key] !== undefined ? restockQuantities[alert.key] : 50;
                        return (
                          <div 
                            key={alert.key} 
                            className="bg-white dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                            id={`low-stock-item-${alert.productId}`}
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200 line-clamp-1">{alert.productName}</p>
                              <div className="flex items-center gap-2">
                                {alert.type === 'variant' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-400 rounded-lg">
                                    Variant: {alert.variantName}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                                  Only {alert.currentStock} left
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <input 
                                type="number" 
                                min="1"
                                placeholder="Qty"
                                value={inputVal}
                                onChange={(e) => {
                                  let val = parseInt(e.target.value, 10);
                                  if (isNaN(val) || val < 1) val = 1;
                                  setRestockQuantities(prev => ({ ...prev, [alert.key]: val }));
                                }}
                                className="w-16 bg-zinc-55 dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs rounded-lg p-1 text-center font-semibold focus:outline-hidden focus:border-emerald-500 font-mono"
                              />
                              <button 
                                type="button"
                                onClick={() => restockProductOrVariant(alert.productObj, alert.variantId, inputVal)}
                                className="px-2.5 py-1 bg-emerald-505 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer transition flex items-center gap-1"
                              >
                                Restock
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Orders Warning Status */}
                <div className="md:col-span-3 space-y-3">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-emerald-500" />
                    Pending Shipments ({pendingOrdersAlerts.length})
                  </p>
                  
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800 p-4 rounded-xl space-y-3.5 shadow-sm">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Active customer orders in state <span className="font-semibold text-amber-500">Placed, Confirmed, or Processing</span> awaiting tracking deployment.
                    </p>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-805 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-zinc-200/55 dark:border-zinc-805"
                    >
                      Process Fulfillment Hub <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Returns Info */}
                <div className="md:col-span-3 space-y-3">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <HeartHandshake className="h-4 w-4 text-pink-500" />
                    Untriaged Returns ({pendingReturnsAlerts.length})
                  </p>
                  
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800 p-4 rounded-xl space-y-3.5 shadow-sm">
                    <p className="text-xs text-zinc-505 dark:text-zinc-400 leading-relaxed">
                      Customer products returns/refunds waiting for administrator status confirmation.
                    </p>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('returns')}
                      className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-805 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-zinc-200/55 dark:border-zinc-850"
                    >
                      Review Claim Records <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-emerald-500/5 dark:bg-zinc-900/40 border border-emerald-500/10 dark:border-zinc-805 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5" />
              All systems nominal. Inventories checked, pending checkout pipelines cleared.
            </p>
            <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
              Status Online
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* SIDE BAR NAVIGATION KEYS */}
        <div className="lg:col-span-3 space-y-1.5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-4 space-y-1">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-3">
              Dashboard Units
            </p>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <DollarSign className="h-4.5 w-4.5" /> Core Analytics
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'products'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4.5 w-4.5" /> Products (CRUD)
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'categories'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Image className="h-4.5 w-4.5" /> Categories Slug
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5" /> Order Fulfillment
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'coupons'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Tag className="h-4.5 w-4.5" /> Promotional Coupons
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'banners'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Image className="h-4.5 w-4.5" /> Slider Banners
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('returns')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'returns'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <HeartHandshake className="h-4.5 w-4.5" /> Returns & Refunds
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setActiveTab('emails')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'emails'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-655 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Mail className="h-4.5 w-4.5" /> Transactional Emails
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* WORKSPACE DETAIL VIEWPORTS */}
        <div className="lg:col-span-9">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              <span className="text-sm text-zinc-400 mt-3 font-medium">Syncing database collections...</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* === TAB 1: CORE ANALYTICS === */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Grid Status Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Earnings</span>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold font-display text-zinc-900 dark:text-white mt-1.5">₹{analytics.revenue}</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Orders</span>
                        <ShoppingBag className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold font-display text-zinc-900 dark:text-white mt-1.5">{analytics.totalOrders}</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Low Stock Alerts</span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-bold font-display text-zinc-900 dark:text-white mt-1.5">{analytics.lowStockAlerts}</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-sans">Active Clients</span>
                        <Users className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold font-display text-zinc-900 dark:text-white mt-1.5">{analytics.totalCustomers}</p>
                    </div>
                  </div>

                  {/* Revenue Growth Over Time Charts (SVG layout) */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-display uppercase tracking-wide">
                      Revenue History & Ordering Density (Past Week)
                    </h3>
                    <div className="mt-6 flex flex-col gap-4">
                      {analytics.salesOverTime?.map((day: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-24">{day.date}</span>
                          <div className="flex-1 bg-zinc-150 dark:bg-zinc-800/70 h-4.5 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(12, Math.min(100, (day.Sales / Math.max(100, ...analytics.salesOverTime.map((d: any) => d.Sales))) * 100))}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 w-16 text-right">₹{day.Sales}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories sales splits */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-display uppercase tracking-wide">
                      Category Revenue Composition
                    </h3>
                    {analytics.salesByCategory?.length === 0 ? (
                      <p className="text-zinc-400 text-sm mt-4">Waiting on first order transaction to compute category metrics.</p>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analytics.salesByCategory?.map((cat: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-4.5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-150">{cat.name}</span>
                            <span className="font-bold text-emerald-500 text-sm">₹{cat.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* === TAB 2: PRODUCTS CRUD === */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in" id="product-crud-panel">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-zinc-950 dark:text-white">
                      Product Catalog Manager ({products.length})
                    </h3>
                    <button
                      onClick={openCreateProduct}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" /> Create Product
                    </button>
                  </div>

                  {/* Products Form Modal */}
                  {showProductModal && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {editingProduct ? `Edit ${editingProduct.name}` : 'Create New Premium Product'}
                      </h4>
                      <form onSubmit={submitProduct} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Product Title</label>
                          <input
                            type="text" required
                            value={productForm.name}
                            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">SKU identifier</label>
                          <input
                            type="text"
                            placeholder="e.g. TEE-COT-BLK"
                            value={productForm.sku}
                            onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Price (₹)</label>
                          <input
                            type="number" step="0.01" required
                            value={productForm.price}
                            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Compare Price (Market ₹) </label>
                          <input
                            type="number" step="0.01"
                            value={productForm.compare_at_price}
                            onChange={(e) => setProductForm(prev => ({ ...prev, compare_at_price: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Warehouse Stock Units</label>
                          <input
                            type="number" required
                            value={productForm.stock}
                            onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        {/* File Upload / Image fields */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Product Images (URLs separated by commas)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={productForm.imagesStr}
                              onChange={(e) => setProductForm(prev => ({ ...prev, imagesStr: e.target.value }))}
                              className="w-full flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs truncate"
                            />
                            
                            {/* Base64 cloud file selection */}
                            <label className="p-2.5 bg-zinc-800 text-white rounded-xl text-xs flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition font-semibold min-h-[44px]">
                              {uploadingImage ? 'Uploading...' : 'Upload File'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileSelect}
                                disabled={uploadingImage}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Product Description</label>
                          <textarea
                            required rows={3}
                            value={productForm.description}
                            onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Variants JSON (Options sizing/weights)</label>
                          <input
                            type="text" required
                            value={productForm.variantsStr}
                            onChange={(e) => setProductForm(prev => ({ ...prev, variantsStr: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs font-mono"
                          />
                        </div>

                        <div className="md:col-span-2 flex gap-3 justify-end pt-3">
                          <button
                            type="button" onClick={() => setShowProductModal(false)}
                            className="px-4 py-2 font-semibold text-xs text-zinc-500 hover:text-zinc-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold transition"
                          >
                            Save Product Config
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Products Table */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs uppercase font-bold">
                          <th className="p-4">SKU/Item</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-850/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                                  referrerPolicy="no-referrer"
                                  className="h-10 w-10 object-cover rounded-xl bg-zinc-100"
                                />
                                <div>
                                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{p.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium text-zinc-650 dark:text-zinc-300">{p.category}</td>
                            <td className="p-4 font-bold text-zinc-900 dark:text-white">₹{p.price}</td>
                            <td className="p-4 font-mono">
                              <span className={p.stock <= 5 ? 'text-amber-500 font-bold' : p.stock === 0 ? 'text-red-500 font-bold' : 'text-zinc-650 dark:text-zinc-300'}>
                                {p.stock} units
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg min-h-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg min-h-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 3: CATEGORIES CRUD === */}
              {activeTab === 'categories' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-zinc-950 dark:text-white">
                      Discovery Categories
                    </h3>
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" /> Add Category
                    </button>
                  </div>

                  {showCategoryModal && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">New Category Details</h4>
                      <form onSubmit={submitCategory} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Name</label>
                          <input
                            type="text" required
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Banner Image URL</label>
                          <div className="flex gap-2">
                            <input
                              type="text" required
                              value={categoryForm.image}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                              className="w-full flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm truncate"
                            />
                            <label className="p-2.5 bg-zinc-850 text-white rounded-xl text-xs flex items-center justify-center cursor-pointer hover:bg-zinc-750 transition font-semibold min-h-[44px]">
                              {uploadingImage ? 'Uploading...' : 'Uploade File'}
                              <input type="file" accept="image/*" onChange={handleImageFileSelect} disabled={uploadingImage} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Description</label>
                          <textarea
                            required rows={2}
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-3">
                          <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 font-semibold text-xs text-zinc-500">Cancel</button>
                          <button type="submit" className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">Save Category</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(c => (
                      <div key={c.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex gap-4 items-center">
                        <img src={c.image} referrerPolicy="no-referrer" className="h-16 w-16 object-cover rounded-xl bg-zinc-100" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-zinc-900 dark:text-white capitalize">{c.name}</h4>
                          <p className="text-zinc-400 text-xs line-clamp-2 mt-1">{c.description}</p>
                        </div>
                        <button
                          onClick={() => deleteCategory(c.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 rounded-lg min-h-0"
                          title="Delete Category"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === TAB 4: ORDER FULFILLMENT === */}
              {activeTab === 'orders' && (
                <div className="space-y-6 animate-fade-in" id="admin-orders-fulfillment">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-xl font-bold font-display text-zinc-100">
                        Order Processing & Shipping Center ({filteredOrders.length})
                      </h3>
                      {orderSearchQuery && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl font-semibold">
                          Showing {filteredOrders.length} of {orders.length} orders
                        </span>
                      )}
                    </div>

                    {/* Integrated Dynamic Search Bar */}
                    <div className="relative bg-zinc-100 dark:bg-zinc-950 p-4 rounded-3xl border border-zinc-200/55 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-center">
                      <div className="relative w-full flex-1">
                        <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search orders by customer name, email, order ID, or waybill..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-hidden focus:border-emerald-500 font-medium"
                          id="order-search-field"
                        />
                        {orderSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setOrderSearchQuery('')}
                            className="absolute right-3.5 top-3.5 p-0.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                            title="Clear search"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 pr-2">
                        <span className="font-bold uppercase tracking-widest text-[10px] text-zinc-500">Filters:</span>
                        <span className="px-2 py-0.5 bg-zinc-200/55 dark:bg-zinc-900 border border-zinc-300/40 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg">Name</span>
                        <span className="px-2 py-0.5 bg-zinc-200/55 dark:bg-zinc-900 border border-zinc-300/40 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-lg">Email</span>
                        <span className="px-2 py-0.5 bg-zinc-200/55 dark:bg-zinc-900 border border-zinc-300/40 dark:border-zinc-805 text-zinc-650 dark:text-zinc-300 rounded-lg">ID</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredOrders.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl" id="no-search-results">
                          <p className="text-zinc-400 text-base font-medium">No transaction orders match your query.</p>
                          <p className="text-zinc-500 text-xs mt-1.5">Try searching with a different name, email, or exact order number.</p>
                          {orderSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setOrderSearchQuery('')}
                              className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Reset Search Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredOrders.map(o => (
                        <div key={o.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 space-y-4">
                          
                          {/* Top Heading Info */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                                  {o.order_number}
                                </span>
                                <span className="text-zinc-400 text-xs">
                                  {new Date(o.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Delivery details: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{o.shipping_address?.name}</span>, {o.shipping_address?.phone}, {o.shipping_address?.city}, {o.shipping_address?.postal_code}
                              </p>
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Total (COD):</span>
                              <span className="text-lg font-bold font-display text-zinc-955 dark:text-white">₹{o.total}</span>
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="space-y-2">
                            {o.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-zinc-650 dark:text-zinc-300">
                                <span>{item.name} <span className="text-zinc-400">({item.variant_id})</span> x{item.quantity}</span>
                                <span className="font-medium">₹{item.price}</span>
                              </div>
                            ))}
                          </div>

                          {/* Tracking & Shipping detail */}
                          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 space-y-3">
                            {editingTrackingOrderId === o.id ? (
                              <div className="space-y-3 w-full">
                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Edit Fulfillment Coordinates</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1 font-mono">Qikink Sub ID / Ref ID</label>
                                    <input
                                      type="text"
                                      className="w-full text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white"
                                      value={tempQikinkOrderId}
                                      onChange={e => setTempQikinkOrderId(e.target.value)}
                                      placeholder="e.g. QK-938192"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1 font-mono">Waybill / Tracking ID</label>
                                    <input
                                      type="text"
                                      className="w-full text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white"
                                      value={tempTrackingId}
                                      onChange={e => setTempTrackingId(e.target.value)}
                                      placeholder="e.g. AWB192837319"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1 font-mono">Tracking URL</label>
                                    <input
                                      type="text"
                                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white font-mono"
                                      value={tempTrackingUrl}
                                      onChange={e => setTempTrackingUrl(e.target.value)}
                                      placeholder="e.g. https://track.qikink.com/..."
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTrackingOrderId(null)}
                                    className="px-3 py-1.5 text-xs font-bold bg-zinc-200 dark:bg-zinc-850 hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-xl transition cursor-pointer min-h-0"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => saveManualTracking(o.id)}
                                    className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-xl transition cursor-pointer min-h-0"
                                  >
                                    Save Coordinates
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    <Truck className="h-4 w-4" /> Qikink Fulfillment Tracker
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTrackingOrderId(o.id);
                                        setTempTrackingId(o.qikink_tracking_id || '');
                                        setTempTrackingUrl(o.qikink_tracking_url || '');
                                        setTempQikinkOrderId(o.qikink_order_id || '');
                                      }}
                                      className="ml-2 text-[10px] text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 px-1.5 py-0.5 rounded-md font-semibold transition cursor-pointer min-h-0"
                                    >
                                      ✏️ Edit Tracking
                                    </button>
                                  </div>
                                  <p className="text-xs text-zinc-700 dark:text-zinc-200">
                                    Sub ID: <span className="font-mono">{o.qikink_order_id || 'Not synced'}</span> | Waybill: <a href={o.qikink_tracking_url || '#'} target="_blank" className="text-emerald-500 underline font-mono">{o.qikink_tracking_id || 'Awaiting generation'}</a>
                                  </p>
                                </div>

                                {/* COD PAYMENT STATUS BAR CONTROL */}
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-zinc-400 font-semibold">Payment COD:</span>
                                  <select
                                    value={o.payment_status}
                                    onChange={(e) => updatePaymentStatus(o.id, e.target.value)}
                                    className="bg-zinc-100 dark:bg-zinc-900 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-900 dark:text-white border-0"
                                  >
                                    <option value="Pending">COD Collector (Pending)</option>
                                    <option value="Paid">COD Cleared (Paid)</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* PIPELINE CONTROLLER STATUS */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Fulfillment Step:</span>
                              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-xs">
                                {o.status}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {[
                                'Confirmed',
                                'Processing',
                                'Packed',
                                'Shipped',
                                'Delivered',
                                'Cancelled'
                              ].map(st => (
                                <button
                                  key={st}
                                  onClick={() => updateOrderStatus(o.id, st)}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition border min-h-0 ${
                                    o.status === st
                                      ? 'bg-zinc-900 text-white dark:bg-emerald-500 dark:text-white border-transparent'
                                      : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 5: PROMOTIONAL COUPONS === */}
              {activeTab === 'coupons' && (
                <div className="space-y-6 animate-fade-in" id="coupons-panel">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-zinc-950 dark:text-white">Promo Codes Management</h3>
                    <button
                      onClick={() => setShowCouponModal(true)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" /> Create Coupon
                    </button>
                  </div>

                  {showCouponModal && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Create Promo Code</h4>
                      <form onSubmit={submitCoupon} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Coupon code key</label>
                          <input
                            type="text" required placeholder="e.g. FLASH30"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Discounts Type</label>
                          <select
                            value={couponForm.discount_type}
                            onChange={(e) => setCouponForm(prev => ({ ...prev, discount_type: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          >
                            <option value="percentage">Percentage ( % )</option>
                            <option value="fixed">Fixed Deduction (₹)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Discounts value</label>
                          <input
                            type="number" required placeholder="e.g. 15"
                            value={couponForm.discount_value}
                            onChange={(e) => setCouponForm(prev => ({ ...prev, discount_value: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Min cart value eligibility</label>
                          <input
                            type="number" placeholder="0"
                            value={couponForm.min_order_value}
                            onChange={(e) => setCouponForm(prev => ({ ...prev, min_order_value: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2 flex gap-3 justify-end pt-3">
                          <button type="button" onClick={() => setShowCouponModal(false)} className="px-4 py-2 text-zinc-500">Cancel</button>
                          <button type="submit" className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold text-sm transition">Publish Code</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.map(c => (
                      <div key={c.id} className="bg-white dark:bg-zinc-900 border border-zinc-201 dark:border-zinc-800 p-5 rounded-2xl flex justify-between items-center relative overflow-hidden group">
                        <div className="space-y-1.5">
                          <span className="font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg text-sm">
                            {c.code}
                          </span>
                          <p className="text-xs text-zinc-400 mt-2">
                            Deducts <span className="font-bold text-zinc-700 dark:text-zinc-200">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</span> from order total.
                          </p>
                          <p className="text-[10px] text-zinc-400">Min card eligibility requirement: ₹{c.min_order_value}</p>
                        </div>
                        <button
                          onClick={() => deleteCoupon(c.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition min-h-0"
                          title="Disable coupon"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === TAB 6: SLIDER BANNERS === */}
              {activeTab === 'banners' && (
                <div className="space-y-6 animate-fade-in" id="banners-panel">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-zinc-950 dark:text-white">Storefront Display Banners</h3>
                    <button
                      onClick={() => setShowBannerForm(true)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" /> Post Banner
                    </button>
                  </div>

                  {showBannerForm && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 animate-fade-in">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Banner Information</h4>
                      <form onSubmit={submitBanner} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Display Title</label>
                          <input
                            type="text" required placeholder="e.g. Minimalist Vibe Selection"
                            value={bannerForm.title}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Subtitle Message</label>
                          <input
                            type="text" required placeholder="e.g. Crafted for ultimate structure and utility styles."
                            value={bannerForm.subtitle}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, subtitle: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Redirection Link</label>
                          <input
                            type="text" placeholder="/shop?category=T-Shirts"
                            value={bannerForm.link}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, link: e.target.value }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-sm lg:col-span-2"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-strong mb-1">Banner Image Link </label>
                          <div className="flex gap-2">
                            <input
                              type="text" required
                              value={bannerForm.image_url}
                              onChange={(e) => setBannerForm(prev => ({ ...prev, image_url: e.target.value }))}
                              className="w-full flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs truncate"
                            />
                            <label className="p-2.5 bg-zinc-850 text-white rounded-xl text-xs flex items-center justify-center cursor-pointer hover:bg-zinc-750 transition font-semibold min-h-[44px]">
                              {uploadingImage ? 'Uploading...' : 'Uploade File'}
                              <input type="file" accept="image/*" onChange={handleImageFileSelect} disabled={uploadingImage} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-3">
                          <button type="button" onClick={() => setShowBannerForm(false)} className="px-4 py-2 text-zinc-500">Cancel</button>
                          <button type="submit" className="px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-semibold text-sm transition">Post Slider Banner</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {banners.map(b => (
                      <div key={b.id} className="relative aspect-[16/6] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-end p-6 group">
                        <img src={b.image_url} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover brightness-[0.5] group-hover:scale-101 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        
                        <div className="relative z-10 text-white flex-1 text-left">
                          <h4 className="text-xl font-bold font-display">{b.title}</h4>
                          <p className="text-zinc-200 text-xs mt-1">{b.subtitle}</p>
                          <p className="text-emerald-400 text-[10px] font-mono mt-2 tracking-wide font-bold">Redirect Link: {b.link}</p>
                        </div>

                        <button
                          onClick={() => deleteBanner(b.id)}
                          className="absolute top-4 right-4 z-20 p-2.5 bg-red-600/90 hover:bg-red-700 hover:scale-105 rounded-xl transition text-white min-h-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === TAB 7: RETURNS & REFUNDS === */}
              {activeTab === 'returns' && (
                <div className="space-y-6 animate-fade-in" id="admin-returns">
                  <h3 className="text-xl font-bold font-display text-zinc-950 dark:text-white">
                    Returns Management & Refund Processing Center ({returns.length})
                  </h3>

                  <div className="space-y-4">
                    {returns.length === 0 ? (
                      <p className="text-zinc-400 text-sm italic text-center py-8">No return requests on file.</p>
                    ) : (
                      returns.map(ret => (
                        <div key={ret.id} className="bg-white dark:bg-zinc-900 border border-zinc-201 dark:border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          <div className="space-y-1.5 flex-1 select-none text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-zinc-450 dark:text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                {ret.order_number}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                ret.status === 'Requested' ? 'bg-amber-100 text-amber-800' : ret.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-00'
                              }`}>
                                {ret.status}
                              </span>
                            </div>
                            
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-150">
                              User: {ret.user_email}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans mt-2">
                              Reason for return: <span className="font-medium text-zinc-800 dark:text-zinc-300 italic">"{ret.reason}"</span>
                            </p>

                            <p className="text-[10px] text-zinc-400">Filed at: {new Date(ret.created_at).toLocaleString()}</p>
                          </div>

                          {/* Action decisions */}
                          <div className="flex flex-col items-end gap-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 font-semibold">Refund Code:</span>
                              <span className={`text-xs px-2 py-0.5 font-bold rounded ${
                                ret.refund_status === 'Refunded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 text-zinc-500'
                              }`}>
                                {ret.refund_status}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {ret.status === 'Requested' && (
                                <>
                                  <button
                                    onClick={() => updateReturnStatus(ret.id, 'Approved', 'Pending')}
                                    className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition min-h-0 flex items-center gap-1"
                                  >
                                    <Check className="h-4.5 w-4.5" /> Approve Type
                                  </button>
                                  <button
                                    onClick={() => updateReturnStatus(ret.id, 'Rejected')}
                                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-350 rounded-xl transition min-h-0 flex items-center gap-1"
                                  >
                                    <X className="h-4.5 w-4.5" /> Reject Return
                                  </button>
                                </>
                              )}

                              {ret.status === 'Approved' && ret.refund_status === 'Pending' && (
                                <button
                                  onClick={() => updateReturnStatus(ret.id, 'Approved', 'Refunded')}
                                  className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition flex items-center gap-1 min-h-0"
                                >
                                  Trigger Refund Amount
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 8: TRANSACTIONAL EMAIL LOGS === */}
              {activeTab === 'emails' && (
                <div className="space-y shadow-sm bg-stone-900/5 dark:bg-stone-950/5 text-zinc-800 dark:text-zinc-200" id="admin-emails">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-805/80 pb-5">
                    <div>
                      <h3 className="text-xl font-bold font-sans text-zinc-950 dark:text-white flex items-center gap-2">
                        <Mail className="h-5 w-5 text-emerald-500" /> Operational Transactional Emails ({emails.length})
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed">
                        Review, audit, and visually inspect Welcome onboarding, Order Confirmation receipt, and Password Reset emails generated by the backend engine.
                      </p>
                    </div>
                    <button
                      onClick={loadAdminState}
                      className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[10px] text-zinc-700 dark:text-zinc-300 font-extrabold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer max-h-10 min-h-0"
                    >
                      <RefreshCw className="h-3 w-3" /> Sync Central
                    </button>
                  </div>

                  {/* Dev Sandbox explanation alert */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl border border-zinc-150 dark:border-zinc-850/80 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        Unified Dispatch Architecture
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                        This system operates on dual mode. If live SMTP credentials are set, emails will be delivered directly to the user's inbox in real-time. Otherwise, a secure sandbox logger preserves the dispatches for visual assessment.
                      </p>
                    </div>
                    <div className="text-left font-mono text-[10px] space-y-1 bg-zinc-100/65 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200/30 dark:border-zinc-800/50 text-zinc-650 dark:text-zinc-400">
                      <div><strong className="text-zinc-850 dark:text-zinc-300">SMTP_HOST:</strong> smtp.gmail.com (e.g.)</div>
                      <div><strong className="text-zinc-850 dark:text-zinc-300">SMTP_PORT:</strong> 587 (or 465)</div>
                      <div><strong className="text-zinc-850 dark:text-zinc-300 font-sans text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-500 p-0.5 rounded leading-none">Configure in env.example or system secrets!</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
                    {/* Left side email dispatch index */}
                    <div className="lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                      {emails.length === 0 ? (
                        <div className="p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/10 border border-zinc-150 dark:border-zinc-850 rounded-2xl text-xs text-zinc-400 italic">
                          No transactional dispatches recorded yet. Place an order or trigger reset password to generate.
                        </div>
                      ) : (
                        emails.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            onClick={() => setSelectedEmail(item)}
                            className={`p-3.5 rounded-xl border transition text-left cursor-pointer ${
                              selectedEmail?.id === item.id 
                                ? 'bg-emerald-500/5 border-emerald-500/30 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-300 shadow-sm shadow-emerald-500/5'
                                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50/60 dark:hover:bg-zinc-850/60 border-zinc-150 dark:border-zinc-800/85'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                item.type === 'welcome' 
                                  ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                                  : item.type === 'order_confirmation'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-purple-500/10 text-purple-500 dark:text-purple-400'
                              }`}>
                                {item.type?.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                {new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </span>
                            </div>

                            <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate mt-2 font-mono">
                              {item.recipient}
                            </p>
                            <p className="text-[11px] text-zinc-550 dark:text-zinc-400 truncate mt-0.5 font-sans font-medium">
                              {item.subject}
                            </p>
                            
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                item.status === 'delivered' ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                              }`} />
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-black font-mono">
                                {item.status || 'simulated'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Right side live rendering simulator visual panel */}
                    <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm min-h-[450px] flex flex-col">
                      {selectedEmail ? (
                        <div className="flex-1 flex flex-col h-full space-y-4">
                          <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 space-y-1.5 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-sans">
                                {selectedEmail.subject}
                              </h4>
                              <span className="text-[9px] text-zinc-450 font-mono bg-zinc-50 dark:bg-zinc-850 px-2 py-0.5 rounded border border-zinc-200/40 dark:border-zinc-800">
                                ID: {selectedEmail.id}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-450 font-mono">
                              RECIPIENT: <span className="text-zinc-800 dark:text-zinc-300 font-bold font-sans">{selectedEmail.recipient}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-450 font-mono">
                              TIMESTAMP: <span className="text-zinc-850 dark:text-zinc-300 font-sans">{new Date(selectedEmail.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Render HTML content safe inside a preview wrapper iframe */}
                          <div className="flex-1 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-850 h-[480px]">
                            <iframe
                              srcDoc={selectedEmail.body}
                              title="Astraveda Email Live Simulator Preview"
                              className="w-full h-full bg-zinc-950 border-0"
                              sandbox="allow-same-origin"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-400 dark:text-zinc-500">
                          <Mail className="h-9 w-9 text-zinc-300 dark:text-zinc-700 animate-pulse mb-3" />
                          <h4 className="font-extrabold text-zinc-600 dark:text-zinc-300 text-xs uppercase tracking-widest font-sans">Aesthetic Email Sim-Box Center</h4>
                          <p className="text-[11px] text-zinc-450 dark:text-zinc-500 max-w-sm mt-1.5 mx-auto leading-relaxed">
                            Select any recorded transactional dispatch from the left panel index to inspect raw metadata logs and view its live responsive HTML template wrapper.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
