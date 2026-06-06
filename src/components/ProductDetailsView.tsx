import React, { useState, useEffect } from 'react';
import { Star, Heart, Truck, RotateCcw, ShieldCheck, ChevronDown, Sparkles, Share2 } from 'lucide-react';
import { Product, User } from '../types';
import ReviewsList from './ReviewsList';
import ProductCard from './ProductCard';

interface ProductDetailsViewProps {
  products: Product[];
  viewArgument: string | null;
  onNavigate: (view: string, arg?: string) => void;
  handleAddToCart: (productId: string, variantId?: string, qty?: number) => void;
  handleToggleWishlist: (productId: string) => void;
  wishlist: any[];
  user: User | null;
}

export default function ProductDetailsView({
  products,
  viewArgument,
  onNavigate,
  handleAddToCart,
  handleToggleWishlist,
  wishlist,
  user
}: ProductDetailsViewProps) {
  if (!viewArgument) return <div className="p-8 text-center text-zinc-500">Product details error.</div>;
  const prod = products.find(p => p.id === viewArgument);
  
  if (!prod) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-zinc-400 font-medium">Traces of this product ID could not be matched.</p>
        <button onClick={() => onNavigate('shop')} className="mt-4 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer">Back to Shop</button>
      </div>
    );
  }

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [detailQty, setDetailQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'sizing' | 'shipping'>('details');
  const [sizingUnit, setSizingUnit] = useState<'in' | 'cm'>('in');
  const [userHeight, setUserHeight] = useState<string>('');
  const [userWeight, setUserWeight] = useState<string>('');
  const [recommendedSize, setRecommendedSize] = useState<string>('');
  const [sizingTab, setSizingTab] = useState<'table' | 'measure'>('table');

  const [reviewsAggregate, setReviewsAggregate] = useState<{ avg: number; count: number }>({ avg: 5.0, count: 20 });

  useEffect(() => {
    const fetchReviewsAggregate = async () => {
      try {
        const res = await fetch(`/api/products/${prod.id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const sum = data.reduce((s: number, r: any) => s + r.rating, 0);
            setReviewsAggregate({
              avg: parseFloat((sum / data.length).toFixed(1)),
              count: data.length
            });
          } else {
            setReviewsAggregate({ avg: 5.0, count: 0 });
          }
        }
      } catch (err) {
        console.error('Error aggregate reviews load:', err);
      }
    };
    fetchReviewsAggregate();
  }, [prod.id]);

  // Interactive zoom-on-hover style state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center'
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      transform: 'scale(2.2)', // Close zoom factor for premium tactile examination
      transformOrigin: `${x}% ${y}%`,
      transition: 'transform 0.08s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center',
      transition: 'transform 0.2s ease-out'
    });
  };

  // Parse variant names (e.g., "Small / Premium White") to distinct size and color options
  const parsedVariants = (prod.variants || []).map(v => {
    const parts = v.name.split('/').map(s => s.trim());
    return {
      id: v.id,
      size: parts[0] || 'Standard',
      color: parts[1] || 'Default',
      stock: v.stock
    };
  });

  const availableColors = Array.from(new Set(parsedVariants.map(pv => pv.color)));
  const availableSizes = Array.from(new Set(parsedVariants.map(pv => pv.size)));

  const activeColor = selectedColor || availableColors[0] || 'Default';
  const activeSize = selectedSize || availableSizes[0] || 'Standard';

  // Resolve matching product variant ID
  const matchedVar = parsedVariants.find(pv => pv.size === activeSize && pv.color === activeColor)
    || parsedVariants.find(pv => pv.color === activeColor) // fallback if size mismatch
    || parsedVariants[0]
    || { id: 'v-default', stock: prod.stock };

  const selectedVarId = matchedVar.id;
  const resolvedStock = matchedVar.stock;

  // Sync state on product load or transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImgIdx(0);
    setDetailQty(1);
    setUserHeight('');
    setRecommendedSize('');

    if (prod.variants && prod.variants.length > 0) {
      const parts = prod.variants[0].name.split('/').map(s => s.trim());
      setSelectedSize(parts[0] || 'Standard');
      setSelectedColor(parts[1] || 'Default');
    } else {
      setSelectedSize('Standard');
      setSelectedColor('Default');
    }
  }, [viewArgument, prod]);

  // Handle color selection with automatic mockup preview swap helper
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    const col = colorName.toLowerCase();
    if (col.includes('white')) {
      if (prod.images.length > 0) setActiveImgIdx(0);
    } else if (col.includes('black')) {
      if (prod.images.length > 1) setActiveImgIdx(1);
    } else if (col.includes('grey') || col.includes('gray')) {
      if (prod.images.length > 2) {
        setActiveImgIdx(2);
      } else if (prod.images.length > 1) {
        setActiveImgIdx(1);
      }
    } else {
      if (prod.images.length > 3) {
        setActiveImgIdx(3);
      } else if (prod.images.length > 2) {
        setActiveImgIdx(2);
      }
    }
  };

  // Sizing recommendation calculator logic based on both height and weight (Flipkart-style Fit Selector)
  const calculateRecommendation = (hStr: string, wStr: string) => {
    const height = parseFloat(hStr);
    const weight = parseFloat(wStr);
    
    if (!hStr || isNaN(height) || height <= 0) {
      setRecommendedSize('');
      return;
    }

    let resolvedH = height;
    // Check if height is in feet (e.g. 5.7) and convert to cm
    if (height > 3 && height < 9) {
      resolvedH = height * 30.48;
    }

    let resolvedW = weight;
    if (isNaN(weight) || weight <= 0) {
      // fallback to height only
      if (resolvedH < 165) setRecommendedSize('Small');
      else if (resolvedH >= 165 && resolvedH < 178) setRecommendedSize('Medium');
      else if (resolvedH >= 178 && resolvedH < 188) setRecommendedSize('Large');
      else setRecommendedSize('X-Large');
      return;
    }

    // Joint body shape matrix (Flipkart intelligence algorithm)
    if (resolvedH < 165) {
      if (resolvedW < 58) setRecommendedSize('Small');
      else if (resolvedW >= 58 && resolvedW < 70) setRecommendedSize('Medium');
      else setRecommendedSize('Large');
    } else if (resolvedH >= 165 && resolvedH < 178) {
      if (resolvedW < 65) setRecommendedSize('Small');
      else if (resolvedW >= 65 && resolvedW < 76) setRecommendedSize('Medium');
      else if (resolvedW >= 76 && resolvedW < 88) setRecommendedSize('Large');
      else setRecommendedSize('X-Large');
    } else {
      if (resolvedW < 70) setRecommendedSize('Medium');
      else if (resolvedW >= 70 && resolvedW < 85) setRecommendedSize('Large');
      else setRecommendedSize('X-Large');
    }
  };

  const handleHeightCheck = (heightValue: string) => {
    setUserHeight(heightValue);
    calculateRecommendation(heightValue, userWeight);
  };

  const handleWeightCheck = (weightValue: string) => {
    setUserWeight(weightValue);
    calculateRecommendation(userHeight, weightValue);
  };

  function heightStrValid(val: string) {
    return /^[0-9.]+$/.test(val);
  }

  // Get CSS classes for the interactive color swatches
  const getColorSwatchClass = (colorName: string) => {
    const col = colorName.toLowerCase();
    if (col.includes('white')) return 'bg-white border-zinc-300 dark:border-zinc-700 text-zinc-900';
    if (col.includes('black')) return 'bg-zinc-900 border-zinc-950 text-white';
    if (col.includes('red')) return 'bg-red-600 border-red-800 text-white';
    if (col.includes('grey') || col.includes('gray')) return 'bg-stone-550 border-stone-600 text-zinc-900';
    if (col.includes('beige')) return 'bg-amber-100 border-amber-250 text-zinc-950';
    if (col.includes('blue')) return 'bg-blue-650 border-blue-800 text-white';
    return 'bg-emerald-500 text-white';
  };

  // Robust Related Products logic to always supply 4 items for better visual weight
  let relatedProducts = products.filter(p => p.category === prod.category && p.id !== prod.id);
  if (relatedProducts.length < 4) {
    const fallbackItems = products.filter(p => p.id !== prod.id && !relatedProducts.some(rp => rp.id === p.id));
    relatedProducts = [...relatedProducts, ...fallbackItems].slice(0, 4);
  } else {
    relatedProducts = relatedProducts.slice(0, 4);
  }

  // Static product attribute calculations for the spec sheets
  const premiumSpecs = [
    { label: "Edition Range", value: "Curated Limited Release" },
    { label: "Design Blueprint", value: prod.category || "Astraveda Modern" },
    { label: "SKU Identifier", value: prod.sku || "N/A" },
    { label: "Origin Standard", value: "Premium Sourced Artisanal" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left font-sans" id="product-detail-viewport">
      
      {/* Breadcrumb / Back Navigation Link */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={() => onNavigate('shop')}
          className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-150 flex items-center gap-2 border border-zinc-200/60 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition cursor-pointer font-bold"
        >
          &larr; Return to Curated Catalog
        </button>
        <span className="text-[11px] font-mono font-bold text-zinc-400 tracking-wider hidden sm:block">
          ASTRAVEDA // DESIGNS // {prod.sku || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        
        {/* LEFT COLUMN: MULTIPLE IMAGE GALLERY WITH PREVIEWS */}
        <div className="lg:col-span-6 space-y-5">
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-800/80 relative group shadow-sm transition overflow-hidden cursor-zoom-in"
            id="product-image-container"
          >
            <img
              src={prod.images?.[activeImgIdx] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={zoomStyle}
              alt={prod.name}
            />
            
            {/* Quick Micro Tag */}
            <span className="absolute top-5 left-5 bg-zinc-950/85 backdrop-blur-md text-white font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 select-none font-bold pointer-events-none">
              ★ Hover to Zoom Textures
            </span>
          </div>

          {prod.images && prod.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {prod.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImgIdx(i)}
                  className={`h-18 w-18 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex-shrink-0 border-2 transition cursor-pointer shadow-xs ${
                    i === activeImgIdx 
                      ? 'border-emerald-500 scale-102 ring-2 ring-emerald-500/15' 
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <img src={img} referrerPolicy="no-referrer" className="h-full w-full object-cover" alt="preview" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CONFIGURATOR & TECHNICAL SPECS */}
        <div className="lg:col-span-6 flex flex-col justify-between py-1">
          <div>
            {/* Category / Curated Label */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
                {prod.category || "Premium Segment"}
              </span>
              <span className="h-1 w-1 bg-zinc-300 rounded-full" />
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500 inline" /> Exclusive Release
              </span>
            </div>
            
            {/* Main Title heading */}
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-zinc-900 dark:text-white mt-3 leading-tight tracking-tight">
              {prod.name}
            </h1>

            {/* Customer rating overview & SKU detail */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 select-none">
              <button 
                onClick={() => {
                  const el = document.getElementById('reviews-segment-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 hover:opacity-85 transition cursor-pointer text-left"
              >
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < Math.round(reviewsAggregate.avg) ? 'fill-current text-amber-400' : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 font-mono">{reviewsAggregate.avg.toFixed(1)}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline font-sans">
                  ({reviewsAggregate.count === 0 ? "Write first review" : `${reviewsAggregate.count} verified owner${reviewsAggregate.count > 1 ? 's' : ''}`})
                </span>
              </button>
              <span className="text-zinc-300 dark:text-zinc-800 hidden sm:inline">|</span>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-205 dark:border-zinc-850">
                Identifier: {prod.sku}
              </span>
            </div>

            {/* Refined Pricing Segment */}
            <div className="flex items-baseline gap-3.5 mt-6 py-4 px-5 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150 dark:border-zinc-850 max-w-sm">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-0.5">Assurance List Price</span>
                <span className="text-3xl font-display font-black text-zinc-950 dark:text-white">₹{prod.price}</span>
              </div>
              {prod.compare_at_price && (
                <div className="mb-0.5">
                  <span className="text-xs text-zinc-400 line-through block">₹{prod.compare_at_price}</span>
                  <span className="text-[10px] text-emerald-500 font-extrabold uppercase">
                    Save {Math.round(((prod.compare_at_price - prod.price) / prod.compare_at_price) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Description Segment */}
            <p className="text-zinc-650 dark:text-zinc-350 text-sm sm:text-base mt-6 leading-relaxed">
              {prod.description}
            </p>

            {/* Premium Separated Color Switcher Swatches */}
            {availableColors.length > 0 && availableColors[0] !== 'Default' && (
              <div className="mt-8 border-t border-zinc-100 dark:border-zinc-850/80 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Choose Colour: <span className="text-zinc-800 dark:text-zinc-200 font-extrabold ml-1">{activeColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const isSelected = activeColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`h-9 items-center px-3.5 py-1.5 rounded-full border-2 text-[11px] font-bold transition flex gap-2 cursor-pointer ${getColorSwatchClass(color)} ${
                          isSelected 
                            ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 scale-105 border-transparent shadow shadow-black/25' 
                            : 'opacity-65 hover:opacity-100 scale-100'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full border border-black/10 inline-block bg-current" />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Premium Separated Size Picker */}
            {availableSizes.length > 0 && availableSizes[0] !== 'Standard' && (
              <div className="mt-6 border-t border-zinc-100 dark:border-zinc-850/20 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Select Apparel Size: <span className="text-zinc-800 dark:text-zinc-200 font-extrabold ml-1">{activeSize}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sizing');
                      const element = document.getElementById('details-accordion-tab-nav');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-[10px] text-emerald-500 hover:text-emerald-600 font-extrabold uppercase tracking-wide cursor-pointer underline"
                  >
                    View Size Assistant Chart &rarr;
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableSizes.map((size) => {
                    const isSelected = activeSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSelectedSize(size);
                          setDetailQty(1);
                        }}
                        className={`h-11 px-4 py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition cursor-pointer flex items-center justify-center min-w-12 ${
                          isSelected
                            ? 'bg-zinc-950 text-white dark:bg-emerald-500 dark:text-zinc-950 border-transparent shadow shadow-black/20 scale-102 font-bold ring-2 ring-emerald-550/10'
                            : 'bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-350 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Manager & Real-Time Stock Indicators */}
            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 rounded-xl px-2 border border-zinc-200/40 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={detailQty <= 1}
                  onClick={() => setDetailQty(p => p - 1)}
                  className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition font-bold text-sm cursor-pointer disabled:opacity-20"
                >
                  -
                </button>
                <span className="text-zinc-850 dark:text-zinc-100 text-sm font-extrabold w-9 text-center select-none font-mono">
                  {detailQty}
                </span>
                <button
                  type="button"
                  disabled={detailQty >= resolvedStock}
                  onClick={() => setDetailQty(p => p + 1)}
                  className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition font-bold text-sm cursor-pointer disabled:opacity-20"
                >
                  +
                </button>
              </div>

              <div className="text-xs font-semibold">
                {resolvedStock > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10 inline-block align-middle">
                    ✓ Available: {resolvedStock} limits remaining
                  </span>
                ) : (
                  <span className="text-red-500 font-bold font-mono bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10 inline-block align-middle">
                    ✕ Selection Sold Out
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CRITICAL BRAND CTA WORKFLOW BUTTONS */}
          <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-850/80 flex gap-3 flex-wrap">
            <button
              type="button"
              disabled={resolvedStock === 0}
              onClick={() => {
                handleAddToCart(prod.id, selectedVarId, detailQty);
                onNavigate('cart');
              }}
              className="flex-1 min-w-[180px] px-6 py-4 bg-zinc-950 dark:bg-emerald-500 hover:bg-zinc-850 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-40 text-center cursor-pointer select-none"
            >
              Order & Proceed Checkout
            </button>

            <button
              type="button"
              disabled={resolvedStock === 0}
              onClick={() => handleAddToCart(prod.id, selectedVarId, detailQty)}
              className="px-6 py-4 bg-zinc-100 border border-zinc-250 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-850 dark:text-zinc-200 hover:text-zinc-950 disabled:opacity-40 font-bold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer max-w-xs"
            >
              Add To Cart Bag
            </button>

            <button
              type="button"
              onClick={() => handleToggleWishlist(prod.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                wishlist.some(w => w.product_id === prod.id)
                  ? 'text-red-500 bg-red-500/5 hover:bg-red-500/10 border-red-200 dark:border-red-950'
                  : 'text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
              }`}
              title="Add to wishlist folder"
            >
              <Heart className={`h-4.5 w-4.5 ${wishlist.some(w => w.product_id === prod.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* EXPERT SPEC SHEETS & ACCORDION DETAIL TABS */}
          <div id="details-accordion-tab-nav" className="mt-8 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/40 select-none">
            
            {/* Tab navigation headers */}
            <div className="grid grid-cols-3 border-b border-zinc-150 dark:border-zinc-800 text-center text-xs font-semibold bg-zinc-50 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`py-3.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'details' 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sizing')}
                className={`py-3.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'sizing' 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Sizing Fit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`py-3.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'shipping' 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Shipping & COD
              </button>
            </div>

            {/* Tab Panel contents */}
            <div className="p-5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              
              {activeTab === 'details' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {premiumSpecs.map((spec, sidx) => (
                      <div key={sidx} className="border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-0.5">{spec.label}</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400 italic pt-1 text-justify">
                    Astraveda items prioritize sustainable fabrication, with dynamic double-stitched reinforcements for extensive lifecycle performance.
                  </p>
                </div>
              )}

              {activeTab === 'sizing' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* FLIPKART STYLE INNER TAB SELECTOR & UNIT SWITCHER */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 w-fit">
                      <button
                        type="button"
                        onClick={() => setSizingTab('table')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          sizingTab === 'table' 
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs' 
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        📊 Size Chart Table
                      </button>
                      <button
                        type="button"
                        onClick={() => setSizingTab('measure')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          sizingTab === 'measure' 
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs' 
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        📐 How To Measure
                      </button>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unit:</span>
                      <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800 w-fit">
                        <button
                          type="button"
                          onClick={() => setSizingUnit('in')}
                          className={`px-2 py-1 text-[10px] font-black rounded-md transition ${
                            sizingUnit === 'in' 
                              ? 'bg-zinc-950 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-xs' 
                              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                          }`}
                        >
                          Inches
                        </button>
                        <button
                          type="button"
                          onClick={() => setSizingUnit('cm')}
                          className={`px-2 py-1 text-[10px] font-black rounded-md transition ${
                            sizingUnit === 'cm' 
                              ? 'bg-zinc-950 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-xs' 
                              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                          }`}
                        >
                          cm
                        </button>
                      </div>
                    </div>
                  </div>

                  {sizingTab === 'table' ? (
                    <div className="space-y-4">
                      {/* TABLE SECTION */}
                      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-450 dark:text-zinc-400 uppercase font-bold tracking-wider">
                              <th className="p-3">Brand Size</th>
                              <th className="p-3">To Fit Chest</th>
                              <th className="p-3">Front Length</th>
                              <th className="p-3">Shoulder width</th>
                              <th className="p-3">Sleeve Length</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                            
                            {/* row 1: Small */}
                            <tr className={`transition-all duration-300 ${
                              activeSize.toLowerCase().includes('small') || activeSize === 'S'
                                ? 'bg-amber-500/10 dark:bg-emerald-550/15 border-l-4 border-l-amber-500 dark:border-l-emerald-500 text-zinc-950 dark:text-emerald-300 font-bold' 
                                : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10'
                            }`}>
                              <td className="p-3 font-sans font-bold flex items-center gap-1.5">
                                Small (S)
                                {(activeSize.toLowerCase().includes('small') || activeSize === 'S') && (
                                  <span className="bg-amber-500/20 text-amber-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight select-none">
                                    Your Size
                                  </span>
                                )}
                              </td>
                              <td className="p-3">{sizingUnit === 'in' ? '36" - 38"' : '91 - 96 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '27"' : '68 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '17.5"' : '44 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '8.5"' : '21 cm'}</td>
                              <td className="p-3 text-right font-sans">
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>
                              </td>
                            </tr>

                            {/* row 2: Medium */}
                            <tr className={`transition-all duration-300 ${
                              activeSize.toLowerCase().includes('medium') || activeSize === 'M'
                                ? 'bg-amber-500/10 dark:bg-emerald-555/15 border-l-4 border-l-amber-500 dark:border-l-emerald-500 text-zinc-950 dark:text-emerald-300 font-bold' 
                                : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10'
                            }`}>
                              <td className="p-3 font-sans font-bold flex items-center gap-1.5">
                                Medium (M)
                                {(activeSize.toLowerCase().includes('medium') || activeSize === 'M') && (
                                  <span className="bg-amber-500/20 text-amber-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight select-none">
                                    Your Size
                                  </span>
                                )}
                              </td>
                              <td className="p-3">{sizingUnit === 'in' ? '38" - 40"' : '96 - 101 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '28"' : '71 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '18.0"' : '46 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '9.0"' : '23 cm'}</td>
                              <td className="p-3 text-right font-sans">
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>
                              </td>
                            </tr>

                            {/* row 3: Large */}
                            <tr className={`transition-all duration-300 ${
                              activeSize.toLowerCase().includes('large') && !activeSize.toLowerCase().includes('x') || activeSize === 'L'
                                ? 'bg-amber-500/10 dark:bg-emerald-555/15 border-l-4 border-l-amber-500 dark:border-l-emerald-500 text-zinc-950 dark:text-emerald-300 font-bold' 
                                : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10'
                            }`}>
                              <td className="p-3 font-sans font-bold flex items-center gap-1.5">
                                Large (L)
                                {(activeSize.toLowerCase().includes('large') && !activeSize.toLowerCase().includes('x') || activeSize === 'L') && (
                                  <span className="bg-amber-500/20 text-amber-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight select-none">
                                    Your Size
                                  </span>
                                )}
                              </td>
                              <td className="p-3">{sizingUnit === 'in' ? '40" - 42"' : '101 - 106 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '29"' : '73 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '19.0"' : '48 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '9.5"' : '24 cm'}</td>
                              <td className="p-3 text-right font-sans">
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>
                              </td>
                            </tr>

                            {/* row 4: X-Large */}
                            <tr className={`transition-all duration-300 ${
                              activeSize.toLowerCase().includes('xl') || activeSize.toLowerCase().includes('x-large') || activeSize === 'XL'
                                ? 'bg-amber-500/10 dark:bg-emerald-555/15 border-l-4 border-l-amber-500 dark:border-l-emerald-500 text-zinc-950 dark:text-emerald-300 font-bold' 
                                : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10'
                            }`}>
                              <td className="p-3 font-sans font-bold flex items-center gap-1.5">
                                X-Large (XL)
                                {(activeSize.toLowerCase().includes('xl') || activeSize.toLowerCase().includes('x-large') || activeSize === 'XL') && (
                                  <span className="bg-amber-500/20 text-amber-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight select-none">
                                    Your Size
                                  </span>
                                )}
                              </td>
                              <td className="p-3">{sizingUnit === 'in' ? '42" - 44"' : '106 - 111 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '30"' : '76 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '20.0"' : '50 cm'}</td>
                              <td className="p-3">{sizingUnit === 'in' ? '10.0"' : '25 cm'}</td>
                              <td className="p-3 text-right font-sans border-none">
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      </div>

                      {/* FLIPKART INTELLIGENT BODY FIT SELECTOR (HEIGHT & WEIGHT JOINT ESTIMATOR) */}
                      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850/80">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                          <p className="font-extrabold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">Flipkart Intelligent Sizing Recommender</p>
                        </div>
                        <p className="text-[10px] text-zinc-400 mb-3">
                          Input your physical characteristics below to predict the absolute perfect brand fit with our warehouse logs:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mb-3">
                          <div>
                            <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">Your Height</label>
                            <input
                              type="text"
                              value={userHeight}
                              onChange={(e) => handleHeightCheck(e.target.value)}
                              placeholder="e.g. 175 cm or 5.9 ft"
                              className="bg-white dark:bg-zinc-950 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-800 dark:text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">Your Weight (kg)</label>
                            <input
                              type="text"
                              value={userWeight}
                              onChange={(e) => handleWeightCheck(e.target.value)}
                              placeholder="e.g. 68 kg"
                              className="bg-white dark:bg-zinc-950 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-800 dark:text-white font-mono"
                            />
                          </div>
                        </div>

                        {recommendedSize ? (
                          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 p-2.5 rounded-lg text-xs font-bold border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                              <span>Your Recommended Flipkart Size: <span className="uppercase text-zinc-950 dark:text-white font-extrabold px-1 text-sm underline">{recommendedSize}</span></span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                setSelectedSize(recommendedSize);
                              }}
                              className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white dark:text-zinc-950 font-extrabold px-2 py-1 rounded transition uppercase tracking-wider"
                            >
                              Apply Size Selection
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-400 italic">Enter parameters above to unlock automatic size fit recommendation verdict.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* HOW TO MEASURE FLIPKART SCHEMATIC GUIDE */
                    <div className="space-y-4 animate-fade-in text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Interactive schematic outline of a shirt */}
                        <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-white dark:bg-zinc-950 relative flex flex-col justify-between overflow-hidden">
                          <p className="font-extrabold text-[11px] uppercase text-zinc-800 dark:text-zinc-200 mb-3 block text-center">📐 Garment Measurement Guide</p>
                          
                          {/* Beautiful Interactive Blueprint Style CSS Mockup representing accurate clothing coordinate measurements */}
                          <div className="relative w-40 h-48 mx-auto flex flex-col items-center justify-center p-4">
                            {/* Guideline vectors */}
                            {/* Shoulder line guide */}
                            <div className="absolute top-8 w-28 border-t border-dashed border-sky-400 dark:border-sky-500 flex justify-between">
                              <span className="text-[7px] text-sky-500 font-extrabold absolute -top-3.5 left-1/2 -translate-x-1/2 select-none tracking-widest font-mono">SHOULDER</span>
                            </div>
                            
                            {/* Length line guide */}
                            <div className="absolute left-6 h-32 border-l border-dashed border-emerald-400 dark:border-emerald-500 flex items-center">
                              <span className="text-[7px] text-emerald-500 font-extrabold -rotate-90 absolute -left-7 top-1/2 -translate-y-1/2 select-none tracking-widest font-mono">LENGTH</span>
                            </div>

                            {/* Chest line guide */}
                            <div className="absolute top-20 w-24 border-t border-dashed border-orange-400 dark:border-orange-500 flex justify-between">
                              <span className="text-[7px] text-orange-500 font-extrabold absolute -top-3.5 left-1/2 -translate-x-1/2 select-none tracking-widest font-mono">CHEST</span>
                            </div>
                            
                            {/* Custom rendered Tailwind stylized shirt contours */}
                            <div className="w-24 h-32 bg-stone-100/50 dark:bg-zinc-900 border-2 border-zinc-400 dark:border-zinc-650 rounded-t-xl relative overflow-visible shadow-xs">
                              {/* Left Sleeve */}
                              <div className="absolute -left-3.5 top-0 w-3.5 h-10 border-t-2 border-l-2 border-b-2 border-zinc-400 dark:border-zinc-650 rounded-tl-lg bg-stone-100 dark:bg-zinc-900" />
                              {/* Right Sleeve */}
                              <div className="absolute -right-3.5 top-0 w-3.5 h-10 border-t-2 border-r-2 border-b-2 border-zinc-400 dark:border-zinc-650 rounded-tr-lg bg-stone-100 dark:bg-zinc-900" />
                              {/* Collar neck cut */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 border-b-2 border-zinc-400 dark:border-zinc-650 rounded-b-full bg-zinc-200 dark:bg-zinc-950" />
                            </div>
                          </div>

                          <span className="text-[9px] text-zinc-400 block text-center mt-3 font-mono">
                            Visual guidelines for Astraveda garment alignment limits.
                          </span>
                        </div>

                        {/* List items with elegant checklist details */}
                        <div className="space-y-3.5 flex flex-col justify-center">
                          <div className="flex gap-3 leading-relaxed">
                            <span className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-mono flex-shrink-0">1</span>
                            <div>
                              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">Fits Chest Measurement</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Run a flexible measuring tape across the widest periphery of your pectoral structure, holding tape flat, level, and horizontal.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 leading-relaxed border-t border-zinc-100 dark:border-zinc-900 pt-3">
                            <span className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-mono flex-shrink-0">2</span>
                            <div>
                              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">Total Front Length</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Measure from the absolute highest vertical tip of your neck collar junction directly down onto your lower pelvic limit.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 leading-relaxed border-t border-zinc-100 dark:border-zinc-900 pt-3">
                            <span className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-mono flex-shrink-0">3</span>
                            <div>
                              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">Across Shoulder</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Align measuring anchors from your left shoulder bone peak across the base spine curve over towards the right peak.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[10.5px] text-zinc-450 dark:text-zinc-500 italic border-t border-zinc-100 dark:border-zinc-900 pt-2.5">
                    * If you correspond midpoint between dimensions, select the immediate larger increment for relaxed spatial movement. Fits are standard boxy comfort models.
                  </p>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex gap-3 items-start">
                    <Truck className="h-4.5 w-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">Express Cash on Delivery dispatch</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal text-justify">
                        Parcels are synced dynamically with Qikink Logistics pipelines. Package updates are sent to registered phone coordinates immediately upon handover.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start border-t border-zinc-100 dark:border-zinc-900 pt-3">
                    <RotateCcw className="h-4.5 w-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">7-Day Simple Returning Window</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal text-justify">
                        Requests are initiated on user accounts. Keep labels, tags, and unedited unboxing videos intact for verification processing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* REVIEWS SEGMENT */}
      <div id="reviews-segment-anchor" className="mt-14">
        <ReviewsList productId={prod.id} user={user} onNavigate={onNavigate} />
      </div>

      {/* GORGEOUS HIGH-FIDELITY RELATED PRODUCTS GALLERY */}
      {relatedProducts.length > 0 && (
        <div id="additional-suggestions-section" className="mt-20 pt-16 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 text-left">
            <div>
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-450 uppercase tracking-widest font-mono block mb-1">
                Curated Recommendations
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 dark:text-white leading-none">
                You May Also Be Interested In
              </h3>
            </div>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 max-w-xs md:text-right leading-relaxed font-medium">
              Hand-guided selections optimized to coordinate flawlessly with the current release. Click to configure.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(rp => (
              <ProductCard
                key={rp.id}
                product={rp}
                isWishlisted={wishlist.some(w => w.product_id === rp.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onViewDetails={(pid) => onNavigate('details', pid)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
