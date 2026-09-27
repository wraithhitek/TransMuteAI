"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Cpu, Database, Activity, RefreshCw } from "lucide-react";
import { fetchSystemStatus } from "../lib/api";

interface NavbarProps {
  onOpenLedger: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLedger }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemStatus();
      setStatus(data);
    } catch (e) {
      console.warn("Backend offline or unreachable", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">TransmuteAI</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                GenAI v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Automated Content Synthesis & Provenance</p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-300">
              Provider: <strong className="text-blue-400 font-mono capitalize">{status?.llm_provider || "Gemini"}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">
              Mode: <strong className="text-purple-400 font-mono capitalize">{status?.execution_mode || "Direct"}</strong>
            </span>
          </div>

          {/* Blockchain Ledger Button */}
          <button
            onClick={onOpenLedger}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-medium transition-all shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Blockchain Ledger</span>
            {status?.ledger_blocks !== undefined && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 font-mono">
                {status.ledger_blocks} Blocks
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={loadStatus}
            disabled={loading}
            title="Refresh status"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
