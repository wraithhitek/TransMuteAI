export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RedactedItem {
  type: string;
  original_masked: string;
  replacement: string;
}

export interface IngestionResponse {
  document_id: string;
  filename: string;
  file_type: string;
  raw_character_count: number;
  redacted_character_count: number;
  redaction_count: number;
  redactions: RedactedItem[];
  redacted_text: string;
  preview: string;
}

export interface ContentBriefJSON {
  brief_id: string;
  title: string;
  tone: string;
  summary: string;
  entities_extracted: string[];
  executive_summary: {
    headline: string;
    context: string;
    key_findings: string[];
    strategic_recommendations: string[];
  };
  presentation_outline: Array<{
    slide_number: number;
    title: string;
    bullet_points: string[];
    speaker_notes: string;
  }>;
  social_media_thread: Array<{
    post_number: number;
    content: string;
    hashtags: string[];
  }>;
  video_package?: {
    concept: string;
    target_duration: string;
    storyboard: Array<{
      scene_number: number;
      timestamp: string;
      visual_description: string;
      narration: string;
      audio_cues: string;
      b_roll_recommendations?: string[];
    }>;
    subtitles_srt: string;
  };
  linkedin_post?: {
    hook: string;
    body: string;
    bullet_insights: string[];
    call_to_action: string;
    hashtags: string[];
  };
  advisory_document?: {
    executive_mandate: string;
    strategic_context: string;
    risk_matrix: Array<{
      risk_factor: string;
      severity: string;
      likelihood: string;
      mitigation_strategy: string;
    }>;
    phased_roadmap: Array<{
      phase: string;
      timeframe: string;
      actions: string[];
    }>;
    governance_framework: string[];
  };
  infographic?: {
    headline: string;
    narrative_flow: string;
    color_palette: string[];
    sections: Array<{
      section_title: string;
      key_stat: string;
      visual_layout_directive: string;
      supporting_text: string;
    }>;
    footer_callout: string;
  };
  target_formats: string[];
  source_metadata: Record<string, any>;
  created_at: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  message?: string;
  artifacts?: Record<string, string>;
  ledger_entry?: any;
  qr_code_url?: string;
  error?: string;
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  if (res.status === 404) {
    return `Backend API endpoint not found (404). If deployed on Vercel, ensure NEXT_PUBLIC_API_URL is set in Vercel Environment Variables to your Render backend URL.`;
  }
  try {
    const data = await res.json();
    return data.detail || data.message || fallback;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE_URL}/api/status`);
  if (!res.ok) throw new Error(await parseApiError(res, "Failed to fetch system status"));
  return res.json();
}

export async function ingestDocument(file: File): Promise<IngestionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/ingest`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Failed to parse document"));
  }

  return res.json();
}

export async function generateBrief(
  raw_text: string,
  title: string,
  tone: string = "authoritative",
  provider?: string
): Promise<ContentBriefJSON> {
  const res = await fetch(`${API_BASE_URL}/api/brief/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text, title, tone, provider }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Failed to generate Content Brief"));
  }

  return res.json();
}


export async function triggerTransformation(
  brief: ContentBriefJSON,
  formats: string[] = ["docx", "pptx", "social"]
): Promise<TaskStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/transform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief, formats }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to trigger transformation");
  }

  return res.json();
}

export async function pollTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`);
  if (!res.ok) throw new Error("Failed to poll task status");
  return res.json();
}

export async function verifyBlockchainProvenance(briefId?: string, artifactHash?: string) {
  const res = await fetch(`${API_BASE_URL}/api/provenance/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief_id: briefId, artifact_hash: artifactHash }),
  });
  if (!res.ok) throw new Error("Verification request failed");
  return res.json();
}
