"use client";

import { AppHeader } from "@/components/app-header";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

// ── TigerGraph-ready node/edge schema ─────────────────────────────────────────
// In production: replace fetchGraphData() with real TigerGraph REST++ calls.
// Endpoint: GET /restpp/query/{graph}/your_gsql_query
// Auth: Authorization: Bearer <TGCLOUD_TOKEN>

interface GraphNode {
  id: string;
  label: string;
  x: number; // % of canvas
  y: number;
  size: number;
  type: "core" | "patent" | "research" | "algorithm" | "data" | "model" | "proof" | "citation" | "link";
  connections: number;
  detail: string;
}

interface GraphEdge { from: string; to: string; weight?: number; }

const GRAPH_NODES: GraphNode[] = [
  { id: "1", label: "IP Core",    x: 50, y: 50, size: 24, type: "core",      connections: 8,  detail: "Central IP asset hub" },
  { id: "2", label: "Patent A",   x: 25, y: 30, size: 16, type: "patent",    connections: 4,  detail: "US Patent #2847391" },
  { id: "3", label: "Patent B",   x: 75, y: 25, size: 16, type: "patent",    connections: 4,  detail: "EU Patent #EU2024891" },
  { id: "4", label: "Research",   x: 20, y: 65, size: 14, type: "research",  connections: 3,  detail: "Peer-reviewed paper" },
  { id: "5", label: "Algorithm",  x: 80, y: 60, size: 14, type: "algorithm", connections: 3,  detail: "ZK-SNARK impl v2" },
  { id: "6", label: "Dataset",    x: 35, y: 82, size: 12, type: "data",      connections: 2,  detail: "Training dataset v3" },
  { id: "7", label: "Model",      x: 65, y: 78, size: 12, type: "model",     connections: 2,  detail: "ML model checkpoint" },
  { id: "8", label: "Proof",      x: 10, y: 45, size: 10, type: "proof",     connections: 1,  detail: "On-chain ZK proof" },
  { id: "9", label: "Citation",   x: 90, y: 40, size: 10, type: "citation",  connections: 1,  detail: "3rd party reference" },
  { id: "10",label: "Link",       x: 50, y: 18, size: 8,  type: "link",      connections: 2,  detail: "Cross-chain reference" },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: "1", to: "2", weight: 0.9 }, { from: "1", to: "3", weight: 0.85 },
  { from: "1", to: "4", weight: 0.7 }, { from: "1", to: "5", weight: 0.75 },
  { from: "2", to: "8", weight: 0.6 }, { from: "3", to: "9", weight: 0.55 },
  { from: "4", to: "6", weight: 0.5 }, { from: "5", to: "7", weight: 0.65 },
  { from: "2", to: "10",weight: 0.4 }, { from: "3", to: "10",weight: 0.45 },
  { from: "6", to: "7", weight: 0.35 },
];

const NODE_COLORS: Record<GraphNode["type"], string> = {
  core:      "#007BFF",
  patent:    "#00BFFF",
  research:  "#4dabf7",
  algorithm: "#74c0fc",
  data:      "#339af0",
  model:     "#228be6",
  proof:     "#1c7ed6",
  citation:  "#1971c2",
  link:      "#1864ab",
};

// ── Canvas graph ──────────────────────────────────────────────────────────────
interface NetworkGraphProps {
  zoom: number;
  onNodeClick: (node: GraphNode) => void;
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
}

