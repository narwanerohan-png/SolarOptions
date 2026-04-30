import React, { useEffect, useMemo, useState } from 'react';
import { Sun, Factory, Zap, ArrowRight, CheckCircle2, Calculator, Database, Shield, MapPin, LogIn, ChevronRight, Copy, ExternalLink, MessageSquare, HelpCircle, X, PenTool, Layout, Box, Mail, Send, Loader2, Target, ArrowLeft, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SketchBoard from './components/SketchBoard';
import ThreeScene from './components/ThreeScene';
import { Point, PanelConfig } from './utils/geometry';
import { cn } from './lib/utils';

// --- HELPERS ---
const formatIndianNumber = (value: string | number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString('en-IN') : value;
};

const formatPower = (value: string | number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num >= 1000
    ? `${(num / 1000).toFixed(1).replace('.0', '')} MW`
    : `${formatIndianNumber(num)} kW`;
};

// --- DATA ---
interface Lead {
  factory: string;
  location: string;
  rooftop: number;
  kw: number;
  region: string;
  owner?: string;
  contact?: string;
  email?: string;
  monthlyBill?: string | number;
  monthlySavings?: string | number;
}

const sampleLeadsData: Lead[] = [
  { factory: 'Focus Controls Pvt. Ltd.', location: 'Shindewadi, Pune', rooftop: 5000, kw: 71.4, region: 'pune' },
  { factory: 'Havmor Icecream Pvt Ltd', location: 'Talegaon, Pune', rooftop: 280000, kw: 4000, region: 'pune' },
  { factory: 'Bericap India Pvt. Ltd.', location: 'Talegaon, Pune', rooftop: 100000, kw: 1428.6, region: 'pune' },
  { factory: 'Infra Industries', location: 'Vasai, Maharashtra', rooftop: 75000, kw: 1071.4, region: 'mumbai' },
  { factory: 'Safex Fire Services', location: 'Palghar, Maharashtra', rooftop: 42000, kw: 600, region: 'mumbai' },
  { factory: 'RBSM Industrial Plant', location: 'Pune, Maharashtra', rooftop: 56000, kw: 800, region: 'pune' },
];

export default function SolarApp() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<'landing' | 'consumer' | 'epc' | 'privacy' | 'terms'>('landing');
  
  // App Logic State
  const [monthlyBill, setMonthlyBill] = useState(50000);
  const [rooftopSpace, setRooftopSpace] = useState(5000);
  const [electricityRate, setElectricityRate] = useState(8);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liveLeads, setLiveLeads] = useState<Lead[]>(sampleLeadsData);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Modals & UI
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [quoteData, setQuoteData] = useState({ factory: '', location: '', units: '', contact: '' });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '', expiry: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentLoadingMessage, setPaymentLoadingMessage] = useState('');
  
  // Form State
  const [accessForm, setAccessForm] = useState({
    companyName: '',
    contact: '',
    email: '',
    location: '',
    companyType: '',
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Portal State
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [rooftopSearch, setRooftopSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [epcView, setEpcView] = useState<'search' | 'inbox' | 'design'>('search');
  const [inboxData, setInboxData] = useState<any[]>([]);

  // Design Tool State
  const [designBuildings, setDesignBuildings] = useState<Point[][]>([]);
  const [designPanelZones, setDesignPanelZones] = useState<Point[][]>([]);
  const [designPhase, setDesignPhase] = useState<'rooftops' | 'panels'>('rooftops');
  const [designTargetArea, setDesignTargetArea] = useState(5000);
  const [designFactoryName, setDesignFactoryName] = useState('');
  const [designPanelConfig] = useState<PanelConfig>({ width: 1.1, height: 2.3, spacing: 0.1, wattage: 550 });
  const [showDesign3D, setShowDesign3D] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [designPanelCount, setDesignPanelCount] = useState(0);
  const [showDesignProposal, setShowDesignProposal] = useState(false);

  useEffect(() => {
    if (isLoggedIn && epcView === 'inbox') {
      fetch('/api/admin/inbox')
        .then(res => res.json())
        .then(data => setInboxData(data))
        .catch(err => console.error('Failed to fetch inbox:', err));
    }
  }, [isLoggedIn, epcView]);

  const API_URL = "https://script.google.com/macros/s/AKfycbycpu9irUypX9jXEGKgx-tbKW41dbQE_zTJHuhlf1TiT2a_ImksFFrVH3fCDtp523o8EQ/exec";

  // --- ACTIONS ---
  const fetchLiveLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const mapped = data.map((row) => ({
          region: (row['Region'] || 'NA').toLowerCase(),
          factory: row['Factory Name'] || 'NA',
          location: row['Location'] || 'NA',
          rooftop: Number(row['Rooftop Space']) || 0,
          kw: row['Potential kW'] || 0,
          owner: row['Owner Name'] || 'NA',
          contact: row['Contact Number'] || row['Contact'] || 'NA',
          email: row['Email ID'] || row['Email'] || 'NA',
          monthlyBill: row['Monthly Bill'] || 'NA',
          monthlySavings: row['Monthly Savings'] || row['Monthly Saving'] || 'NA',
        }));
        setLiveLeads(mapped.length ? mapped : sampleLeadsData);
      }
    } catch (e) {
      console.error("Fetch failed, using samples", e);
      setLiveLeads(sampleLeadsData);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchLiveLeads();
  }, [isLoggedIn]);

  const calculatorResult = useMemo(() => {
    const safeBill = Number(monthlyBill) || 0;
    const safeRate = Number(electricityRate) || 1;
    const safeRoof = Number(rooftopSpace) || 0;

    const unitsFromBill = safeBill / safeRate;
    const kwFromBill = unitsFromBill / 120;
    const kwFromRooftop = safeRoof / 70;
    const plantSize = Number(Math.max(0, Math.min(kwFromBill, kwFromRooftop)).toFixed(1));
    const yearlyGeneration = Math.round(plantSize * 1300);
    const yearlySavings = Math.round(yearlyGeneration * safeRate);
    const projectCost = Math.round(plantSize * 40000);
    const payback = yearlySavings > 0 ? (projectCost / yearlySavings).toFixed(1) : '0.0';

    return { plantSize, yearlyGeneration, yearlySavings, projectCost, payback };
  }, [monthlyBill, rooftopSpace, electricityRate]);

  const handlePayment = async () => {
    if (!accessForm.email.includes('@') || accessForm.contact.length !== 10) {
      alert("Please enter valid contact details.");
      return;
    }
    
    setIsSubmitting(true);
    setPaymentLoadingMessage('Connecting to Razorpay...');

    const openRazorpay = () => {
      const options = {
        key: 'rzp_live_SYVCbNHoPZBoWv',
        amount: 100, // ₹1 for testing (100 paise)
        currency: 'INR',
        name: 'Solar Options Pro Access',
        description: '30 Days Premium Leads Access',
        handler: (response: any) => {
          console.log("Payment Success Handler Fired:", response.razorpay_payment_id);
          
          // 1. Generate local credentials immediately
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let genPwd = '';
          for (let i = 0; i < 8; i++) {
            genPwd += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          const expiryStr = expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
          
          const newCreds = { 
            username: accessForm.email, 
            password: genPwd,
            expiry: expiryStr 
          };

          // 2. FORCE IMMEDIATE UI UPDATE
          setCredentials(newCreds);
          setShowAccessForm(false);
          setShowCredentials(true);
          setIsSubmitting(false);
          setPaymentLoadingMessage('');

          // 3. BACKGROUND SYNC TO GOOGLE SHEETS
          fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              ...accessForm,
              password: genPwd,
              paymentId: response.razorpay_payment_id,
              action: 'register',
              sheet: 'Sheet2',
              expiryDate: expiry.toISOString(),
              validUntil: expiryStr,
              timestamp: new Date().toISOString()
            })
          }).then(() => {
            console.log("Background sync to Sheet2 complete");
          }).catch(err => {
            console.error("Background sync error:", err);
          });
        },
        modal: {
          onDismiss: () => {
            setIsSubmitting(false);
            setPaymentLoadingMessage('');
          }
        },
        prefill: {
          name: accessForm.companyName,
          email: accessForm.email,
          contact: accessForm.contact,
        },
        theme: { color: '#10b981' },
      };
      
      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error("Razorpay Payment Failure Notice:", response.error);
          alert(`Payment Error: ${response.error.description}. If you see 'Business Failure', please ensure this domain is registered in your Razorpay Dashboard.`);
          setIsSubmitting(false);
          setPaymentLoadingMessage('');
        });
        rzp.open();
      } catch (err) {
        console.error("Razorpay Initialization/Open Error:", err);
        alert("Razorpay failed to open. This may be due to a domain mismatch in Live mode.");
        setIsSubmitting(false);
        setPaymentLoadingMessage('');
      }
    };

    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = openRazorpay;
      document.body.appendChild(script);
    } else {
      openRazorpay();
    }
  };

  const savePayment = async (paymentId: string) => {
    // This is now handled directly in the Razorpay handler for better reliability
    console.log("Legacy savePayment called (should be handled in handler):", paymentId);
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) return;
    setIsSubmitting(true);
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'login',
          username: loginForm.username,
          password: loginForm.password
        })
      });
      const data = await resp.json();
      if (data.success) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setCurrentPage('epc');
        setEpcView('search');
        window.scrollTo(0, 0);
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (e) {
      alert("Login service unavailable. Please check back later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = liveLeads.filter(l => {
    if (regionFilter !== 'all' && l.region !== regionFilter) return false;
    
    const search = rooftopSearch.trim();
    if (!search) return true;
    
    // Clean rooftop space for exact matching
    const leadRooftopStr = String(l.rooftop).replace(/,/g, '');
    const searchClean = search.replace(/,/g, '');

    return leadRooftopStr === searchClean;
  });

  const cardsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / cardsPerPage));

  // --- RENDERING ---

  const Nav = () => (
    <nav className="fixed top-0 w-full z-[100] px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-slate-900/50">
      <div 
        onClick={() => { window.scrollTo(0, 0); setCurrentPage('landing'); }} 
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <Sun className="w-6 h-6 text-slate-900" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">SolarOptions<span className="text-emerald-400"> . </span>in</span>
      </div>
      
      <div className="flex items-center gap-8">
        <button 
          onClick={() => { window.scrollTo(0, 0); setCurrentPage('consumer'); }} 
          className="text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Calculator
        </button>
        <button 
          onClick={() => { 
            if (isLoggedIn) {
              window.scrollTo(0, 0); 
              setCurrentPage('epc');
              setEpcView('search');
            } else {
              setShowLoginModal(true);
            }
          }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl border border-slate-700 transition-all cursor-pointer group"
        >
          <LogIn className="w-4 h-4 text-emerald-400" />
          {isLoggedIn ? 'Dashboard' : 'Login'}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      <Nav />

      <AnimatePresence mode="wait">
        {currentPage === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative"
          >
            {/* Hero */}
            <header className="relative w-full min-h-[60vh] flex items-center overflow-hidden border-b border-white/5">
              {/* Video Background layer */}
              <div className="absolute inset-0 z-0">
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover opacity-50"
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-solar-panels-on-the-roof-of-a-house-4841-large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-900/80 to-slate-900"></div>
              </div>

              <div className="max-w-6xl mx-auto text-center relative z-10 px-6 py-16 mt-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6 shadow-2xl backdrop-blur-md"
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Pro Studio 3D Designer Now Live</span>
                </motion.div>
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="text-4xl sm:text-6xl font-bold mb-4 leading-tight tracking-tight text-white drop-shadow-xl"
                >
                  <span className="text-emerald-400 italic">Rooftop</span> & Solar Design Tool.
                </motion.h1>
                <p className="text-lg sm:text-xl text-gray-300 mb-0 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-lg opacity-90">
                  Access factory locations, rooftop estimates, and key decision-maker insights — so your sales team approaches the right opportunity with clarity.
                </p>
              </div>
            </header>

            {/* Strategy Section */}
            <section className="max-w-6xl mx-auto px-6 pt-8 pb-10 border-t border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4">
                    <Database className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">1. Access Data</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-light">
                    Browse our curated list of industrial facilities with extensive, potential rooftop areas 
                    across major clusters.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4">
                    <PenTool className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">2. Precision Design</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-light">
                    Sketch site boundaries and auto-populate panels with integrated safety walkways. 
                    Simulate real-world layouts in our 3D Studio.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">3. Approach & Close</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-light">
                    Reach out with Decision Maker contact details and data-backed proposals already in hand. 
                    Reduce your sales cycle by 40%.
                  </p>
                </div>
              </div>

              {/* Enterprise Section */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 rounded-[40px] p-8 sm:p-10 text-center relative overflow-hidden mb-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                  <div className="inline-block px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">SolarOptions Pro</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-white">Scale your sales team.</h2>
                  <p className="text-gray-400 max-w-xl mx-auto mb-8 text-base font-light leading-relaxed">
                    Unlock professional-grade industrial rooftop area dimensions potential for project and decision-maker contact details mapped specifically for EPC installers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 group hover:border-emerald-500/30 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Lite Access</p>
                      <p className="text-3xl font-bold mb-6 text-white tracking-tighter">Complimentary</p>
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><span className="text-emerald-500">→</span> 3D Designer Access</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><span className="text-emerald-500">→</span> Tech Potential Calculator</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><span className="text-emerald-500">→</span> Est. Savings & Payback Period</p>
                      </div>
                    </div>
                    <div className="p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/30 ring-2 ring-emerald-500/10 scale-105 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Direct Intelligence</p>
                      <p className="text-3xl font-bold mb-6 text-white tracking-tighter">Enterprise</p>
                      <div className="space-y-3">
                        <p className="text-xs text-gray-200 font-bold flex items-center gap-2"><span className="text-emerald-400">✓</span> Potential Industries</p>
                        <p className="text-xs text-gray-200 font-bold flex items-center gap-2"><span className="text-emerald-400">✓</span> Rooftop Area Dimensions</p>
                        <p className="text-xs text-gray-200 font-bold flex items-center gap-2"><span className="text-emerald-400">✓</span> Est. Potential Project</p>
                        <p className="text-xs text-gray-200 font-bold flex items-center gap-2"><span className="text-emerald-400">✓</span> Est. Monthly Savings</p>
                        <p className="text-xs text-gray-200 font-bold flex items-center gap-2"><span className="text-emerald-400">✓</span> Contact Decision Maker</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    // @ts-ignore
                    window.gtag?.('event', 'click_partner_portal');
                    setCurrentPage('epc');
                  }} 
                  className="group w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 rounded-2xl text-slate-900 font-bold text-xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Request Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => {
                    // @ts-ignore
                    window.gtag?.('event', 'click_3d_designer');
                    setCurrentPage('epc');
                    setEpcView('design');
                  }} 
                  className="group w-full sm:w-auto px-10 py-5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white font-bold text-xl shadow-xl transition-all border border-slate-700 flex items-center justify-center gap-3"
                >
                  <PenTool className="w-5 h-5 text-emerald-400" />
                  3D Solar Design Tool
                </button>
              </div>
            </section>

            {/* SEO Keyword Sections */}
            <section className="max-w-6xl mx-auto px-6 py-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-3">Solar Design Tool</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Advanced 3D simulation for industrial rooftops. Create precise PV layouts with safety gaps and generate professional PDF proposals.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-3">Factory Data List</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Curated intelligence of industrial facilities across MIDC and prime clusters, mapped specifically for solar EPC potential.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-3">Decision Maker Contacts</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Save weeks of prospecting with direct contact details of key stakeholders. Approach the right person with a data-backed plan.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-3">Industrial Solar Calculator</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Instant feasibility reports based on electricity consumption, available rooftop area, and current tariff rates.</p>
                </div>
              </div>
            </section>

            {/* Industrial Focus */}
            <section className="bg-slate-800/50 py-16">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-8">Why professionals choose us</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-700/50 flex items-start gap-4 text-left">
                    <Shield className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">Potential Clusters</h4>
                      <p className="text-sm text-gray-400">Data focused on MIDC and prime industrial zones where policy is favorable.</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-700/50 flex items-start gap-4 text-left">
                    <Zap className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">Instant Readiness</h4>
                      <p className="text-sm text-gray-400">Get 30 days of seamless access to Decision Maker contact details and rooftop dimensions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Solar Options Guide for SEO */}
            <section className="max-w-4xl mx-auto px-6 py-8 text-left opacity-30 hover:opacity-100 transition-opacity">
               <h2 className="text-xl font-bold mb-6 text-gray-400">Industrial Solar Options & Resources</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] text-gray-500">
                  <div>
                     <h3 className="font-bold text-gray-400 mb-2 uppercase tracking-widest">How much rooftop space for solar?</h3>
                     <p className="leading-relaxed">Usually, 1 kWp of solar capacity requires approximately 100 square feet of shadow-free rooftop area. For industrial setups, our solar calculator helps estimate the exact capacity based on your MIDC factory's footprint.</p>
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-400 mb-2 uppercase tracking-widest">Finding Solar EPC Near Me</h3>
                     <p className="leading-relaxed">Building relationships with nearby EPC partners is easier when you have decision maker contact details. SolarOptions bridges the gap between industrial owners and local solar expertise.</p>
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-400 mb-2 uppercase tracking-widest">Solar Design Tool Features</h3>
                     <p className="leading-relaxed">Our 3D solar design tool allows designers to visualize layouts, account for safety walkways, and calculate generation based on specific industrial rooftop orientations.</p>
                  </div>
               </div>
            </section>

            {/* Disclaimer Footer */}
            <footer className="max-w-4xl mx-auto px-6 py-24 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-4 font-bold">Disclaimer</p>
              <p className="text-xs text-gray-500 leading-relaxed font-medium bg-slate-800/30 p-6 rounded-2xl">
                Data provided is sourced from public records and indicative computational models. 
                SolarOptions.in makes no claims regarding actual property availability or project realization. 
                Final feasibility must be assessed on-site. For inquiries regarding update data or removal, contact us or <button onClick={() => setShowFeedbackModal(true)} className="text-emerald-500 font-bold hover:underline cursor-pointer">view feedback</button>.
              </p>
              <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <button onClick={() => { window.scrollTo(0, 0); setCurrentPage('privacy'); }} className="hover:text-emerald-400 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-widest bg-transparent border-none p-0">Privacy Policy</button>
                <button onClick={() => { window.scrollTo(0, 0); setCurrentPage('terms'); }} className="hover:text-emerald-400 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-widest bg-transparent border-none p-0">Terms of Service</button>
                <span>© 2024 SolarOptions</span>
              </div>
            </footer>
          </motion.div>
        )}

        {currentPage === 'privacy' && (
          <motion.div 
            key="privacy"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto px-6 py-24"
          >
            <button onClick={() => { window.scrollTo(0, 0); setCurrentPage('landing'); }} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-300 mb-16 transition-colors uppercase tracking-[0.2em]">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </button>
            <h1 className="text-3xl font-medium mb-12 text-gray-200 tracking-tight">Privacy Policy</h1>
            <div className="space-y-12 text-gray-400 leading-relaxed text-sm">
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">1. Minimal Tracking</h3>
                <p className="font-light">We use industry-standard analytics (GA4) to understand how the 3D Designer is used. We do not track personal identifying information of our casual browsers. For registered EPC partners, we protect your login and search activity with encrypted storage.</p>
              </section>
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">2. B2B Context</h3>
                <p className="font-light">Our database contains professional business details, not private residence data. We are committed to the General Data Protection principles as applied to business-to-business solar consulting. We never share your project designs with competitors.</p>
              </section>
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">3. Data Removal</h3>
                <p className="font-light">Owners or representatives wishing to opt-out of industrial analytics mapping can do so instantly by emailing info@solaroptions.in. We maintain a strict compliance list to ensure your privacy preferences are respected across our modeling engine.</p>
              </section>
            </div>
          </motion.div>
        )}

        {currentPage === 'terms' && (
          <motion.div 
            key="terms"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto px-6 py-24"
          >
            <button onClick={() => { window.scrollTo(0,0); setCurrentPage('landing'); }} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-300 mb-16 transition-colors uppercase tracking-[0.2em]">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </button>
            <h1 className="text-3xl font-medium mb-12 text-gray-200 tracking-tight">Terms of Service</h1>
            <div className="space-y-12 text-gray-400 leading-relaxed text-sm">
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">1. Public Data Utilization</h3>
                <p className="font-light">SolarOptions.in aggregates information derived exclusively from public datasets, industrial directories, and satellite imagery models. We do not perform private surveillance or store non-commercial personal data. All factory details are considered professional business information available in the public domain.</p>
              </section>
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">2. Professional Responsibility & Indemnity</h3>
                <p className="font-light">Users (EPC Partners & Solar Professionals) agree to use this platform as a preliminary tool. You are solely responsible for on-site verification. SolarOptions.in shall not be liable for any claims, losses, or legal allegations arising from your outreach to factory owners or your subsequent project implementations. You agree to indemnify this platform against any third-party claims resulting from your specific use of the provided data.</p>
              </section>
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">3. Property Owner Protection</h3>
                <p className="font-light">Inclusion in our database does not imply an endorsement or a request for solicitation by the property owner. We strictly bridge information gaps for B2B industrial development. Property owners may request data updates or removal at any time via the Feedback tool; such requests are handled with absolute priority to ensure professional boundaries are maintained.</p>
              </section>
              <section>
                <h3 className="text-gray-300 font-semibold mb-3">4. Non-Scraping Agreement</h3>
                <p className="font-light">Redistribution, automated scraping, or bulk harvesting of our leads for the purpose of reselling is strictly prohibited and protected by intellectual property laws. Access is granted for individual professional use only.</p>
              </section>
            </div>
          </motion.div>
        )}

        {currentPage === 'consumer' && (
          <motion.div 
            key="consumer"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-5xl mx-auto px-6 py-12"
          >
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl mb-12">
                   <button 
                    onClick={() => setCurrentPage('landing')} 
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                   >
                     <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
                   </button>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Feasibility Terminal</div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-black mb-4">Industrial solar calculator</h1>
              <p className="text-gray-400 max-w-xl mx-auto">Calculate the commercial potential of your industrial rooftop with our advanced solar modeling engine.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-12 bg-white text-slate-900 rounded-[48px] p-8 sm:p-12 shadow-2xl space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Electricity Bill</label>
                          <p className="text-2xl font-black text-emerald-600">₹{formatIndianNumber(monthlyBill)}</p>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="20000" 
                        max="1000000" 
                        step="5000" 
                        value={monthlyBill} 
                        className="w-full h-3 bg-slate-100 rounded-2xl appearance-none cursor-pointer accent-emerald-500" 
                        onChange={(e) => setMonthlyBill(Number(e.target.value))} 
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                        <span>Min ₹20k</span>
                        <span>Max ₹10L</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Electricity Rate (per kW)</label>
                      <div className="relative group">
                        <select 
                          value={electricityRate}
                          onChange={(e) => setElectricityRate(Number(e.target.value))}
                          className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-emerald-500 appearance-none font-black text-xl transition-all cursor-pointer"
                        >
                          {[7, 8, 9, 10, 11].map(rate => (
                            <option key={rate} value={rate}>₹{rate} per unit</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 rotate-90 pointer-events-none group-hover:scale-110 transition-transform" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Rooftop Space</label>
                          <p className="text-2xl font-black text-emerald-600">{formatIndianNumber(rooftopSpace)} <span className="text-sm text-slate-400">sq.ft</span></p>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="1000" 
                        max="100000" 
                        step="500" 
                        value={rooftopSpace} 
                        className="w-full h-3 bg-slate-100 rounded-2xl appearance-none cursor-pointer accent-emerald-500" 
                        onChange={(e) => setRooftopSpace(Number(e.target.value))} 
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                        <span>Min 1k sq.ft</span>
                        <span>Max 1L sq.ft</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-2">
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Recommended Capacity</p>
                       <p className="text-3xl font-black text-emerald-600">{formatPower(calculatorResult.plantSize)}</p>
                       <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (calculatorResult.plantSize / 1000) * 100)}%` }}
                            className="h-full bg-emerald-500"
                          />
                       </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Yearly Units</p>
                      <p className="text-lg font-black">{formatIndianNumber(calculatorResult.yearlyGeneration)} <span className="text-[10px] text-slate-400">kWh</span></p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Yearly Savings</p>
                      <p className="text-lg font-black text-emerald-600">₹{formatIndianNumber(calculatorResult.yearlySavings)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Project Cost</p>
                      <p className="text-lg font-black">₹{formatIndianNumber(calculatorResult.projectCost)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">ROI Payback</p>
                      <p className="text-lg font-black">{calculatorResult.payback} <span className="text-[10px] text-slate-400 uppercase">Years</span></p>
                    </div>

                    <div className="col-span-2 pt-4">
                      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <p className="text-xs text-emerald-700 font-medium">Estimated savings of <span className="font-bold">85%</span> on your current electricity expenditure.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="bg-slate-900 text-white p-10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="text-2xl font-black italic">Get Technical Feasibility Visit</h3>
                      <p className="text-gray-400 text-sm max-w-sm">Receive most suitable proposal as per the actual energy consumption pattern and feasibility.</p>
                    </div>
                    <button 
                      onClick={() => setShowQuoteModal(true)}
                      className="w-full md:w-auto px-10 py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Get Detailed Quote <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === 'epc' && (
          <motion.div 
            key="epc"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-7xl mx-auto px-6 py-12 pt-28"
          >
            {isLoggedIn ? (
              <div className="space-y-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Partner Central</h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
                         <Database className="w-3 h-3 text-emerald-500" />
                         Industrial Site Explorer
                      </div>
                      <div className="h-4 w-[1px] bg-slate-700" />
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setEpcView('search')}
                          className={`text-xs font-black uppercase tracking-widest transition-all ${epcView === 'search' ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          Explore Sites
                        </button>
                        <button 
                          onClick={() => setEpcView('design')}
                          className={`text-xs font-black uppercase tracking-widest transition-all ${epcView === 'design' ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          Design Tool
                        </button>
                        <button 
                          onClick={() => setEpcView('inbox')}
                          className={`text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${epcView === 'inbox' ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          Leads Inbox 
                          {inboxData.length > 0 && <span className="bg-emerald-500 text-slate-900 px-1.5 py-0.5 rounded-full text-[8px]">{inboxData.length}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsLoggedIn(false)} className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95">
                    Secure Logout
                  </button>
                </header>

                {epcView === 'search' && (
                  <>
                    <div className="flex flex-wrap gap-4 bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50 backdrop-blur-md">
                      <div className="relative group flex-1 min-w-[240px]">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                          <input 
                            value={rooftopSearch} 
                            onChange={(e) => { setRooftopSearch(e.target.value); setCurrentPageIndex(1); }}
                            placeholder="Search rooftop size (exact e.g. 6000)" 
                            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:border-emerald-500 transition-all font-medium"
                          />
                      </div>
                      <select 
                        value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setCurrentPageIndex(1); }}
                        className="px-6 py-3 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:border-emerald-400 font-bold"
                      >
                        <option value="all">All Regions</option>
                        <option value="pune">Pune Cluster</option>
                        <option value="mumbai">Mumbai Cluster</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLeads.slice((currentPageIndex - 1) * 6, currentPageIndex * 6).map((lead, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ y: -4 }}
                          className="bg-white text-slate-900 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-black text-xl leading-tight h-14 line-clamp-2">{lead.factory}</h3>
                              <span className="text-[10px] font-bold uppercase py-1 px-3 bg-emerald-100 text-emerald-700 rounded-full">{lead.region}</span>
                            </div>
                            <div className="space-y-4 mb-8">
                              <div className="flex justify-between border-b border-slate-100 pb-3">
                                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Site Size</span>
                                  <span className="font-bold">{formatIndianNumber(lead.rooftop)} sq.ft</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-3">
                                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Potential</span>
                                  <span className="font-black text-emerald-600">{formatPower(lead.kw)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium h-10 line-clamp-2">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {lead.location}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedLead(lead)}
                            className="w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-emerald-500 transition-all"
                          >
                            View Full Specs
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-6 mt-12 bg-slate-800/20 p-6 rounded-[32px] border border-slate-800">
                        <button 
                          disabled={currentPageIndex === 1}
                          onClick={() => setCurrentPageIndex(p => Math.max(1, p - 1))}
                          className="p-3 bg-white text-slate-900 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                        >
                          <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <span className="font-black text-sm uppercase tracking-widest text-gray-400">
                          Page <span className="text-white">{currentPageIndex}</span> of <span className="text-white">{totalPages}</span>
                        </span>
                        <button 
                          disabled={currentPageIndex === totalPages}
                          onClick={() => setCurrentPageIndex(p => Math.min(totalPages, p + 1))}
                          className="p-3 bg-white text-slate-900 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                  </>
                )}

                {epcView === 'design' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
                     <div className="flex justify-between items-center no-print">
                        <button 
                          onClick={() => setEpcView('search')}
                          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <ArrowLeft size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Back</span>
                        </button>
                        <button 
                          onClick={() => window.location.reload()}
                          className="flex items-center gap-2 px-6 py-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all border border-slate-100"
                        >
                           <RefreshCw size={12} />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Project</span>
                        </button>
                     </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* STEP 1: Small Input Card */}
                      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                            <Target size={16} />
                          </div>
                          <h3 className="text-xl font-black text-slate-900">1. Project Identity</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Building Name</label>
                            <input 
                              type="text" 
                              value={designFactoryName || ''} 
                              onChange={e => setDesignFactoryName(e.target.value)}
                              placeholder="Enter industrial site name..."
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:border-emerald-500 transition-all outline-none"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Target Area</label>
                              <span className="text-xl font-black text-slate-900 font-mono">{designTargetArea.toLocaleString()} <span className="text-xs text-slate-400">SQFT</span></span>
                            </div>
                            <input 
                              type="range" min="1000" max="100000" step="1000"
                              value={designTargetArea}
                              onChange={e => setDesignTargetArea(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-xl appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Potential</p>
                                <p className="text-lg font-black text-slate-900">
                                  {designPanelCount > 0 
                                    ? (designPanelCount * 0.55).toFixed(1) 
                                    : (designTargetArea / 65).toFixed(1)} 
                                  <span className="text-[10px] text-slate-400"> kW</span>
                                </p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{designPanelCount > 0 ? 'Actual Modules' : 'Est. Modules'}</p>
                                <p className="text-lg font-black text-slate-900">
                                  {designPanelCount > 0 
                                    ? designPanelCount 
                                    : Math.floor((designTargetArea / 75) / 0.55)} 
                                  <span className="text-[10px] text-slate-400"> Panels</span>
                                </p>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* STEP 2: Design Canvas Card */}
                      <div className="bg-white p-2 rounded-[40px] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[500px]">
                        <header className="p-6 flex justify-between items-center bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                              <PenTool size={16} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">2. Sketch Boundaries</h3>
                          </div>
                          
                          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                             <button 
                               onClick={() => setDesignPhase('rooftops')}
                               className={cn(
                                 "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                 designPhase === 'rooftops' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                               )}
                             >
                               Roof
                             </button>
                             <button 
                               onClick={() => setDesignPhase('panels')}
                               disabled={designBuildings.length === 0}
                               className={cn(
                                 "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                 designPhase === 'panels' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600",
                                 designBuildings.length === 0 && "opacity-30 cursor-not-allowed"
                               )}
                             >
                               Panels
                             </button>
                          </div>
                        </header>
                        
                        <div className="flex-1 bg-slate-50 relative">
                          <SketchBoard 
                            targetArea={designTargetArea * 0.092903} 
                            onComplete={(data) => {
                              setDesignBuildings(data.buildings);
                              setDesignPanelZones(data.panelZones);
                              setShowDesign3D(false);
                            }} 
                            activeMode={designPhase}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Action & Result View */}
                    <div className="flex flex-col items-center gap-8">
                       <button 
                         onClick={() => {
                           setIsVisualizing(true);
                           setTimeout(() => {
                             setShowDesign3D(true);
                             setIsVisualizing(false);
                           }, 800);
                         }}
                         disabled={designBuildings.length === 0 || isVisualizing}
                         className={cn(
                           "flex items-center gap-4 px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all group",
                           designBuildings.length > 0
                            ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] hover:bg-emerald-400"
                            : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                         )}
                       >
                         {isVisualizing ? <Loader2 className="animate-spin" /> : "Visualize 3D System"} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                       </button>

                       {showDesign3D && designBuildings.length > 0 && (
                         <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-700">
                           <div className="h-[600px] bg-slate-900 rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl relative group">
                              <ThreeScene 
                                buildings={designBuildings}
                                panelZones={designPanelZones}
                                buildingHeight={6}
                                panelConfig={designPanelConfig}
                                onPlacementsUpdate={setDesignPanelCount}
                              />
                              <div className="absolute top-8 left-8 flex flex-col gap-2">
                                <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                   <span className="text-[10px] font-black text-white uppercase tracking-widest">3D Precision Simulation</span>
                                </div>
                              </div>

                              <div className="absolute bottom-8 right-8 pointer-events-none">
                                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                                  <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Actual Peak</p>
                                      <p className="text-2xl font-black text-white font-mono leading-none">{(designPanelCount * 0.55).toFixed(1)} <span className="text-xs">kWp</span></p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Payback</p>
                                      <p className="text-2xl font-black text-white font-mono leading-none">{(3.1).toFixed(1)} <span className="text-xs">Yrs</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                           </div>

                           <div className="flex justify-center">
                              <button 
                                onClick={() => setShowDesignProposal(true)}
                                className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl shadow-sm border border-slate-100 hover:scale-105 transition-all flex items-center gap-3"
                              >
                                <Layout size={18} className="text-emerald-500" /> Export Design
                              </button>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}


                {/* Design Proposal Modal */}
                <AnimatePresence>
                  {showDesignProposal && (
                    <div className="fixed inset-0 bg-slate-950/98 flex items-center justify-center z-[250] p-4 sm:p-8" onClick={() => setShowDesignProposal(false)}>
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-[50px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                      >
                         <div className="sticky top-0 right-0 p-8 flex justify-end z-10">
                            <button onClick={() => setShowDesignProposal(false)} className="p-3 bg-slate-100 rounded-full hover:bg-rose-50 transition-colors">
                              <X className="w-6 h-6 text-slate-400" />
                            </button>
                         </div>

                         <div className="p-12 sm:p-16 space-y-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
                               <div className="space-y-4">
                                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full w-fit">
                                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Engineering Specification</span>
                                  </div>
                                  <h2 className="text-4xl font-black italic tracking-tight text-slate-900">
                                    {designFactoryName || 'Untitled Project'}
                                  </h2>
                                  <p className="text-slate-400 font-medium">Technical Solar PV Proposal & System Simulation</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Generated On</p>
                                  <p className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                               </div>
                            </div>

                            {/* Design Visualization */}
                            <div className="space-y-8">
                               <div className="w-full aspect-[16/10] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 relative">
                                  <ThreeScene 
                                    buildings={designBuildings}
                                    panelZones={designPanelZones}
                                    buildingHeight={6}
                                    panelConfig={designPanelConfig}
                                  />
                                  <div className="absolute top-8 left-8">
                                     <div className="bg-slate-900/80 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md">3D System View</div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center px-12 border-t border-slate-50 pt-8">
                                  <div className="space-y-1">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calculated Peak</p>
                                     <p className="text-3xl font-black text-slate-900">{(designPanelCount * 0.55).toFixed(1)} kWp</p>
                                  </div>
                                  <div className="text-right space-y-1">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Modules</p>
                                     <p className="text-3xl font-black text-slate-900">{designPanelCount} Nos</p>
                                  </div>
                               </div>
                            </div>

                            <div className="pt-8 flex justify-center pb-2 no-print">
                               <button 
                                 onClick={() => window.print()}
                                 className="flex items-center gap-3 px-10 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                               >
                                 <ExternalLink size={16} /> Download Design PDF
                               </button>
                            </div>
                         </div>

                         {/* A4 Print Layout Overlay */}
                         <div className="hidden print:block fixed inset-0 bg-white z-[999] p-0">
                            <style>{`
                              @media print {
                                @page { size: A4; margin: 0; }
                                body { margin: 0; -webkit-print-color-adjust: exact; }
                                .no-print { display: none !important; }
                              }
                            `}</style>
                            <div className="w-[210mm] h-[297mm] mx-auto bg-white flex flex-col">
                               {/* Letterhead Space (Upper 20%) - Left EMPTY for pre-printed letterhead */}
                               <div className="h-[75mm] w-full flex flex-col justify-end p-12">
                                  <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                                     <div className="space-y-1">
                                        <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-300">Technical Design Proposal</h2>
                                        <p className="text-[10px] font-bold text-slate-200">INTERNAL REF: {new Date().getTime().toString(36).toUpperCase()}</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Date</p>
                                        <p className="text-xs font-black text-slate-400">{new Date().toLocaleDateString('en-IN')}</p>
                                     </div>
                                  </div>
                               </div>

                               {/* Design View (Lower 80%) */}
                               <div className="flex-1 p-12 flex flex-col">
                                  <div className="w-full flex-1 bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-100 relative shadow-2xl">
                                     <ThreeScene 
                                       buildings={designBuildings}
                                       panelZones={designPanelZones}
                                       buildingHeight={6}
                                       panelConfig={designPanelConfig}
                                     />
                                     <div className="absolute top-12 left-12">
                                        <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border border-white/10 text-[11px] font-black text-white uppercase tracking-[0.4em] backdrop-blur-xl">3D Site Model</div>
                                     </div>
                                     
                                     {/* Overlay Stats in the scene itself to save space */}
                                     <div className="absolute bottom-12 right-12 flex gap-8">
                                        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                                           <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">System Capacity</p>
                                           <p className="text-2xl font-black text-white">{(designPanelCount * 0.55).toFixed(1)} <span className="text-xs">kWp</span></p>
                                        </div>
                                        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                                           <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Modules</p>
                                           <p className="text-2xl font-black text-white">{designPanelCount} <span className="text-xs">Nos</span></p>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="p-8 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
                                     <p>VALID FOR 30 DAYS</p>
                                     <p>PREPARED BY PARTNER CENTRAL</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {epcView === 'inbox' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-emerald-500/10 p-6 rounded-[32px] border border-emerald-500/20">
                      <div>
                        <h2 className="text-xl font-black text-emerald-400">Leads Inbox</h2>
                        <p className="text-gray-400 text-sm">Secure storage for customer inquiries and feedback.</p>
                      </div>
                      <div className="bg-emerald-500 text-slate-900 px-6 py-2 rounded-full font-black text-sm">
                        {inboxData.length} Messages
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {inboxData.length === 0 ? (
                        <div className="bg-slate-800/30 p-24 rounded-[40px] border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-2">
                             <MessageSquare className="w-10 h-10" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-500">No messages yet</h3>
                          <p className="text-slate-600 max-w-xs">New feedback and quote requests will appear here automatically.</p>
                        </div>
                      ) : (
                        inboxData.map((item, idx) => (
                          <div key={idx} className="bg-white text-slate-900 p-8 rounded-[40px] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-8">
                            <div className="shrink-0">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${item.type === 'quote' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {item.type === 'quote' ? 'QT' : 'FB'}
                               </div>
                            </div>
                            <div className="flex-1 space-y-4">
                               <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                  <div>
                                     <h4 className="font-black text-xl italic">{item.type === 'quote' ? 'Detailed Quote Inquiry' : 'Customer Feedback'}</h4>
                                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(item.timestamp).toLocaleString()}</p>
                                  </div>
                                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.status === 'new' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                                     {item.status}
                                  </div>
                               </div>

                               {item.type === 'quote' ? (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                   <div>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase">Factory</p>
                                      <p className="font-bold">{item.factory}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase">Location</p>
                                      <p className="font-bold">{item.location}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase">Estimated Load</p>
                                      <p className="font-bold">{item.units} Units/Mo</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase">Contact</p>
                                      <p className="font-bold text-emerald-600">{item.contact}</p>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic text-slate-600 leading-relaxed font-medium">
                                   "{item.message}"
                                 </div>
                               )}
                               
                               <div className="flex gap-3">
                                  <button onClick={() => window.open(`https://wa.me/${item.contact?.replace(/[^0-9]/g, '') || item.contact || '91862606122'}?text=Hello%20${item.factory || ''},%20this%20is%20from%20SolarOptions.in`, '_blank')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                                     Reply via WhatsApp <ArrowRight className="w-4 h-4" />
                                  </button>
                                  <button className="px-6 py-3 border border-slate-200 text-slate-400 rounded-2xl text-xs font-bold hover:text-slate-900 transition-all">
                                     Archive
                                  </button>
                               </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-12">
                 <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl mb-12">
                   <button 
                    onClick={() => setCurrentPage('landing')} 
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                   >
                     <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
                   </button>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Partner Gate</div>
                 </div>

                 <div className="text-center space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-black">Partner Dashboard Access</h2>
                    <p className="text-gray-400 max-w-xl mx-auto font-light">
                       Access 1,500+ potential industrial rooftop leads. Targeted specifically for EPC professionals.
                    </p>
                 </div>

                 {/* Preview Grid (Interactive Sample) */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                   {sampleLeadsData.slice(0, 3).map((lead, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden h-64 border border-emerald-500/10 group flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div className="pr-4">
                            <h4 className="font-black text-slate-900 text-lg leading-tight mb-1 line-clamp-2">{lead.factory}</h4>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Potential Details</p>
                         </div>
                         <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-400 shrink-0">Locked</div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Site Size</p>
                              <p className="font-bold text-slate-900">{formatIndianNumber(lead.rooftop)} sq.ft</p>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Potential</p>
                              <p className="font-black text-emerald-600">{formatPower(lead.kw)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium truncate">
                           <MapPin className="w-3.5 h-3.5" /> {lead.location}
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                            <Shield className="w-4 h-4" /> Locked Details
                         </div>
                      </div>
                    </motion.div>
                   ))}
                 </div>

                 <div className="bg-white/5 border border-white/10 p-12 rounded-[50px] text-center backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                    <p className="text-xl font-bold mb-8 relative z-10">Premium Professional Integration</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                    <button onClick={() => setShowLoginModal(true)} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2">
                          <LogIn className="w-5 h-5" /> Login
                       </button>
                       <button onClick={() => setShowAccessForm(true)} className="px-10 py-5 bg-emerald-500 text-slate-900 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                          Request Access
                       </button>
                    </div>
                    <p className="mt-8 text-xs text-slate-500 relative z-10">Immediate activation upon successful payment integration.</p>
                 </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md" onClick={() => setShowLoginModal(false)}>
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden" 
            onClick={e => e.stopPropagation()}
           >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowLoginModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black mb-2 text-slate-900">Login Access</h3>
                <p className="text-gray-500 text-sm font-medium">Use credentials shared after payments</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    placeholder="Enter Username" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                    onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                  />
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                    <button 
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter Password" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleLogin} 
                    className="flex-[2] py-4 bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Verifying...' : 'Login Now'}
                  </button>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => { setShowLoginModal(false); setShowAccessForm(true); }}
                    className="w-full py-4 text-slate-400 text-sm font-medium hover:text-emerald-600 transition-colors"
                  >
                    Don't have access? <span className="font-bold underline">Register Here</span>
                  </button>
                </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-emerald-950/95 flex items-center justify-center z-[110] p-4 backdrop-blur-xl">
           <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-[50px] w-full max-w-md shadow-2xl text-center"
           >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black mb-4">Payment Confirmed</h3>
              <p className="text-gray-500 mb-10 leading-relaxed">
                Your 30-day access is now active. Valid until <span className="text-emerald-600 font-bold">{credentials.expiry}</span>. Please save these credentials securely.
              </p>

              <div className="space-y-4 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl text-left border border-slate-100 group relative">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Username</p>
                   <p className="font-mono font-bold text-lg select-all">{credentials.username}</p>
                   <button 
                    onClick={() => { navigator.clipboard.writeText(credentials.username); alert("Copied!"); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl shadow-sm transition-all"
                   >
                     <Copy className="w-4 h-4 text-emerald-600" />
                   </button>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl text-left border border-slate-100 group relative">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated Password</p>
                   <p className="font-mono font-bold text-lg select-all">{credentials.password}</p>
                   <button 
                    onClick={() => { navigator.clipboard.writeText(credentials.password); alert("Copied!"); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl shadow-sm transition-all"
                   >
                     <Copy className="w-4 h-4 text-emerald-600" />
                   </button>
                </div>
              </div>

              <button 
                onClick={() => { setShowCredentials(false); setShowLoginModal(true); }}
                className="w-full py-5 bg-emerald-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Continue to Dashboard <ArrowRight className="w-6 h-6" />
              </button>
           </motion.div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4 backdrop-blur-sm" onClick={() => setShowForgotPasswordModal(false)}>
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-[40px] w-full max-w-sm" 
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
                onClick={() => setShowForgotPasswordModal(false)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                Close
              </button>
           </motion.div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4 backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)}>
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-[50px] w-full max-w-md shadow-2xl relative" 
            onClick={e => e.stopPropagation()}
           >
              <h3 className="text-3xl font-black mb-2">Feedback</h3>
              <p className="text-gray-500 mb-8 font-medium">Help us improve the database quality.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    rows={4}
                    placeholder="Tell us about data accuracy or suggestions..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none"
                  />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setShowFeedbackModal(false)} className="flex-1 py-4 bg-slate-100 font-bold rounded-2xl">Cancel</button>
                   <button 
                    onClick={() => { alert("Feedback received. Thank you!"); setShowFeedbackModal(false); }}
                    className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg"
                   >
                     Submit Feedback
                   </button>
                </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
         <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setShowFeedbackModal(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-500 transition-colors"
         >
           <MessageSquare className="w-6 h-6" />
         </motion.button>
      </div>

      {/* Access/Payment Modal */}
      {showAccessForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setShowAccessForm(false)}>
           <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-[50px] w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-3xl font-black mb-1">Request Data Access</h3>
                    <p className="text-gray-400 text-sm">30-day regional access to all industrial facility leads.</p>
                 </div>
                 <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-2xl text-xs font-black uppercase">₹100 Only</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company Entity</label>
                  <input placeholder="Enter Company Name" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" onChange={e => setAccessForm({...accessForm, companyName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile (Direct)</label>
                  <input placeholder="Enter Mobile Number" maxLength={10} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" onChange={e => setAccessForm({...accessForm, contact: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Work Email (Login Identity)</label>
                  <input placeholder="Enter Work Email" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" onChange={e => setAccessForm({...accessForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Active City</label>
                  <input placeholder="Enter Active City" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" onChange={e => setAccessForm({...accessForm, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Type</label>
                  <input placeholder="Enter Business Type" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" onChange={e => setAccessForm({...accessForm, companyType: e.target.value})} />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 mb-8 flex items-center gap-4">
                 <Shield className="w-10 h-10 text-emerald-500 shrink-0" />
                 <p className="text-xs text-gray-500 leading-relaxed font-medium">
                   Secure payment via Razorpay. Credentials will be generated instantly and emailed to you after successful reconciliation.
                 </p>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setShowAccessForm(false)}
                  className="flex-1 py-5 bg-slate-100 text-slate-900 font-bold text-xl rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Go Back
                </button>
                <button onClick={handlePayment} className="group flex-[2] py-5 bg-emerald-500 text-slate-900 font-black text-xl rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  {isSubmitting ? (paymentLoadingMessage || 'Initializing...') : 'Proceed to Gateway'}
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Quote Request Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuoteModal(false)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[40px] w-full max-w-lg p-10 sm:p-12 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setShowQuoteModal(false)}
                  className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-black text-slate-900 mb-2 italic">Request Solar Quote</h3>
                <p className="text-slate-500 font-medium">Looking for a professional solar power plant integration?</p>
              </div>

              <div className="space-y-6">
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  Fill in your details and we'll generate the most suitable proposal for your facility.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Factory Name</label>
                    <input 
                      type="text"
                      value={quoteData.factory}
                      onChange={(e) => setQuoteData({...quoteData, factory: e.target.value})}
                      placeholder="Enter company name"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Location</label>
                    <input 
                      type="text"
                      value={quoteData.location}
                      onChange={(e) => setQuoteData({...quoteData, location: e.target.value})}
                      placeholder="City/Area"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Avg. Monthly Units</label>
                    <input 
                      type="number"
                      value={quoteData.units}
                      onChange={(e) => setQuoteData({...quoteData, units: e.target.value})}
                      placeholder="Units consumption"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Contact Number</label>
                    <input 
                      type="tel"
                      value={quoteData.contact}
                      onChange={(e) => setQuoteData({...quoteData, contact: e.target.value})}
                      placeholder="Primary phone"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={async () => {
                      if (!quoteData.factory || !quoteData.contact) return alert('Please provide at least factory name and contact number.');
                      setIsSubmittingQuote(true);
                      try {
                        await fetch('/api/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'quote', ...quoteData }),
                        });
                        setIsSubmittingQuote(false);
                        setShowQuoteModal(false);
                        setQuoteData({ factory: '', location: '', units: '', contact: '' });
                        alert('Thank you! We will contact you soon with the most suitable Solar Options.');
                      } catch (error) {
                        console.error('Quote error:', error);
                        alert('Could not submit request. Please try again.');
                        setIsSubmittingQuote(false);
                      }
                    }}
                    disabled={isSubmittingQuote}
                    className="w-full py-5 bg-emerald-500 text-slate-900 rounded-[28px] font-black text-lg hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    {isSubmittingQuote ? 'Sending Inquiry...' : 'Submit Request'}
                  </button>
                  <button 
                    onClick={() => setShowQuoteModal(false)}
                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 font-black text-2xl italic">
                  SO
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Share Feedback</h3>
                <p className="text-slate-500 font-medium">Your insights help us improve the platform for everyone.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 text-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-emerald-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Direct Email</p>
                    <p className="text-xl font-black text-slate-900 select-all">info@solaroptions.in</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                    For technical support, data removal requests, or general inquiries, please reach out to our team via email. We typically respond within 24 hours.
                  </p>
                  
                  <button 
                    onClick={() => window.location.href = 'mailto:info@solaroptions.in?subject=SolarOptions Feedback'}
                    className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    Compose Email <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                  SolarOptions.in • Industrial Solar Intelligence
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Feedback Button */}
      <motion.button
        onClick={() => setShowFeedbackModal(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-8 right-8 z-[200] bg-emerald-500 text-slate-900 p-4 rounded-full shadow-2xl flex items-center justify-center group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-xs uppercase px-0 group-hover:px-2 whitespace-nowrap">Feedback</span>
      </motion.button>

      {/* BG Effects */}
      <div className="fixed top-0 left-0 w-full h-[800px] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none -z-10" />
      <div className="fixed -top-48 -right-48 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Full Specs Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[150] p-4 backdrop-blur-md" onClick={() => setSelectedLead(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white text-slate-900 p-8 sm:p-12 rounded-[50px] w-full max-w-2xl shadow-2xl relative overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
               <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setSelectedLead(null)} className="p-3 bg-slate-100 rounded-full hover:bg-rose-50 transition-colors text-slate-400 hover:text-rose-500">
                    <X className="w-6 h-6" />
                  </button>
               </div>

                <div className="mb-10">
                  <h3 className="text-2xl font-black mb-2 pr-12 leading-tight">{selectedLead.factory}</h3>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-[10px] tracking-widest">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Potential Details
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rooftop Area</p>
                      <p className="text-xl font-black">{formatIndianNumber(selectedLead.rooftop)} sq.ft</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1">Monthly Savings</p>
                      <p className="text-xl font-black text-emerald-600">₹{formatIndianNumber(selectedLead.monthlySavings || 'NA')}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 text-white p-8 rounded-[40px] space-y-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Decision Maker</p>
                      <p className="font-bold text-lg">{selectedLead.owner || 'Potential Manager'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Direct Contact</p>
                      <p className="font-bold text-lg text-emerald-400">{selectedLead.contact || 'Resource Locked'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                      <p className="font-bold text-sm break-all opacity-80">{selectedLead.email || 'Partner Exclusive'}</p>
                    </div>
                  </div>
                </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      const msg = `Hello, I'm interested in the solar project potential for ${selectedLead.factory} at ${selectedLead.location}. Area: ${selectedLead.rooftop} sqft.`;
                      window.open(`https://wa.me/91862606122?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    Action Plan <MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 py-5 bg-emerald-500 text-slate-900 rounded-3xl font-black text-lg hover:shadow-2xl shadow-emerald-500/20 transition-all"
                  >
                    Close Specs
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
