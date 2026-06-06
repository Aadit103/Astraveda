import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Check, 
  ShoppingCart, 
  Truck, 
  ClipboardList, 
  HelpCircle,
  Settings,
  Package,
  Navigation,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';

interface OrdersViewProps {
  token: string | null;
  showNotification: (message: string, type: 'success' | 'error') => void;
  onOpenPolicy?: (tab: 'terms' | 'policy' | 'privacy') => void;
}

export default function OrdersView({ token, showNotification, onOpenPolicy }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  
  // Return form structures
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // Live Qikink shipment status tracking states
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});
  const [loadingTracking, setLoadingTracking] = useState<Record<string, boolean>>({});

  // Public instant tracker states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/orders/track-public/${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
        showNotification('Order found! Live tracking timeline synced with Qikink Logistics.', 'success');
      } else {
        const errData = await res.json();
        setSearchError(errData.error || 'No active purchase order or consignment was located with that identifier.');
        showNotification('No matching order was found.', 'error');
        setSearchResult(null);
      }
    } catch (err) {
      setSearchError('Network error syncing status coordinates.');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const fetchTrackingForOrder = async (oid: string) => {
    setLoadingTracking(prev => ({ ...prev, [oid]: true }));
    try {
      const res = await fetch(`/api/orders/${oid}/tracking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrackingData(prev => ({ ...prev, [oid]: data }));
      }
    } catch (err) {
      console.error('Error fetching timeline details for order:', oid, err);
    } finally {
      setLoadingTracking(prev => ({ ...prev, [oid]: false }));
    }
  };

  const toggleTimeline = (oid: string) => {
    const isExpanding = !expandedOrders[oid];
    setExpandedOrders(prev => ({ ...prev, [oid]: isExpanding }));
    if (isExpanding && !trackingData[oid]) {
      fetchTrackingForOrder(oid);
    }
  };

  const getTimelineIcon = (keyName: string, isCompleted: boolean) => {
    const colorClass = isCompleted ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700";
    switch (keyName) {
      case 'ClipboardCheck': return <ClipboardList className={`h-4 w-4 ${colorClass}`} />;
      case 'Settings': return <Settings className={`h-4 w-4 ${colorClass}`} />;
      case 'Package': return <Package className={`h-4 w-4 ${colorClass}`} />;
      case 'Truck': return <Truck className={`h-4 w-4 ${colorClass}`} />;
      case 'Navigation': return <Navigation className={`h-4 w-4 ${colorClass}`} />;
      case 'MapPin': return <MapPin className={`h-4 w-4 ${colorClass}`} />;
      case 'CheckCircle2': return <CheckCircle2 className={`h-4 w-4 ${colorClass}`} />;
      default: return <ClipboardList className={`h-4 w-4 ${colorClass}`} />;
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: returnOrderId, reason: returnReason })
      });
      if (res.ok) {
        showNotification('Return request filed successfully! Admin has been notified.', 'success');
        setReturnOrderId(null);
        setReturnReason('');
        fetchOrders();
      }
    } catch (err) {
      showNotification('Failed loading return configs.', 'error');
    }
  };

  const handleCancelOrder = async (oid: string) => {
    try {
      const res = await fetch(`/api/orders/${oid}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Purchase cancelled successfully.', 'success');
        fetchOrders();
      }
    } catch (err) {
      showNotification('Cancellation request error.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-left font-sans" id="orders-viewport">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-zinc-900 dark:text-white">
            Purchase History & Invoices
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Track dispatch waybills, view certified checkout statements, and manage claims</p>
        </div>
        <div className="flex gap-2 text-xs shrink-0 font-semibold select-none">
          <button 
            onClick={() => onOpenPolicy?.('terms')}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200/50 dark:border-zinc-800 rounded-xl cursor-pointer"
          >
            Terms of Use
          </button>
          <button 
            onClick={() => onOpenPolicy?.('policy')}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200/50 dark:border-zinc-800 rounded-xl cursor-pointer"
          >
            Assurance Policy
          </button>
        </div>
      </div>

      {/* Real-time Order Tracking Form Card */}
      <div className="mt-8 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/80 p-6 rounded-3xl space-y-4 shadow-sm" id="customer-order-tracker">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">
              Real-time 'Track My Order' Lookup
            </h3>
            <p className="text-[11px] text-zinc-550 dark:text-zinc-400">
              Input your Order ID, Order Number (e.g. AST-1004), or Qikink Waybill to load live packing & shipping updates.
            </p>
          </div>
        </div>

        <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Type Order ID or Number (e.g. AST-1001)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 p-3 px-4 text-xs rounded-2xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-450 text-zinc-950 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {searching ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Searching...
              </>
            ) : (
              'Locate Consignment'
            )}
          </button>
        </form>

        {/* Search Error Indicator */}
        {searchError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-650 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5 font-sans animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Dynamic Display of Found Order with Live Status Timeline */}
        {searchResult && (
          <div className="mt-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-250/70 dark:border-zinc-800 rounded-2xl space-y-5 animate-fade-in divide-y divide-zinc-100 dark:divide-zinc-800/60" id="search-result-timeline">
            {/* Header portion of search report */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 px-3 py-1 rounded-xl tracking-wider select-all animate-pulse">
                    {searchResult.order_number}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium font-sans">Logistics Registry Code</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-mono">Status: </span>
                  <span className="text-emerald-500 font-extrabold font-mono uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-md text-[10px]">
                    {searchResult.current_status}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">Cash on Delivery Value</span>
                <span className="text-xl font-black text-zinc-950 dark:text-white">₹{searchResult.total}</span>
              </div>
            </div>

            {/* Step-by-Step interactive visual timeline representing Qikink backend status */}
            <div className="py-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <p className="font-extrabold text-[10px] text-zinc-400 uppercase tracking-widest">
                  Fulfillment Status Tracker Waybills
                </p>
                {searchResult.tracking_id ? (
                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <a
                      href={searchResult.tracking_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-500 hover:text-emerald-400 font-mono font-semibold flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10"
                      title="Open original Qikink tracking page (requires published store status)"
                    >
                      Qikink Portal ID: {searchResult.tracking_id} <ExternalLink className="h-3 w-3" />
                    </a>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] text-zinc-500 font-sans font-medium">Direct Carrier Trace:</span>
                      <a
                        href={`https://www.delhivery.com/track/share?reid=&awb=${searchResult.tracking_id.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded transition font-mono font-bold font-semibold"
                        title="Search waybill directly on Delhivery corporate platform"
                      >
                        Delhivery (Best)
                      </a>
                      <a
                        href={`https://track.xpressbees.com/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded transition font-sans font-medium"
                        title="Open Xpressbees tracker"
                      >
                        Xpressbees
                      </a>
                      <a
                        href={`https://www.shadowfax.in/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded transition font-sans font-medium"
                        title="Open Shadowfax tracker"
                      >
                        Shadowfax
                      </a>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-405 dark:text-zinc-500 italic">Waybill under packaging registration</span>
                )}
              </div>

              {searchResult.isCancelled ? (
                <div className="py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-650 dark:text-red-400 text-xs font-semibold flex items-center gap-2 font-sans">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>This COD dispatch status is 'Cancelled'. Package courier delivery is stopped.</span>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-zinc-150 dark:bg-zinc-800" />
                  {searchResult.timeline?.map((step: any, sIdx: number) => {
                    const isCompleted = step.isCompleted;
                    const isCurrent = step.isCurrent;
                    const timestamp = step.timestamp;

                    return (
                      <div key={sIdx} className="relative flex gap-4 text-left">
                        <div 
                          className={`absolute -left-5 top-1 h-4 w-4 rounded-full flex items-center justify-center transition-all border duration-300 ${
                            isCurrent 
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-emerald-500/30' 
                              : isCompleted 
                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' 
                                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800'
                          }`}
                        >
                          {isCurrent ? (
                            <span className="h-1.5 w-1.5 bg-zinc-950 rounded-full animate-pulse" />
                          ) : isCompleted ? (
                            <Check className="h-2 w-2 stroke-[3]" />
                          ) : (
                            <div className="h-1 w-1 bg-zinc-350 dark:bg-zinc-700 rounded-full" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h6 
                              className={`text-xs font-bold font-sans uppercase tracking-wide flex items-center gap-2 ${
                                isCurrent 
                                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' 
                                  : isCompleted 
                                    ? 'text-zinc-800 dark:text-zinc-200' 
                                    : 'text-zinc-400 dark:text-zinc-600'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {getTimelineIcon(step.icon, isCompleted || isCurrent)}
                                {step.title}
                              </span>
                              {isCurrent && (
                                <span className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded animate-pulse">
                                  DAILY TRACK STAGE
                                </span>
                              )}
                            </h6>

                            {timestamp && (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                {new Date(timestamp).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })}{' '}
                                -{' '}
                                {new Date(timestamp).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            )}
                          </div>
                          <p 
                            className={`text-[11px] mt-0.5 leading-normal ${
                              isCurrent 
                                ? 'text-zinc-700 dark:text-zinc-300 font-medium' 
                                : isCompleted 
                                  ? 'text-zinc-500 dark:text-zinc-400' 
                                  : 'text-zinc-400 dark:text-zinc-650'
                            }`}
                          >
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Articles breakdown contained in lookup order result */}
            {searchResult.items && searchResult.items.length > 0 && (
              <div className="py-4 space-y-3">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Shipment Package Manifest</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/20 px-4 rounded-2xl border border-zinc-150/75 dark:border-zinc-850/60 divide-y divide-zinc-100 dark:divide-zinc-800/40">
                  {searchResult.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 rounded-lg object-cover bg-zinc-100"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-zinc-150 flex items-center justify-center text-[10px] font-semibold text-zinc-400">
                            PKG
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{item.name}</p>
                          {item.variant_id && (
                            <p className="text-[9px] text-zinc-400 font-mono uppercase">Variant: {item.variant_id}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-zinc-500">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery address details of order */}
            {searchResult.shipping_address && (
              <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Fulfillment Recipient</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">{searchResult.shipping_address.name}</p>
                  <p className="text-zinc-500 font-mono">{searchResult.shipping_address.phone}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Waybill Destination</span>
                  <p className="text-zinc-500">{searchResult.shipping_address.street}</p>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                    {searchResult.shipping_address.city}, {searchResult.shipping_address.state} - {searchResult.shipping_address.postal_code}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loadingLocal ? (
        <div className="text-center py-20 text-zinc-400 font-medium">Assembling checkout history records...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl mt-8 border border-zinc-150 dark:border-zinc-800/50 flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-zinc-400 font-bold text-sm">No transaction orders on file.</p>
            <p className="text-zinc-500 text-xs mt-1">Ready to start shopping? Your certified invoices will display right here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 mt-8">
          {orders.map(o => (
            <div
              key={o.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 p-6 rounded-3xl space-y-5 shadow-xs hover:shadow-lg hover:border-zinc-300/40 dark:hover:border-zinc-800 transition duration-200"
            >
              {/* Meta details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-850">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 px-3 py-1 rounded-xl tracking-wider select-all">
                      {o.order_number}
                    </span>
                    <span className="text-xs text-zinc-450 font-medium">
                      {new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2.5">
                    <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 flex-wrap">
                      <span className="text-zinc-500 uppercase font-bold tracking-widest text-[9px] bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md">Logistics Waybill:</span>{' '}
                      {o.qikink_tracking_id ? (
                        <a
                          href={o.qikink_tracking_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-500 hover:text-emerald-400 underline font-semibold flex items-center inline-flex gap-1"
                        >
                          {o.qikink_tracking_id} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-500 font-sans italic font-medium">Consignment under assembly & packing</span>
                      )}
                    </p>

                    <button
                      onClick={() => toggleTimeline(o.id)}
                      className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0 uppercase tracking-tight ${
                        expandedOrders[o.id]
                          ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/15'
                          : 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/15'
                      }`}
                    >
                      {expandedOrders[o.id] ? (
                        <>Hide Tracker <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Track Live Status <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-[10px] text-zinc-450 uppercase tracking-widest font-bold">Grand Total COD:</span>
                  <span className="text-lg font-extrabold font-display text-zinc-950 dark:text-white">₹{o.total}</span>
                </div>
              </div>

              {/* Visual Step-by-Step Logistics Timeline */}
              {expandedOrders[o.id] && (
                <div className="bg-zinc-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850/80 space-y-4 animate-fade-in" id={`timeline-${o.id}`}>
                  <div className="flex items-center justify-between border-b border-zinc-200/40 dark:border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <p className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 uppercase tracking-widest font-sans flex items-center gap-1.5">
                        Qikink Logistics Real-Time Timeline Tracker
                      </p>
                    </div>

                    <button
                      onClick={() => fetchTrackingForOrder(o.id)}
                      disabled={loadingTracking[o.id]}
                      className="text-[10px] text-zinc-450 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 transition-all uppercase tracking-wider font-extrabold disabled:opacity-50 min-h-0 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingTracking[o.id] ? 'animate-spin' : ''}`} />
                      Sync Live
                    </button>
                  </div>

                  {loadingTracking[o.id] && !trackingData[o.id] ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-zinc-400 text-[11px] font-medium">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                      Fetching real-time waybill coordinates from Qikink Logistics...
                    </div>
                  ) : trackingData[o.id]?.isCancelled ? (
                    <div className="py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-650 dark:text-red-400 text-xs font-semibold flex items-center gap-2 font-sans">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>This cash-on-delivery (COD) dispatch has status "Cancelled" and logistics tracking is terminated.</span>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-5">
                      {/* Longitudinal visual vertical timeline connector bar */}
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800/60" />

                      {trackingData[o.id]?.timeline?.map((step: any, sIdx: number) => {
                        const isCompleted = step.isCompleted;
                        const isCurrent = step.isCurrent;
                        const timestamp = step.timestamp;

                        return (
                          <div key={sIdx} className="relative flex gap-4 text-left transition-all duration-300">
                            {/* Absolute left centered timeline status bubble */}
                            <div 
                              className={`absolute -left-5 top-0.5 h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all border duration-300 ${
                                isCurrent 
                                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-emerald-500/30' 
                                  : isCompleted 
                                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-555/30' 
                                    : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800'
                              }`}
                            >
                              {isCurrent ? (
                                <span className="h-1.5 w-1.5 bg-zinc-950 rounded-full animate-pulse" />
                              ) : isCompleted ? (
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              ) : (
                                <div className="h-1 w-1 bg-zinc-350 dark:bg-zinc-700 rounded-full" />
                              )}
                            </div>

                            {/* Timeline text context */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h6 
                                  className={`text-xs font-bold font-sans uppercase tracking-wide flex items-center gap-2 ${
                                    isCurrent 
                                      ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' 
                                      : isCompleted 
                                        ? 'text-zinc-800 dark:text-zinc-200' 
                                        : 'text-zinc-400 dark:text-zinc-650'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {getTimelineIcon(step.icon, isCompleted || isCurrent)}
                                    {step.title}
                                  </span>
                                  {isCurrent && (
                                    <span className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-405 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest select-none animate-pulse">
                                      ACTIVE STAGE
                                    </span>
                                  )}
                                </h6>

                                {timestamp && (
                                  <span className="text-[10px] text-zinc-405 dark:text-zinc-500 font-mono">
                                    {new Date(timestamp).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric'
                                    })}{' '}
                                    -{' '}
                                    {new Date(timestamp).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                )}
                              </div>

                              <p 
                                className={`text-[11px] leading-relaxed mt-0.5 ${
                                  isCurrent 
                                    ? 'text-zinc-700 dark:text-zinc-300 font-medium' 
                                    : isCompleted 
                                      ? 'text-zinc-550 dark:text-zinc-400' 
                                      : 'text-zinc-405 dark:text-zinc-750'
                                }`}
                              >
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Invoice breakdown list of items */}
              {o.items && o.items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <ShoppingCart className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Articles Included in Dispatch</span>
                  </div>
                  
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/20 px-4 rounded-2xl border border-zinc-100 dark:border-zinc-850/50">
                    {o.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 rounded-xl object-cover bg-zinc-100 border border-zinc-200/50 dark:border-zinc-800"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              ITEM
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{item.name}</p>
                            {item.variant_id && (
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase">Variant: {item.variant_id}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-zinc-500">₹{item.price} × {item.quantity}</span>
                          <p className="font-mono font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Details Block */}
              {o.shipping_address && (
                <div className="bg-zinc-50/55 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-150/80 dark:border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Fulfillment Recipient</span>
                    <p className="font-bold text-zinc-850 dark:text-zinc-100">{o.shipping_address.name}</p>
                    <p className="text-zinc-500 font-mono mt-0.5">{o.shipping_address.phone}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Fulfillment Coordinate Details</span>
                    <p className="text-zinc-500 leading-normal">{o.shipping_address.street}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{o.shipping_address.city}, {o.shipping_address.state} - {o.shipping_address.postal_code}</p>
                  </div>
                </div>
              )}

              {/* Invoice Subtotals Calculations Block */}
              <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-3 flex flex-wrap justify-between items-center gap-3 text-xs text-zinc-500 select-none">
                <div className="flex flex-wrap gap-5 font-medium">
                  <div>
                    <span>Items Subtotal:</span>{' '}
                    <span className="font-black text-zinc-750 dark:text-zinc-200 font-mono ml-0.5">₹{o.subtotal || (o.total - (o.shipping_fee || 0))}</span>
                  </div>
                  {o.shipping_fee !== undefined && (
                    <div>
                      <span>Shipping dispatch:</span>{' '}
                      <span className="font-black text-zinc-750 dark:text-zinc-200 font-mono ml-0.5">
                        {o.shipping_fee === 0 ? 'FREE' : `₹${o.shipping_fee}`}
                      </span>
                    </div>
                  )}
                  {o.discount !== undefined && o.discount > 0 && (
                    <div>
                      <span className="text-emerald-500 font-bold">Discount coupon:</span>{' '}
                      <span className="font-black text-emerald-500 font-mono ml-0.5">-₹{o.discount}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Fulfillment:</span>
                  <span className="text-emerald-500 font-extrabold font-mono uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md text-xs select-none">
                    {o.status}
                  </span>
                </div>
              </div>

              {/* Brand Policies Clickable Compliance Section (Invoice Context) */}
              <div className="bg-emerald-500/[0.02] dark:bg-emerald-950/10 p-4 rounded-2xl border border-zinc-200/40 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-left" id="invoice-policy-banner">
                <div className="flex items-start gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="h-3 w-3" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-zinc-800 dark:text-zinc-250 text-xs">Astraveda Assurance Regulations</p>
                    <p className="text-[10.5px] text-zinc-450 dark:text-zinc-400 leading-normal">
                      Every COD dispatch represents a certified transaction. Unpack parcel only with uncut unboxing video proof for claims. All packages qualify under standard terms and a 7-day returning period.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 font-semibold shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('terms')}
                    className="px-3 py-1.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-805 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 text-[10.5px] rounded-lg transition border border-zinc-200/40 dark:border-zinc-700 cursor-pointer min-h-0"
                  >
                    Read Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('policy')}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10.5px] rounded-lg transition border border-emerald-500/10 cursor-pointer min-h-0"
                  >
                    Return Policy
                  </button>
                </div>
              </div>

              {/* Cancellation / Return Actions Panel */}
              <div className="flex justify-end gap-3 pt-1">
                {o.status === 'Placed' && (
                  <button
                    onClick={() => handleCancelOrder(o.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-605 dark:text-red-400 font-bold text-xs rounded-xl min-h-0 cursor-pointer border border-red-500/10 transition"
                  >
                    Cancel COD Order
                  </button>
                )}
                {o.status === 'Delivered' && (
                  <button
                    onClick={() => setReturnOrderId(o.id)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-350 font-bold text-xs rounded-xl min-h-0 cursor-pointer transition border border-zinc-200/50 dark:border-zinc-700"
                  >
                    Inquire Product Return
                  </button>
                )}
              </div>

              {/* Inline return description form */}
              {returnOrderId === o.id && (
                <form
                  onSubmit={handleCreateReturn}
                  className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 mt-4 text-left animate-fade-in"
                >
                  <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Provide Return Reason details</h5>
                  <textarea
                    required
                    placeholder="e.g. Fit is tight, need an exchange / refund."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-sm rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-zinc-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setReturnOrderId(null)}
                      className="font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer px-2 py-1.5"
                    >
                      Close Form
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-xl font-bold min-h-0 cursor-pointer"
                    >
                      Verify & Submit Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
