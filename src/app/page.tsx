"use client";

import { useState } from "react";
import { Search, Download, Loader2, MapPin, Briefcase, Globe, Phone, Star, MessageSquare, ArrowUpRight, Zap, Target, Users, Trash2, Map } from "lucide-react";
import { BusinessLead } from "@/types";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !niche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, niche }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape leads");
      }

      if (data.leads.length === 0) {
        setError("No leads found matching your criteria in this area.");
      } else {
        setLeads(data.leads);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearLeads = () => {
    setLeads([]);
    setError(null);
  };

  const handleExport = () => {
    if (leads.length === 0) return;

    const csvData = leads.map((lead) => ({
      "Business Name": lead.name,
      "Phone Number": lead.phone,
      "Website": lead.website,
      "Google Maps URL": lead.googleMapsUrl,
      "Rating": lead.rating,
      "Review Count": lead.reviewCount,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `LEADPRO_${city.replace(/\s+/g, "_")}_${niche.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const averageRating = leads.length > 0 ? (leads.reduce((acc, lead) => acc + lead.rating, 0) / leads.length).toFixed(1) : "0";
  const totalReviews = leads.reduce((acc, lead) => acc + lead.reviewCount, 0);

  return (
    <main className="min-h-screen selection:bg-accent selection:text-black bg-[#1A1918]">
      {/* Decorative Blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(251,175,0,0.3)]">
              <Zap className="text-black w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-heading font-bold tracking-tighter uppercase italic">LeadPro</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-6 text-sm font-medium text-white/50"
          >
            <span className="hover:text-accent transition-colors cursor-pointer">Dashboard</span>
            <span className="hover:text-accent transition-colors cursor-pointer">Settings</span>
            <div className="h-4 w-[1px] bg-white/10" />
            <button 
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.reload();
              }}
              className="text-white/40 hover:text-red-400 transition-colors cursor-pointer uppercase tracking-widest text-[10px] font-bold"
            >
              Sign Out
            </button>
            <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 transition-all font-mono">
              v1.0.4
            </button>
          </motion.div>
        </nav>

        {/* Hero & Search */}
        <div className="grid lg:grid-cols-2 gap-12 items-end mb-16">
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-heading font-extrabold leading-[0.9] tracking-tight"
            >
              FIND YOUR <br />
              <span className="text-accent underline decoration-white/10 underline-offset-8">NEXT CLIENT</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/40 text-lg max-w-lg font-light leading-relaxed"
            >
              Advanced Google Maps automation for high-yield outreach. 
              Identify businesses with low ratings and weak digital presence instantly.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 rounded-[2.5rem] relative overflow-hidden"
          >
            <form onSubmit={handleScrape} className="grid sm:grid-cols-2 gap-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold ml-1">Location</label>
                <div className="relative group/input">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/input:text-accent transition-colors w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Miami, FL"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold ml-1">Niche</label>
                <div className="relative group/input">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/input:text-accent transition-colors w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Roofing"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="col-span-full bg-accent hover:bg-white text-black font-heading font-bold text-lg py-4 rounded-2xl transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 mt-4 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Market...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Initialize Scan</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Stats */}
        <AnimatePresence>
          {leads.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { label: "Total Leads", value: leads.length, icon: Target },
                { label: "Avg Rating", value: averageRating, icon: Star },
                { label: "Total Reviews", value: totalReviews, icon: MessageSquare },
                { label: "Opportunity", value: leads.length > 10 ? "High" : "Mid", icon: Users },
              ].map((stat, i) => (
                <div key={i} className="glass p-6 rounded-3xl border-accent/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/50">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-heading font-bold">{stat.value}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-center mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-2xl font-heading font-bold text-white mb-1">Lead Inventory</h2>
              <p className="text-white/30 text-[10px] uppercase tracking-widest">
                {loading ? "Syncing..." : `${leads.length} high-intent matches`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={clearLeads}
                disabled={leads.length === 0}
                className="bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 px-4 py-3 rounded-2xl font-heading font-bold transition-all disabled:opacity-0 flex items-center gap-2"
                title="Clear all leads"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                disabled={leads.length === 0}
                className="bg-white hover:bg-accent text-black px-8 py-3 rounded-2xl font-heading font-bold transition-all disabled:opacity-20 flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Business Name</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Contact</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Website</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Maps Link</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.length > 0 ? (
                  leads.map((lead, index) => (
                    <tr key={index} className="glass-hover group/row">
                      <td className="px-8 py-6">
                        <div className="font-heading font-medium text-white group-hover/row:text-accent transition-colors">{lead.name}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-white/60">
                          <Phone className="w-3 h-3 text-accent" />
                          <span className="text-sm font-mono">{lead.phone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {lead.website !== "N/A" ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white flex items-center gap-2 transition-all text-sm">
                            <Globe className="w-3 h-3 text-accent" />
                            <span>Visit Site</span>
                          </a>
                        ) : (
                          <span className="text-white/10 text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {lead.googleMapsUrl ? (
                          <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white flex items-center gap-2 transition-all text-sm">
                            <Map className="w-3 h-3 text-accent" />
                            <span>View on Maps</span>
                          </a>
                        ) : (
                          <span className="text-white/10 text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white/30 uppercase tracking-tighter">Rating</span>
                            <span className="text-sm font-bold text-orange-400">{lead.rating.toFixed(1)} ★</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white/30 uppercase tracking-tighter">Reviews</span>
                            <span className="text-sm font-bold text-white/60">{lead.reviewCount}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Target className="w-8 h-8 text-white/10" />
                        <p className="text-white/20 uppercase tracking-[0.25em] font-heading text-lg">
                          {loading ? "Scanning Maps Data..." : "Ready for Mission"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-10">
          <div className="flex items-center gap-4 text-[10px] font-medium text-white/20 uppercase tracking-widest">
            <span>© 2026 LeadPro Intel</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>Privacy Policy</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Systems Nominal</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
