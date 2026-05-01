import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Sun, Factory, Zap, ArrowRight, CheckCircle2, Calculator, Database, Shield, MapPin, LogIn, ChevronRight, Copy, ExternalLink, MessageSquare, HelpCircle, X, PenTool, Layout, Box, Mail, Send, Loader2, Target, ArrowLeft, RefreshCw, ShieldCheck, FileText } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn("Video Autoplay was blocked or failed:", error);
      });
    }
  }, []);
  
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
              username: accessForm.email, // Explicitly map email to username for the script
              password: genPwd,           // Explicitly send the generated code
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
    <nav className="fixed top-0 w-full z-[100] px-4 md:px-12 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-slate-900/50">
      <div 
        onClick={() => { window.scrollTo(0, 0); setCurrentPage('landing'); }} 
        className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
        aria-label="SolarOptions Home"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
        </div>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-white">SolarOptions<span className="text-emerald-400"> . </span>in</span>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6">
        <button 
          onClick={() => { window.scrollTo(0, 0); setCurrentPage('consumer'); }} 
          className="hidden sm:block text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Solar Calculator"
        >
          Calculator
        </button>
        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
        {isLoggedIn ? (
          <>
            <button 
              onClick={() => { window.scrollTo(0, 0); setCurrentPage('epc'); }} 
              className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Access Dashboard"
            >
              Dashboard
            </button>
            <button 
              onClick={() => setIsLoggedIn(false)} 
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => setShowLoginModal(true)} 
              className="text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => setShowAccessForm(true)}
              className="px-4 pr-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              Get Access
            </button>
          </>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative">
      {/* Global Solar Background Layer */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1509391366360-fe5ace448016?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      
      <div className="relative z-10">
        <Nav />

        <AnimatePresence mode="wait">
        {currentPage === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative"
          >
            {/* Hero */}
            <header className="relative w-full min-h-[70vh] flex items-center overflow-hidden border-b border-white/5">
              {/* Video Background layer */}
              <div className="absolute inset-0 z-0 bg-transparent">
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  preload="auto"
                  className="w-full h-full object-cover opacity-60 mix-blend-lighten"
                  poster="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=2000"
                >
                  <source src="https://videos.pexels.com/video-files/15920793/15920793-sd_640_360_25fps.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/30 to-slate-900"></div>
                
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] z-[1] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20"></div>
              </div>

              <div className="max-w-7xl mx-auto text-center relative z-10 px-6 py-24 mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8 backdrop-blur-md"
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Pro Studio 3D Designer Now Live</span>
                </motion.div>
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-white drop-shadow-2xl"
                >
                  <span className="text-emerald-400">Rooftop</span> & Solar <br className="hidden sm:block" />Design Tool.
                </motion.h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-medium leading-relaxed opacity-90">
                  Elevating execution through better options, sharper planning, and confident decisions.
                </p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10"
                >
                  <button 
                    onClick={() => setShowAccessForm(true)}
                    className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Get Access <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                        window.scrollTo(0, 1000); // Scroll down to features or 3D section
                        setCurrentPage('epc');
                        setEpcView('design');
                    }}
                    className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-lg rounded-2xl border border-white/10 backdrop-blur-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Start 3D Design
                  </button>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="flex flex-col items-center gap-3 mt-16"
                >
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-black opacity-40">Dive into the platform</span>
                  <div className="w-px h-16 bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-transparent"></div>
                </motion.div>
              </div>
            </header>

            {/* Strategy Section */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="flex flex-col p-8 bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/5 group transition-all hover:bg-slate-800/60 hover:border-emerald-500/30 min-h-[320px] shadow-2xl"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                    <Database className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">1. Right Rooftops</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-normal opacity-80">
                    Leverage high-potential rooftop data and deep industrial insights. Explore a curated network of industrial facilities across key clusters, so you approach the right sites with a clear strategy from day one.
                  </p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="flex flex-col p-8 bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/5 group transition-all hover:bg-slate-800/60 hover:border-emerald-500/30 min-h-[320px] shadow-2xl"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                    <PenTool className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">2. Design Faster</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-normal opacity-80">
                    Turn insights into precise, site-ready designs. Sketch boundaries, auto-place panels with safety walkways, and simulate real-world layouts in 3D—so you present a plan that is clear, practical, and built for confidence and closure.
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -8 }}
                  className="flex flex-col p-8 bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/5 group transition-all hover:bg-slate-800/60 hover:border-emerald-500/30 min-h-[320px] shadow-2xl"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">3. Close Better</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-normal opacity-80">
                    Reach the right decision-makers with data-backed proposals in hand. Eliminate blind outreach and guesswork—so your team moves with clarity, shortens the sales cycle, and closes deals faster.
                  </p>
                </motion.div>
              </div>

              {/* Enterprise Section */}
              <div className="bg-slate-900/60 border border-white/5 rounded-[40px] p-12 sm:p-20 text-center relative overflow-hidden mb-24 backdrop-blur-xl shadow-2xl shadow-black/50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 blur-[120px] -ml-48 -mb-48 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mt-0.5 block">Premium Platform for EPCs</span>
                  </motion.div>
                  
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-8 tracking-tight text-white max-w-3xl mx-auto leading-tight">
                    Empower your <span className="text-emerald-400">entire</span> sales organization.
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg font-normal leading-relaxed opacity-80">
                    Enable team with the clarity to plan accurately, reach the right stakeholders, and execute with better results
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                    <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 group hover:border-emerald-500/30 transition-all shadow-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Lite Access</p>
                      <p className="text-3xl font-bold mb-6 text-white tracking-tighter">Standard Access</p>
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><span className="text-emerald-500">→</span> 3D Designer Access</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><span className="text-emerald-500">→</span> Tech Potential Calculator</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><span className="text-emerald-500">→</span> Est. Savings & Payback Period</p>
                      </div>
                    </div>
                    <div className="p-8 bg-slate-800 rounded-3xl border border-emerald-500/30 ring-2 ring-emerald-500/10 scale-105 shadow-2xl relative overflow-hidden">
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

              {/* Removed redundant buttons section */}
            </section>

            {/* SEO Keyword Sections */}
            <section className="max-w-7xl mx-auto px-6 py-24 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {[
                  { title: "Solar Design Tool", desc: "Advanced 3D simulation for industrial rooftops. Create precise PV layouts with safety gaps and professional PDF proposals." },
                  { title: "Factory Data List", desc: "Curated intelligence of industrial facilities across MIDC and prime clusters, mapped specifically for solar potential." },
                  { title: "Decision Makers", desc: "Save weeks of prospecting with direct contact details. Approach stakeholders with a specialized data-backed plan." },
                  { title: "Solar Calculator", desc: "Instant feasibility reports based on electricity consumption, available rooftop area, and regional tariff rates." }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-slate-900/30 rounded-[32px] border border-white/5 transition-colors hover:border-emerald-500/20 group">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium opacity-70 group-hover:opacity-100 transition-opacity">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>


            {/* Solar Options Guide for SEO */}
            <section id="seo-insights" className="max-w-5xl mx-auto px-6 py-24 text-left border-t border-white/5">
               <h2 className="text-3xl font-black mb-12 text-white/90 uppercase tracking-tight">Solar <br/><span className="text-emerald-400 italic font-medium">Insights Engine.</span></h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-sm text-gray-500">
                  <div className="space-y-6">
                     <h3 className="font-black text-gray-300 uppercase tracking-[0.2em] text-[10px]">Industrial Rooftop Capacity</h3>
                     <p className="leading-relaxed font-medium">Standard industrial solar requires ~100 sq.ft per kWp. Our modeling accounts for shadow-free areas in high-density zones like MIDC to ensure precision estimation.</p>
                  </div>
                  <div className="space-y-6">
                     <h3 className="font-black text-gray-300 uppercase tracking-[0.2em] text-[10px]">Local EPC Connectivity</h3>
                     <p className="leading-relaxed font-medium">Bridges the gap between industrial owners and certified EPC experts by providing verified site data and executive contact details for seamless outreach.</p>
                  </div>
                  <div className="space-y-6">
                     <h3 className="font-black text-gray-300 uppercase tracking-[0.2em] text-[10px]">Design Optimization</h3>
                     <p className="leading-relaxed font-medium">Advanced boundary calculations help in assessing net usable area, accounting for HVAC systems, skylights, and safety walkways on commercial buildings.</p>
                  </div>
               </div>
            </section>

            {/* Final Footer */}
            <footer className="max-w-6xl mx-auto px-6 py-24 mb-12">
               <div className="bg-slate-900/50 p-12 rounded-[50px] border border-white/5 backdrop-blur-md">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-left space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
                            <Sun className="w-6 h-6" />
                         </div>
                         <span className="text-xl font-black text-white tracking-tighter">SolarOptions.in</span>
                      </div>
                      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">Industrial Solar Lead Intelligence platform. Precision data for high-capacity projects. 2024 © All Rights Reserved.</p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end gap-10">
                       <button onClick={() => { window.scrollTo(0, 0); setCurrentPage('privacy'); }} className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-emerald-400 transition-all">Privacy</button>
                       <button onClick={() => { window.scrollTo(0, 0); setCurrentPage('terms'); }} className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-emerald-400 transition-all">Terms</button>
                       <button onClick={() => setShowFeedbackModal(true)} className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-emerald-400 transition-all">Feedback</button>
                    </div>
                 </div>
                 <div className="mt-12 pt-12 border-t border-white/5 text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] text-center">
                   Official Platform for Professional Solar EPC Partners
                 </div>
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
            className="max-w-6xl mx-auto px-6 py-24"
          >
            <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[32px] backdrop-blur-xl mb-16">
                   <button 
                    onClick={() => setCurrentPage('landing')} 
                    className="flex items-center gap-3 text-xs font-black text-emerald-400 uppercase tracking-widest hover:text-white transition-all bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/10"
                   >
                     <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                   </button>
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50">Feasibility Terminal v2.1</div>
            </div>

            <div className="text-center mb-16 space-y-4">
              <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-none uppercase">Industrial <br/><span className="text-emerald-400 italic font-medium">Solar Intelligence</span></h1>
              <p className="text-gray-500 max-w-xl mx-auto font-medium text-lg">Calculate precision commercial metrics for high-capacity industrial rooftop systems.</p>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-[60px] p-8 sm:p-16 backdrop-blur-xl shadow-3xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-12">
                    <div className="space-y-8">
                       <div className="space-y-2">
                         <div className="flex justify-between items-end mb-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Monthly Load (Avg Bill)</label>
                           <p className="text-3xl font-black text-white font-mono leading-none">₹{formatIndianNumber(monthlyBill)}</p>
                         </div>
                         <input 
                           type="range" min="20000" max="1000000" step="10000" 
                           value={monthlyBill} 
                           className="w-full h-1.5 bg-slate-800 rounded-2xl appearance-none cursor-pointer accent-emerald-500" 
                           onChange={(e) => setMonthlyBill(Number(e.target.value))} 
                         />
                         <div className="flex justify-between text-[8px] font-black text-gray-700 uppercase tracking-widest pt-2">
                           <span>MIN 20K</span>
                           <span>MAX 10L</span>
                         </div>
                       </div>

                       <div className="space-y-2">
                         <div className="flex justify-between items-end mb-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available Footprint</label>
                           <p className="text-3xl font-black text-white font-mono leading-none">{formatIndianNumber(rooftopSpace)} <span className="text-xs text-gray-500">SQFT</span></p>
                         </div>
                         <input 
                           type="range" min="1000" max="100000" step="1000" 
                           value={rooftopSpace} 
                           className="w-full h-1.5 bg-slate-800 rounded-2xl appearance-none cursor-pointer accent-emerald-500" 
                           onChange={(e) => setRooftopSpace(Number(e.target.value))} 
                         />
                         <div className="flex justify-between text-[8px] font-black text-gray-700 uppercase tracking-widest pt-2">
                           <span>MIN 1K</span>
                           <span>MAX 1L</span>
                         </div>
                       </div>

                       <div className="space-y-4 pt-4">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Grid Tariff Rate</label>
                         <div className="grid grid-cols-5 gap-3">
                           {[7, 8, 9, 10, 11].map(rate => (
                             <button
                               key={rate}
                               onClick={() => setElectricityRate(rate)}
                               className={cn(
                                 "py-4 rounded-2xl text-xs font-black transition-all border",
                                 electricityRate === rate 
                                   ? "bg-emerald-500 text-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/20" 
                                   : "bg-slate-900/50 text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300"
                               )}
                             >
                               ₹{rate}
                             </button>
                           ))}
                         </div>
                       </div>
                    </div>

                    <div className="bg-slate-800/60 p-8 rounded-[40px] border border-white/10 flex items-center gap-6 group">
                       <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                       </div>
                       <div>
                          <h4 className="text-white font-bold tracking-tight">Estimated Savings</h4>
                          <p className="text-emerald-400 font-bold text-lg leading-tight mt-0.5">85% Reduction <span className="text-gray-500 text-xs font-medium italic">— Across life cycle</span></p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-[50px] p-10 border border-white/10 grid grid-cols-2 gap-6 relative">
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-500/10 blur-[80px] pointer-events-none" />
                    
                    <div className="bg-slate-800/70 p-8 rounded-[40px] border border-white/10 col-span-2 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                          <Zap size={60} />
                       </div>
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Recommended Capacity</p>
                       <p className="text-5xl font-black text-emerald-400 leading-none mb-6">{formatPower(calculatorResult.plantSize)}</p>
                       <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (calculatorResult.plantSize / 1000) * 100)}%` }}
                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          />
                       </div>
                    </div>

                    <div className="bg-slate-800/70 p-6 rounded-[32px] border border-white/10">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Yearly Generation</p>
                      <p className="text-xl font-bold text-white leading-none">{formatIndianNumber(calculatorResult.yearlyGeneration)} <span className="text-[10px] text-gray-600">KWH</span></p>
                    </div>

                    <div className="bg-slate-800/70 p-6 rounded-[32px] border border-white/10 group overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500/50 group-hover:h-full transition-all duration-700 opacity-20 pointer-events-none" />
                      <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] mb-2">Yearly Savings</p>
                      <p className="text-xl font-bold text-emerald-400 leading-none">₹{formatIndianNumber(calculatorResult.yearlySavings)}</p>
                    </div>

                    <div className="bg-slate-800/70 p-6 rounded-[32px] border border-white/10">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">System Cost (Est)</p>
                      <p className="text-xl font-bold text-white leading-none">₹{formatIndianNumber(calculatorResult.projectCost)}</p>
                    </div>

                    <div className="bg-slate-800/70 p-6 rounded-[32px] border border-white/10">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">ROI Payback</p>
                      <p className="text-xl font-bold text-white leading-none font-mono">{calculatorResult.payback} <span className="text-[10px] text-gray-600">YRS</span></p>
                    </div>
                </div>
            </div>

                <div className="mt-20 pt-16 border-t border-white/5">
                  <div className="bg-emerald-500 text-slate-900 p-12 rounded-[50px] flex flex-col md:flex-row items-center justify-between gap-12 group relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-[60px]" />
                    <div className="space-y-4 text-center md:text-left relative z-10">
                      <h3 className="text-3xl sm:text-4xl font-black leading-[1.1]">Get Technical <br/><span className="italic opacity-80">Feasibility Design.</span></h3>
                      <p className="text-slate-900/70 text-sm max-w-sm font-bold uppercase tracking-wide">Professional on-site audit & precise system layout design.</p>
                    </div>
                    <button 
                      onClick={() => setShowQuoteModal(true)}
                      className="w-full md:w-auto px-12 py-6 bg-slate-900 text-white font-black rounded-3xl shadow-3xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 relative z-10 group"
                    >
                      REQUEST DETAILED PROPOSAL <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-all text-emerald-500" />
                    </button>
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
                </header>

                {epcView === 'search' && (
                  <>
                    <div className="flex flex-wrap gap-4 bg-slate-700/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                      <div className="relative group flex-1 min-w-[240px]">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                          <input 
                            value={rooftopSearch} 
                            onChange={(e) => { setRooftopSearch(e.target.value); setCurrentPageIndex(1); }}
                            placeholder="Search rooftop size (exact e.g. 6000)" 
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all font-medium"
                          />
                      </div>
                      <select 
                        value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setCurrentPageIndex(1); }}
                        className="px-6 py-3 bg-slate-800/60 border border-white/10 rounded-2xl outline-none focus:border-emerald-400 font-bold"
                      >
                        <option value="all">All Regions</option>
                        <option value="pune">Pune Cluster</option>
                        <option value="mumbai">Mumbai Cluster</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredLeads.slice((currentPageIndex - 1) * 6, currentPageIndex * 6).map((lead, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
                          className="group bg-white text-slate-900 p-10 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col justify-between border border-slate-100 hover:shadow-[0_40px_70px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-10">
                                <h3 className="font-black text-2xl leading-[1.1] pr-4 text-slate-800 tracking-tight">{lead.factory}</h3>
                                <span className="shrink-0 text-[10px] font-black uppercase py-1.5 px-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">{lead.region}</span>
                            </div>
                            
                            <div className="space-y-4 mb-10">
                              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                  <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Site Size</span>
                                  <span className="font-black text-lg text-slate-800">{formatIndianNumber(lead.rooftop)} <span className="text-xs font-bold text-slate-400">sq.ft</span></span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Potential</span>
                                  <span className="font-black text-lg text-emerald-500">{formatPower(lead.kw)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-8 text-slate-400">
                               <MapPin className="w-4 h-4 text-slate-300" />
                               <span className="text-xs font-semibold">{lead.location}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setSelectedLead(lead)}
                            className="w-full py-5 bg-[#121826] hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                          >
                            View Full Specs
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-6 mt-12 bg-black/40 p-6 rounded-[32px] backdrop-blur-xl">
                        <button 
                          disabled={currentPageIndex === 1}
                          onClick={() => setCurrentPageIndex(p => Math.max(1, p - 1))}
                          className="p-3 bg-black/40 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-lg backdrop-blur-md"
                        >
                          <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <span className="font-black text-sm uppercase tracking-widest text-gray-400">
                          Page <span className="text-white">{currentPageIndex}</span> of <span className="text-white">{totalPages}</span>
                        </span>
                        <button 
                          disabled={currentPageIndex === totalPages}
                          onClick={() => setCurrentPageIndex(p => Math.min(totalPages, p + 1))}
                          className="p-3 bg-black/40 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-lg backdrop-blur-md"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                  </>
                )}

                {epcView === 'design' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[1700px] mx-auto px-4"
                  >
                    <div className="flex justify-between items-center mb-8 no-print">
                      <button 
                        onClick={() => setEpcView('search')}
                        className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-all group"
                      >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back
                      </button>
                      <button 
                         onClick={() => window.location.reload()}
                         className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-lg"
                      >
                        <RefreshCw size={16} /> New Project
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch mb-12">
                      {/* STEP 1: Identity Card (3 columns) */}
                      <div className="xl:col-span-4 bg-white p-12 rounded-[56px] border border-slate-100 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.03)] h-full min-h-[600px]">
                        <div>
                          <div className="flex items-center gap-4 mb-12">
                            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                              <Target size={20} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">1. Project Identity</h3>
                          </div>
                          
                          <div className="space-y-12">
                            <div className="space-y-4">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] block ml-1">Building Name</label>
                              <input 
                                type="text" 
                                value={designFactoryName || ''} 
                                onChange={e => setDesignFactoryName(e.target.value)}
                                placeholder="Enter industrial site name..."
                                className="w-full bg-[#F8FAFC] border border-slate-100 rounded-[24px] p-6 text-slate-800 font-bold focus:border-emerald-500/30 transition-all outline-none placeholder:text-slate-300 text-lg"
                              />
                            </div>
                            
                            <div className="space-y-6">
                              <div className="flex justify-between items-end">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Target Area</label>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-4xl font-black text-slate-800 tracking-tight">{designTargetArea.toLocaleString()}</span>
                                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SQFT</span>
                                </div>
                              </div>
                              <input 
                                type="range" min="1000" max="100000" step="1000"
                                value={designTargetArea}
                                onChange={e => setDesignTargetArea(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-12">
                           <div className="bg-[#F8FAFC] p-8 rounded-[32px] border border-slate-50">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Project Potential</p>
                              <p className="text-3xl font-black text-slate-800">
                                {designPanelCount > 0 
                                  ? (designPanelCount * 0.55).toFixed(1) 
                                  : (designTargetArea / 65).toFixed(1)} 
                                <span className="text-xs font-bold text-slate-400 ml-1">kW</span>
                              </p>
                           </div>
                           <div className="bg-[#F8FAFC] p-8 rounded-[32px] border border-slate-50">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Est. Modules</p>
                              <p className="text-3xl font-black text-slate-800">
                                {designPanelCount > 0 
                                  ? designPanelCount 
                                  : Math.floor((designTargetArea / 75) / 0.55)} 
                                <span className="text-xs font-bold text-slate-400 ml-1">Panels</span>
                              </p>
                           </div>
                        </div>
                      </div>

                      {/* STEP 2: Design Canvas Card (8 columns) */}
                      <div className="xl:col-span-8 bg-white rounded-[56px] border border-slate-100 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] min-h-[700px]">
                        <header className="px-10 py-8 flex justify-between items-center border-b border-slate-50 bg-white z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl">
                              <PenTool size={20} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">2. SKETCH BOUNDARIES</h3>
                          </div>
                          
                          <div className="flex bg-[#F8FAFC] p-1.5 rounded-[20px] border border-slate-100 shadow-inner">
                             {[
                               { id: 'rooftops', label: 'ROOF' },
                               { id: 'panels', label: 'PANELS' }
                             ].map((phase) => (
                               <button 
                                 key={phase.id}
                                 onClick={() => setDesignPhase(phase.id as any)}
                                 disabled={phase.id === 'panels' && designBuildings.length === 0}
                                 className={cn(
                                   "px-10 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                   designPhase === phase.id ? "bg-white text-emerald-600 shadow-sm border border-slate-100/50" : "text-slate-400 hover:text-slate-600",
                                   phase.id === 'panels' && designBuildings.length === 0 && "opacity-30 cursor-not-allowed"
                                 )}
                               >
                                 {phase.label}
                               </button>
                             ))}
                          </div>
                        </header>
                        
                        <div className="flex-1 bg-[#F8FAFC] relative overflow-hidden">
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
                                className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl border border-slate-800 hover:scale-105 transition-all flex items-center gap-3 group"
                              >
                                <Layout size={18} className="text-emerald-500" /> Export Design
                              </button>
                           </div>
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}


                {/* Design Proposal Modal */}
                <AnimatePresence>
                  {showDesignProposal && (
                    <div className="fixed inset-0 bg-slate-900/98 flex items-center justify-center z-[250] p-4 sm:p-8" onClick={() => setShowDesignProposal(false)}>
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-slate-900 rounded-[50px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-800"
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
                    <div className="flex justify-between items-center bg-emerald-500/5 p-8 rounded-[32px] border border-emerald-500/20 backdrop-blur-md">
                      <div>
                        <h2 className="text-2xl font-black text-emerald-400 tracking-tight">Leads Inbox</h2>
                        <p className="text-gray-400 text-sm font-medium opacity-80">Secure storage for customer inquiries and feedback.</p>
                      </div>
                      <div className="bg-emerald-500 text-slate-900 px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20">
                        {inboxData.length} New Messages
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
                          <div key={idx} className="bg-slate-900/40 text-white p-8 rounded-[40px] border border-white/5 shadow-2xl flex flex-col md:flex-row gap-8 backdrop-blur-md group hover:border-emerald-500/30 transition-all">
                            <div className="shrink-0">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${item.type === 'quote' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {item.type === 'quote' ? 'QT' : 'FB'}
                               </div>
                            </div>
                            <div className="flex-1 space-y-6">
                               <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                  <div>
                                     <h4 className="font-bold text-2xl tracking-tight">{item.type === 'quote' ? 'Detailed Quote Inquiry' : 'Customer Feedback'}</h4>
                                     <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                                  </div>
                                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'new' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                                     {item.status}
                                  </div>
                               </div>

                               {item.type === 'quote' ? (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-900/50 p-8 rounded-[32px] border border-white/5">
                                   <div>
                                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Factory</p>
                                      <p className="font-bold text-sm text-gray-100">{item.factory}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Location</p>
                                      <p className="font-bold text-sm text-gray-100">{item.location}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Load</p>
                                      <p className="font-bold text-sm text-gray-100">{item.units} Units/Mo</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Contact</p>
                                      <p className="font-bold text-sm text-emerald-400">{item.contact}</p>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="bg-slate-900/50 p-8 rounded-[32px] border border-white/5 italic text-gray-400 text-base leading-relaxed font-medium">
                                   "{item.message}"
                                 </div>
                               )}
                               
                               <div className="flex gap-4 pt-2">
                                  <button onClick={() => window.open(`https://wa.me/${item.contact?.replace(/[^0-9]/g, '') || item.contact || '91862606122'}?text=Hello%20${item.factory || ''},%20this%20is%20from%20SolarOptions.in`, '_blank')} className="px-8 py-3 bg-emerald-500 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-3">
                                     Reply WhatsApp <ArrowRight className="w-4 h-4" />
                                  </button>
                                  <button className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5">
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
                      className="bg-slate-900/40 rounded-[40px] p-8 shadow-2xl relative overflow-hidden h-64 border border-white/10 group flex flex-col justify-between backdrop-blur-md"
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div className="pr-4">
                            <h4 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2">{lead.factory}</h4>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Potential Details</p>
                         </div>
                         <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-500 shrink-0 border border-white/5">Locked</div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Site Size</p>
                              <p className="font-bold text-white text-sm">{formatIndianNumber(lead.rooftop)} <span className="text-[10px] opacity-60 font-medium">SQFT</span></p>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Potential</p>
                              <p className="font-black text-emerald-400 text-sm">{formatPower(lead.kw)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium truncate">
                           <MapPin className="w-3.5 h-3.5 text-emerald-500/50" /> {lead.location}
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[4px]">
                         <div className="bg-emerald-500 text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl scale-90 group-hover:scale-100 transition-all">
                            <Shield className="w-4 h-4" /> Locked Details
                         </div>
                      </div>
                    </motion.div>
                   ))}
                 </div>

                 <div className="bg-white/5 border border-white/10 p-12 rounded-[50px] text-center backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                    <h3 className="text-3xl font-black mb-10 relative z-10 text-white uppercase tracking-tight">Professional <span className="text-emerald-400 italic">Integration</span></h3>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                    <button onClick={() => setShowLoginModal(true)} className="px-10 py-5 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700">
                          <LogIn className="w-5 h-5" /> Login
                       </button>
                       <button onClick={() => setShowAccessForm(true)} className="px-10 py-5 bg-emerald-500 text-slate-900 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                          Get Access
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
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[250] p-4 backdrop-blur-xl" onClick={() => setShowLoginModal(false)}>
           <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-slate-900/80 backdrop-blur-2xl text-white p-12 rounded-[50px] w-full max-w-md shadow-2xl relative overflow-hidden border border-white/10 shadow-emerald-500/5" 
            onClick={e => e.stopPropagation()}
           >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowLoginModal(false)} className="p-3 bg-slate-800 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-all text-gray-500">
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
                    onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                  />
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                    <button 
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter Password" 
                    className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-white placeholder:text-gray-600" 
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleLogin} 
                    className="flex-[2] py-4 bg-emerald-500 text-slate-900 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Verifying...' : 'Login Now'}
                  </button>
                </div>
                
                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={() => { setShowLoginModal(false); setShowAccessForm(true); }}
                    className="w-full py-4 text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors"
                  >
                    Don't have access? <span className="font-bold underline">Register Here</span>
                  </button>
                </div>
              </div>
            </div>
           </motion.div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl">
           <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
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
                onClick={() => { setShowCredentials(false); setShowLoginModal(true); }}
                className="w-full py-5 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Continue to Terminal <ArrowRight className="w-5 h-5" />
              </button>
           </motion.div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4 backdrop-blur-sm" onClick={() => setShowForgotPasswordModal(false)}>
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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
        <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl" onClick={() => setShowFeedbackModal(false)}>
           <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-slate-900 text-white p-12 rounded-[50px] w-full max-w-md shadow-2xl relative border border-white/5" 
            onClick={e => e.stopPropagation()}
           >
              <div className="mb-10 text-left">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                  <MessageSquare className="w-7 h-7 text-slate-900" />
                </div>
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">System <span className="text-emerald-400 italic">Feedback.</span></h3>
                <p className="text-gray-400 font-medium leading-relaxed">Help us calibrate our industrial solar intelligence engine.</p>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Message Protocol</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe data inconsistencies or system suggestions..." 
                    className="w-full px-6 py-5 bg-slate-900/50 border border-white/5 rounded-3xl outline-none focus:border-emerald-500/50 text-white transition-all font-medium resize-none placeholder:text-gray-700"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setShowFeedbackModal(false)} className="flex-1 py-5 bg-slate-800 text-gray-400 font-bold rounded-2xl hover:bg-slate-700 transition-all">Dismiss</button>
                   <button 
                    onClick={() => { setShowFeedbackModal(false); }}
                    className="flex-[2] py-5 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all uppercase text-xs tracking-widest"
                   >
                     Submit Signal
                   </button>
                </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
         <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
          onClick={() => setShowFeedbackModal(true)}
          className="w-14 h-14 bg-slate-900 text-emerald-400 rounded-2xl shadow-3xl flex items-center justify-center border border-white/10 hover:border-emerald-500/50 backdrop-blur-md transition-all"
         >
           <MessageSquare className="w-6 h-6" />
         </motion.button>
      </div>

      {/* Access/Payment Modal */}
      {showAccessForm && (
        <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[200] p-4 backdrop-blur-xl" onClick={() => setShowAccessForm(false)}>
           <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-slate-900 text-white p-12 rounded-[50px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl border border-white/5 scrollbar-hide" 
            onClick={e => e.stopPropagation()}
           >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">Request <span className="text-emerald-400 italic font-medium">Data Access.</span></h3>
                    <p className="text-gray-400 text-sm font-medium">30-day regional access to industrial facility leads.</p>
                 </div>
                 <div className="bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">₹100 Enterprise</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Company Entity</label>
                  <input placeholder="Legal Entity Name" className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" onChange={e => setAccessForm({...accessForm, companyName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Mobile (Direct)</label>
                  <input placeholder="Direct Line" maxLength={10} className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" onChange={e => setAccessForm({...accessForm, contact: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Corporate Email</label>
                  <input placeholder="work@company.com" className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" onChange={e => setAccessForm({...accessForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Industrial Zone</label>
                  <input placeholder="e.g. MIDC Chakan" className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" onChange={e => setAccessForm({...accessForm, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-white/40">Business Authority</label>
                  <input placeholder="Owner / EPC / Consultant" className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:border-emerald-500/50 outline-none transition-all text-white font-bold placeholder:text-gray-700" onChange={e => setAccessForm({...accessForm, companyType: e.target.value})} />
                </div>
              </div>

              <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5 mb-12 flex flex-col sm:flex-row items-center gap-6 group">
                 <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-emerald-500 transition-all duration-500">
                   <Shield className="w-8 h-8 text-emerald-500 group-hover:text-slate-900" />
                 </div>
                 <p className="text-xs text-gray-400 leading-relaxed font-medium">
                   Secure gateway validation via Razorpay. Credentials will be <span className="text-white font-bold italic underline decoration-emerald-500/50">deployed instantly</span> after payment reconciliation.
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => setShowAccessForm(false)}
                  className="flex-1 py-6 bg-slate-800 text-gray-400 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-700 transition-all border border-white/5"
                >
                  Dismiss
                </button>
                <button onClick={handlePayment} className="group flex-[2] py-6 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-3xl shadow-3xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                  {isSubmitting ? (paymentLoadingMessage || 'Initializing...') : 'Proceed to Gateway'}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-slate-900 rounded-[50px] w-full max-w-lg p-10 sm:p-16 relative z-10 shadow-3xl overflow-hidden border border-white/5"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setShowQuoteModal(false)}
                  className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-10 text-left space-y-4">
                 <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                   <FileText className="w-7 h-7 text-slate-900" />
                 </div>
                 <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">Request <br/><span className="text-emerald-400 italic font-medium">Solar Proposal.</span></h3>
                 <p className="text-gray-400 font-medium">Tailored industrial feasibility analysis for your facility.</p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Factory / Entity Name</label>
                    <input 
                      type="text"
                      value={quoteData.factory}
                      onChange={(e) => setQuoteData({...quoteData, factory: e.target.value})}
                      placeholder="Enter company name"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-gray-700 focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Industry Zone / Level</label>
                    <input 
                      type="text"
                      value={quoteData.location}
                      onChange={(e) => setQuoteData({...quoteData, location: e.target.value})}
                      placeholder="City/MIDC Area"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-gray-700 focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Avg. Monthly Units (kWh)</label>
                    <input 
                      type="number"
                      value={quoteData.units}
                      onChange={(e) => setQuoteData({...quoteData, units: e.target.value})}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-gray-700 focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Executive Contact</label>
                    <input 
                      type="tel"
                      value={quoteData.contact}
                      onChange={(e) => setQuoteData({...quoteData, contact: e.target.value})}
                      placeholder="+91 Phone Number"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-gray-700 focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={async () => {
                      if (!quoteData.factory || !quoteData.contact) return alert('Missing essential details.');
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
                      } catch (error) {
                        setIsSubmittingQuote(false);
                      }
                    }}
                    disabled={isSubmittingQuote}
                    className={cn(
                      "w-full py-6 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-3xl shadow-3xl transition-all flex items-center justify-center gap-4",
                      isSubmittingQuote ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {isSubmittingQuote ? "Processing..." : "Generate Analysis Report"} <ArrowRight className="w-5 h-5" />
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
              className="bg-slate-900 rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl overflow-hidden border border-slate-800"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mb-6 font-black text-2xl italic border border-emerald-500/20">
                  SO
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Share Feedback</h3>
                <p className="text-gray-400 font-medium">Your insights help us improve the platform for everyone.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-950/50 p-8 rounded-[40px] border border-slate-800 text-center space-y-4">
                  <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl flex items-center justify-center mx-auto text-emerald-400">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Direct Signal</p>
                    <p className="text-xl font-black text-white select-all">info@solaroptions.in</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-sm text-gray-400 font-medium leading-relaxed px-4 text-center">
                    Technical support, data resolution, or enterprise inquiries are processed within 24 hours.
                  </p>
                  
                  <button 
                    onClick={() => window.location.href = 'mailto:info@solaroptions.in?subject=SolarOptions Feedback'}
                    className="w-full py-6 bg-emerald-500 text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-500/10"
                  >
                    Transmit Email <ArrowRight className="w-5 h-5" />
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
          <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-[300] p-4 backdrop-blur-xl" onClick={() => setSelectedLead(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-slate-900 text-white p-10 sm:p-16 rounded-[60px] w-full max-w-2xl shadow-3xl relative overflow-hidden border border-white/5" 
              onClick={e => e.stopPropagation()}
            >
               <div className="absolute top-0 right-0 p-10">
                  <button onClick={() => setSelectedLead(null)} className="w-12 h-12 bg-slate-800 rounded-full hover:bg-rose-500/10 transition-all text-gray-500 hover:text-rose-400 border border-white/5 flex items-center justify-center">
                    <X className="w-6 h-6" />
                  </button>
               </div>

                <div className="mb-12 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Sun className="w-6 h-6 text-slate-900" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Site Analysis Protocol</span>
                  </div>
                  <h3 className="text-4xl font-black pr-16 leading-tight uppercase tracking-tight">{selectedLead.factory}</h3>
                  <div className="flex items-center gap-3 text-gray-400 font-medium pt-2">
                    <MapPin className="w-5 h-5 text-emerald-500" /> {selectedLead.location}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      {/* Primary Metric: Rooftop */}
                      <div className="bg-slate-800/40 p-8 rounded-[32px] border border-white/5 shadow-lg group hover:border-emerald-500/10 transition-all cursor-default">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Available Rooftop</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-white tracking-tight">
                            {formatIndianNumber(selectedLead.rooftop)}
                          </p>
                          <span className="text-xs font-bold text-gray-600 uppercase">sq.ft</span>
                        </div>
                      </div>
                      
                      {/* Secondary Metrics: Grid Layout */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/40 p-6 rounded-[32px] border border-white/5 shadow-md group hover:border-emerald-500/10 transition-all">
                          <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-3">Capacity</p>
                          <p className="text-xl font-black text-emerald-400 leading-none">{formatPower(selectedLead.kw)}</p>
                        </div>

                        <div className="bg-slate-800/40 p-6 rounded-[32px] border border-white/5 shadow-md group hover:border-emerald-500/10 transition-all">
                          <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-3">Monthly Saving</p>
                          <p className="text-xl font-black text-emerald-400 leading-none">₹{formatIndianNumber(Math.round(selectedLead.kw * 120 * 8))}</p>
                        </div>
                      </div>

                      {/* Summary/Status Badge */}
                      <div className="bg-slate-800/20 p-5 rounded-[24px] border border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Analysis</span>
                        <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">Verified Zone</span>
                        </div>
                      </div>
                    </div>

                   <div className="bg-slate-900/80 p-10 rounded-[50px] border border-white/5 space-y-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-20">
                       <Shield className="w-12 h-12 text-gray-600" />
                     </div>
                     <div className="space-y-1">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Decision Authority</p>
                       <p className="font-bold text-lg text-white">{selectedLead.owner || 'Corporate Manager'}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Digital Contact</p>
                       <p className="font-bold text-lg text-emerald-400">{selectedLead.contact || 'Platform Locked'}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">System Email</p>
                       <p className="font-bold text-xs text-gray-400 break-all">{selectedLead.email || 'partner-exclusive@domain.in'}</p>
                     </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button 
                    onClick={() => {
                      const msg = `Industrial Solar Protocol: Analysis for ${selectedLead.factory}. Zone: ${selectedLead.location}. Potential: ${selectedLead.rooftop} sqft.`;
                      window.open(`https://wa.me/91862606122?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex-1 py-6 bg-slate-800 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5 flex items-center justify-center gap-4"
                  >
                    Action Plan <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 py-6 bg-emerald-500 text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest shadow-3xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Close Specs
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
