import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, LogOut, Building, Compass, Calculator, AlertTriangle, KeyRound } from 'lucide-react';

interface AdminPortalProps {
  isAdmin: boolean;
  onAdminLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  onAdminLogout: () => void;
  onNavigate: (path: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isAdmin,
  onAdminLogin,
  onAdminLogout,
  onNavigate
}) => {
  const [email, setEmail] = useState('Admin@solaroptions.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both admin email and password.');
      return;
    }

    // Strict validation requirement:
    // Email: Admin@solaroptions.in
    // Password: Check@up
    if (cleanEmail.toLowerCase() !== 'admin@solaroptions.in' || password !== 'Check@up') {
      setErrorMessage('Access restricted: Only authorized administrators can log in here.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAdminLogin(cleanEmail, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Access restricted: Only authorized administrators can log in here.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error during administrative authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-28 pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-[36px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5" />
                  SolarOptions Special Administrator
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                  Admin <span className="text-emerald-400 italic">Command Center.</span>
                </h1>
                <p className="text-gray-400 text-sm max-w-xl font-medium">
                  Authenticated with exclusive administrator privileges for <span className="text-white font-mono font-bold">Admin@solaroptions.in</span>. Full unrestricted access to all industrial facility intelligence and engineering engines.
                </p>
              </div>

              <button
                onClick={onAdminLogout}
                className="px-6 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Admin
              </button>
            </div>
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => onNavigate('/industrial-intelligence')}
              className="group bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/40 p-8 rounded-[32px] transition-all cursor-pointer shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Facility Intelligence</h3>
                <p className="text-gray-400 text-xs leading-relaxed font-medium">
                  Explore 1,500+ industrial factories, MIDC clusters, rooftop dimensions, and decision-maker contact details.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Open Directory <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div 
              onClick={() => onNavigate('/3d-layout-designer')}
              className="group bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/40 p-8 rounded-[32px] transition-all cursor-pointer shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">3D Rooftop CAD</h3>
                <p className="text-gray-400 text-xs leading-relaxed font-medium">
                  Launch the 3D photovoltaic simulation canvas, calculate panel azimuth/tilt, and optimize factory rooftop density.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Launch Designer <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div 
              onClick={() => onNavigate('/solar-rooftop-calculator')}
              className="group bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/40 p-8 rounded-[32px] transition-all cursor-pointer shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Financial Modeler</h3>
                <p className="text-gray-400 text-xs leading-relaxed font-medium">
                  Calculate CAPEX, OPEX PPA financial returns, IRR, and payback periods tailored for high-tension industrial connections.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Open Calculator <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Admin Credentials & System Status */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Security Credentials & Verification Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Authorized Account</span>
                <p className="text-emerald-400 font-mono font-bold text-sm mt-1">Admin@solaroptions.in</p>
              </div>
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Access Tier</span>
                <p className="text-white font-bold text-sm mt-1">Super Administrator (Lifetime)</p>
              </div>
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Restrictions</span>
                <p className="text-emerald-400 font-bold text-sm mt-1">None (Full API & Data Access)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center pt-24 pb-16 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[36px] sm:rounded-[48px] p-8 sm:p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-left space-y-8 relative z-10">
          {/* Logo / Emblem */}
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-slate-950">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
                <Lock className="w-3 h-3" /> Exclusive Admin Access
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Special <span className="text-emerald-400 italic">Admin Login.</span>
              </h2>
              <p className="text-gray-400 text-xs font-medium pt-1">
                Authorized entry for SolarOptions system operations. Access is strictly restricted.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs font-semibold text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin@solaroptions.in"
                  className="w-full px-5 py-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-white placeholder-gray-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-5 pr-14 py-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-white placeholder-gray-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>Verifying Administrative Access...</>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Authenticate Admin
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span>Access: Admin@solaroptions.in</span>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
