import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AccessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
}

export const AccessFormModal = React.memo(({ isOpen, onClose, onSubmit }: AccessFormModalProps) => {
  const [accessForm, setAccessForm] = useState({
    companyName: '',
    contact: '',
    email: '',
    industry: 'Industrial',
    requirement: 'Solar Assets',
    gst: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[200] p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 text-white p-12 rounded-[50px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl border border-white/5 scrollbar-hide" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">Request <span className="text-emerald-400 italic font-medium">Data Access.</span></h3>
            <p className="text-gray-400 text-sm font-medium">30-day regional access to industrial facility leads.</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">₹7800 Enterprise</div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Company Entity</label>
            <input 
              placeholder="Legal Entity Name" 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" 
              value={accessForm.companyName}
              onChange={e => setAccessForm({...accessForm, companyName: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Mobile (Direct)</label>
            <input 
              placeholder="Direct Line" 
              maxLength={10} 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" 
              value={accessForm.contact}
              onChange={e => setAccessForm({...accessForm, contact: e.target.value.replace(/\D/g, '')})} 
            />
          </div>
          <div className="col-span-full space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Corporate Email</label>
            <input 
              type="email" 
              placeholder="verified@company.com" 
              className="w-full px-8 py-5 bg-slate-900 text-white border border-white/5 rounded-2xl focus:border-emerald-500 transition-all font-black" 
              value={accessForm.email}
              onChange={e => setAccessForm({...accessForm, email: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Industry Segment</label>
            <select 
              className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold appearance-none"
              value={accessForm.industry}
              onChange={e => setAccessForm({...accessForm, industry: e.target.value})}
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
              onChange={e => setAccessForm({...accessForm, gst: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-6 border-t border-white/5">
           <button onClick={onClose} className="flex-1 py-5 bg-slate-800 text-gray-400 font-bold rounded-2xl hover:bg-slate-700 transition-all">Cancel Request</button>
           <button 
            onClick={() => onSubmit(accessForm)}
            className="flex-[2] py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-sm tracking-[0.2em]"
           >
             Initialize Secure Payment
           </button>
        </div>
      </motion.div>
    </div>
  );
});
