"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

const demoAccounts = [
  ["Clinic Owner", "omar@petpals-vet.com"],
  ["Veterinarian", "sara@petpals-vet.com"],
  ["Receptionist", "sarah@petpals-vet.com"],
  ["Accountant", "tarek@petpals-vet.com"],
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md space-y-6 relative z-10">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-700 to-teal-500 text-white font-black text-3xl shadow-xl mb-2">Q</div>
          <div className="flex items-center justify-center gap-2"><h1 className="text-2xl font-black text-white">Qlinic v2</h1><Badge variant="brand" dot>SaaS Edition</Badge></div>
          <p className="text-xs text-slate-400">PetPals Veterinary Clinic Management System • Cairo, Egypt</p>
        </header>

        <section className="bg-white/10 dark:bg-dark-card/90 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl space-y-6 text-white">
          <div><h2 className="text-lg font-bold">Sign In to Your Workspace</h2><p className="text-xs text-slate-400 mt-1">Use your staff account credentials.</p></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-300">Staff Email Address
              <span className="relative block mt-1.5"><Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@petpals-vet.com" className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" /></span>
            </label>
            <label className="block text-xs font-semibold text-slate-300">Password
              <span className="relative block mt-1.5"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" /></span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</p>}
            <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {loading ? "Authenticating..." : "Sign In to Clinic"}
            </Button>
          </form>
          <div className="pt-4 border-t border-white/10 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Demo staff accounts</p>
            <div className="grid grid-cols-2 gap-2">{demoAccounts.map(([role, accountEmail]) => <button key={accountEmail} type="button" onClick={() => { setEmail(accountEmail); setPassword("Clinic@123"); setError(""); }} className="p-2.5 rounded-xl border border-white/10 bg-black/10 hover:bg-white/10 text-left"><span className="text-xs font-bold block">{role}</span><span className="text-[10px] text-slate-400">{accountEmail}</span></button>)}</div>
            <p className="text-center text-[11px] text-slate-400">Seeded demo password: <span className="font-semibold text-slate-300">Clinic@123</span></p>
          </div>
        </section>
        <footer className="flex items-center justify-center gap-2 text-slate-400 text-xs"><ShieldCheck className="w-4 h-4 text-teal-400" /><span>Password verified against the clinic database</span></footer>
      </div>
    </main>
  );
}
