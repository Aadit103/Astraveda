import React, { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, UserPlus, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface AuthFlowViewProps {
  viewType: 'login' | 'register' | 'forgot-password';
  onNavigate: (view: string, arg?: string) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  syncUserBoundStates: (token: string) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
  handleGoogleMockIn: (email?: string, name?: string) => Promise<void>;
}

export default function AuthFlowView({
  viewType,
  onNavigate,
  setToken,
  setUser,
  syncUserBoundStates,
  showNotification,
  handleGoogleMockIn
}: AuthFlowViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [localErr, setLocalErr] = useState('');

  // Custom Google Identity Selector Drawer/Modal states
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleCustomMode, setGoogleCustomMode] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  const presetGoogleAccounts = [
    { name: 'Cartoon Today', email: 'cartoontoday.333@gmail.com', avatarBg: 'from-emerald-500 to-teal-600', initial: 'C', badge: 'Active' },
    { name: 'Amit Patidar', email: 'amit.patidar@gmail.com', avatarBg: 'from-blue-500 to-indigo-600', initial: 'A' },
    { name: 'Pooja Iyer', email: 'pooja.iyer@gmail.com', avatarBg: 'from-pink-500 to-rose-600', initial: 'P' },
    { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', avatarBg: 'from-amber-500 to-orange-600', initial: 'V' }
  ];

  const triggerGoogleLoginFlow = async (gEmail: string, gName: string) => {
    if (googleLoading) return;
    setGoogleLoading(true);
    // Simulate high-fidelity Google OAuth security token verification delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await handleGoogleMockIn(gEmail, gName);
      setShowGoogleChooser(false);
    } catch (err: any) {
      showNotification('Google Authentication unaligned: ' + err.message, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr('');

    try {
      let endpoint = '/api/auth/login';
      let payload: any = { email, password };

      if (viewType === 'register') {
        endpoint = '/api/auth/register';
        payload = { email, password, full_name: fullName, phone };
      } else if (viewType === 'forgot-password') {
        endpoint = '/api/auth/forgot-password';
        payload = { email };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (viewType === 'forgot-password') {
          showNotification(data.message, 'success');
          // Easy preview link for mock resets
          if (data.resetToken) {
            setLocalErr(`PREVIEW CLOUD RESET TOKEN FOUND: ${data.resetToken}. You can proceed with custom resets.`);
          }
        } else {
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('token', data.token);
          syncUserBoundStates(data.token);
          showNotification('Welcome! Connection established successfully.', 'success');
          onNavigate('home');
        }
      } else {
        const dat = await res.json();
        setLocalErr(dat.error || 'Authentication credential failure.');
      }

    } catch (err) {
      setLocalErr('Connection failure. Please cross check server.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4 animate-fade-in text-left" id="auth-panel">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[32px] p-8 space-y-6 shadow-xl shadow-zinc-100 dark:shadow-black/20">
        
        <div className="text-center select-none">
          <span className="h-10 w-10 mx-auto flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xl shadow-sm">
            A
          </span>
          <h2 className="text-2xl font-display font-bold text-zinc-900 dark:text-white mt-4">
            {viewType === 'login' ? 'Welcome Back' : viewType === 'register' ? 'Create Premium Account' : 'Recover Credential Account'}
          </h2>
        </div>

        {localErr && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl leading-relaxed">
            {localErr}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {viewType === 'register' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  type="text" required placeholder="Full Name details"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500/30 transition outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Phone line</label>
                <input
                  type="text" placeholder="+919999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500/30 transition outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Email address</label>
            <input
              type="email" required placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500/30 transition outline-none"
            />
          </div>

          {viewType !== 'forgot-password' && (
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                {viewType === 'login' && (
                  <button
                    type="button" onClick={() => onNavigate('forgot-password')}
                    className="text-[10px] text-emerald-500 hover:underline min-h-0 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password" required placeholder={viewType === 'login' ? '••••••••' : 'Minimum 6 symbols'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500/30 transition outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full px-5 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 font-bold text-white dark:text-zinc-950 rounded-xl transition text-xs uppercase tracking-wider block cursor-pointer"
          >
            {viewType === 'login' ? 'Secure Log In' : viewType === 'register' ? 'Register Premium Key' : 'Request Recovery'}
          </button>
        </form>

        {/* Solid Google Auth divider and login */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 select-none">
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">Managed Google Account</span>
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleChooser(true)}
            className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.39 3.61v3h3.86c2.26-2.08 3.67-5.14 3.67-8.73z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1c1.97 3.92 6.02 6.61 10.71 6.61z"/>
              <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.29C.47 8.24 0 10.07 0 12s.47 3.76 1.29 5.4l3.98-3.11z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.6l3.98 3.11c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Google Accounts Login
          </button>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4.5 text-center text-xs text-zinc-500">
          {viewType === 'login' ? (
            <p>
              First time visitor?{' '}
              <button onClick={() => onNavigate('register')} className="text-emerald-500 font-bold hover:underline min-h-0 cursor-pointer">
                Register Coordinates
              </button>
            </p>
          ) : (
            <p>
              Already have credentials?{' '}
              <button onClick={() => onNavigate('login')} className="text-emerald-500 font-bold hover:underline min-h-0 cursor-pointer">
                Login Securely
              </button>
            </p>
          )}
        </div>

      </div>

      {/* Google Account Selector Overlay Modal */}
      <AnimatePresence>
        {showGoogleChooser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <style>{`
              @keyframes googleLoaderMove {
                0% { left: -45%; }
                100% { left: 100%; }
              }
              .google-loader-bar {
                animation: googleLoaderMove 1.5s infinite linear;
              }
            `}</style>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl text-left"
            >
              {/* Google progress line */}
              {googleLoading && (
                <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-red-500 via-yellow-400 to-green-500 google-loader-bar absolute w-1/2 rounded-full"></div>
                </div>
              )}

              {/* Close Button */}
              <button
                disabled={googleLoading}
                onClick={() => {
                  setShowGoogleChooser(false);
                  setGoogleCustomMode(false);
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full transition cursor-pointer"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-6 pt-8 space-y-6">
                {/* Branding Headers */}
                <div className="text-center space-y-1.5">
                  <div className="flex justify-center items-center gap-1.5 mb-1 select-none">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.39 3.61v3h3.86c2.26-2.08 3.67-5.14 3.67-8.73z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1c1.97 3.92 6.02 6.61 10.71 6.61z"/>
                      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.29C.47 8.24 0 10.07 0 12s.47 3.76 1.29 5.4l3.98-3.11z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.6l3.98 3.11c.95-2.85 3.6-4.96 6.73-4.96z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-zinc-900 dark:text-white font-sans">
                    {googleCustomMode ? 'Use another account' : 'Choose an account'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    to continue to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Astraveda Apparels</span>
                  </p>
                </div>

                {/* Body Content */}
                {!googleCustomMode ? (
                  <div className="space-y-2">
                    {/* Prest Accounts */}
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-64 overflow-y-auto pr-1">
                      {presetGoogleAccounts.map((acc, index) => (
                        <button
                          key={index}
                          disabled={googleLoading}
                          onClick={() => triggerGoogleLoginFlow(acc.email, acc.name)}
                          className="w-full text-left py-3.5 px-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-3.5 transition rounded-2xl cursor-pointer disabled:opacity-60 disabled:hover:bg-transparent group"
                        >
                          <div className={`h-9 w-9 rounded-full bg-gradient-to-tr ${acc.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm select-none`}>
                            {acc.initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{acc.name}</p>
                              {acc.badge ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 select-none">
                                  {acc.badge}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">{acc.email}</p>
                          </div>
                          <UserCheck className="h-4 w-4 text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500 transition" />
                        </button>
                      ))}
                    </div>

                    {/* Another Account toggle */}
                    <button
                      disabled={googleLoading}
                      onClick={() => setGoogleCustomMode(true)}
                      className="w-full text-left py-3.5 px-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-3.5 transition rounded-2xl cursor-pointer text-xs font-medium text-blue-500 dark:text-blue-450 hover:text-blue-600 dark:hover:text-blue-305 border border-transparent hover:border-zinc-150 dark:hover:border-zinc-800 mt-2 disabled:opacity-50"
                    >
                      <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-505 dark:text-zinc-400 flex items-center justify-center font-bold text-lg select-none">
                        +
                      </div>
                      <span>Use another Google Account</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Custom User Credentials Simulator Form */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          disabled={googleLoading}
                          placeholder="Your official Google profile name"
                          value={googleCustomName}
                          onChange={(e) => setGoogleCustomName(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-blue-500 transition outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Gmail Address</label>
                        <input
                          type="email"
                          required
                          disabled={googleLoading}
                          placeholder="yourname@gmail.com"
                          value={googleCustomEmail}
                          onChange={(e) => setGoogleCustomEmail(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-blue-500 transition outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="button"
                        disabled={googleLoading}
                        onClick={() => setGoogleCustomMode(false)}
                        className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-350 transition cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={googleLoading || !googleCustomEmail.includes('@') || !googleCustomName.trim()}
                        onClick={() => triggerGoogleLoginFlow(googleCustomEmail.trim(), googleCustomName.trim())}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        Verify & Login
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy notices */}
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-850">
                  To continue, Google will share your verified name, email address, language preference, and profile picture with Astraveda. Standard security regulations protect your cloud credentials.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
