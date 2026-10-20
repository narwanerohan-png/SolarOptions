import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Copy, ArrowRight, X, Check } from 'lucide-react';

interface CredentialsModalProps {
  isOpen: boolean;
  credentials: { username: string; password: any; isPaymentSuccess?: boolean };
  onClose: () => void;
  onContinue: () => void;
}

export const CredentialsModal = React.memo(({ isOpen, credentials, onClose, onContinue }: CredentialsModalProps) => {
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  const handleCopy = (text: string, field: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  if (credentials?.isPaymentSuccess) {
    return (
      <div 
        className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Payment Successful Modal"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-slate-900 text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-800 text-center" 
          id="credentials-modal-success-content"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-6 right-6 p-3 bg-slate-800 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-400 cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 mx-auto">
              <ShieldCheck className="w-8 h-8 text-slate-900" />
            </div>
            <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">Payment <span className="text-emerald-400 italic">successful.</span></h3>
            <p className="text-gray-300 text-sm font-medium leading-relaxed">
              We've sent a password setup email to your registered email address.
              <br /><br />
              Please create your password and then log in.
            </p>
          </div>

          <button 
            onClick={onContinue}
            className="w-full py-5 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            id="continue-to-login-btn"
          >
            Continue to Login <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Credentials Initialized Modal"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-800 text-center" 
        id="credentials-modal-trial-content"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-6 right-6 p-3 bg-slate-800 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-400 cursor-pointer border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 mx-auto">
            <ShieldCheck className="w-8 h-8 text-slate-900" />
          </div>
          <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">Dashboard <span className="text-emerald-400 italic">Unlocked.</span></h3>
          <p className="text-gray-400 text-sm font-medium">Enterprise credentials initialized. Save securely.</p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="bg-slate-950/50 p-6 rounded-3xl text-left border border-slate-800 group relative">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Username</p>
            <p className="font-mono font-bold text-lg select-all text-white">{credentials.username}</p>
            <button 
              type="button"
              onClick={() => handleCopy(credentials.username, 'username')}
              aria-label="Copy username"
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-800 rounded-xl hover:bg-emerald-500 hover:text-slate-900 transition-all text-gray-400 border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              {copiedField === 'username' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="bg-slate-950/50 p-6 rounded-3xl text-left border border-slate-800 group relative">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Secure Password</p>
            <p className="font-mono font-bold text-lg select-all text-emerald-400">{credentials.password}</p>
            <button 
              type="button"
              onClick={() => handleCopy(credentials.password, 'password')}
              aria-label="Copy password"
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-800 rounded-xl hover:bg-emerald-500 hover:text-slate-900 transition-all text-gray-400 border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              {copiedField === 'password' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className="w-full py-5 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          Continue to Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
});
