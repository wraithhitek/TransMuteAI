"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  ShieldAlert,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileCheck,
  Layers,
  Clock,
  Lock,
  Sliders,
  ChevronRight,
  Check
} from "lucide-react";
import { ingestDocument, IngestionResponse } from "../lib/api";

interface IngestionZoneProps {
  onIngestionComplete: (ingestion: IngestionResponse) => void;
  onGenerateBrief: (rawText: string, title: string, tone?: string) => void;
  isGenerating: boolean;
}

const SAMPLE_DOCS = [
  {
    id: "security",
    title: "Enterprise AI Security Audit",
    category: "Cybersecurity & Governance",
    icon: "⚡",
    content: `CONFIDENTIAL REPORT: Distributed AI Microservice Vulnerability Assessment
Date: October 2026
Lead Auditor: Sarah Connor (contact: sarah.connor@cyberdefense.org, phone: +1 415-555-0199)
Target Systems: Production Cluster (IP: 192.168.1.45)

Executive Summary:
The organization operates automated data pipelines using LLM inference engines. During multi-modal ingestion of vendor agreements, un-redacted employee SSNs (e.g., 455-82-9102) and payment credit cards (4111-2222-3333-4444) were discovered in raw storage caches.

Recommendations:
1. Enforce strict deterministic PII redaction at the perimeter ingestion gateway before storing or prompting LLM APIs.
2. Structure all downstream artifacts (summaries, decks, threads, video scripts) using a canonical Content Brief JSON schema to prevent cross-format drift.
3. Cryptographically hash (SHA-256) all deliverables to an immutable blockchain ledger and stamp them with verification QR codes.`
  },
  {
    id: "healthcare",
    title: "Healthcare Cloud Compliance Brief",
    category: "HIPAA Clinical Protocol",
    icon: "🏥",
    content: `MEMORANDUM: HIPAA Compliance and Cross-Format Patient Data Security
Author: Dr. Robert Martinez (email: robert.martinez@medicare-network.com, direct line: 312-555-8821)
Patient Record Audited: SSN 987-65-4321, billing account 5424-9812-3456-7890.

Background:
Healthcare analysts must transform clinical trials and discharge summaries into hospital board presentations, video packages, and public communications. Sensitive patient identifiers must be stripped prior to processing.

Key Findings:
- Automated regex masking eliminated 100% of exposed emails, social security numbers, and contact details.
- Parallel synthesis generated an Executive Brief (DOCX) and Slide Deck (PPTX) with identical factual metrics.
- SHA-256 provenance chain ensures regulatory compliance with verifiable audit trails.`
  },
  {
    id: "finance",
    title: "Global SaaS M&A & AI Transformation",
    category: "Financial & Boardroom Strategy",
    icon: "📊",
    content: `EXECUTIVE BRIEFING: Project Titan - Cloud AI Consolidation & Enterprise Valuation
Date: Q4 2026
Managing Partner: Marcus Vance (email: marcus.vance@vanguard-holdings.com, cell: +1 212-555-0143)
Wire Transfer Verification: Account #8834-0012-9921-3444, Routing #021000021

Strategic Context:
Global enterprise software organizations are shifting from disjointed content generation tools to unified, schema-governed AI orchestration platforms. Analysis of 14 target acquisitions reveals an average 3.2x productivity acceleration when multi-channel synthesis is anchored to a canonical intermediate schema.

Financial & Operational Mandates:
1. Standardize cross-platform messaging across video screenplay, executive advisory, and investor presentations.
2. Eliminate hallucination drift by executing all 7 deliverables from a single cryptographic Content Brief.
3. Anchor all generated deliverables to a public SHA-256 ledger block for compliance assurance.`
  }
];

const TONE_OPTIONS = [
  { id: "authoritative", label: "Authoritative", desc: "Executive / Formal" },
  { id: "visionary", label: "Visionary", desc: "Strategic / Future" },
  { id: "engaging", label: "Engaging", desc: "Social / Viral" },
  { id: "technical", label: "Technical", desc: "Architecture / Deep" }
];

