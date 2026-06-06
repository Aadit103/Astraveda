import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '../types';

interface HeroBannerProps {
  banners: Banner[];
  onNavigate: (view: string, arg?: string) => void;
}

export default function HeroBanner({ banners, onNavigate }: HeroBannerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) {
    // Elegant fallback skeleton banner
    return (
      <div className="relative bg-zinc-900 border-b border-zinc-800 h-[380px] sm:h-[450px] flex items-center justify-center p-8 select-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/40 to-emerald-950/40 opacity-50 z-0"></div>
        <div className="relative z-10 text-center max-w-2xl px-4 animate-fade-in">
          <span className="text-emerald-400 font-display text-sm font-semibold uppercase tracking-wider">
            Premium Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mt-3 leading-tight">
            Elevated Essentials for Modern Living
          </h1>
          <p className="text-zinc-300 mt-4 text-base sm:text-lg max-w-lg mx-auto">
            Discover handpicked apparel, premium hoodies, and creation daypacks engineered for style and endurance.
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-semibold hover:opacity-90 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 mx-auto"
          >
            Start Browsing <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative h-[380px] sm:h-[480px] w-full overflow-hidden border-b border-zinc-200 dark:border-zinc-800 select-none group">
      {/* Slides */}
      {banners.map((ban, idx) => (
        <div
          key={ban.id}
          className={`absolute inset-0 transition-all duration-700 ease-out flex items-center ${
            idx === currentIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Background Image */}
          <img
            src={ban.image_url}
            referrerPolicy="no-referrer"
            alt={ban.title}
            className="absolute inset-0 w-full h-full object-cover brightness-[0.55] dark:brightness-[0.4]"
          />

          {/* Solid Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>

          {/* Text Content overlay */}
          <div className="absolute left-0 right-0 px-6 sm:px-12 md:px-20 max-w-3xl z-10 text-left text-white animate-fade-in">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-tight">
              {ban.title}
            </h2>
            <p className="text-zinc-200 mt-4 text-base sm:text-lg md:text-xl font-light leading-relaxed">
              {ban.subtitle}
            </p>
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  if (ban.link) {
                    if (ban.link.includes('category:')) {
                      const categoryName = ban.link.split('category:')[1];
                      onNavigate('shop', `category:${categoryName}`);
                    } else if (ban.link === '/shop') {
                      onNavigate('shop');
                    } else {
                      onNavigate('shop');
                    }
                  } else {
                    onNavigate('shop');
                  }
                }}
                className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-100 transition shadow-lg shadow-black/10 flex items-center gap-2"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition opacity-0 group-hover:opacity-100 z-25"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition opacity-0 group-hover:opacity-100 z-25"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicators Indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-25">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIdx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