function NetworkGraph({ zoom, onNodeClick, hoveredNode, setHoveredNode }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const timeRef   = useRef(0);

  const getNodePos = useCallback((node: GraphNode, w: number, h: number) => ({
    x: (node.x / 100) * w,
    y: (node.y / 100) * h,
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;
      const W = canvas.width / zoom;
      const H = canvas.height / zoom;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(zoom, zoom);

      // Draw edges
      GRAPH_EDGES.forEach((edge) => {
        const from = GRAPH_NODES.find((n) => n.id === edge.from)!;
        const to   = GRAPH_NODES.find((n) => n.id === edge.to)!;
        const fp = getNodePos(from, W, H);
        const tp = getNodePos(to,   W, H);
        const isHovered = hoveredNode === from.id || hoveredNode === to.id;

        // Animated dash pulse along edge
        const pulse = Math.abs(Math.sin(t * 1.5 + parseInt(edge.from) * 0.7));
        ctx.setLineDash([6, 10]);
        ctx.lineDashOffset = -(t * 18);
        ctx.strokeStyle = isHovered
          ? `rgba(0,123,255,${0.5 + pulse * 0.3})`
          : `rgba(0,123,255,${0.18 + pulse * 0.1})`;
        ctx.lineWidth = isHovered ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.lineTo(tp.x, tp.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes
      GRAPH_NODES.forEach((node, i) => {
        const { x, y } = getNodePos(node, W, H);
        const pulse = Math.sin(t * 1.8 + i * 0.6) * 0.18 + 1;
        const isHov = hoveredNode === node.id;
        const baseSize = node.size * pulse * (isHov ? 1.35 : 1);
        const color = NODE_COLORS[node.type];

        // Outer glow
        const g = ctx.createRadialGradient(x, y, 0, x, y, baseSize * 2.8);
        g.addColorStop(0, color + (isHov ? "cc" : "66"));
        g.addColorStop(0.45, color + "33");
        g.addColorStop(1, color + "00");
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Core circle
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        if (isHov) { ctx.shadowColor = color; ctx.shadowBlur = 20; }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner white dot
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();

        // Label
        if (isHov || node.type === "core") {
          ctx.font = `${isHov ? "600 " : ""}11px 'GeistMono', monospace`;
          ctx.fillStyle = isHov ? "#fff" : "rgba(255,255,255,0.7)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, x, y - baseSize * 0.75);
        }
      });

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [zoom, hoveredNode, getNodePos]);

  // Mouse interactions
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom;
    const W = canvas.width / zoom;
    const H = canvas.height / zoom;

    let found: string | null = null;
    for (const node of GRAPH_NODES) {
      const { x, y } = { x: (node.x / 100) * W, y: (node.y / 100) * H };
      if (Math.hypot(mx - x, my - y) < node.size * 1.2) { found = node.id; break; }
    }
    setHoveredNode(found);
    canvas.style.cursor = found ? "pointer" : "default";
  }, [zoom, setHoveredNode]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom;
    const W = canvas.width / zoom;
    const H = canvas.height / zoom;

    for (const node of GRAPH_NODES) {
      const { x, y } = { x: (node.x / 100) * W, y: (node.y / 100) * H };
      if (Math.hypot(mx - x, my - y) < node.size * 1.2) { onNodeClick(node); break; }
    }
  }, [zoom, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredNode(null)}
      onClick={handleClick}
    />
  );
}

// ── Stat mini-card with hover lift ────────────────────────────────────────────
function MiniStat({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 0 24px 4px rgba(0,123,255,0.18)" }}
      transition={{ duration: 0.35, delay }}
      className="glass-card p-6 text-center cursor-default"
    >
      <p className="font-mono text-xs text-muted uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-sentient text-foreground">{value}</p>
    </motion.div>
  );
}

// ── Node detail card ──────────────────────────────────────────────────────────
function NodeDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="absolute top-4 right-4 w-56 glass-card p-4 z-10"
      style={{ border: "1px solid rgba(0,123,255,0.4)", boxShadow: "0 0 24px rgba(0,123,255,0.2)" }}
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-muted hover:text-foreground text-xs">✕</button>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[node.type], boxShadow: `0 0 8px ${NODE_COLORS[node.type]}` }} />
        <span className="font-sentient text-sm text-foreground">{node.label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-mono text-xs text-muted">Type</span>
          <span className="font-mono text-xs text-primary capitalize">{node.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-xs text-muted">Links</span>
          <span className="font-mono text-xs text-foreground">{node.connections}</span>
        </div>
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="font-mono text-xs text-muted">{node.detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [zoom, setZoom]               = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [tigStatus, setTigStatus]     = useState<"idle" | "connecting" | "live">("idle");

  const handleZoomIn  = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset   = () => { setZoom(1); setSelectedNode(null); setHoveredNode(null); };

  // Simulate TigerGraph connection
  const handleTigerConnect = () => {
    setTigStatus("connecting");
    setTimeout(() => setTigStatus("live"), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AppHeader title="Network" />

      {/* Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <MiniStat label="Total Nodes"   value="2,847"  delay={0}   />
        <MiniStat label="Connections"   value="12,459" delay={0.1} />
        <MiniStat label="Graph Density" value="0.78"   delay={0.2} />
      </div>

      {/* TigerGraph integration banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-4 mb-6 flex items-center justify-between"
        style={{
          borderTop: tigStatus === "live"
            ? "1px solid rgba(34,197,94,0.5)"
            : "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            tigStatus === "live" ? "bg-green-400" :
            tigStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
            "bg-white/30"
          }`} style={{ boxShadow: tigStatus === "live" ? "0 0 8px rgba(34,197,94,0.8)" : undefined }} />
          <div>
            <p className="font-mono text-xs text-foreground uppercase tracking-wider">
              TigerGraph Database
              {tigStatus === "live" && <span className="text-green-400 ml-2">● Live</span>}
              {tigStatus === "connecting" && <span className="text-yellow-400 ml-2">Connecting...</span>}
            </p>
            <p className="font-mono text-xs text-muted mt-0.5">
              {tigStatus === "live"
                ? "REST++ endpoint active · GSQL queries enabled"
                : "Connect to enable real-time graph queries"}
            </p>
          </div>
        </div>
        {tigStatus !== "live" && (
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleTigerConnect}
            disabled={tigStatus === "connecting"}
            className="px-4 py-2 rounded-lg font-mono text-xs uppercase bg-primary/10 border border-primary/40 text-primary btn-glow hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {tigStatus === "connecting" ? (
              <span className="flex items-center gap-2">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Connecting
              </span>
            ) : "Connect"}
          </motion.button>
        )}
        {tigStatus === "live" && (
          <div className="flex gap-2">
            <span className="font-mono text-xs text-green-400 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              127 queries/s
            </span>
          </div>
        )}
      </motion.div>

      {/* Graph card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card p-6 mb-6"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-mono text-sm text-muted uppercase tracking-wider mb-0.5">
              TigerGraph Visualization
            </h3>
            <p className="font-mono text-xs text-muted">
              Real-time IP asset relationship mapping · click a node to inspect
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted mr-1">{Math.round(zoom * 100)}%</span>
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg font-mono text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary transition-all flex items-center justify-center"
            >+</motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg font-mono text-sm bg-white/5 border border-card-border text-muted hover:text-foreground hover:border-white/30 transition-all flex items-center justify-center"
            >−</motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg font-mono text-xs bg-white/5 border border-card-border text-muted hover:text-foreground hover:border-white/30 transition-all"
            >Reset</motion.button>
          </div>
        </div>

        {/* Canvas container */}
        <div className="relative h-[420px] rounded-xl bg-black/60 border border-card-border overflow-hidden">
          <NetworkGraph
            zoom={zoom}
            onNodeClick={setSelectedNode}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
          />

          {/* Node detail panel */}
          <AnimatePresence>
            {selectedNode && (
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex gap-4 flex-wrap">
            {(["core","patent","research"] as const).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type], boxShadow: `0 0 6px ${NODE_COLORS[type]}` }} />
                <span className="font-mono text-xs text-muted capitalize">{type === "core" ? "Core IP" : type.charAt(0).toUpperCase()+type.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredNode && !selectedNode && (() => {
              const n = GRAPH_NODES.find(x => x.id === hoveredNode);
              return n ? (
                <motion.div
                  key={hoveredNode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-4 right-4 px-3 py-2 rounded-lg glass-card"
                  style={{ border: "1px solid rgba(0,123,255,0.3)" }}
                >
                  <p className="font-mono text-xs text-foreground">{n.label}</p>
                  <p className="font-mono text-xs text-muted">{n.connections} connections</p>
                </motion.div>
              ) : null;
            })()}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Top connected nodes — with hover lift */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="glass-card p-6"
      >
        <h3 className="font-mono text-sm text-muted mb-4 uppercase tracking-wider">
          Top Connected Nodes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Quantum Protocol Core", connections: 847, type: "IP Asset" },
            { name: "DeFi Patent Cluster",   connections: 623, type: "Patent Group" },
            { name: "ML Research Hub",       connections: 512, type: "Research" },
            { name: "Blockchain Security",   connections: 489, type: "IP Asset" },
            { name: "Zero-Knowledge Proofs", connections: 421, type: "Algorithm" },
            { name: "Data Sovereignty",      connections: 387, type: "Dataset" },
          ].map((node, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, boxShadow: "0 0 20px 3px rgba(0,123,255,0.16)", borderColor: "rgba(0,123,255,0.35)" }}
              transition={{ duration: 0.25 }}
              className="p-4 rounded-lg bg-white/[0.02] border border-card-border cursor-default"
              style={{ transition: "box-shadow 0.25s ease, border-color 0.25s ease" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-primary" style={{ boxShadow: "0 0 8px rgba(0,123,255,0.6)" }} />
                <p className="font-mono text-sm text-foreground">{node.name}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">{node.type}</span>
                <span className="font-mono text-xs text-primary">{node.connections} links</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
