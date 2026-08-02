import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sun, Eye, EyeOff, Link2, ShieldCheck, Loader2 } from 'lucide-react';

interface AccountLinkingModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onLinkAccount: (password: string) => Promise<void>;
  isSubmitting: boolean;
}

export const AccountLinkingModal = React.memo(({
  isOpen,
  email,
  onClose,
  onLinkAccount,
  isSubmitting
}: AccountLinkingModalProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    try {
      await onLinkAccount(password);
      setPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to link account.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[500] p-4 backdrop-blur-xl" onClick={handleClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-2xl text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/10 shadow-emerald-500/5 text-left"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-4 sm:p-6">
          <button onClick={handleClose} className="p-3 bg-slate-800 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-emerald-500/20">
              <Link2 className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Existing Account <br />
              <span className="text-emerald-400 italic">Found.</span>
            </h2>
            <p className="text-gray-400 font-medium leading-relaxed text-sm">
              An account for <span className="text-white font-bold">{email}</span> already exists. To enable 1-click Google Sign-In for future logins, please verify ownership by entering your password.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-6 py-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl outline-none font-medium text-gray-400 cursor-not-allowed select-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Account Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-6 pr-14 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-white placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-300 font-medium leading-normal">
              One-time verification. Future sign-ins with Google will work instantly without a password.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="flex-[2] py-4 bg-emerald-500 text-slate-900 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Linking...
                </>
              ) : (
                'Link & Sign In'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});
