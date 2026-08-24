import React from 'react';
import { useLocation } from 'wouter';
import {
  Bell,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Users,
  BarChart3,
  ShieldCheck,
  Building,
} from 'lucide-react';

export function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans select-none">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-display text-2xl">S</span>
          <span className="text-xl font-black tracking-tight text-white uppercase">SilentServe</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation('/demo')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> View Demo
          </button>
          <button
            onClick={() => setLocation('/sign-in')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition uppercase tracking-wider"
          >
            Start Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 mb-8">
          <Zap className="w-3.5 h-3.5" /> Next-Gen QR Service Protocol for Hospitality
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase leading-none">
          Silent service. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
            Faster response.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Let guests call your team with one tap. No app download. No shouting across the room. No waiting on hold. Real-time tablet dispatch for restaurants, hotels, resorts, and cafes.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setLocation('/demo')}
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-xl shadow-amber-500/10"
          >
            Launch Interactive Demo <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLocation('/sign-up')}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            Create Business Workspace
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-900 border-y border-slate-800 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400">HOW IT WORKS</h2>
            <p className="text-3xl font-black text-white mt-2 uppercase tracking-tight">3 Simple Steps to Effortless Service</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">1. Guest Scans QR</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Guest points phone camera at table or cabana QR code. Opens instantly in web browser without app installation or login.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">2. One Tap Call</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Guest taps one button. Service request instantly syncs across staff tablet devices via multi-tenant Firestore realtime channels.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">3. Atomic Claim & Response</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Staff member claims request with transaction guarantees. Guest sees who is coming ("Maria is on the way").
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Tiers */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400">SAAS PLANS</h2>
          <p className="text-3xl font-black text-white mt-2 uppercase tracking-tight">Scalable Multi-Tenant Pricing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white uppercase">Starter</h3>
              <p className="text-3xl font-black text-amber-400 mt-2">$49<span className="text-xs font-normal text-slate-400">/mo</span></p>
              <ul className="mt-6 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 1 Location</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Up to 5 Staff</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 50 Service Points</li>
              </ul>
            </div>
            <button
              onClick={() => setLocation('/sign-up')}
              className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl uppercase transition"
            >
              Choose Starter
            </button>
          </div>

          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between relative shadow-xl shadow-amber-500/5">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-bold text-white uppercase">Pro</h3>
              <p className="text-3xl font-black text-amber-400 mt-2">$149<span className="text-xs font-normal text-slate-400">/mo</span></p>
              <ul className="mt-6 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Multiple Zones</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Unlimited Staff</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Analytics Dashboard</li>
              </ul>
            </div>
            <button
              onClick={() => setLocation('/sign-up')}
              className="mt-8 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl uppercase transition"
            >
              Choose Pro
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white uppercase">Hotel</h3>
              <p className="text-3xl font-black text-amber-400 mt-2">$299<span className="text-xs font-normal text-slate-400">/mo</span></p>
              <ul className="mt-6 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Multiple Outlets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Large Room Outlets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Advanced Metrics</li>
              </ul>
            </div>
            <button
              onClick={() => setLocation('/sign-up')}
              className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl uppercase transition"
            >
              Choose Hotel
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white uppercase">Enterprise</h3>
              <p className="text-3xl font-black text-amber-400 mt-2">$499<span className="text-xs font-normal text-slate-400">+/mo</span></p>
              <ul className="mt-6 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Multi-Property Chains</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Dedicated Admin</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> SLA Support</li>
              </ul>
            </div>
            <button
              onClick={() => setLocation('/sign-up')}
              className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl uppercase transition"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600 font-mono">
        SilentServe • Production-Ready QR Service Protocol
      </footer>
    </div>
  );
}
