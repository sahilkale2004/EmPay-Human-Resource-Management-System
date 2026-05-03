import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Banknote, Users, Clock, CalendarOff, FileBarChart, Shield,
  ChevronRight, ArrowRight, Menu, X, Zap, BarChart3, Globe,
  CheckCircle2, Star, TrendingUp
} from 'lucide-react';

/* ─── Feature data ─── */
const features = [
  {
    icon: Users,
    title: 'Employee Management',
    desc: 'Centralized profiles, document storage, and org-chart views — all in a single pane of glass.',
  },
  {
    icon: Clock,
    title: 'Smart Attendance',
    desc: 'One-click check-in / check-out with real-time dashboards and automated overtime calculations.',
  },
  {
    icon: Banknote,
    title: 'Payroll Processing',
    desc: 'Automated pay-runs with tax deductions, allowances, and instant payslip generation.',
  },
  {
    icon: CalendarOff,
    title: 'Leave Management',
    desc: 'Configurable leave types, approval workflows, and calendar-view team availability.',
  },
  {
    icon: FileBarChart,
    title: 'Advanced Reports',
    desc: 'Export-ready analytics with department-level breakdowns, trends, and compliance audit trails.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Granular permissions for Admins, HR Officers, Payroll Officers, and Employees.',
  },
];

/* ─── Landing Page Component ─── */
export const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Redirect logged-in users */
  if (user) return <Navigate to="/employees" replace />;

  return (
    <div className="min-h-screen bg-[#F5F2ED] font-sans overflow-x-hidden">
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FDFBF8]/90 backdrop-blur-xl shadow-[0_2px_24px_rgba(92,122,95,0.08)] border-b border-[#DDD8CF]/60'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#5C7A5F] rounded-xl flex items-center justify-center shadow-lg shadow-[#5C7A5F]/20 group-hover:scale-105 transition-transform">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-[#1C2B1E] tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                <em>EmPay</em>
              </span>
              <span className="hidden sm:inline ml-2 text-[10px] font-bold text-[#9C9286] uppercase tracking-[0.2em]">
                HRMS
              </span>
            </div>
          </Link>

          {/* Right side — Login CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/signup"
              className="text-sm font-semibold text-[#5C7A5F] hover:text-[#3F5C42] transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              id="navbar-login-btn"
              className="px-5 py-2.5 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#5C7A5F]/20 transition-all active:scale-[0.97]"
            >
              Login
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#2A2520]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FDFBF8] border-t border-[#DDD8CF] px-6 pb-6 pt-2 space-y-4 animate-fade-in-up">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#6B6259] hover:text-[#5C7A5F]">Features</a>
            <div className="flex gap-3 pt-2">
              <Link to="/signup" className="flex-1 text-center py-2.5 border border-[#5C7A5F] text-[#5C7A5F] font-semibold rounded-xl text-sm">Sign Up</Link>
              <Link to="/login" className="flex-1 text-center py-2.5 bg-[#5C7A5F] text-white font-semibold rounded-xl text-sm">Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#5C7A5F]/8 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#8B7355]/6 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#5C7A5F]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-[#5C7A5F]/10 text-[#5C7A5F] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                <Zap className="w-3.5 h-3.5" />
                Next-Gen HR Platform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1C2B1E] leading-[1.1] tracking-tight">
                Streamline your{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#5C7A5F]">workforce</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-[#5C7A5F]/15 rounded-sm -z-0" />
                </span>
                <br />
                management
              </h1>

              <p className="text-lg text-[#6B6259] leading-relaxed max-w-xl">
                EmPay unifies employee records, attendance tracking, payroll processing, and leave management 
                into one elegant platform — so you can focus on growing your people.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white font-semibold rounded-2xl shadow-lg shadow-[#5C7A5F]/25 transition-all active:scale-[0.97] text-base"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FDFBF8] border border-[#DDD8CF] text-[#2A2520] font-semibold rounded-2xl hover:border-[#5C7A5F]/40 hover:shadow-md transition-all text-base"
                >
                  Explore Features
                </a>
              </div>
            </div>

            {/* Right — Dashboard preview */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-[#1C2B1E]/15 border border-[#DDD8CF]">
                <img
                  src="/hero-dashboard.png"
                  alt="EmPay HRMS Dashboard Preview"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#5C7A5F]/10 text-[#5C7A5F] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
              <BarChart3 className="w-3.5 h-3.5" />
              Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1C2B1E]">
              Everything you need to manage your <span className="text-[#5C7A5F]">team</span>
            </h2>
            <p className="text-[#6B6259] max-w-2xl mx-auto text-lg">
              A complete HRMS solution designed for modern organizations — from onboarding to off-boarding.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="group bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl p-7 hover:shadow-xl hover:shadow-[#5C7A5F]/5 hover:border-[#5C7A5F]/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-[#5C7A5F]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#5C7A5F] group-hover:scale-110 transition-all duration-300">
                  <feat.icon className="w-6 h-6 text-[#5C7A5F] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-[#2A2520] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#6B6259] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#1C2B1E] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #5C7A5F 0%, transparent 60%)' }} />
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-[#5C7A5F] rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#5C7A5F]/30">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to modernize your <span className="text-[#7FA882]">HR?</span>
              </h2>
              <p className="text-[#A8C4AB] max-w-lg mx-auto text-lg">
                Join hundreds of organizations that trust EmPay to manage their workforce effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#5C7A5F] hover:bg-[#7FA882] text-white font-semibold rounded-2xl shadow-lg shadow-[#5C7A5F]/30 transition-all active:scale-[0.97] text-base"
                >
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2E4232] text-[#A8C4AB] hover:text-white hover:border-[#5C7A5F] font-semibold rounded-2xl transition-all text-base"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[#1C2B1E] border-t border-[#2E4232] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#5C7A5F] rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <em>EmPay</em> <span className="text-[#7FA882] text-[10px] font-sans uppercase tracking-[0.2em]">HRMS</span>
                </span>
              </div>
              <p className="text-[#A8C4AB] text-sm leading-relaxed max-w-sm">
                Empowering organizations with modern, intuitive HR management tools. 
                From attendance to payroll — simplified.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {['Features', 'Pricing', 'Security', 'Integrations'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[#A8C4AB] hover:text-white text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[#A8C4AB] hover:text-white text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#2E4232] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#7FA882] text-xs">&copy; {new Date().getFullYear()} EmPay HRMS. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-[#A8C4AB]">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
