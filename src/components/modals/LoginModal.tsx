import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, X, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (form: any) => void;
  onShowForgotPassword: () => void;
  onShowAccessForm: () => void;
  isSubmitting: boolean;
}

export const LoginModal = React.memo(({ 
  isOpen, 
  onClose, 
  onLogin, 
  onShowForgotPassword, 
  onShowAccessForm,
  isSubmitting 
}: LoginModalProps) => {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[250] p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-2xl text-white p-12 rounded-[50px] w-full max-w-md shadow-2xl relative overflow-hidden border border-white/10 shadow-emerald-500/5" 
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-6">
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
              <Sun className="w-8 h-8 text-slate-900" />
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-tight">Secure <br/><span className="text-emerald-400 italic">Access.</span></h2>
            <p className="text-gray-400 font-medium leading-relaxed">Enterprise solar intelligence dashboard for approved partners.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
              <input 
                placeholder="Enter Username" 
                className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-white placeholder:text-gray-600" 
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
              />
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                <button 
                  onClick={onShowForgotPassword}
                  className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter Password" 
                  className="w-full pl-6 pr-14 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-white placeholder:text-gray-600 animate-none" 
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={() => onLogin(loginForm)} 
                className="flex-[2] py-4 bg-emerald-500 text-slate-900 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Login Now'}
              </button>
            </div>
            
            <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={() => { onClose(); onShowAccessForm(); }}
                className="w-full py-4 text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors"
              >
                Don't have access? <span className="font-bold underline">Register Here</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
