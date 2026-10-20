import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

export const FeedbackModal = React.memo(({ isOpen, onClose, onSubmit }: FeedbackModalProps) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Platform Feedback Modal"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/5 text-left" 
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-6 right-6 p-3 bg-slate-800 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-400 cursor-pointer border border-white/5 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-10 text-left pr-10">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
            <MessageSquare className="w-7 h-7 text-slate-900" />
          </div>
          <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">Platform <span className="text-emerald-400 italic">Feedback.</span></h3>
          <p className="text-gray-400 font-medium leading-relaxed mb-4 text-sm">Help us improve our industrial solar intelligence platform.</p>
          <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
            Email Us: <a href="mailto:admin@solaroptions.in" className="hover:text-emerald-300 transition-colors underline decoration-emerald-500/30 underline-offset-4">admin@solaroptions.in</a>
          </div>
          <p className="text-xs text-gray-400 font-medium leading-relaxed mt-4 pt-3 border-t border-white/5">
            <span className="text-gray-300 font-semibold">Data Removal &amp; Opt-Out:</span> To request data removal or opt out, please email{' '}
            <a 
              href="mailto:admin@solaroptions.in" 
              className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-2 transition-colors font-semibold"
            >
              admin@solaroptions.in
            </a>.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Message or Suggestions</label>
            <textarea 
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your feedback, feature requests, or facility inquiries..." 
              className="w-full px-6 py-5 bg-slate-900/50 border border-white/5 rounded-3xl outline-none focus:border-emerald-500/50 text-white transition-all font-medium resize-none placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-4 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 bg-slate-800 text-gray-300 font-bold rounded-2xl hover:bg-slate-700 transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={!message.trim()}
              onClick={() => { onSubmit(message); setMessage(''); onClose(); }}
              className="flex-[2] py-4 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all uppercase text-xs tracking-widest disabled:opacity-50 cursor-pointer active:scale-95"
            >
              Send Feedback
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
