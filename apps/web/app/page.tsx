import Link from "next/link";
import { ArrowRight, Sparkles, Search, FileText, CalendarDays, ShieldCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { val: "4.2 hrs", label: "Avg. Time to Shortlist" },
  { val: "93%", label: "Match Accuracy" },
  { val: "2,300+", label: "Active Talent Profiles" },
];

const steps = [
  { num: "01", title: "Define Your Role", desc: "Describe what you need. AI enhances your brief into a compelling, bias-free job description." },
  { num: "02", title: "Review AI Shortlist", desc: "Ranked candidates scored on 7 factors — skills, experience, availability, rate, location, culture, and track record." },
  { num: "03", title: "Interview & Close", desc: "Schedule interviews, send offers, and track acceptances — all from one pipeline." },
];

const features = [
  { title: "AI Talent Matching", icon: Sparkles, desc: "Deep learning ranks candidates across 7 weighted factors. Every match comes with a score explanation." },
  { title: "Semantic Search", icon: Search, desc: "Describe what you need in plain language. The engine understands context, synonyms, and intent." },
  { title: "Role Description AI", icon: FileText, desc: "Paste rough notes, get a polished JD in seconds. Bias-checked and structured for clarity." },
  { title: "Interview Pipeline", icon: CalendarDays, desc: "Schedule, track, collect feedback, and move candidates through stages — no spreadsheets." },
  { title: "Admin Governance", icon: ShieldCheck, desc: "Role-based access, verification queues, demand approvals, and full audit trails." },
  { title: "Recruiter Analytics", icon: BarChart3, desc: "Time-to-hire, pipeline velocity, skill demand trends, and conversion funnels — all real-time." },
];

const footerLinks = [
  { section: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
  { section: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { section: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-primary font-extrabold text-2xl tracking-tight">TalentAI</span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
              Hire the Right <br />
              <span className="text-primary">Talent. Fast.</span>
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-lg leading-relaxed">
              AI-powered matching connects enterprise teams with pre-vetted talent — shortlist to signed offer in hours, not weeks.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link href="/register">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="hero-outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video bg-card border border-border rounded-2xl overflow-hidden shadow-lg relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="space-y-3 w-3/4">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                  <div className="h-8 bg-primary/20 rounded w-full mt-4" />
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 bg-secondary rounded border border-border" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {stats.map((stat, i) => (
            <div key={i} className="p-12 text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">{stat.val}</div>
              <div className="text-sm text-text-secondary uppercase tracking-widest font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-16 text-center">From Role to Hire in Three Steps</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-extrabold text-lg mx-auto mb-6">
                {step.num}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-12 text-center">Everything Your Hiring Team Needs</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="p-8 bg-card border border-border rounded-lg hover:bg-secondary transition-all group"
            >
              <feat.icon className="h-8 w-8 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div>
            <span className="text-primary font-extrabold text-xl">TalentAI</span>
            <p className="text-text-secondary text-sm mt-4 leading-relaxed">
              AI-powered talent marketplace for modern recruiting teams.
            </p>
          </div>
          {footerLinks.map((col) => (
            <div key={col.section}>
              <h4 className="font-bold text-sm mb-4">{col.section}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-text-secondary hover:text-foreground transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-text-muted">
          © 2026 TalentAI Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
