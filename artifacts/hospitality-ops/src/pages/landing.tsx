import { ArrowRight, Check, ChevronDown, Clock3, QrCode, Radio, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

export function LandingPage() {
  return (
    <div className="noise min-h-[100dvh] overflow-hidden bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" data-testid="link-landing-logo">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-2xl font-semibold">H</span>
          <span><span className="block text-[16px] font-extrabold tracking-tight">harbor</span><span className="block font-mono-app text-[9px] uppercase tracking-[0.2em] text-muted-foreground">service operations</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex"><a href="#how-it-works" data-testid="link-how-it-works">How it works</a><a href="#for-teams" data-testid="link-for-teams">For teams</a><a href="#proof" data-testid="link-proof">The difference</a></nav>
        <div className="flex items-center gap-2"><Link href="/sign-in" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex" data-testid="link-landing-sign-in">Sign in</Link><Link href="/sign-up" className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background transition hover:-translate-y-0.5" data-testid="link-landing-start">Start a workspace <ArrowRight size={15} /></Link></div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-32">
          <div className="absolute right-[-10%] top-[-5%] -z-0 h-[540px] w-[540px] rounded-full bg-accent/60 blur-3xl" />
          <div className="relative z-10 max-w-4xl">
            <div className="animate-in inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono-app text-[10px] font-medium uppercase tracking-[0.17em] text-primary"><span className="pulse-soft h-1.5 w-1.5 rounded-full bg-primary" /> Built for the floor</div>
            <h1 className="animate-in animate-in-delay-1 mt-7 max-w-4xl text-balance font-display text-[clamp(4rem,10vw,8.7rem)] leading-[.83] tracking-[-0.055em] text-foreground">Service, <em className="text-primary">without</em> the scramble.</h1>
            <p className="animate-in animate-in-delay-2 mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">Harbor turns every “could we get…” into a clear next step — from the guest’s table to the team that makes it happen.</p>
            <div className="animate-in animate-in-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"><Link href="/sign-up" className="inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-1" data-testid="link-hero-start">Bring your floor online <ArrowRight size={18} /></Link><a href="#how-it-works" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-muted-foreground hover:text-foreground" data-testid="link-hero-learn">See how it works <ChevronDown size={16} /></a></div>
          </div>
          <div className="relative z-10 mt-20 grid max-w-5xl grid-cols-2 border-y border-border/80 py-5 sm:grid-cols-4">
            {[['01', 'Instant requests'], ['02', 'One live queue'], ['03', 'Clear ownership'], ['04', 'Quiet confidence']].map(([number, label]) => <div key={number} className="flex items-center gap-3 border-r border-border px-3 py-3 first:pl-0 last:border-0 sm:px-5"><span className="font-mono-app text-[10px] text-primary">{number}</span><span className="text-xs font-semibold text-muted-foreground">{label}</span></div>)}
          </div>
        </section>

        <section id="how-it-works" className="bg-foreground px-5 py-20 text-background sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-primary">The handoff, redesigned</p><h2 className="mt-5 font-display text-5xl leading-[.95] tracking-[-0.04em] sm:text-7xl">One small scan.<br /><span className="text-primary">A calmer shift.</span></h2></div>
            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-background/15 bg-background/15 md:grid-cols-3">
              {[{num:'01', icon:QrCode, title:'Guests scan once', body:'A table QR opens a focused, branded request menu. No app. No awkward hand raise.'}, {num:'02', icon:Radio, title:'Teams see clearly', body:'Requests land in one live command center with table, service, priority, and time attached.'}, {num:'03', icon:ShieldCheck, title:'Every handoff lands', body:'Accept, own, progress, complete. The whole floor knows what is moving and what is done.'}].map(({num, icon: Icon, title, body}) => <div key={num} className="bg-foreground p-7 sm:p-9"><span className="font-mono-app text-xs text-primary">{num}</span><Icon className="mt-16 text-background/75" size={25} strokeWidth={1.5} /><h3 className="mt-8 font-display text-3xl">{title}</h3><p className="mt-3 text-sm leading-6 text-background/60">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section id="for-teams" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-primary">Made for momentum</p><h2 className="mt-5 font-display text-5xl leading-[.94] tracking-[-0.04em] sm:text-6xl">The floor,<br />in focus.</h2></div><p className="max-w-xl text-lg leading-8 text-muted-foreground">Hospitality moves at the speed of attention. Harbor gives managers the signal they need, and staff the context they deserve — so service stays personal, even when the room is full.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl bg-accent p-7 sm:p-10"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[30px] border-background/20" /><Clock3 size={24} className="relative text-primary" /><h3 className="relative mt-20 max-w-xs font-display text-4xl leading-none">Know what needs you next.</h3><p className="relative mt-4 max-w-sm text-sm leading-6 text-foreground/65">The queue is ordered by the work, not by the noise. Urgent stays urgent. Everything else stays visible.</p></div>
            <div className="rounded-3xl border border-border bg-card p-7 sm:p-10"><Sparkles size={24} className="text-primary" /><h3 className="mt-20 max-w-xs font-display text-4xl leading-none">Give guests a little more ease.</h3><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Clear service options, a space for context, and a private tracking link that keeps them in the loop.</p><div className="mt-9 flex items-center gap-2 text-xs font-bold text-primary"><Check size={15} /> No download required</div></div>
          </div>
        </section>

        <section id="proof" className="border-t border-border bg-muted/55 px-5 py-16 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-primary">A better standard</p><p className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">“The best service feels effortless. The best operations make that possible.”</p></div><Link href="/sign-up" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:gap-3" data-testid="link-proof-start">Start with Harbor <ArrowRight size={16} /></Link></div></section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span className="font-mono-app uppercase tracking-[0.15em]">Harbor / Hospitality operations</span><span>Built for places people remember.</span></footer>
    </div>
  );
}