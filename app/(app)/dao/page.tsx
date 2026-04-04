"use client";

import { AppHeader } from "@/components/app-header";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  requestedAmount: string;
  currentFunding: number;
  targetFunding: number;
  votes: number;
  votesYes: number;
  votesNo: number;
  status: "active" | "funded" | "expired";
  daysLeft: number;
}

const initialProposals: Proposal[] = [
  {
    id: "1",
    title: "Quantum-Resistant Encryption Protocol",
    description: "Development of post-quantum cryptographic algorithms for blockchain security",
    requestedAmount: "$500,000",
    currentFunding: 380000,
    targetFunding: 500000,
    votes: 1247, votesYes: 890, votesNo: 357,
    status: "active", daysLeft: 12,
  },
  {
    id: "2",
    title: "Decentralized Identity Framework",
    description: "Self-sovereign identity solution built on verifiable credentials",
    requestedAmount: "$250,000",
    currentFunding: 250000,
    targetFunding: 250000,
    votes: 892, votesYes: 712, votesNo: 180,
    status: "funded", daysLeft: 0,
  },
  {
    id: "3",
    title: "AI-Powered Patent Analysis",
    description: "Machine learning system for automated prior art search and analysis",
    requestedAmount: "$150,000",
    currentFunding: 89000,
    targetFunding: 150000,
    votes: 534, votesYes: 310, votesNo: 224,
    status: "active", daysLeft: 5,
  },
  {
    id: "4",
    title: "Cross-Chain IP Registry",
    description: "Interoperable protocol for IP registration across multiple blockchains",
    requestedAmount: "$300,000",
    currentFunding: 45000,
    targetFunding: 300000,
    votes: 312, votesYes: 198, votesNo: 114,
    status: "active", daysLeft: 21,
  },
];

