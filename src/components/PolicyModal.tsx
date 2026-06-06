import React, { useState, useEffect } from 'react';
import { X, FileText, HeartHandshake, ShieldCheck, CheckCircle, Scale, AlertCircle } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'policy' | 'privacy';
}

export default function PolicyModal({ isOpen, onClose, initialTab = 'terms' }: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'policy' | 'privacy'>(initialTab);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      id="policy-modal-backdrop"
    >
      <div 
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        id="policy-modal-content"
      >
        {/* Top Header Card */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-zinc-900 dark:text-white">Astraveda Assurance Center</h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-500">Legal declarations, service blueprints, and buyer provisions</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs Row */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-1.5 overflow-x-auto scrollbar-none select-none">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Terms & Conditions
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            Return & Refund Policy
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy Framework
          </button>
        </div>

        {/* Scrollable Rich Document Viewport */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed text-left font-sans">
          
          {/* TAB 1: TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in" id="content-terms">
              <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-2xl flex gap-3">
                <Scale className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-550 dark:text-emerald-400/90 leading-normal">
                  By accessing the Astraveda platform, checking out items, or engaging dynamically with our digital storefront, you unconditionally consent to these terms of service.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-mono">01</span>
                  Cash on Delivery (COD) Mandate
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-7 text-justify">
                  Our storefront utilizes continuous Cash on Delivery (COD) pipelines synchronized directly with real-time Qikink fulfillment networks. Registered buyers warrant that any placement of a COD order constitutes a structural promise to procure. Package refusal at doorsteps without verified physical damage incurs transactional safety audits, and may lead to persistent dashboard checkout suspension.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-mono">02</span>
                  Inventory Control & Over-sale Restrictions
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-7 text-justify">
                  Astraveda premium variants represent curated, small-batch releases. Due to precise live-stock tracking alerts, stock amounts are updated dynamically. If an item becomes deactivated or low-stock at checkout, Astraveda reserves rights to coordinate alternative sizes or refund instantly.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-mono">03</span>
                  Limitation of Liability
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-7 text-justify">
                  We render website operations without guarantee of uninterrupted uptime. Under no context shall Astraveda or its partner logistics modules be liable for transit delay, system data maintenance intervals, or third-party web interface errors.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-mono">04</span>
                  Governing Jurisdiction
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-7 text-justify">
                  All transactional agreements and policy rules are governed and interpreted purely according to commercial legal frameworks, without reference to conflict of laws parameters.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RETURN AND REFUND POLICY */}
          {activeTab === 'policy' && (
            <div className="space-y-5 animate-fade-in" id="content-policy">
              <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-550 dark:text-amber-400/90 leading-normal">
                  Our Return Process is integrated step-by-step into your user dashboard. Please review the criteria below to ensure seamless returns validation.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">7-Day Return Period</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Return requests can be registered within <span className="font-semibold text-zinc-800 dark:text-zinc-200">7 days from package arrival</span>. Once 7 days expire, the checkout interface locks the Order Transaction record, and return submissions will be restricted.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">Unboxing Video Requirement</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      To qualify for claims of damaged, missing, or incorrect products, customers are required to provide a clear, uncut unboxing video. Without verification records, Qikink and Astraveda auditing admins reserve complete rights to rejects claims.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">Product Tags & Quality</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Articles must remain in original unused state, with all labels, product tags, and custom packaging envelopes fully intact. Used, altered, or dirty merchandise is strictly non-returnable.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">Admin Approval & Refunds</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Once returned, shipments are audited within 48 working hours. Approved claims receive prompt cashback allocations or direct merchandise exchange tracking keys.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY FRAMEWORK */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fade-in" id="content-privacy">
              <div className="bg-sky-500/5 dark:bg-sky-950/10 border border-sky-500/10 p-4 rounded-2xl flex gap-3">
                <ShieldCheck className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-550 dark:text-sky-400/90 leading-normal">
                  Your data security is Astraveda`s central directive. We operate enterprise-grade protection architectures to safeguard physical customer credentials.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-l-2 border-emerald-500 pl-4 py-1">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-150 uppercase tracking-wider block">Credential Encryption</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1">
                    Passcodes and active dashboard web-tokens are fully encrypted before database injection. Administrators do not have structural raw text read permissions on user log-ins.
                  </p>
                </div>

                <div className="border-l-2 border-emerald-500 pl-4 py-1">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-150 uppercase tracking-wider block">Zero Third-Party Scraping</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1">
                    We strictly forbid outbound sharing or sales of delivery coordinates, customer emails, or transaction logs. Information is solely transmitted to secure shipping proxies like Qikink for parcel dispatch.
                  </p>
                </div>

                <div className="border-l-2 border-emerald-500 pl-4 py-1">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-150 uppercase tracking-wider block">Safe Payment Protocols</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1">
                    As we prioritize Cash On Delivery routes, no private bank accounts or direct card credentials are requested or stored during active sessions, preserving full digital anonymity.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Call to Action Info */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-805 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white dark:text-zinc-950 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition"
          >
            I Acknowledge Updates
          </button>
        </div>
      </div>
    </div>
  );
}
