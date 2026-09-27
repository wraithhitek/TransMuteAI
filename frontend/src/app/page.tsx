"use client";

import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { IngestionZone } from "../components/IngestionZone";
import { ContentBriefInspector } from "../components/ContentBriefInspector";
import { ArtifactViewer } from "../components/ArtifactViewer";
import { ProvenanceModal } from "../components/ProvenanceModal";
import {
  FileText,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Cpu,
  ArrowRight
} from "lucide-react";
import {
  IngestionResponse,
  ContentBriefJSON,
  TaskStatusResponse,
  generateBrief,
  triggerTransformation,
  pollTaskStatus
} from "../lib/api";

export default function Home() {
  const [ingestion, setIngestion] = useState<IngestionResponse | null>(null);
  const [brief, setBrief] = useState<ContentBriefJSON | null>(null);
  const [task, setTask] = useState<TaskStatusResponse | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Determine current active step
  const currentStep = task?.status === "COMPLETED" ? 4 : task ? 3 : brief ? 2 : 1;

  // Step 1: Document Ingested
  const handleIngestionComplete = (data: IngestionResponse) => {
    setIngestion(data);
    setBrief(null);
    setTask(null);
  };

  // Step 2: Generate Content Brief JSON
  const handleGenerateBrief = async (rawText: string, title: string) => {
    try {
      setIsGeneratingBrief(true);
      const res = await generateBrief(rawText, title);
      setBrief(res);
      setTask(null);
    } catch (e: any) {
      alert("Error generating brief: " + e.message);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Step 3: Trigger Multi-Format Transformation
  const handleTransform = async (briefData: ContentBriefJSON, formats: string[]) => {
    try {
      setIsTransforming(true);
      const initialTask = await triggerTransformation(briefData, formats);
      setTask(initialTask);

      // Poll task status until complete or failed
      const interval = setInterval(async () => {
        try {
          const status = await pollTaskStatus(initialTask.task_id);
          setTask(status);

          if (status.status === "COMPLETED" || status.status === "FAILED") {
            clearInterval(interval);
            setIsTransforming(false);
          }
        } catch (err) {
          clearInterval(interval);
          setIsTransforming(false);
        }
      }, 1000);
    } catch (e: any) {
      alert("Error initiating transformation: " + e.message);
      setIsTransforming(false);
    }
  };

  const STEPS = [
    { num: 1, label: "Ingest & Redact PII", icon: FileText, desc: "PDF, DOCX & OCR" },
    { num: 2, label: "Canonical Brief JSON", icon: Sparkles, desc: "Single Source of Truth" },
    { num: 3, label: "Parallel 7-in-1 Synthesis", icon: Zap, desc: "Synchronized Formats" },
    { num: 4, label: "Blockchain Provenance", icon: ShieldCheck, desc: "SHA-256 Ledger & QR" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh-radial flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar onOpenLedger={() => setIsLedgerOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold shadow-sm backdrop-blur-sm">
            <Cpu className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            <span>Google Gemini 2.5 Flash • Canonical Schema intermediate • Cryptographic Provenance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Automated Content Transformation <br />
            <span className="gradient-text-hero">
              With Guaranteed Semantic Parity
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            Ingest multi-modal enterprise documents, scrub sensitive PII deterministically, compile into a canonical 
            <strong> Content Brief JSON</strong>, and synthesize <strong>7 synchronized human-grade deliverables</strong> anchored to an immutable blockchain ledger.
          </p>

          {/* Quick Metrics Ticker */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>100% Cross-Format Factual Parity</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>Perimeter PII Redaction</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>7 Specialized Output Formats</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>SHA-256 Chained Ledger</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Stepper Bar */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-lg">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  isCurrent
                    ? "bg-blue-600/15 border-blue-500/50 shadow-md ring-1 ring-blue-500/30"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-950/40 border-slate-800/60 opacity-60"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : isCurrent
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{s.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workflow Stages */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step 1: Ingestion & PII Redaction Studio */}
        <IngestionZone
          onIngestionComplete={handleIngestionComplete}
          onGenerateBrief={handleGenerateBrief}
          isGenerating={isGeneratingBrief}
        />

        {/* Step 2: Canonical Content Brief JSON Inspector */}
        {brief && (
          <ContentBriefInspector
            brief={brief}
            onTransform={handleTransform}
            isTransforming={isTransforming}
          />
        )}

        {/* Step 3: Multi-Format Deliverables Hub & Blockchain Provenance */}
        {task && (
          <ArtifactViewer
            task={task}
            onOpenLedger={() => setIsLedgerOpen(true)}
          />
        )}
      </main>

      {/* Blockchain Ledger Explorer Modal */}
      <ProvenanceModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>TransmuteAI • Scalable Gen AI Platform for Automated Content Transformation • Verified Cryptographic Provenance</p>
      </footer>
    </div>
  );
}
