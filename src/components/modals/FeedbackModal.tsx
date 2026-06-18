import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

export const FeedbackModal = React.memo(({ isOpen, onClose, onSubmit }: FeedbackModalProps) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/5 text-left" 
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-10 text-left">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
            <MessageSquare className="w-7 h-7 text-slate-900" />
          </div>
          <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">System <span className="text-emerald-400 italic">Feedback.</span></h3>
          <p className="text-gray-400 font-medium leading-relaxed mb-4">Help us calibrate our industrial solar intelligence engine.</p>
          <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
            Email Us: <a href="mailto:admin@solaroptions.in" className="hover:text-emerald-300 transition-colors underline decoration-emerald-500/30 underline-offset-4">admin@solaroptions.in</a>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Message Protocol</label>
            <textarea 
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe data inconsistencies or system suggestions..." 
              className="w-full px-6 py-5 bg-slate-900/50 border border-white/5 rounded-3xl outline-none focus:border-emerald-500/50 text-white transition-all font-medium resize-none placeholder:text-gray-700"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-5 bg-slate-800 text-gray-400 font-bold rounded-2xl hover:bg-slate-700 transition-all">Dismiss</button>
            <button 
              onClick={() => { onSubmit(message); setMessage(''); onClose(); }}
              className="flex-[2] py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all uppercase text-xs tracking-widest"
            >
              Submit Signal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
