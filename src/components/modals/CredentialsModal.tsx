import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Copy, ArrowRight } from 'lucide-react';

interface CredentialsModalProps {
  isOpen: boolean;
  credentials: { username: string; password: any };
  onClose: () => void;
  onContinue: () => void;
}

export const CredentialsModal = React.memo(({ isOpen, credentials, onClose, onContinue }: CredentialsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-12 rounded-[50px] w-full max-w-md shadow-2xl relative overflow-hidden border border-slate-800" 
      >
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
              onClick={() => { navigator.clipboard.writeText(credentials.username); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-800 rounded-xl hover:bg-emerald-500 hover:text-slate-900 transition-all text-gray-400 border border-slate-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-slate-950/50 p-6 rounded-3xl text-left border border-slate-800 group relative">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Secure Token</p>
            <p className="font-mono font-bold text-lg select-all text-emerald-400">{credentials.password}</p>
            <button 
              onClick={() => { navigator.clipboard.writeText(credentials.password); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-800 rounded-xl hover:bg-emerald-500 hover:text-slate-900 transition-all text-gray-400 border border-slate-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className="w-full py-5 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Continue to Terminal <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
});
