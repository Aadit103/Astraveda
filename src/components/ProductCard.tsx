import React, { useState } from 'react';
import { Heart, Star, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => any;
  onAddToCart: (productId: string, variantId?: string, qty?: number) => void;
  onViewDetails: (productId: string) => void;
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onViewDetails
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  // Take the primary or fallback images
  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
  const secondaryImage = product.images?.[1] || primaryImage;

  // Calculate discount percentage
  const discountPercent = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl overflow-hidden hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:scale-[1.015] hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col h-full"
    >
      {/* Product Image Window */}
      <div 
        onClick={() => onViewDetails(product.id)}
        className="relative bg-zinc-50 dark:bg-zinc-950 aspect-[4/5] w-full overflow-hidden cursor-pointer"
      >
        {/* Secondary image fades in on hover */}
        <img
          src={hovered ? secondaryImage : primaryImage}
          referrerPolicy="no-referrer"
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out scale-100 group-hover:scale-105"
          loading="lazy"
        />

        {/* Discount Tag */}
        {discountPercent > 0 && (
          <span className="absolute top-4 left-4 bg-emerald-500 text-white font-extrabold text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-lg z-10 shadow-sm shadow-emerald-500/20">
            {discountPercent}% OFF
          </span>
        )}

        {/* Dynamic Glowing Low Stock Urgency Badge */}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-4 right-4 bg-rose-500 text-white font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg z-10 shadow-lg shadow-rose-500/20 flex items-center gap-1.5 select-none transition animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-white inline-block animate-ping"></span>
            Only {product.stock} left!
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 bg-black/40 text-white font-bold text-sm tracking-uppercase flex items-center justify-center backdrop-blur-[2px] z-10">
            OUT OF STOCK
          </span>
        )}

        {/* Quick hover views slide-in buttons */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-300 translate-y-2 group-hover:translate-y-0 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product.id);
            }}
            className="p-3 bg-white dark:bg-zinc-800 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white text-zinc-700 dark:text-zinc-200 rounded-xl transition shadow-lg"
            title="Quick View"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          
          {product.stock > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Select default first variant if exists
                const defaultVariantId = product.variants?.[0]?.id || undefined;
                onAddToCart(product.id, defaultVariantId);
              }}
              className="p-3 bg-white dark:bg-zinc-800 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white text-zinc-700 dark:text-zinc-200 rounded-xl transition shadow-lg"
              title="Add to Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Badge & Toggle Wishlist */}
          <div className="flex items-center justify-between gap-2 h-6">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {product.category}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(product.id);
              }}
              className={`p-1.5 rounded-full transition ${
                isWishlisted 
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20' 
                  : 'text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onViewDetails(product.id)}
            className="mt-2 text-zinc-900 dark:text-zinc-100 font-display font-semibold text-lg line-clamp-1 hover:text-emerald-500 cursor-pointer transition"
          >
            {product.name}
          </h3>

          {/* Static Star Rating */}
          <div className="flex items-center gap-1 mt-2">
            <div className="flex text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">5.0</span>
          </div>
        </div>

        {/* Pricing Layout */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-display font-bold text-zinc-900 dark:text-white">
              ₹{product.price}
            </span>
            {product.compare_at_price && (
              <span className="text-zinc-400 dark:text-zinc-500 text-sm line-through">
                ₹{product.compare_at_price}
              </span>
            )}
          </div>
          
          <button
            onClick={() => onViewDetails(product.id)}
            className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 hover:underline"
          >
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
