"use client";

import React, { useState } from "react";
import {
  FileCode,
  Layers,
  Presentation,
  MessageSquare,
  Check,
  Copy,
  Zap,
  Video,
  Share2,
  FileCheck,
  PieChart,
  Twitter,
  Clock,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  Volume2,
  Palette,
  Calendar,
  AlertTriangle,
  Eye,
  Sliders,
  ExternalLink
} from "lucide-react";
import { ContentBriefJSON } from "../lib/api";

interface ContentBriefInspectorProps {
  brief: ContentBriefJSON;
  onTransform: (brief: ContentBriefJSON, formats: string[]) => void;
  isTransforming: boolean;
}

export const ContentBriefInspector: React.FC<ContentBriefInspectorProps> = ({
  brief,
  onTransform,
  isTransforming
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "linkedin" | "twitter" | "advisory" | "infographic" | "exec" | "pptx" | "raw">("video");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "video",
    "linkedin",
    "twitter",
    "advisory",
    "infographic",
    "executive_summary",
    "presentation"
  ]);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [copiedThread, setCopiedThread] = useState(false);
  const [copiedSrt, setCopiedSrt] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const toggleFormat = (fmt: string) => {
    setSelectedFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    );
  };

  const selectAll = () => {
    setSelectedFormats(["video", "linkedin", "twitter", "advisory", "infographic", "executive_summary", "presentation"]);
  };

  const deselectAll = () => {
    setSelectedFormats([]);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const copyLinkedIn = () => {
    if (!brief.linkedin_post) return;
    const post = `${brief.linkedin_post.hook}\n\n${brief.linkedin_post.body}\n\n${(brief.linkedin_post.bullet_insights || []).map(b => `• ${b}`).join("\n")}\n\n${brief.linkedin_post.call_to_action}\n\n${(brief.linkedin_post.hashtags || []).map(h => `#${h.replace(/^#/, "")}`).join(" ")}`;
    navigator.clipboard.writeText(post);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2000);
  };

  const copyTwitter = () => {
    if (!brief.social_media_thread) return;
    const thread = brief.social_media_thread.map(t => `${t.post_number}/${brief.social_media_thread.length}\n${t.content}\n${(t.hashtags || []).map(h => `#${h.replace(/^#/, "")}`).join(" ")}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(thread);
    setCopiedThread(true);
    setTimeout(() => setCopiedThread(false), 2000);
  };

  const copySrt = () => {
    if (!brief.video_package?.subtitles_srt) return;
    navigator.clipboard.writeText(brief.video_package.subtitles_srt);
    setCopiedSrt(true);
    setTimeout(() => setCopiedSrt(false), 2000);
  };

  const copyHexCode = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const FORMAT_SPECIFICATIONS = [
    {
      id: "video",
      title: "Video Package",
      subtitle: "Complete Production Package",
      badge: "Script • Storyboard • Narration • Subtitles • Visuals",
      icon: Video,
      color: "text-purple-400",
      accentBorder: "border-purple-500/40",
      accentBg: "bg-purple-500/10",
      tabKey: "video" as const
    },
    {
      id: "linkedin",
      title: "LinkedIn Post",
      subtitle: "Professional Thought Leadership",
      badge: "Curiosity Hook • Bullets • CTA • Hashtags",
      icon: Share2,
      color: "text-blue-400",
      accentBorder: "border-blue-500/40",
      accentBg: "bg-blue-500/10",
      tabKey: "linkedin" as const
    },
    {
      id: "twitter",
      title: "Twitter/X Post",
      subtitle: "Platform-Optimized Viral Thread",
      badge: "1/N Thread • Viral Hook • Takeaways • CTA",
      icon: Twitter,
      color: "text-sky-400",
      accentBorder: "border-sky-500/40",
      accentBg: "bg-sky-500/10",
      tabKey: "twitter" as const
    },
    {
      id: "advisory",
      title: "Advisory Document",
      subtitle: "Structured Strategic Memo",
      badge: "Mandate • Risk Matrix • 30-60-90d Roadmap",
      icon: FileCheck,
      color: "text-emerald-400",
      accentBorder: "border-emerald-500/40",
      accentBg: "bg-emerald-500/10",
      tabKey: "advisory" as const
    },
    {
      id: "infographic",
      title: "Infographic",
      subtitle: "Visual Blueprint & Messaging",
      badge: "Narrative Flow • Palette • 4 Hero Stats • HTML",
      icon: PieChart,
      color: "text-cyan-400",
      accentBorder: "border-cyan-500/40",
      accentBg: "bg-cyan-500/10",
      tabKey: "infographic" as const
    },
    {
      id: "executive_summary",
      title: "Executive Summary",
      subtitle: "Concise Executive Briefing",
      badge: "Headline • Context • Findings • Directives",
      icon: Layers,
      color: "text-indigo-400",
      accentBorder: "border-indigo-500/40",
      accentBg: "bg-indigo-500/10",
      tabKey: "exec" as const
    },
    {
      id: "presentation",
      title: "Presentation",
      subtitle: "Slide Deck & Speaker Notes",
      badge: "16:9 Widescreen • Bullets • Speaker Notes",
      icon: Presentation,
      color: "text-orange-400",
      accentBorder: "border-orange-500/40",
      accentBg: "bg-orange-500/10",
      tabKey: "pptx" as const
    }
  ];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 items-center justify-center text-sm font-mono border border-indigo-500/20 font-bold shadow-inner">
              2
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Canonical Content Brief JSON (Single Source of Truth)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Standardized intermediate representation synthesized from sanitized input. Ensures <strong>100% semantic consistency</strong> across all downstream media channels.
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 font-mono border border-slate-800">
            ID: {brief.brief_id.substring(0, 16)}...
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20 capitalize">
            Tone: {brief.tone}
          </span>
          {brief.entities_extracted && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 font-mono border border-purple-500/20">
              {brief.entities_extracted.length} Entities Tracked
            </span>
          )}
          <button
            onClick={copyJson}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm font-medium"
          >
            {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copiedJson ? "Copied JSON" : "Copy Brief JSON"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Tabs Bar */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preview Canonical Structure:</span>
        </div>
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: "video", label: "Video Package", icon: Video, color: "text-purple-400", count: brief.video_package?.storyboard?.length ? `${brief.video_package.storyboard.length} Scenes` : null },
            { id: "linkedin", label: "LinkedIn Post", icon: Share2, color: "text-blue-400", count: "Post Ready" },
            { id: "twitter", label: "Twitter/X Thread", icon: Twitter, color: "text-sky-400", count: brief.social_media_thread?.length ? `${brief.social_media_thread.length} Tweets` : null },
            { id: "advisory", label: "Strategic Advisory", icon: FileCheck, color: "text-emerald-400", count: brief.advisory_document?.risk_matrix?.length ? `${brief.advisory_document.risk_matrix.length} Risks` : null },
            { id: "infographic", label: "Infographic", icon: PieChart, color: "text-cyan-400", count: brief.infographic?.sections?.length ? `${brief.infographic.sections.length} Stats` : null },
            { id: "exec", label: "Executive Summary", icon: Layers, color: "text-indigo-400", count: "Briefing" },
            { id: "pptx", label: "Presentation Deck", icon: Presentation, color: "text-orange-400", count: brief.presentation_outline?.length ? `${brief.presentation_outline.length} Slides` : null },
            { id: "raw", label: "Raw JSON", icon: FileCode, color: "text-slate-400", count: null },
          ].map((tab: any) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-600/20 text-white border border-blue-500/40 shadow-md ring-1 ring-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? tab.color : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? "bg-blue-500/30 text-blue-200" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENTS */}
      <div className="min-h-[380px]">
        {/* 1. Video Package */}
        {activeTab === "video" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Video className="h-4 w-4" /> Concept Treatment & Narrative Flow
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    Target Duration: {brief.video_package?.target_duration || "60-90s"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {brief.video_package?.concept || "Comprehensive broadcast screenplay designed for maximum audience retention with synced subtitles and visual directives."}
                </p>
              </div>

              {brief.video_package?.subtitles_srt && (
                <button
                  onClick={copySrt}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium shrink-0 transition-colors"
                >
                  {copiedSrt ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSrt ? "SRT Copied" : "Copy Subtitles (.SRT)"}</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Scene-by-Scene Storyboard & Teleprompter</h4>
                <span className="text-[11px] text-slate-500 font-mono">{brief.video_package?.storyboard?.length || 0} Scenes Total</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {brief.video_package?.storyboard?.map((scene) => (
                  <div key={scene.scene_number} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold font-mono text-[11px]">
                          #{scene.scene_number}
                        </span>
                        <span className="font-bold text-white">Scene {scene.scene_number}</span>
                      </div>
                      <span className="text-purple-300 font-mono text-xs flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                        <Clock className="h-3.5 w-3.5 text-purple-400" /> {scene.timestamp}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Visual Framing */}
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-purple-400 uppercase font-bold flex items-center gap-1">
                            🎥 Visual & Camera Direction
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{scene.visual_description}</p>
                        {scene.b_roll_recommendations && scene.b_roll_recommendations.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium mr-1">B-Roll:</span>
                            {scene.b_roll_recommendations.map((b, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                                🎞️ {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Narration Script */}
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                            🎙️ Narration Script (Voiceover)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Volume2 className="h-3 w-3 text-emerald-400" /> {scene.narration.split(" ").length} words
                          </span>
                        </div>
                        <p className="text-slate-200 italic font-serif leading-relaxed text-sm bg-slate-950/60 p-2 rounded border border-slate-800/60">
                          "{scene.narration}"
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                          <strong className="text-purple-400">Audio / SFX Cue:</strong>
                          <span>{scene.audio_cues}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SubRip SRT Box */}
            {brief.video_package?.subtitles_srt && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5 text-purple-400" /> Broadcast SubRip Subtitles (.SRT Stream)
                  </span>
                  <button
                    onClick={copySrt}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                  >
                    {copiedSrt ? "Copied!" : "Copy Stream"}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-purple-300 overflow-x-auto max-h-36 p-3 rounded-lg bg-slate-900 border border-slate-800 leading-relaxed">
                  {brief.video_package.subtitles_srt}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 2. LinkedIn Post */}
        {activeTab === "linkedin" && (
          <div className="space-y-4">
            <div className="max-w-2xl mx-auto rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
              {/* LinkedIn Post Header */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-blue-500/20">
                    AI
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">Executive Thought Leader</h4>
                      <span className="text-[10px] text-blue-400 font-mono">✦ Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Enterprise AI Transformation Strategist • 1st</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">Just now • 🌐 Public</p>
                  </div>
                </div>

                <button
                  onClick={copyLinkedIn}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium transition-colors"
                >
                  {copiedPost ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPost ? "Copied" : "Copy Post"}</span>
                </button>
              </div>

              {/* LinkedIn Post Body */}
              <div className="p-5 text-xs text-slate-200 space-y-4 leading-relaxed font-sans">
                {/* Hook */}
                <div className="text-sm sm:text-base font-bold text-blue-200 border-l-2 border-blue-500 pl-3 py-0.5">
                  {brief.linkedin_post?.hook}
                </div>

                {/* Core Body */}
                <div className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {brief.linkedin_post?.body}
                </div>

                {/* Bullet Insights */}
                {brief.linkedin_post?.bullet_insights && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">Key Executive Takeaways</span>
                    <ul className="space-y-2">
                      {brief.linkedin_post.bullet_insights.map((b, i) => (
                        <li key={i} className="text-slate-200 flex items-start gap-2.5 text-xs">
                          <span className="h-5 w-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold">
                            ✓
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                <div className="font-semibold text-slate-100 pt-1 text-xs sm:text-sm">
                  {brief.linkedin_post?.call_to_action}
                </div>

                {/* Hashtags */}
                {brief.linkedin_post?.hashtags && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900">
                    {brief.linkedin_post.hashtags.map((t, i) => (
                      <span key={i} className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                        #{t.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Engagement Actions Mockup */}
              <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                    <ThumbsUp className="h-4 w-4" /> Like
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                    <MessageCircle className="h-4 w-4" /> Comment
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                    <Repeat2 className="h-4 w-4" /> Repost
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                    <Send className="h-4 w-4" /> Send
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Twitter / X Thread */}
        {activeTab === "twitter" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Viral Tweet Sequence</span>
              <button
                onClick={copyTwitter}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-medium transition-colors"
              >
                {copiedThread ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedThread ? "Copied" : "Copy Full Thread"}</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-4">
              {/* Vertical connector line */}
              <div className="absolute left-2.5 top-5 bottom-5 w-0.5 bg-slate-800" />

              {brief.social_media_thread?.map((post, idx) => (
                <div key={post.post_number} className="relative p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 hover:border-sky-500/40 transition-all">
                  {/* Thread Node Dot */}
                  <div className="absolute -left-[19px] top-5 h-3 w-3 rounded-full bg-sky-500 border-2 border-slate-950" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-sky-600/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                        𝕏
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white">TransmuteAI</span>
                          <span className="text-[10px] text-sky-400 font-mono">✦</span>
                        </div>
                        <span className="text-[10px] text-slate-500">@transmuteai</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {post.post_number}/{brief.social_media_thread.length}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pt-1 font-sans">{post.content}</p>

                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.hashtags.map((h, i) => (
                        <span key={i} className="text-[10px] text-sky-400 font-mono">#{h.replace(/^#/, "")}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Strategic Advisory */}
        {activeTab === "advisory" && (
          <div className="space-y-4">
            {/* Executive Mandate */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950/80 to-slate-950/80 border border-emerald-500/30 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Strategic Mandate
                </span>
                <span className="text-xs text-slate-400">Confidential Advisory Briefing</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
                {brief.advisory_document?.executive_mandate || brief.summary}
              </p>
            </div>

            {/* Strategic Risk Assessment Matrix */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" /> Strategic Risk Assessment Matrix
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Severity & Mitigation Roadmap</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                      <th className="pb-2.5 font-bold">Identified Risk Factor</th>
                      <th className="pb-2.5 font-bold">Severity</th>
                      <th className="pb-2.5 font-bold">Likelihood</th>
                      <th className="pb-2.5 font-bold">Actionable Mitigation Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {brief.advisory_document?.risk_matrix?.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-white max-w-[220px]">
                          {r.risk_factor}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.severity === "Critical"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : r.severity === "High"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-slate-400 font-mono text-[11px]">
                          {r.likelihood}
                        </td>
                        <td className="py-3 text-slate-300 text-[11px] leading-relaxed">
                          {r.mitigation_strategy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phased Roadmap */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-400" /> 30-60-90 Day Phased Implementation Roadmap
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Execution Milestones</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {brief.advisory_document?.phased_roadmap?.map((p, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {p.timeframe}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Phase {i + 1}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white pt-1">{p.phase}</h5>
                    <ul className="space-y-1.5 pt-1">
                      {p.actions.map((act, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                          <span className="text-emerald-400 font-bold shrink-0">▸</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Infographic */}
        {activeTab === "infographic" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-cyan-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold tracking-wider">
                  Visual Infographic Blueprint
                </span>
                <h4 className="text-sm font-bold text-white">{brief.infographic?.headline || brief.title}</h4>
                <p className="text-xs text-slate-400 max-w-xl">{brief.infographic?.narrative_flow}</p>
              </div>

              {/* Color Palette Swatches */}
              {brief.infographic?.color_palette && (
                <div className="space-y-1 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">Color Palette (Click to Copy):</span>
                  <div className="flex items-center gap-1.5">
                    {brief.infographic.color_palette.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => copyHexCode(c)}
                        title={`Click to copy ${c}`}
                        className="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-mono text-white border border-white/20 transition-transform hover:scale-105 active:scale-95 shadow-sm"
                        style={{ backgroundColor: c }}
                      >
                        {copiedHex === c ? "✓" : c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4 Quadrants Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {brief.infographic?.sections?.map((sec, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      {sec.section_title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Quadrant #{idx + 1}</span>
                  </div>
                  <div className="text-3xl font-black text-cyan-300 tracking-tight my-1">
                    {sec.key_stat}
                  </div>
                  <div className="text-[11px] text-slate-400 italic bg-slate-900 px-2.5 py-1 rounded border border-slate-800/80">
                    📐 Layout Directive: {sec.visual_layout_directive}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">{sec.supporting_text}</p>
                </div>
              ))}
            </div>

            {brief.infographic?.footer_callout && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                📌 Callout: {brief.infographic.footer_callout}
              </div>
            )}
          </div>
        )}

        {/* 6. Executive Summary */}
        {activeTab === "exec" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-indigo-500/25 space-y-2">
              <span className="text-[10px] text-indigo-400 uppercase font-mono font-bold tracking-wider">
                Executive Briefing
              </span>
              <h3 className="text-base font-bold text-white">{brief.executive_summary.headline}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{brief.executive_summary.context}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Key Analytical Findings
                </h4>
                <ul className="space-y-2">
                  {brief.executive_summary.key_findings.map((finding, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4" /> Strategic Recommendations
                </h4>
                <ul className="space-y-2">
                  {brief.executive_summary.strategic_recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 7. Presentation Deck */}
        {activeTab === "pptx" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">16:9 Widescreen Slide Deck Layout</span>
              <span className="text-[11px] text-slate-500 font-mono">{brief.presentation_outline.length} Slides Structured</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {brief.presentation_outline.map((slide) => (
                <div key={slide.slide_number} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between hover:border-orange-500/30 transition-all shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                        Slide {slide.slide_number}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">16:9 HD</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-2 leading-snug">{slide.title}</h4>
                    <ul className="space-y-1.5 mb-3">
                      {slide.bullet_points.map((bp, i) => (
                        <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                          <span className="text-orange-400 shrink-0">▸</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {slide.speaker_notes && (
                    <div className="pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400 italic bg-slate-900/60 p-2 rounded">
                      <strong className="text-orange-300 not-italic">Speaker Notes:</strong> {slide.speaker_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Raw JSON */}
        {activeTab === "raw" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Canonical Intermediate Schema (JSON)</span>
              <button
                onClick={copyJson}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                {copiedJson ? "Copied" : "Copy to Clipboard"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto max-h-96 leading-relaxed">
              {JSON.stringify(brief, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* MULTI-FORMAT DELIVERABLE SELECTION MATRIX */}
      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Choose Deliverables to Synthesize</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono font-semibold border border-blue-500/30">
                {selectedFormats.length} of 7 Selected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any combination or all 7. All deliverables are rendered simultaneously from the canonical brief above.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium border border-blue-500/20 transition-colors"
            >
              Select All 7 Formats
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Deliverable Cards Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FORMAT_SPECIFICATIONS.map((spec) => {
            const isChecked = selectedFormats.includes(spec.id);
            const Icon = spec.icon;

            return (
              <div
                key={spec.id}
                onClick={() => toggleFormat(spec.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  isChecked
                    ? `${spec.accentBg} ${spec.accentBorder} shadow-md ring-1 ring-white/10`
                    : "bg-slate-950/50 border-slate-800 opacity-60 hover:opacity-90 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-lg ${spec.accentBg} ${spec.color} flex items-center justify-center border border-white/5`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">{spec.title}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 h-4 w-4"
                    />
                  </div>

                  <p className="text-[11px] text-slate-300 font-medium">{spec.subtitle}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 leading-snug">{spec.badge}</p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className={`text-[10px] font-semibold ${isChecked ? spec.color : "text-slate-500"}`}>
                    {isChecked ? "✓ Ready to Synthesize" : "Not Selected"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(spec.tabKey);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 hover:underline"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Parallel workers synthesize all deliverables concurrently with cryptographic proof.</span>
          </div>

          <button
            onClick={() => onTransform(brief, selectedFormats)}
            disabled={isTransforming || selectedFormats.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-4 w-4" />
            <span>
              {isTransforming
                ? "Synthesizing Deliverables in Parallel..."
                : `Dispatch Parallel Generation (${selectedFormats.length} Deliverables)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
