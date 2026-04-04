"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { motion } from "framer-motion";

export default function VaultPage() {
  const [isHashing, setIsHashing] = useState(false);
  const [hashComplete, setHashComplete] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsHashing(true);
    setHashComplete(false);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsHashing(false);
    setHashComplete(true);

    setTimeout(() => {
      setHashComplete(false);
      setFormData({ title: "", description: "", file: null });
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <AppHeader title="The Vault" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-sentient text-foreground mb-2">Register Your IP</h2>
          <p className="font-mono text-sm text-muted">
            Commit your intellectual property to the blockchain for immutable proof of existence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
              Asset Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter IP asset name..."
              className="w-full px-4 py-3 bg-black border border-primary/30 rounded-lg font-mono text-sm text-foreground placeholder:text-muted/50 focus:outline-none input-azure transition-all duration-300"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your intellectual property..."
              rows={4}
              className="w-full px-4 py-3 bg-black border border-primary/30 rounded-lg font-mono text-sm text-foreground placeholder:text-muted/50 focus:outline-none input-azure transition-all duration-300 resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
              Attach File (Optional)
            </label>
            <div className="relative border border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <svg className="w-8 h-8 mx-auto text-primary/50 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-mono text-sm text-muted">
                  {formData.file ? formData.file.name : "Drop file here or click to upload"}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isHashing || !formData.title || !formData.description}
            className="w-full py-4 rounded-lg font-mono text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-primary/10 border border-primary text-primary btn-glow hover:bg-primary/20"
          >
            {isHashing ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Hashing...
              </span>
            ) : hashComplete ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Committed Successfully
              </span>
            ) : (
              "Commit to Blockchain"
            )}
          </button>
        </form>

        {/* Hash Preview */}
        {(isHashing || hashComplete) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-card-border"
          >
            <p className="font-mono text-xs text-muted mb-2">Generated Hash</p>
            <p className="font-mono text-sm text-primary break-all">
              {isHashing
                ? "0x" + "█".repeat(64)
                : "0x7a3f8c2e1d4b6a9f0e5c8d7b2a4e6f1c9d8b7a5e3f2c1d0e9f8a7b6c5d4e3f2a"}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Recent Submissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-card p-6 mt-6"
      >
        <h3 className="font-mono text-sm text-muted mb-4 uppercase tracking-wider">Your Vault</h3>
        <div className="space-y-3">
          {[
            { name: "Neural Network Architecture v2", hash: "0x7a3...b2f", date: "Mar 15, 2024" },
            { name: "Quantum Algorithm Design", hash: "0x1c9...e4d", date: "Mar 10, 2024" },
            { name: "Blockchain Protocol Spec", hash: "0x5f2...a1c", date: "Mar 5, 2024" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-card-border"
            >
              <div>
                <p className="font-mono text-sm text-foreground">{item.name}</p>
                <p className="font-mono text-xs text-primary">{item.hash}</p>
              </div>
              <span className="font-mono text-xs text-muted">{item.date}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
