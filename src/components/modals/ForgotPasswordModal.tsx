import React from 'react';
import { motion } from 'motion/react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = React.memo(({ isOpen, onClose }: ForgotPasswordModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[500] p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 text-white p-8 sm:p-12 rounded-[40px] w-full max-w-sm border border-slate-800" 
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-2xl font-black mb-4">Reset Access</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          If you have forgotten your credentials, please check your payment confirmation email or contact our support team.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Support Email</p>
          <p className="font-bold text-emerald-600">admin@solaroptions.in</p>
        </div>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
});