// ── Vote Modal ────────────────────────────────────────────────────────────────
function VoteModal({
  proposal,
  onClose,
  onVote,
}: {
  proposal: Proposal;
  onClose: () => void;
  onVote: (id: string, vote: "yes" | "no") => void;
}) {
  const [chosen, setChosen] = useState<"yes" | "no" | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!chosen) return;
    onVote(proposal.id, chosen);
    setConfirmed(true);
    setTimeout(onClose, 1400);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md mx-4 glass-card p-8"
        style={{ border: "1px solid rgba(255,255,255,0.15)" }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!confirmed ? (
          <>
            <h3 className="font-sentient text-xl text-foreground mb-2">Cast Your Vote</h3>
            <p className="font-mono text-xs text-muted mb-6 leading-relaxed">{proposal.title}</p>

            {/* Current tally */}
            <div className="mb-6 p-4 rounded-lg bg-white/[0.02] border border-card-border">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-xs text-green-400">YES — {proposal.votesYes.toLocaleString()}</span>
                <span className="font-mono text-xs text-red-400">NO — {proposal.votesNo.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{
                    width: `${(proposal.votesYes / proposal.votes) * 100}%`,
                    boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                  }}
                />
              </div>
            </div>

            {/* Yes / No buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setChosen("yes")}
                className={`py-4 rounded-xl font-mono text-sm uppercase tracking-wider border transition-all duration-200 ${
                  chosen === "yes"
                    ? "bg-green-500/20 border-green-400 text-green-400"
                    : "bg-white/[0.02] border-card-border text-muted hover:border-green-500/40 hover:text-green-400"
                }`}
                style={{ boxShadow: chosen === "yes" ? "0 0 20px rgba(34,197,94,0.3)" : "none" }}
              >
                ✓ Yes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setChosen("no")}
                className={`py-4 rounded-xl font-mono text-sm uppercase tracking-wider border transition-all duration-200 ${
                  chosen === "no"
                    ? "bg-red-500/20 border-red-400 text-red-400"
                    : "bg-white/[0.02] border-card-border text-muted hover:border-red-500/40 hover:text-red-400"
                }`}
                style={{ boxShadow: chosen === "no" ? "0 0 20px rgba(239,68,68,0.3)" : "none" }}
              >
                ✕ No
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: chosen ? 1.02 : 1 }}
              whileTap={{ scale: chosen ? 0.98 : 1 }}
              onClick={handleConfirm}
              disabled={!chosen}
              className="w-full py-3 rounded-xl font-mono text-sm uppercase tracking-wider border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-primary/10 border-primary text-primary btn-glow hover:bg-primary/20"
            >
              Confirm Vote
            </motion.button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: chosen === "yes" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}
            >
              <span className="text-2xl">{chosen === "yes" ? "✓" : "✕"}</span>
            </div>
            <h3 className="font-sentient text-lg text-foreground mb-1">Vote Recorded!</h3>
            <p className="font-mono text-xs text-muted">
              You voted <span className={chosen === "yes" ? "text-green-400" : "text-red-400"}>{chosen?.toUpperCase()}</span>
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Fund Modal ────────────────────────────────────────────────────────────────
function FundModal({
  proposal,
  onClose,
  onFund,
}: {
  proposal: Proposal;
  onClose: () => void;
  onFund: (id: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");

  const parsed = parseFloat(amount.replace(/,/g, ""));
  const remaining = proposal.targetFunding - proposal.currentFunding;
  const pct = Math.min((parsed / remaining) * 100, 100);

  const handleNext = () => { if (parsed > 0 && wallet) setStep("confirm"); };
  const handleConfirm = () => {
    onFund(proposal.id, parsed);
    setStep("success");
    setTimeout(onClose, 1800);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md mx-4 glass-card p-8"
        style={{ border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "form" && (
          <>
            <h3 className="font-sentient text-xl text-foreground mb-1">Fund This Proposal</h3>
            <p className="font-mono text-xs text-muted mb-6 leading-relaxed">{proposal.title}</p>

            {/* Progress remaining */}
            <div className="mb-6 p-4 rounded-lg bg-white/[0.02] border border-card-border">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-xs text-muted">Remaining</span>
                <span className="font-mono text-xs text-primary">${remaining.toLocaleString()} needed</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-[#00BFFF] rounded-full progress-glow"
                  style={{ width: `${(proposal.currentFunding / proposal.targetFunding) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number" min="1" placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-primary/30 rounded-lg font-mono text-sm text-foreground placeholder:text-muted/40 focus:outline-none input-azure transition-all"
                />
                {parsed > 0 && (
                  <div className="mt-2">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        style={{ boxShadow: "0 0 8px rgba(34,197,94,0.5)" }}
                      />
                    </div>
                    <p className="font-mono text-xs text-green-400 mt-1">
                      Covers {pct.toFixed(1)}% of remaining goal
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
                  Wallet Address
                </label>
                <input
                  type="text" placeholder="0x..."
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-primary/30 rounded-lg font-mono text-sm text-foreground placeholder:text-muted/40 focus:outline-none input-azure transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
                  Note (Optional)
                </label>
                <input
                  type="text" placeholder="Supporting decentralized IP..."
                  className="w-full px-4 py-3 bg-black border border-primary/30 rounded-lg font-mono text-sm text-foreground placeholder:text-muted/40 focus:outline-none input-azure transition-all"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: parsed > 0 && wallet ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!(parsed > 0 && wallet)}
              className="w-full py-3 rounded-xl font-mono text-sm uppercase tracking-wider border disabled:opacity-40 disabled:cursor-not-allowed bg-primary/10 border-primary text-primary btn-glow hover:bg-primary/20 transition-all"
            >
              Review Transaction →
            </motion.button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h3 className="font-sentient text-xl text-foreground mb-6">Confirm Transaction</h3>
            <div className="space-y-3 mb-8">
              {[
                { label: "Proposal", val: proposal.title },
                { label: "Amount", val: `$${parseFloat(amount).toLocaleString()} USD` },
                { label: "From", val: wallet.length > 16 ? wallet.slice(0,8)+"..."+wallet.slice(-6) : wallet },
                { label: "Network Fee", val: "~$2.40 (estimated)" },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-start justify-between p-3 rounded-lg bg-white/[0.02] border border-card-border">
                  <span className="font-mono text-xs text-muted uppercase">{label}</span>
                  <span className="font-mono text-xs text-foreground text-right max-w-[60%]">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("form")}
                className="flex-1 py-3 rounded-xl font-mono text-xs uppercase border border-card-border text-muted hover:text-foreground hover:border-white/20 transition-all">
                ← Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl font-mono text-xs uppercase bg-primary/10 border border-primary text-primary btn-glow hover:bg-primary/20 transition-all">
                Confirm & Fund
              </motion.button>
            </div>
          </>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center"
              style={{ boxShadow: "0 0 24px rgba(34,197,94,0.3)" }}>
              <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-sentient text-lg text-foreground mb-1">Funded Successfully!</h3>
            <p className="font-mono text-xs text-muted">
              <span className="text-green-400">${parseFloat(amount).toLocaleString()}</span> committed to this proposal
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-[#00BFFF] rounded-full progress-glow"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DAOPage() {
  const [proposals, setProposals] = useState(initialProposals);
  const [voteModal, setVoteModal] = useState<Proposal | null>(null);
  const [fundModal, setFundModal] = useState<Proposal | null>(null);

  const handleVote = (id: string, vote: "yes" | "no") => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              votes: p.votes + 1,
              votesYes: vote === "yes" ? p.votesYes + 1 : p.votesYes,
              votesNo: vote === "no" ? p.votesNo + 1 : p.votesNo,
            }
          : p
      )
    );
  };

  const handleFund = (id: string, amount: number) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newFunding = Math.min(p.currentFunding + amount, p.targetFunding);
        return {
          ...p,
          currentFunding: newFunding,
          status: newFunding >= p.targetFunding ? "funded" : p.status,
        };
      })
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AppHeader title="Funding DAO" />

      <div className="space-y-6">
        {proposals.map((proposal, index) => (
          <motion.div
            key={proposal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="glass-card p-6 relative overflow-hidden"
            style={{ transition: "box-shadow 0.3s ease, border-color 0.3s ease" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px 4px rgba(0,123,255,0.14), 0 12px 32px rgba(0,0,0,0.4)";
              (e.currentTarget as HTMLElement).style.borderTop = "1px solid rgba(0,123,255,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
              (e.currentTarget as HTMLElement).style.borderTop = "1px solid rgba(255,255,255,0.15)";
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-sentient text-lg text-foreground">{proposal.title}</h3>
                  <span className={`font-mono text-xs px-2 py-1 rounded-full border ${
                    proposal.status === "funded"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : proposal.status === "expired"
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-primary/10 border-primary/30 text-primary"
                  }`}>
                    {proposal.status.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-sm text-muted">{proposal.description}</p>
              </div>
            </div>

            {/* Funding Progress */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-xs text-muted">Funding Progress</span>
                <span className="font-mono text-xs text-primary">
                  ${proposal.currentFunding.toLocaleString()} / {proposal.requestedAmount}
                </span>
              </div>
              <ProgressBar current={proposal.currentFunding} target={proposal.targetFunding} />
            </div>

            {/* Vote tally bar */}
            {proposal.votes > 0 && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-xs text-green-400">YES {proposal.votesYes.toLocaleString()}</span>
                  <span className="font-mono text-xs text-red-400">NO {proposal.votesNo.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                  <motion.div
                    animate={{ width: `${(proposal.votesYes / proposal.votes) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-green-500 rounded-l-full"
                    style={{ boxShadow: "0 0 6px rgba(34,197,94,0.5)" }}
                  />
                  <motion.div
                    animate={{ width: `${(proposal.votesNo / proposal.votes) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-red-500 rounded-r-full"
                    style={{ boxShadow: "0 0 6px rgba(239,68,68,0.5)" }}
                  />
                </div>
              </div>
            )}

            {/* Stats + Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="font-mono text-xs text-muted">Votes</p>
                  <p className="font-mono text-sm text-foreground">{proposal.votes.toLocaleString()}</p>
                </div>
                {proposal.daysLeft > 0 && (
                  <div>
                    <p className="font-mono text-xs text-muted">Days Left</p>
                    <p className="font-mono text-sm text-foreground">{proposal.daysLeft}</p>
                  </div>
                )}
              </div>

              {proposal.status === "active" && (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setFundModal(proposal)}
                    className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs btn-glow hover:bg-primary/20 transition-all duration-200"
                  >
                    Fund This
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setVoteModal(proposal)}
                    className="px-4 py-2 rounded-lg bg-white/[0.02] border border-card-border text-muted font-mono text-xs hover:text-foreground hover:border-white/30 transition-all duration-200"
                  >
                    Vote
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {voteModal && (
          <VoteModal
            proposal={voteModal}
            onClose={() => setVoteModal(null)}
            onVote={handleVote}
          />
        )}
        {fundModal && (
          <FundModal
            proposal={fundModal}
            onClose={() => setFundModal(null)}
            onFund={handleFund}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