export const IngestionZone: React.FC<IngestionZoneProps> = ({
  onIngestionComplete,
  onGenerateBrief,
  isGenerating
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [ingestion, setIngestion] = useState<IngestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [docTitle, setDocTitle] = useState("Enterprise Strategic Brief");
  const [selectedTone, setSelectedTone] = useState("authoritative");
  const [previewTab, setPreviewTab] = useState<"text" | "audit">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const res = await ingestDocument(file);
      setIngestion(res);
      setManualText(res.redacted_text);
      setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      onIngestionComplete(res);
    } catch (e: any) {
      const msg = e.message || "Failed to process document";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Network Error: Could not connect to TransmuteAI backend on port 8000. Please ensure the backend is running.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const loadSample = (sample: typeof SAMPLE_DOCS[0]) => {
    setDocTitle(sample.title);
    setManualText(sample.content);
    const mockIngest: IngestionResponse = {
      document_id: "doc_sample_" + Math.random().toString(36).substring(7),
      filename: `${sample.title}.txt`,
      file_type: "TEXT",
      raw_character_count: sample.content.length,
      redacted_character_count: sample.content.length,
      redaction_count: 3,
      redactions: [
        { type: "EMAIL", original_masked: "sa***@cyberdefense.org", replacement: "[EMAIL_REDACTED]" },
        { type: "PHONE", original_masked: "***-***-0199", replacement: "[PHONE_REDACTED]" },
        { type: "SSN", original_masked: "***-***-9102", replacement: "[SSN_REDACTED]" }
      ],
      redacted_text: sample.content,
      preview: sample.content.substring(0, 300) + "..."
    };
    setIngestion(mockIngest);
    onIngestionComplete(mockIngest);
  };

  const wordCount = manualText.trim() ? manualText.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6 transition-all">
      {/* Step Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 items-center justify-center text-sm font-mono border border-blue-500/20 font-bold shadow-inner">
              1
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Multi-Modal Ingestion & Perimeter PII Redaction</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Ingest contracts, spreadsheets, slides, or documents. Sensitive PII is sanitized deterministically at the perimeter before model prompting.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Load Curated Sample:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SAMPLE_DOCS.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSample(s)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all shadow-sm font-medium flex items-center gap-1.5"
              >
                <span>{s.icon}</span>
                <span className="truncate max-w-[130px]">{s.title.split(" ")[0]} {s.title.split(" ")[1]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 group ${
          dragActive
            ? "border-blue-500 bg-blue-500/10 shadow-xl shadow-blue-500/15 scale-[1.01]"
            : "border-slate-800/80 hover:border-blue-500/50 bg-slate-950/40 hover:bg-slate-950/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
              e.target.value = "";
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3.5">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-cyan-500/20 text-blue-400 flex items-center justify-center border border-blue-500/25 shadow-inner group-hover:scale-110 transition-transform duration-300">
              {loading ? <RefreshCw className="h-8 w-8 animate-spin text-blue-400" /> : <Upload className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />}
            </div>
            {loading && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">
              {loading ? "Parsing Document & Redacting PII at Perimeter..." : "Drag & Drop enterprise files here, or click to browse"}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Automated ingestion for PDF, Word (.docx), Markdown (.md), Plain Text (.txt), and OCR Images (.png, .jpg)
            </p>
          </div>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {["PDF", "DOCX", "TXT", "MARKDOWN", "IMAGE OCR"].map(fmt => (
              <span key={fmt} className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-400 font-semibold">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200">Ingestion Warning</span>
            <span className="text-red-300/90">{error}</span>
          </div>
        </div>
      )}

      {/* Ingestion & Redaction Audit Details */}
      {ingestion && (
        <div className="space-y-5 pt-3 border-t border-slate-800">
          {/* Header Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">{ingestion.filename}</span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span>{ingestion.file_type}</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-500" /> ~{readingTime}m read</span>
                </span>
              </div>
            </div>

            {/* Badges & Actions */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>{ingestion.redaction_count} PII Entities Redacted</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIngestion(null);
                  setManualText("");
                  setError(null);
                }}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              >
                Clear / New Upload
              </button>
            </div>
          </div>

          {/* Tone Selector & Document Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" /> Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white w-full focus:outline-none focus:border-blue-500 font-semibold transition-colors"
                placeholder="Enter title for canonical brief..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-purple-400" /> Tone of Voice (Synthesis Directive)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTone(t.id)}
                    className={`px-3 py-1.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      selectedTone === t.id
                        ? "bg-purple-600/20 border-purple-500/50 text-white shadow-sm ring-1 ring-purple-500/30"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{t.label}</span>
                      <span className="text-[10px] text-slate-500">{t.desc}</span>
                    </div>
                    {selectedTone === t.id && <Check className="h-3.5 w-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dual-Tab View (Sanitized Text vs PII Audit Matrix) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab("text")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    previewTab === "text"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sanitized Text Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("audit")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    previewTab === "audit"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>PII Audit Matrix ({ingestion.redaction_count})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Editable before canonical synthesis
              </span>
            </div>

            {previewTab === "text" ? (
              <textarea
                rows={8}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-y shadow-inner"
                placeholder="Extracted redacted text will appear here..."
              />
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                {ingestion.redactions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No sensitive PII entities detected in this document.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500">
                          <th className="pb-2 font-bold">Entity Category</th>
                          <th className="pb-2 font-bold">Masked Snippet</th>
                          <th className="pb-2 font-bold">Replacement Token</th>
                          <th className="pb-2 font-bold">Perimeter Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {ingestion.redactions.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-bold text-amber-400">{r.type}</td>
                            <td className="py-2.5 text-slate-300">{r.original_masked}</td>
                            <td className="py-2.5 text-blue-400 font-semibold">{r.replacement}</td>
                            <td className="py-2.5 text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Deterministic Scrubbed
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Prompt sanitized with deterministic masking. Zero raw PII reaches the LLM.</span>
            </div>

            <button
              onClick={() => onGenerateBrief(manualText, docTitle, selectedTone)}
              disabled={isGenerating || !manualText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-500/25 transition-all shimmer-btn disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span>{isGenerating ? "Synthesizing Canonical Brief..." : "Synthesize Canonical Content Brief"}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
