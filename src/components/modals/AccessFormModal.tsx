import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AccessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
  onFreeTrial?: (form: any, forceBypass?: boolean) => void;
  onGoogleLogin?: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const AccessFormModal = React.memo(({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onFreeTrial,
  onGoogleLogin,
  isSubmitting = false,
  errorMessage = null,
  onClearError
}: AccessFormModalProps) => {
  const [accessForm, setAccessForm] = useState({
    companyName: '',
    contact: '',
    email: '',
    industry: 'Industrial',
    requirement: 'Solar Assets',
    gst: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setAccessForm(prev => ({ ...prev, [field]: value }));
    if (onClearError) {
      onClearError();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[200] p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl border border-white/5 scrollbar-hide" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-10">
          <div className="space-y-2 text-left">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">Request <span className="text-emerald-400 italic font-medium">Data Access.</span></h3>
            <p className="text-gray-400 text-sm font-medium">30-day regional access to industrial facility intelligence.</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shrink-0">₹7800 Enterprise</div>
        </div>

        {/* Google Sign-In Option for instant login or automated trial provisioning */}
        {onGoogleLogin && (
          <div className="mb-8 space-y-4">
            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/10 hover:border-white/20 rounded-2xl font-black text-xs text-white transition-all uppercase tracking-widest shadow-xl cursor-pointer"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
              One-Tap access with Google
            </button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">or request access manually</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-12 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Company Entity</label>
            <input 
              placeholder="Legal Entity Name" 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" 
              value={accessForm.companyName}
              onChange={e => handleInputChange('companyName', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Mobile (Direct)</label>
            <input 
              placeholder="Direct Line" 
              maxLength={10} 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" 
              value={accessForm.contact}
              onChange={e => handleInputChange('contact', e.target.value.replace(/\D/g, ''))} 
            />
          </div>
          <div className="col-span-full space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Corporate Email</label>
            <input 
              type="email" 
              placeholder="verified@company.com" 
              className="w-full px-8 py-5 bg-slate-900 text-white border border-white/5 rounded-2xl focus:border-emerald-500 transition-all font-black" 
              value={accessForm.email}
              onChange={e => handleInputChange('email', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Industry Segment</label>
            <select 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold appearance-none"
              value={accessForm.industry}
              onChange={e => handleInputChange('industry', e.target.value)}
            >
              <option value="Industrial">Manufacturing</option>
              <option value="Commercial">Commercial/Warehousing</option>
              <option value="Institutional">Healthcare/Education</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Tax ID (GST/Optional)</label>
            <input 
              placeholder="GSTIN Number" 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" 
              value={accessForm.gst}
              onChange={e => handleInputChange('gst', e.target.value)} 
            />
          </div>
        </div>

        {errorMessage && (() => {
          const isUnauthorizedDomain = errorMessage.toLowerCase().includes("unauthorized") || 
            errorMessage.toLowerCase().includes("auth-domain") || 
            errorMessage.toLowerCase().includes("iframe") || 
            errorMessage.toLowerCase().includes("firebase") || 
            errorMessage.toLowerCase().includes("popup") ||
            errorMessage.toLowerCase().includes("cancel") ||
            errorMessage.toLowerCase().includes("block");
          
          const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

          return (
            <div className="mb-8 space-y-4">
              {/* Detailed Error Box */}
              <div className="p-6 bg-red-500/10 border border-red-500/25 text-red-400 rounded-3xl flex items-start gap-4 text-xs leading-relaxed">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 animate-pulse" />
                <div className="flex-1 space-y-1 text-left">
                  <span className="font-extrabold uppercase [letter-spacing:0.08em] flex items-center gap-2 text-red-500 text-[10px]">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    Verification Issue
                  </span>
                  <p className="font-semibold text-gray-300">{errorMessage}</p>
                </div>
              </div>

              {/* Troubleshooting and Sandbox Instructions */}
              {isUnauthorizedDomain && (
                <div className="p-6 bg-slate-950 border border-white/10 rounded-3xl space-y-5 text-left text-xs">
                  <div className="space-y-1.5">
                    <h4 className="font-black uppercase tracking-wider text-emerald-400 text-[10px] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                      How to brand as "solaroptions" & fix Auth Domains
                    </h4>
                    <p className="text-gray-400 text-xs">
                      Firebase and Google Sign-In secure apps by requiring app names and authorized domains to be declared in google/firebase consoles.
                    </p>
                  </div>

                  <div className="space-y-4 pl-1 border-l border-white/10">
                    <div className="space-y-1">
                      <p className="font-extrabold text-white text-[11px]">1. Change Display Name to "solaroptions"</p>
                      <ul className="list-disc pl-4 text-[11px] text-gray-400 space-y-1">
                        <li>Go to your <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5 font-bold">Google Cloud Console <ExternalLink className="w-3 h-3" /></a></li>
                        <li>Navigate to <strong>APIs & Services &rarr; OAuth consent screen</strong></li>
                        <li>Under <strong>App Name</strong>, replace the auto-generated client ID (e.g., <code className="text-rose-400 font-mono text-[10px]">gen-lang-client-...</code>) with <strong className="text-emerald-400">solaroptions</strong> or <strong className="text-emerald-400">Solar Options</strong>.</li>
                        <li>Save and publish changes to update the Google identity panel!</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <p className="font-extrabold text-white text-[11px]">2. Authorize Deployed / Preview Domains</p>
                      <ul className="list-disc pl-4 text-[11px] text-gray-400 space-y-1">
                        <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5 font-bold">Firebase Console <ExternalLink className="w-3 h-3" /></a> &rarr; <strong>Authentication &rarr; Settings &rarr; Authorized domains</strong></li>
                        <li>Click <strong>Add domain</strong> and authorize your preview/deployed domain:
                          <div className="mt-1 bg-slate-900 border border-white/5 py-1.5 px-3 rounded font-mono text-[10px] text-emerald-400 select-all font-bold">
                            {currentDomain || 'ais-pre-xeegx3cd7wtad4osbysfww-862991197985.asia-southeast1.run.app'}
                          </div>
                        </li>
                        <li>This enables seamless single-tap authentication directly in your browser iframe!</li>
                      </ul>
                    </div>
                  </div>

                  {/* Sandbox Developer Bypass */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                      <p className="text-[11px] text-gray-400 leading-normal">
                        <strong className="text-emerald-400 uppercase text-[9px] [letter-spacing:0.04em] block">Sandbox Developer Mode</strong>
                        Need to test the 3D tool or explore facilities right now without updating settings? You can auto-verify the corporate email you entered using sandbox simulation mode.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFreeTrial && onFreeTrial(accessForm, true)}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-900" />
                      Simulate Google Sign-In & Bypass
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {isSubmitting && (
          <div className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest">
            <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Digital Request...
          </div>
        )}

        <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={() => onFreeTrial && onFreeTrial(accessForm)}
              disabled={isSubmitting}
              className={`flex-1 py-5 bg-slate-800 text-emerald-400 border border-emerald-500/20 font-black rounded-2xl shadow-2xl transition-all uppercase text-[11px] tracking-wider ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'}`}
            >
              {isSubmitting ? 'Validating...' : 'Start Free 1-Day Trial'}
            </button>
            <button 
              type="button"
              onClick={() => onSubmit(accessForm)}
              disabled={isSubmitting}
              className={`flex-[1.5] py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-3xl shadow-emerald-500/20 transition-all uppercase text-[11px] tracking-widest ${isSubmitting ? 'opacity-40 cursor-not-allowed' : 'hover:bg-emerald-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'}`}
            >
              {isSubmitting ? 'Initializing...' : 'Premium Access (30 Days)'}
            </button>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`w-full py-2 text-gray-500 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest ${isSubmitting ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5 hover:text-white cursor-pointer'}`}
          >
            Cancel Request
          </button>
        </div>
      </motion.div>
    </div>
  );
});
