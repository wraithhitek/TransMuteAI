"use client";

import React, { useState } from "react";
import {
  Download,
  CheckCircle,
  FileText,
  Presentation,
  QrCode,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Video,
  Share2,
  FileCheck,
  PieChart,
  Twitter,
  FileCode,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
  Layers,
  Clock,
  AlertTriangle
} from "lucide-react";
import { TaskStatusResponse, API_BASE_URL } from "../lib/api";

interface ArtifactViewerProps {
  task: TaskStatusResponse;
  onOpenLedger: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ task, onOpenLedger }) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  const blockHash = task.ledger_entry?.block_hash || "";
  const briefId = task.ledger_entry?.brief_id || "";

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const togglePreview = (key: string) => {
    setExpandedPreview(prev => (prev === key ? null : key));
  };

  const DELIVERABLES_CONFIG = [
    {
      key: "video",
      title: "Video Production Package",
      extensionBadge: "DOCX + SRT",
      desc: "Complete video production screenplay including scene descriptions, camera framing, audio cues, narration, and broadcast SRT subtitles.",
      features: ["🎬 Scene-by-scene storyboard", "🎙️ Narration teleprompter", "⏱️ Timecode synchronization", "📝 SubRip (.SRT) subtitles"],
      icon: Video,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      hoverBorder: "hover:border-purple-500/60",
      downloadEndpoint: "video",
      formatLabel: "Download Video Package (DOCX)",
      extraDownload: {
        endpoint: "video_subtitles",
        label: "Download Subtitles (.SRT)"
      }
    },
    {
      key: "linkedin",
      title: "Professional LinkedIn Post",
      extensionBadge: "MARKDOWN",
      desc: "Curiosity-driven hook, whitespace-formatted body, bullet insights, compelling call to action, and strategic hashtags.",
      features: ["⚡ High-engagement hook", "📊 Executive bullet insights", "🎯 Action-oriented CTA", "🏷️ Topic hashtags"],
      icon: Share2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      hoverBorder: "hover:border-blue-500/60",
      downloadEndpoint: "linkedin",
      formatLabel: "Download LinkedIn Post (MD)"
    },
    {
      key: "twitter",
      title: "Twitter/X Viral Thread",
      extensionBadge: "MARKDOWN",
      desc: "Platform-optimized numbered thread (1/N) structured with bold hooks, value takeaways, and engagement CTA.",
      features: ["🧵 1/N Tweet sequence", "🚀 High-velocity hook", "💡 Micro-takeaways", "💬 Conversion CTA"],
      icon: Twitter,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/30",
      hoverBorder: "hover:border-sky-500/60",
      downloadEndpoint: "twitter",
      formatLabel: "Download Twitter Thread (MD)"
    },
    {
      key: "advisory",
      title: "Strategic Advisory Report",
      extensionBadge: "DOCX",
      desc: "McKinsey/Bain-style executive memo with strategic risk assessment matrix (severity/mitigation) and phased 30-60-90 day roadmap.",
      features: ["📋 Executive mandate statement", "⚠️ Risk assessment matrix", "📅 30-60-90 day roadmap", "⚖️ Governance framework"],
      icon: FileCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      hoverBorder: "hover:border-emerald-500/60",
      downloadEndpoint: "advisory",
      formatLabel: "Download Advisory Memo (DOCX)"
    },
    {
      key: "infographic",
      title: "Infographic Visual Blueprint",
      extensionBadge: "DOCX + HTML",
      desc: "Narrative storytelling arc, brand color palette hex codes, 4 hero stat quadrants, and visual layout directives.",
      features: ["🎨 Hex color palette", "📈 4 Hero metric quadrants", "📐 Layout directives", "🌐 Interactive HTML preview"],
      icon: PieChart,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      hoverBorder: "hover:border-cyan-500/60",
      downloadEndpoint: "infographic",
      formatLabel: "Download Blueprint (DOCX)",
      extraDownload: {
        endpoint: "infographic_preview",
        label: "Open Interactive HTML Preview"
      }
    },
    {
      key: "executive_summary",
      title: "Executive Briefing",
      extensionBadge: "DOCX",
      desc: "Concise briefing document with high-impact headline, strategic context, key analytical findings, and embedded verification QR code.",
      features: ["📰 Executive headline", "🔍 Context & problem statement", "📊 Analytical findings checklist", "🛡️ Embedded verification QR"],
      icon: Layers,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      hoverBorder: "hover:border-indigo-500/60",
      downloadEndpoint: "executive_summary",
      formatLabel: "Download Executive Brief (DOCX)"
    },
    {
      key: "presentation",
      title: "Presentation Slide Deck",
      extensionBadge: "PPTX (16:9)",
      desc: "Widescreen 16:9 PowerPoint presentation featuring dark executive theme, bullet hierarchy cards, and speaker notes.",
      features: ["🖥️ 16:9 Widescreen slides", "📑 Structured takeaway bullets", "🎙️ Verbatim speaker notes", "🎨 High-contrast dark styling"],
      icon: Presentation,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      hoverBorder: "hover:border-orange-500/60",
      downloadEndpoint: "presentation",
      formatLabel: "Download Slide Deck (PPTX)"
    }
  ];

  // Filter deliverables present in task artifacts
  const generatedArtifacts = DELIVERABLES_CONFIG.filter(
    d => task.artifacts && (task.artifacts[d.key] || task.artifacts[d.downloadEndpoint])
  );

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 items-center justify-center text-sm font-mono border border-emerald-500/20 font-bold shadow-inner">
              3
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Generated Deliverables & Cryptographic Provenance</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            All requested deliverables generated simultaneously from the canonical brief with <strong>100% semantic alignment</strong> and sealed on the blockchain ledger.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {task.status === "COMPLETED" ? (
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Provenance Sealed ({generatedArtifacts.length} Deliverables)</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold shadow-sm">
              <span className="animate-spin h-3.5 w-3.5 border-2 border-blue-400 border-t-transparent rounded-full" />
              <span>Synthesizing ({task.progress}%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar (during task processing) */}
      {task.status === "PROCESSING" && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
              <span>{task.message || "Generating deliverables in parallel..."}</span>
            </span>
            <span className="font-mono font-bold text-blue-400">{task.progress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Generated Artifacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {generatedArtifacts.map((d) => {
          const Icon = d.icon;
          const isExpanded = expandedPreview === d.key;

          return (
            <div
              key={d.key}
              className={`p-5 rounded-2xl bg-slate-950/80 border ${d.border} ${d.hoverBorder} flex flex-col justify-between transition-all shadow-md hover:shadow-xl`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className={`h-11 w-11 rounded-xl ${d.bg} ${d.color} flex items-center justify-center border border-white/5 shadow-inner`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
                    {d.extensionBadge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{d.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.desc}</p>
                </div>

                {/* Feature Checklist */}
                <div className="pt-2 border-t border-slate-900 space-y-1">
                  {d.features.map((feat, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Area */}
              <div className="pt-4 mt-3 border-t border-slate-800/80 space-y-2">
                <a
                  href={`${API_BASE_URL}/api/artifacts/${briefId}/download/${d.downloadEndpoint}`}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/40 hover:to-indigo-600/40 text-blue-200 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{d.formatLabel}</span>
                </a>

                {d.extraDownload && (
                  <a
                    href={`${API_BASE_URL}/api/artifacts/${briefId}/download/${d.extraDownload.endpoint}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-colors"
                  >
                    {d.extraDownload.endpoint === "infographic_preview" ? (
                      <ExternalLink className="h-3 w-3 text-cyan-400" />
                    ) : (
                      <Download className="h-3 w-3 text-purple-400" />
                    )}
                    <span>{d.extraDownload.label}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cryptographic Ledger & Verification Block */}
      {task.ledger_entry && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Cryptographic Ledger Block #{task.ledger_entry.index}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    Immutable & Sealed
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Every artifact's SHA-256 hash is sealed on the chain. Any byte modification invalidates verification.
                </p>
              </div>
            </div>

            {/* Block Hash details */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-w-xl">
                <span className="text-slate-500 shrink-0 font-bold">SHA-256 Hash:</span>
                <span className="truncate text-emerald-400">{blockHash}</span>
                <button
                  onClick={() => copyHash(blockHash)}
                  className="text-slate-400 hover:text-white shrink-0 ml-1 p-1 hover:bg-slate-800 rounded transition-colors"
                  title="Copy SHA-256 Hash"
                >
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={onOpenLedger}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                >
                  <span>Open Blockchain Explorer</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>

                <a
                  href={`${API_BASE_URL}/api/artifacts/${briefId}/download/qr`}
                  download="transmuteai_verification_qr.png"
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download QR Verification Badge</span>
                </a>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-950 shadow-xl shrink-0 ring-4 ring-slate-800/60">
            <img
              src={`${API_BASE_URL}/api/artifacts/${briefId}/download/qr`}
              alt="Cryptographic Verification QR Code"
              className="h-28 w-28 object-contain"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mt-2 flex items-center gap-1">
              <QrCode className="h-3 w-3" /> Scan to Verify
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
