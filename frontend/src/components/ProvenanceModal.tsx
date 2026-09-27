"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Search, Link2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { API_BASE_URL, verifyBlockchainProvenance } from "../lib/api";

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({ isOpen, onClose }) => {
  const [chainData, setChainData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchChain = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/provenance/chain/audit`);
      if (res.ok) {
        const data = await res.json();
        setChainData(data);
      }
    } catch (e) {
      console.warn("Failed to load blockchain chain audit", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChain();
      setVerificationResult(null);
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      setVerifying(true);
      const res = await verifyBlockchainProvenance(
        searchTerm.startsWith("brief_") ? searchTerm : undefined,
        !searchTerm.startsWith("brief_") ? searchTerm : undefined
      );
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ verified: false, status: "ERROR", message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cryptographic Blockchain Ledger Explorer</h3>
              <p className="text-xs text-slate-400">
                Immutable SHA-256 Merkle block sequence verifying artifact provenance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchChain}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Verification Search Bar */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/20">
          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Verify by Brief ID (e.g. brief_123) or SHA-256 Hash..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || !searchTerm.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
            >
              {verifying ? "Checking Ledger..." : "Verify Hash"}
            </button>
          </form>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
              verificationResult.verified
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : "bg-red-950/40 border-red-500/30 text-red-300"
            }`}>
              <div className="flex items-center gap-2">
                {verificationResult.verified ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                <span>
                  <strong>{verificationResult.status}</strong>: {
                    verificationResult.verified
                      ? `Anchored in Block #${verificationResult.block_index} with matching hash.`
                      : "Hash or Brief ID not found or chain integrity invalid."
                  }
                </span>
              </div>
              {verificationResult.verified && (
                <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  Chain 100% Intact
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chain Integrity Summary */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Blocks:</span>
            <span className="font-mono text-white font-bold">{chainData?.total_blocks || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Chain Status:</span>
            {chainData?.is_valid ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cryptographically Valid
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Tampered / Inconsistent
              </span>
            )}
          </div>
        </div>

        {/* Blocks Scroll View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chainData?.chain?.slice().reverse().map((block: any) => (
            <div
              key={block.index}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                  Block #{block.index} {block.index === 0 ? "(GENESIS)" : ""}
                </span>
                <span className="text-slate-400 text-[11px]">{block.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500">Brief ID: </span>
                  <span className="text-slate-200">{block.brief_id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Nonce: </span>
                  <span className="text-slate-300">{block.nonce}</span>
                </div>
              </div>

              <div className="text-[11px] truncate">
                <span className="text-slate-500">Block Hash: </span>
                <span className="text-emerald-400">{block.block_hash}</span>
              </div>

              <div className="text-[11px] truncate">
                <span className="text-slate-500">Prev Hash: </span>
                <span className="text-slate-400">{block.previous_hash}</span>
              </div>

              {block.artifact_hashes && Object.keys(block.artifact_hashes).length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500 block mb-1">Artifact Fingerprints:</span>
                  <div className="space-y-1">
                    {Object.entries(block.artifact_hashes).map(([fmt, hash]: any) => (
                      <div key={fmt} className="flex items-center justify-between text-slate-400 truncate">
                        <span className="uppercase text-blue-400">{fmt}:</span>
                        <span className="truncate ml-2">{hash}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
