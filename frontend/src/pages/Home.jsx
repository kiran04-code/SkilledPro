import { Link } from 'react-router-dom';

const CATEGORIES = [
  { name: 'Plumbing', icon: 'plumbing' },
  { name: 'Electrical', icon: 'bolt' },
  { name: 'HVAC', icon: 'ac_unit' },
  { name: 'Painting', icon: 'format_paint' },
  { name: 'Carpentry', icon: 'carpenter' },
  { name: 'General', icon: 'handyman' },
];

export default function Home() {
  return (
    <div className="bg-background min-h-screen font-inter selection:bg-secondary-container">

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden bg-primary px-8">
        {/* Background overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/60" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
          <div className="space-y-6">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <span className="material-symbols-outlined text-secondary-light text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-label-caps text-white/80 font-manrope">12,400+ VERIFIED PROFESSIONALS</span>
            </div>

            <h1 className="font-manrope text-[48px] font-extrabold text-white leading-[1.15] tracking-tight max-w-xl">
              Find Trusted Local Pros for Any Job.
            </h1>

            <p className="text-body-lg text-primary-fixed-dim max-w-lg">
              The elite marketplace for high-tier professional services. From complex electrical engineering to master plumbing, we connect you with certified excellence.
            </p>

            {/* Search Bar */}
            <div className="glass-panel p-2 rounded-xl flex flex-col md:flex-row gap-2 max-w-2xl shadow-xl mt-8">
              <div className="flex-1 flex items-center px-4 gap-3 bg-white/50 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input
                  className="w-full py-3 bg-transparent border-none focus:ring-0 focus:shadow-none text-slate-900 font-medium placeholder:text-slate-400 outline-none text-body-sm"
                  placeholder="What service do you need?"
                  type="text"
                />
              </div>
              <div className="md:w-48 flex items-center px-4 gap-3 bg-white/50 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined text-slate-400">location_on</span>
                <input
                  className="w-full py-3 bg-transparent border-none focus:ring-0 focus:shadow-none text-slate-900 font-medium placeholder:text-slate-400 outline-none text-body-sm"
                  placeholder="Zip code"
                  type="text"
                />
              </div>
              <Link
                to="/workers"
                className="bg-secondary-light text-white px-8 py-3 rounded-lg font-manrope font-semibold hover:bg-on-secondary-container transition-all active:scale-95 shadow-lg text-center"
              >
                Search
              </Link>
            </div>
          </div>

          {/* Right side cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              {/* Pro card 1 */}
              <div className="glass-panel p-4 rounded-xl shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-body-sm">David Chen</p>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider">MASTER ELECTRICIAN</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-on-secondary-container bg-secondary-container/40 px-2 py-0.5 rounded w-fit">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                  <span className="text-[11px] font-bold">VERIFIED</span>
                </div>
              </div>

              {/* Pro card 2 */}
              <div className="glass-panel p-4 rounded-xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-body-sm">Sarah Miller</p>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider">INTERIOR ARCHITECT</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-on-secondary-container bg-secondary-container/40 px-2 py-0.5 rounded w-fit">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[11px] font-bold">4.9 (124)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Escrow card */}
              <div className="glass-panel p-6 rounded-xl shadow-2xl bg-white/80 border border-white/40">
                <span className="material-symbols-outlined text-secondary-light text-4xl mb-4 block">lock_open</span>
                <h3 className="text-slate-900 font-manrope font-semibold text-h3 mb-2">Secure Escrow</h3>
                <p className="text-slate-600 text-body-sm">Payments are held securely and only released when the job is completed to your satisfaction.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              { icon: 'verified_user', title: 'Verified Professionals', desc: 'Rigorous 5-step background and license checks for every provider.' },
              { icon: 'payments', title: 'Secure Payments', desc: 'Encrypted transactions with milestone-based payment release.' },
              { icon: 'support_agent', title: '24/7 Support', desc: 'Dedicated concierge team to help you navigate your project needs.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-8 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-secondary-container/30 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary">{icon}</span>
                </div>
                <div>
                  <h4 className="font-manrope font-semibold text-slate-900 mb-1">{title}</h4>
                  <p className="text-body-sm text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 px-8 bg-surface">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-manrope text-h2 text-on-surface mb-2">Popular Categories</h2>
              <p className="text-slate-500">Hire specialized experts for your specific project requirements.</p>
            </div>
            <Link to="/workers" className="text-primary font-bold hover:underline flex items-center gap-2 text-body-sm">
              View All Categories
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                to={`/workers?skill=${cat.name}`}
                className="group block p-6 bg-white border border-slate-200 rounded-xl hover:border-secondary-light hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary-container/30 transition-colors">
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-secondary">{cat.icon}</span>
                </div>
                <span className="font-bold text-slate-900 text-body-sm">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-8 bg-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-manrope text-h1 text-slate-900 mb-4">How SkilledPro Works</h2>
            <p className="text-body-lg text-slate-600">A seamless experience designed for both homeowners and professional service providers.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* For Clients */}
            <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-bl-full -mr-8 -mt-8" />
              <div className="relative z-10">
                <span className="inline-block px-4 py-1 rounded-full bg-slate-200 text-slate-700 text-label-caps font-manrope mb-6">FOR CLIENTS</span>
                <div className="space-y-8">
                  {[
                    { n: '1', title: 'Post Your Project', desc: 'Describe what you need, upload photos, and set your budget preferences.' },
                    { n: '2', title: 'Review Bids', desc: 'Compare verified profiles, reviews, and detailed quotes from top-rated pros.' },
                    { n: '3', title: 'Hire & Pay Securely', desc: 'Choose the best pro and pay through our protected escrow system.' },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{n}</span>
                      <div>
                        <h4 className="font-manrope font-semibold text-slate-900 mb-1">{title}</h4>
                        <p className="text-slate-600 text-body-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/register" className="mt-8 inline-block px-6 py-3 border-2 border-primary text-primary rounded-lg font-manrope font-semibold hover:bg-primary hover:text-white transition-all">
                  Get Started
                </Link>
              </div>
            </div>

            {/* For Workers */}
            <div className="p-10 rounded-2xl bg-primary text-white border border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-light/20 rounded-bl-full -mr-8 -mt-8" />
              <div className="relative z-10">
                <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-white text-label-caps font-manrope mb-6 border border-white/20">FOR PROS</span>
                <div className="space-y-8">
                  {[
                    { n: '1', title: 'Create Your Profile', desc: 'Complete our verification process and showcase your professional portfolio.' },
                    { n: '2', title: 'Bid on Local Jobs', desc: 'Receive notifications for projects that match your skills and location.' },
                    { n: '3', title: 'Grow Your Business', desc: 'Collect verified reviews and build a reputation for quality work.' },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-light text-white flex items-center justify-center font-bold text-sm">{n}</span>
                      <div>
                        <h4 className="font-manrope font-semibold text-white mb-1">{title}</h4>
                        <p className="text-primary-fixed-dim text-body-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/register" className="mt-8 inline-block px-6 py-3 bg-secondary-light text-white rounded-lg font-manrope font-semibold hover:bg-on-secondary-container transition-all">
                  Become a Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Talent Section */}
      <section className="py-20 px-8 bg-white border-y border-slate-100">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-slate-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-slate-300">construction</span>
              <div className="absolute bottom-6 left-6 glass-panel p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="font-bold text-slate-900 text-sm">Certified Professional</span>
                </div>
                <p className="text-slate-600 text-body-sm">Every pro undergoes 15+ background checks.</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <h2 className="font-manrope text-h1 text-slate-900 leading-tight">Elite Talent, Verified for Your Peace of Mind.</h2>
            <p className="text-body-lg text-slate-600">
              At SkilledPro, we don't just list services; we curate expertise. Our rigorous vetting process ensures that every professional is licensed, insured, and has a proven track record of excellence.
            </p>
            <ul className="space-y-4">
              {[
                'Federal Criminal Background Checks',
                'Professional License Verification',
                'Insurance and Bond Validation',
                'Client-Verified Performance Reviews',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-slate-800 font-medium text-body-sm">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/workers" className="inline-block px-8 py-4 bg-primary text-white rounded-lg font-manrope font-semibold hover:bg-slate-800 transition-all shadow-lg">
              Browse Professionals Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-slate-50 font-manrope text-xs tracking-wide">
        <div className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-start gap-12 max-w-[1280px] mx-auto">
          <div className="space-y-4 max-w-xs">
            <span className="font-bold text-slate-900 text-xl block">SkilledPro</span>
            <p className="text-slate-500 leading-relaxed">The premier marketplace for high-tier professional services. Connecting vetted experts with discerning clients since 2024.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            {[
              { title: 'Marketplace', links: [['Browse Jobs', '/projects'], ['Find Professionals', '/workers'], ['Pro Pricing', '#']] },
              { title: 'Resources', links: [['Help Center', '#'], ['Trust & Safety', '#'], ['Community', '#']] },
              { title: 'Company', links: [['About SkilledPro', '#'], ['Careers', '#'], ['Contact', '#']] },
            ].map(section => (
              <div key={section.title} className="space-y-4">
                <p className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">{section.title}</p>
                <nav className="flex flex-col gap-2">
                  {section.links.map(([label, to]) => (
                    <Link key={label} to={to} className="text-slate-500 hover:text-slate-800 transition-colors">{label}</Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full py-8 px-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1280px] mx-auto">
          <p className="text-slate-500">© 2024 SkilledPro Marketplace. Secure Escrow Enabled.</p>
          <div className="flex gap-6">
            {['Terms of Service', 'Privacy Policy', 'Trust & Safety', 'Help Center'].map(l => (
              <a key={l} href="#" className="text-slate-500 hover:text-slate-800 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}