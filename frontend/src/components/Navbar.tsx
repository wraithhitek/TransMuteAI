"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Cpu, Database, Activity, RefreshCw, ExternalLink, Sparkles, Github, BookOpen } from "lucide-react";
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

  const isOnline = !!status;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Cpu className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                Transmute<span className="gradient-text-hero">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                GenAI v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Automated Content Synthesis • Cryptographic Provenance</p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Status Badge */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[11px] font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-400" />
                <span>Model:</span>
                <strong className="text-white font-semibold capitalize font-mono">
                  {status?.models?.gemini || status?.llm_provider || "Gemini 2.5 Flash"}
                </strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-medium">
                <span>Mode:</span>{" "}
                <strong className="text-purple-400 font-semibold uppercase text-[10px] tracking-wide font-mono">
                  {status?.execution_mode || "Direct"}
                </strong>
              </span>
            </div>
          </div>

          {/* Blockchain Ledger Button */}
          <button
            onClick={onOpenLedger}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all shadow-sm group"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Ledger Explorer</span>
            {status?.ledger_blocks !== undefined ? (
              <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                {status.ledger_blocks} Blocks
              </span>
            ) : (
              <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-slate-800 text-slate-400 font-mono">
                Active
              </span>
            )}
          </button>

          {/* GitHub Repo Button */}
          <a
            href="https://github.com/wraithhitek/TransMuteAI"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
            title="View Source on GitHub"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>

          {/* Refresh */}
          <button
            onClick={loadStatus}
            disabled={loading}
            title="Refresh backend status"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
