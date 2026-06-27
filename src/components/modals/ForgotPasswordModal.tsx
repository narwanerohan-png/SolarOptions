import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sun, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = React.memo(({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    // Validation
    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid registered email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Firebase Password Reset authority
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      const code = err?.code;
      if (code === 'auth/invalid-email') {
        setError("Please enter a valid registered email address.");
      } else if (code === 'auth/user-not-found') {
        // Never reveal whether an email address exists or does not exist in the system for security
        setSuccess(true);
      } else {
        setError("Unable to send the password reset email right now. Please try again in a few minutes.");
      }
    } finally {
      setIsSubmitting(false);
    }
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

        {!success ? (
          <form onSubmit={handleSendResetLink} className="space-y-6 sm:space-y-10">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-emerald-500/20">
                <Sun className="w-8 h-8 text-slate-900" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Reset Your <br />
                <span className="text-emerald-400 italic">Password</span>
              </h2>
              <p className="text-gray-400 font-medium leading-relaxed text-sm">
                Enter the registered email address associated with your SolarOptions account. We'll send a secure password reset link to your email.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input 
                    type="email"
                    placeholder="Enter email address" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-white placeholder:text-gray-600" 
                    value={email}
                    onChange={e => setEmail(e.target.value)} 
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              <p className="text-gray-500 text-xs font-medium leading-relaxed">
                Use the same email address that you used while purchasing Premium Access or registering your SolarOptions account.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={handleClose}
                className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-emerald-500 text-slate-900 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 sm:space-y-10 text-center py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Password Reset Link Sent
              </h2>
              <p className="text-gray-400 font-medium leading-relaxed text-sm max-w-sm mx-auto">
                We've sent a secure password reset link to your registered email address.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl text-left text-xs text-gray-400 space-y-2 leading-relaxed">
              <p className="font-semibold text-white">Please check your Inbox.</p>
              <p>If you don't receive the email within a few minutes, check your Spam or Junk folder.</p>
            </div>

            <button 
              onClick={handleClose}
              className="w-full py-4 bg-emerald-500 text-slate-900 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
});
