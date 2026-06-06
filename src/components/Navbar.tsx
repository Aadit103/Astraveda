import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  LayoutDashboard, 
  ShoppingBag as BagIcon,
  MapPin
} from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  cartCount: number;
  wishlistCount: number;
  dark: boolean;
  setDark: (val: boolean) => void;
  onNavigate: (view: string, arg?: string) => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  cartCount,
  wishlistCount,
  dark,
  setDark,
  onNavigate,
  onLogout
}: NavbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onNavigate('shop', `search:${searchVal.trim()}`);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            id="nav-logo"
          >
            <div className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xl shadow-xl border border-zinc-800 dark:border-zinc-200 overflow-hidden">
              {/* Sleek premium emerald accent background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Shimmer/reflective light effect */}
              <div className="absolute -inset-full rotate-45 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <span className="relative z-10 font-serif tracking-tighter text-emerald-400 dark:text-emerald-600 font-extrabold text-2xl group-hover:scale-110 transition-transform duration-300">
                A
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-widest bg-gradient-to-b from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent hidden sm:inline-block leading-tight font-display">
                ASTRAVEDA
              </span>
              <span className="text-[8px] font-extrabold tracking-[0.3em] text-emerald-500 dark:text-emerald-400 uppercase hidden sm:block mt-px font-mono leading-none">
                PREMIUM ATHLETICS
              </span>
            </div>
          </div>

          {/* Quick Category Browsing Links (Tablet/Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <button onClick={() => onNavigate('shop')} className="hover:text-emerald-500 py-2">
              All Products
            </button>
            <button onClick={() => onNavigate('shop', 'category:T-Shirts')} className="hover:text-emerald-500 py-2">
              T-Shirts
            </button>
            <button onClick={() => onNavigate('shop', 'category:Hoodies')} className="hover:text-emerald-500 py-2">
              Hoodies
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search products, brands, or tech..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-0 focus:ring-2 focus:ring-emerald-500/30 text-zinc-900 dark:text-white rounded-xl py-2 pl-10 pr-4 text-sm placeholder-zinc-400 transition"
              />
            </div>
          </form>

          {/* Right Control Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition"
              title="Toggle Theme"
              id="theme-toggle"
            >
              {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Wishlist Link */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition relative"
              title="Wishlist"
              id="wishlist-btn"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white font-bold text-[10px] flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Link */}
            <button
              onClick={() => onNavigate('cart')}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition relative"
              title="Shopping Cart"
              id="cart-btn"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account Section */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 p-1 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition"
                    id="user-profile-dropdown"
                  >
                    <span className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-emerald-500 font-bold text-sm">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium hidden sm:inline max-w-[80px] truncate">
                      {user.full_name || 'My Account'}
                    </span>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-400">Signed in as</p>
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded-md">
                            Administrator
                          </span>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('admin');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                        >
                          <LayoutDashboard className="h-4 w-4 text-emerald-500" />
                          Admin Console
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('orders');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                      >
                        <BagIcon className="h-4 w-4 text-emerald-500" />
                        Purchase History
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('addresses');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                      >
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        Manage Addresses
                      </button>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left font-medium"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm font-medium transition shadow-sm"
                  id="nav-login-btn"
                >
                  <User className="h-4 w-4 mr-1.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories / Search Subbar for Mobile */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border-0 focus:ring-2 focus:ring-emerald-500/30 text-zinc-900 dark:text-white rounded-xl py-2 pl-9 pr-4 text-sm placeholder-zinc-400 transition"
            />
          </form>
        </div>
      </div>
    </nav>
  );
}
