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
  FileCheck
} from "lucide-react";
import { ingestDocument, IngestionResponse } from "../lib/api";

interface IngestionZoneProps {
  onIngestionComplete: (ingestion: IngestionResponse) => void;
  onGenerateBrief: (rawText: string, title: string) => void;
  isGenerating: boolean;
}

const SAMPLE_DOCS = [
  {
    title: "Enterprise AI Security Audit",
    content: `CONFIDENTIAL REPORT: Distributed AI Microservice Vulnerability Assessment
Date: September 2026
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
    title: "Healthcare Cloud Compliance Brief",
    content: `MEMORANDUM: HIPAA Compliance and Cross-Format Patient Data Security
Author: Dr. Robert Martinez (email: robert.martinez@medicare-network.com, direct line: 312-555-8821)
Patient Record Audited: SSN 987-65-4321, billing account 5424-9812-3456-7890.

Background:
Healthcare analysts must transform clinical trials and discharge summaries into hospital board presentations, video packages, and public communications. Sensitive patient identifiers must be stripped prior to processing.

Key Findings:
- Automated regex masking eliminated 100% of exposed emails, social security numbers, and contact details.
- Parallel synthesis generated an Executive Brief (DOCX) and Slide Deck (PPTX) with identical factual metrics.
- SHA-256 provenance chain ensures regulatory compliance with verifiable audit trails.`
  }
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
  const [activeTab, setActiveTab] = useState<"text" | "audit">("text");
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

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 items-center justify-center text-sm font-mono border border-blue-500/20 font-bold">
              1
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Multi-Modal Ingestion & Perimeter PII Redaction</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ingest contracts, slides, or documents. Sensitive PII is sanitized deterministically before model prompting.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Load Example:</span>
          {SAMPLE_DOCS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(s)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm font-medium"
            >
              {idx === 0 ? "⚡ Security Audit" : "🏥 Healthcare Memo"}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
            : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60"
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

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
            {loading ? <RefreshCw className="h-7 w-7 animate-spin text-blue-400" /> : <Upload className="h-7 w-7" />}
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {loading ? "Processing Document & Scrubbing PII..." : "Drag & Drop files here, or click to browse"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, Word (.docx), Markdown (.md), Plain Text (.txt), and Images (.png, .jpg via OCR)
            </p>
          </div>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {["PDF", "DOCX", "TXT", "MARKDOWN", "IMAGE OCR"].map(fmt => (
              <span key={fmt} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Ingestion & Redaction Audit Details */}
      {ingestion && (
        <div className="mt-6 space-y-4 pt-4 border-t border-slate-800">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{ingestion.filename}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {ingestion.file_type} • {wordCount} words • {ingestion.redacted_character_count} chars
                </span>
              </div>
            </div>

            {/* Badges & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>{ingestion.redaction_count} PII Redactions Applied</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIngestion(null);
                  setManualText("");
                  setError(null);
                }}
                className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                Clear / New Upload
              </button>
            </div>
          </div>

          {/* Redactions list */}
          {ingestion.redactions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingestion.redactions.map((r, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  <strong>{r.type}:</strong> {r.original_masked} ➔ <span className="text-slate-400">{r.replacement}</span>
                </span>
              ))}
            </div>
          )}

          {/* Editable Document Title & Text View */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white w-full sm:w-72 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <textarea
              rows={7}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
              placeholder="Extracted redacted text will appear here..."
            />
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onGenerateBrief(manualText, docTitle)}
              disabled={isGenerating || !manualText.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? "Synthesizing Canonical Brief via Gemini..." : "Synthesize Content Brief JSON"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
