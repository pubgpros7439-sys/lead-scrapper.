"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Shield, Loader2, Lock, ArrowRight, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error("Invalid access key");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen selection:bg-accent selection:text-black bg-[#1A1918] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-12 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(251,175,0,0.4)] mx-auto mb-6"
          >
            <Zap className="text-black w-10 h-10 fill-current" />
          </motion.div>
          <h1 className="text-4xl font-heading font-extrabold tracking-tighter uppercase italic mb-2">LeadPro</h1>
          <p className="text-white/40 text-sm font-light tracking-[0.1em] uppercase">Access Terminal Authorization</p>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 shadow-2xl backdrop-blur-3xl">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white">Security Check</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/30">Enter access key to decrypt</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold ml-1">Access Key</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/input:text-accent transition-colors w-4 h-4" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all text-sm font-mono tracking-widest"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-[11px] uppercase tracking-widest font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-accent text-black font-heading font-bold text-lg py-4 rounded-2xl transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Decrypt Data</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <footer className="mt-8 text-center sm:flex sm:items-center sm:justify-between px-4">
          <div className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">
            Shield Protocol v1.4.2
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 sm:mt-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider italic">Secure Environment</span>
          </div>
        </footer>
      </motion.div>
    </main>
  );
}
