import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ExternalLink, Calculator, Box, Database, HelpCircle, Shield, Building2, Layers, Search, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ComparisonPageProps {
  onOpenAccess: () => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ onOpenAccess }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-left relative z-20">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center flex-wrap gap-2 text-xs font-semibold text-gray-400">
          <li>
            <Link 
              to="/" 
              onClick={() => window.scrollTo(0, 0)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </li>
          <li className="text-gray-600">/</li>
          <li className="text-gray-500">Comparisons</li>
          <li className="text-gray-600">/</li>
          <li className="text-emerald-400 font-bold truncate max-w-xs sm:max-w-none">
            SolarOptions vs Solar Ladder vs Solar Connect
          </li>
        </ol>
      </nav>

      {/* Main Header */}
      <header className="mb-14 sm:mb-20 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          B2B Solar Software Comparison · Industrial Solar Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
          SolarOptions vs Solar Ladder vs Solar Connect
        </h1>
        <p className="text-gray-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed">
          A neutral, factual comparison of specialized B2B solar software in India. Learn how SolarOptions’ industrial prospecting and pre-sales intelligence compares with operational platforms and business management software.
        </p>
      </header>

      {/* Section 1: Introduction */}
      <section className="mb-16 p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl shadow-2xl">
        <h2 className="text-2xl font-black text-white tracking-tight mb-4">Introduction: What this comparison covers</h2>
        <div className="text-gray-300 space-y-4 text-sm sm:text-base leading-relaxed font-normal">
          <p>
            India’s solar industry is expanding rapidly across both distributed residential rooftops and high-capacity Commercial & Industrial (C&I) properties. Solar Engineering, Procurement, and Construction (EPC) companies, project developers, and business development executives frequently ask how different software tools fit into their daily workflows.
          </p>
          <p>
            This comparison examines three names frequently mentioned in Indian solar technology discussions: <strong>SolarOptions</strong>, <strong>Solar Ladder</strong>, and <strong>Solar Connect</strong>. Our goal is to clarify the scope, intended use cases, and distinct roles each product serves across the solar lifecycle—from initial industrial site prospecting and rooftop assessments to operational execution and post-sales CRM.
          </p>
        </div>
      </section>

      {/* Section 2: Quick Overview of Each Product */}
      <section className="mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-8">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1: SolarOptions */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 ring-1 ring-emerald-500/20 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">SolarOptions</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">Industrial Solar Prospecting & Pre-Sales</p>
              <p className="text-sm text-gray-300 leading-relaxed font-normal mb-6">
                A dedicated industrial solar intelligence platform for EPCs. It indexes 1,500+ pre-identified industrial facilities across MIDC and commercial manufacturing clusters, mapped with rooftop dimensions, shadow-free area estimates, solar feasibility calculations, and visual 3D rooftop layouts.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs text-gray-400 font-medium space-y-1.5">
              <p><strong className="text-gray-200">Core Focus:</strong> C&I lead discovery & pre-sales</p>
              <p><strong className="text-gray-200">Target User:</strong> C&I EPC business developers</p>
            </div>
          </div>

          {/* Card 2: Solar Ladder */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">Solar Ladder</h3>
                <a 
                  href="https://solarladder.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  aria-label="Solar Ladder official website"
                >
                  solarladder.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-4">Operations & Business Management</p>
              <p className="text-sm text-gray-300 leading-relaxed font-normal mb-6">
                An all-in-one solar business operations and CRM software platform tailored for Indian solar installers. Its publicly documented capabilities include lead pipeline management, proposal generation, 3D rooftop modeling, PM Surya Ghar/net-metering workflow tracking, inventory, BOM cost tracking, and procurement.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs text-gray-400 font-medium space-y-1.5">
              <p><strong className="text-gray-200">Core Focus:</strong> Business execution, CRM & procurement</p>
              <p><strong className="text-gray-200">Target User:</strong> Residential & commercial solar installers</p>
            </div>
          </div>

          {/* Card 3: Solar Connect */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-amber-500/20 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">Solar Connect</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Unverified
                </span>
              </div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-4">Multiple Entities / Marketplace</p>
              <p className="text-sm text-gray-300 leading-relaxed font-normal mb-6">
                Multiple independent entities operate under the name "Solar Connect" in India, notably <span className="text-gray-200">solarconnectindia.in</span> (installer dealership & sales support) and <span className="text-gray-200">solarconnect.co.in</span> (a consumer lead marketplace connecting homeowners with local installers). Specific software capabilities cannot be verified confidently from public documentation.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-xs text-gray-400 font-medium space-y-1.5">
              <p><strong className="text-gray-200">Core Focus:</strong> Unverified from public records</p>
              <p><strong className="text-gray-200">Flagged:</strong> Pending vendor verification</p>
            </div>
          </div>

        </div>
      </section>

      {/* Section 3: Feature Comparison Table */}
      <section className="mb-20">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Factual Capability Comparison
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
            This table compares the publicly documented, verifiable capabilities of each platform. Features marked as unverified reflect the absence of authoritative public documentation rather than an assumption that the feature is absent.
          </p>
        </div>

        {/* Responsive Table Container */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/80 text-xs font-black uppercase tracking-wider">
                  <th scope="col" className="py-5 px-6 text-gray-300 w-1/4">Capability</th>
                  <th scope="col" className="py-5 px-6 text-emerald-400 bg-emerald-500/10 border-x border-emerald-500/20 w-1/4">
                    SolarOptions
                  </th>
                  <th scope="col" className="py-5 px-6 text-blue-300 w-1/4">
                    Solar Ladder
                  </th>
                  <th scope="col" className="py-5 px-6 text-amber-300/80 w-1/4">
                    Solar Connect <span className="text-[9px] font-normal lowercase block text-gray-400">(Unverified Entity)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                
                {/* Row 1 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Primary Purpose</td>
                  <td className="py-5 px-6 text-gray-300 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-medium">
                    Industrial solar prospecting, site discovery, and digital pre-sales intelligence.
                  </td>
                  <td className="py-5 px-6 text-gray-400">
                    Comprehensive operations, CRM, proposals, and project management for solar businesses.
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from reliable public documentation (multiple entities operate under this name).
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Industrial Site Discovery</td>
                  <td className="py-5 px-6 text-emerald-400 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Yes (1,500+ pre-listed industrial facilities)</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-gray-400">
                    No dedicated industrial site database; designed for EPCs to manage their own inbound leads.
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Pre-Identified Industrial Prospects</td>
                  <td className="py-5 px-6 text-emerald-400 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Yes (Rooftop area, company details, cluster filters)</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-gray-400">
                    Not a core offering; focuses on lead pipeline management provided by the user.
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Rooftop Assessment & Solar Capacity Estimates</td>
                  <td className="py-5 px-6 text-emerald-400 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Yes (Rooftop dimensions, usable area, kWp potential)</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-gray-300">
                    Yes (Site survey forms, manual roof measurement, proposal calculations).
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Solar Feasibility & Savings Calculator</td>
                  <td className="py-5 px-6 text-emerald-400 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Yes (Instant C&I tariff, payback, generation estimates)</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-gray-300">
                    Yes (Quotation calculators, cost estimation, and financial metrics in proposals).
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 6 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Solar Design & 3D Visualization</td>
                  <td className="py-5 px-6 text-emerald-400 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Yes (3D layout designer with automated panel placement & walkway offsets)</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-gray-300">
                    Yes (3D solar modeling tool with shadow analysis and proposal view links).
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 7 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Proposals & Sales Workflows</td>
                  <td className="py-5 px-6 text-gray-300 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-medium">
                    Pre-sales outputs: feasibility metrics and 3D visual mockups for initial client outreach.
                  </td>
                  <td className="py-5 px-6 text-gray-300">
                    Yes (Full formal proposal generation with branding, multi-language reports, and client links).
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 8 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Project Management & CRM</td>
                  <td className="py-5 px-6 text-gray-400 bg-emerald-500/[0.03] border-x border-emerald-500/20">
                    Not supported (intentionally focuses strictly on prospecting and pre-sales).
                  </td>
                  <td className="py-5 px-6 text-gray-300 font-semibold text-blue-400">
                    Yes (Task tracking, milestones, team communication, and net-metering workflows).
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 9 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Procurement & Inventory Management</td>
                  <td className="py-5 px-6 text-gray-400 bg-emerald-500/[0.03] border-x border-emerald-500/20">
                    Not supported (no hardware procurement, billing, or warehouse tracking).
                  </td>
                  <td className="py-5 px-6 text-gray-300 font-semibold text-blue-400">
                    Yes (Distributor procurement network, BOM cost tracking, and inventory tools).
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

                {/* Row 10 */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-bold text-white">Intended Business Use</td>
                  <td className="py-5 px-6 text-gray-300 bg-emerald-500/[0.03] border-x border-emerald-500/20 font-medium">
                    Helping solar EPCs identify high-capacity industrial opportunities and qualify rooftop potential in minutes.
                  </td>
                  <td className="py-5 px-6 text-gray-300">
                    Helping solar installers and EPCs run their daily business operations, proposal generation, and installation projects.
                  </td>
                  <td className="py-5 px-6 text-gray-400 italic">
                    Not verified from publicly available documentation.
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Notice */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5 text-xs text-gray-400 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Methodology & Documentation Notice:</strong> SolarOptions data is derived from our live production platform. Solar Ladder details were referenced from its official website (<a href="https://solarladder.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">solarladder.com</a>) and publicly published company announcements. Solar Connect capabilities could not be verified conclusively due to multiple entities sharing the brand name; we recommend visiting <a href="https://solarconnectindia.in" target="_blank" rel="noopener noreferrer" className="text-gray-300 underline">solarconnectindia.in</a> or <a href="https://solarconnect.co.in" target="_blank" rel="noopener noreferrer" className="text-gray-300 underline">solarconnect.co.in</a> directly.
          </p>
        </div>
      </section>

      {/* Section 4: Where SolarOptions Fits */}
      <section className="mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-6">
          Where SolarOptions Fits in the Solar EPC Tech Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed font-normal">
            <p>
              In high-capacity Commercial & Industrial solar projects (typically ranging from 100 kW to multiple megawatts), the greatest business development challenge is not drafting an invoice or ordering panels—it is <strong>finding viable rooftops and qualifying them rapidly</strong>.
            </p>
            <p>
              Historically, C&I sales teams spend weeks manually scanning satellite imagery, driving through industrial zones, or chasing outdated industrial directory lists. When they do find a prospective factory, they must spend hours calculating whether the roof has enough shadow-free space to justify a commercial proposal.
            </p>
            <p>
              <strong>SolarOptions is built specifically to solve this top-of-funnel challenge:</strong>
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span><strong>Pre-Mapped Industrial Data:</strong> Access 1,500+ verified industrial facilities across key industrial belts with identified rooftop boundaries.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span><strong>Instant Capacity Feasibility:</strong> Pre-calculated rooftop square footage and potential solar capacity (kWp) based on standard industry benchmarks (~100 sq.ft per kWp).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span><strong>Rapid Digital Pre-Sales:</strong> Run initial electricity savings and payback estimates in minutes, accompanied by 3D rooftop visualizations, before dispatching engineers for physical site audits.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Complementary Workflow, Not Replacement
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-normal">
              SolarOptions does not replace operational software like Solar Ladder or general CRM systems. Instead, they serve different stages of the business lifecycle:
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-emerald-500/20">
                <span className="font-bold text-emerald-400 uppercase tracking-widest block mb-1">Step 1: Top-of-Funnel (SolarOptions)</span>
                <span className="text-gray-300">Discover industrial prospects, assess rooftop dimensions, calculate financial feasibility, and generate 3D panel layouts to win stakeholder interest.</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10">
                <span className="font-bold text-blue-400 uppercase tracking-widest block mb-1">Step 2: Operations & Execution (ERP / CRM / Solar Ladder)</span>
                <span className="text-gray-300">Once the contract is initiated, track team tasks, manage paperwork, handle supplier procurement, and invoice the customer.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Which Solution Suits Which Need? */}
      <section className="mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-8">
          Which Solution Suits Which Need?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Use Case A */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-emerald-500/20 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              Best for C&I Business Development
            </span>
            <h3 className="text-xl font-bold text-white">Choose SolarOptions if your primary goal is:</h3>
            <ul className="space-y-3 text-sm text-gray-300 font-normal">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Prospecting for viable factories and industrial facilities across major manufacturing clusters.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Evaluating rooftop area, shadow-free dimensions, and potential capacity without manual physical scouting.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Generating quick pre-sales financial feasibility and visual 3D panel layouts to start executive conversations.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Equipping business development teams and interns with instant calculators to reduce the learning curve.</span>
              </li>
            </ul>
          </div>

          {/* Use Case B */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-blue-500/20 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
              Best for Operations & Installers
            </span>
            <h3 className="text-xl font-bold text-white">Choose Solar Ladder if your primary goal is:</h3>
            <ul className="space-y-3 text-sm text-gray-300 font-normal">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Managing high volumes of residential or mixed solar installation leads through an end-to-end CRM.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Generating formal branded customer quotations, multi-language reports, and client tracking links.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Handling post-sale installation operations, PM Surya Ghar workflow tracking, and net metering compliance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Connecting with equipment distributors to manage procurement, BOM costs, and project inventory.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Section 6: Frequently Asked Questions */}
      <section className="mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4 max-w-4xl">
          
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Can a solar EPC use both SolarOptions and Solar Ladder together?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed pl-6">
              Yes. Many solar organizations utilize specialized tools at different stages of their funnel. An EPC company can use SolarOptions at the top of the funnel to identify industrial facilities, assess rooftop potential, and prepare initial feasibility estimates, and subsequently manage customer milestones, project execution, and procurement inside Solar Ladder or their preferred CRM.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              How does SolarOptions estimate industrial solar capacity?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed pl-6">
              SolarOptions analyzes high-resolution satellite mapping to determine industrial facility rooftop dimensions and estimated shadow-free areas. Capacity benchmarks follow established standard metrics (~100 square feet per kWp of solar capacity), providing a rapid preliminary engineering estimate for C&I feasibility analysis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Does SolarOptions replace post-sale project management or invoicing software?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed pl-6">
              No. SolarOptions focuses deliberately on the pre-sales, prospecting, and site discovery phases. It does not provide post-contract invoicing, bill-of-materials procurement, or installation task management.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Why are Solar Connect details listed as unverified?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed pl-6">
              Multiple Indian companies operate in the solar sector under the name "Solar Connect" (such as SolarConnect India at <code className="text-gray-300">solarconnectindia.in</code> and the Solar Connect lead marketplace at <code className="text-gray-300">solarconnect.co.in</code>). To adhere to strict factual accuracy standards, we list these capabilities as unverified rather than assuming or attributing features to an unconfirmed entity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              How do solar EPC teams get started with SolarOptions?
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed pl-6">
              You can explore our public tools immediately without any account: use the <Link to="/solar-rooftop-calculator" onClick={() => window.scrollTo(0,0)} className="text-emerald-400 underline">Solar Calculator</Link> to estimate plant size and savings, or open the <Link to="/3d-layout-designer" onClick={() => window.scrollTo(0,0)} className="text-emerald-400 underline">3D Layout Designer</Link> to visualize panel placements. For access to the full curated industrial facility database, you can request access via our platform portal.
            </p>
          </div>

        </div>
      </section>

      {/* Section 7: Call to Action */}
      <section className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-emerald-500/30 ring-1 ring-emerald-500/20 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Industrial Pre-Sales Acceleration
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Explore Industrial Rooftop Opportunities on SolarOptions
          </h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Discover potential industrial facilities, analyze shadow-free rooftop dimensions, run financial calculations, and create 3D layout visualizations.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/industrial-intelligence');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
            >
              Explore Facilities <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/solar-rooftop-calculator');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Calculator className="w-4 h-4" /> Try Calculator
            </button>
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/3d-layout-designer');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Box className="w-4 h-4" /> 3D Designer
            </button>
          </div>
        </div>
      </section>

      {/* Internal Navigation Links Footer Bar */}
      <footer className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          <span>© {new Date().getFullYear()} SolarOptions.in · Industrial Solar Platform</span>
        </div>
        <div className="flex flex-wrap gap-6 font-semibold uppercase tracking-wider text-[10px]">
          <Link to="/" onClick={() => window.scrollTo(0,0)} className="hover:text-emerald-400 transition-colors">Home</Link>
          <Link to="/industrial-intelligence" onClick={() => window.scrollTo(0,0)} className="hover:text-emerald-400 transition-colors">Industrial Intelligence</Link>
          <Link to="/solar-rooftop-calculator" onClick={() => window.scrollTo(0,0)} className="hover:text-emerald-400 transition-colors">Calculator</Link>
          <Link to="/3d-layout-designer" onClick={() => window.scrollTo(0,0)} className="hover:text-emerald-400 transition-colors">3D Designer</Link>
          <Link to="/privacy-policy" onClick={() => window.scrollTo(0,0)} className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-service" onClick={() => window.scrollTo(0,0)} className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};
