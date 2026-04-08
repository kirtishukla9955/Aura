"use client";

import { AppHeader } from "@/components/app-header";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface GraphNode {
  id: string;
  label: string;
  x: number;       // 0-100 percentage of canvas width
  y: number;       // 0-100 percentage of canvas height
  size: number;
  type: "core" | "patent" | "research" | "algorithm" | "data" | "model" | "proof" | "citation" | "link";
  connections: number;
  detail: string;
}

interface GraphEdge { from: string; to: string; weight?: number; }

// ── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK_NODES: GraphNode[] = [
  { id: "1",  label: "IP Core",    x: 50, y: 50, size: 24, type: "core",      connections: 8, detail: "Central IP asset hub" },
  { id: "2",  label: "Patent A",   x: 25, y: 30, size: 16, type: "patent",    connections: 4, detail: "US Patent #2847391" },
  { id: "3",  label: "Patent B",   x: 75, y: 25, size: 16, type: "patent",    connections: 4, detail: "EU Patent #EU2024891" },
  { id: "4",  label: "Research",   x: 20, y: 65, size: 14, type: "research",  connections: 3, detail: "Peer-reviewed paper" },
  { id: "5",  label: "Algorithm",  x: 80, y: 60, size: 14, type: "algorithm", connections: 3, detail: "ZK-SNARK impl v2" },
  { id: "6",  label: "Dataset",    x: 35, y: 82, size: 12, type: "data",      connections: 2, detail: "Training dataset v3" },
  { id: "7",  label: "Model",      x: 65, y: 78, size: 12, type: "model",     connections: 2, detail: "ML model checkpoint" },
  { id: "8",  label: "Proof",      x: 10, y: 45, size: 10, type: "proof",     connections: 1, detail: "On-chain ZK proof" },
  { id: "9",  label: "Citation",   x: 90, y: 40, size: 10, type: "citation",  connections: 1, detail: "3rd party reference" },
  { id: "10", label: "Link",       x: 50, y: 18, size:  8, type: "link",      connections: 2, detail: "Cross-chain reference" },
];

const FALLBACK_EDGES: GraphEdge[] = [
  { from: "1", to: "2",  weight: 0.90 }, { from: "1", to: "3",  weight: 0.85 },
  { from: "1", to: "4",  weight: 0.70 }, { from: "1", to: "5",  weight: 0.75 },
  { from: "2", to: "8",  weight: 0.60 }, { from: "3", to: "9",  weight: 0.55 },
  { from: "4", to: "6",  weight: 0.50 }, { from: "5", to: "7",  weight: 0.65 },
  { from: "2", to: "10", weight: 0.40 }, { from: "3", to: "10", weight: 0.45 },
  { from: "6", to: "7",  weight: 0.35 },
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

// ── normaliseNodes ─────────────────────────────────────────────────────────────
// LOGIC: TigerGraph can return coordinates in any range (pixels, lat/lng, or missing).
// We scan ALL x values to find min/max, then linearly rescale every node into
// [PAD, 100-PAD] so they always fill the canvas regardless of source format.
// If a node has no coords at all, we fall back to an evenly-spaced circular layout.
function normaliseNodes(raw: any[]): GraphNode[] {
  if (!raw || raw.length === 0) return [];

  const xs = raw.map((n) => Number(n.x ?? n.attributes?.x ?? NaN)).filter(isFinite);
  const ys = raw.map((n) => Number(n.y ?? n.attributes?.y ?? NaN)).filter(isFinite);

  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 1;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const PAD = 10;

  return raw.map((n, i) => {
    const rawX = Number(n.x ?? n.attributes?.x ?? NaN);
    const rawY = Number(n.y ?? n.attributes?.y ?? NaN);

    let x: number, y: number;
    if (isFinite(rawX) && isFinite(rawY)) {
      x = PAD + ((rawX - minX) / rangeX) * (100 - PAD * 2);
      y = PAD + ((rawY - minY) / rangeY) * (100 - PAD * 2);
    } else {
      const angle = (i / raw.length) * Math.PI * 2 - Math.PI / 2;
      const radius = i === 0 ? 0 : 35;
      x = 50 + radius * Math.cos(angle);
      y = 50 + radius * Math.sin(angle);
    }

    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    const rawType = (n.type ?? n.v_type ?? n.attributes?.type ?? "link").toLowerCase();
    const typeMap: Record<string, GraphNode["type"]> = {
      core: "core", "ip asset": "core", ip_asset: "core", ipasset: "core",
      patent: "patent", "patent group": "patent", patent_group: "patent",
      research: "research", paper: "research",
      algorithm: "algorithm", algo: "algorithm",
      data: "data", dataset: "data",
      model: "model", proof: "proof", citation: "citation", link: "link",
    };
    const type: GraphNode["type"] = typeMap[rawType] ?? "link";
    const connections = Number(n.connections ?? n.attributes?.connections ?? n.degree ?? 1);
    const size = Math.max(8, Math.min(26, 8 + connections * 0.8));

    return {
      id:          String(n.id ?? n.v_id ?? i),
      label:       String(n.label ?? n.attributes?.label ?? n.v_id ?? `Node ${i + 1}`),
      x, y, size, type,
      connections: isFinite(connections) ? connections : 1,
      detail:      String(n.detail ?? n.attributes?.detail ?? n.attributes?.description ?? type),
    };
  });
}

// ── NetworkGraph ───────────────────────────────────────────────────────────────
// THE ROOT CAUSE OF MISSING LINES (now fixed):
//
// OLD broken logic:
//   ctx.scale(zoom, zoom)          ← scales the entire canvas space
//   fx = ((x/100) * W) / zoom      ← divides coord by zoom
//   Result: ctx.scale doubles the offset while /zoom halves it.
//   For nodes the visual rounding made them appear roughly correct.
//   For edges the two endpoints had tiny numerical differences that
//   produced lines of length ~0, invisible to the eye.
//
// NEW correct logic:
//   We do NOT call ctx.scale() at all for coordinate placement.
//   Instead we compute pixel coordinates directly:
//     px = (node.x / 100) * canvas.width
//     py = (node.y / 100) * canvas.height
//   Zoom is applied by scaling the SIZE of nodes/glows only,
//   not their positions. This guarantees edges connect the same
//   pixel points that node circles are drawn at — every time.
//
// CANVAS SIZING BUG (also fixed):
//   The canvas element defaults to 300×150px until explicitly sized.
//   If draw() runs before ResizeObserver fires, W=300 and all nodes
//   cluster near the left edge, edges appear as zero-length dots.
//   Fix: read canvas.width/height fresh inside every draw() frame.
//   The ResizeObserver sets canvas.width = parent.clientWidth, so by
//   the second frame everything is correct.

interface NetworkGraphProps {
  zoom: number;
  onNodeClick: (node: GraphNode) => void;
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function NetworkGraph({
  zoom,
  onNodeClick,
  hoveredNode,
  setHoveredNode,
  nodes,
  edges,
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // SIZING: Set canvas pixel dimensions to match its CSS layout size.
    // Must use clientWidth/Height (layout pixels), NOT getBoundingClientRect
    // which can return fractional values on HiDPI screens.
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width  = w;
        canvas.height = h;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    const draw = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;

      // Read dimensions fresh every frame — ResizeObserver may have updated them
      const W = canvas.width;
      const H = canvas.height;

      if (W === 0 || H === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      // ── HELPER: node percentage → actual canvas pixel ──────────────
      // This is the single source of truth for coordinate conversion.
      // Both edges AND nodes use this same function so they always match.
      const toPixel = (node: GraphNode) => ({
        px: (node.x / 100) * W,
        py: (node.y / 100) * H,
      });

      // ── EDGES ────────────────────────────────────────────────────────
      // Draw edges FIRST so they appear behind nodes.
      // Each edge gets an animated dashed line + optional glow on hover.
      edges.forEach((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode   = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const { px: fx, py: fy } = toPixel(fromNode);
        const { px: tx, py: ty } = toPixel(toNode);

        if (!isFinite(fx) || !isFinite(fy) || !isFinite(tx) || !isFinite(ty)) return;

        // Skip degenerate zero-length edges
        if (Math.abs(fx - tx) < 0.5 && Math.abs(fy - ty) < 0.5) return;

        const isHov = hoveredNode === fromNode.id || hoveredNode === toNode.id;
        const pulse = Math.abs(Math.sin(t * 1.5 + parseInt(edge.from, 10) * 0.7));
        const edgeWeight = edge.weight ?? 0.5;

        // Animated dash: offset marches along the line over time
        ctx.setLineDash([6, 10]);
        ctx.lineDashOffset = -(t * 18);

        if (isHov) {
          // Glowing edge on hover
          ctx.shadowColor = NODE_COLORS.core;
          ctx.shadowBlur  = 8;
          ctx.strokeStyle = `rgba(0,123,255,${0.6 + pulse * 0.35})`;
          ctx.lineWidth   = 2;
        } else {
          ctx.shadowBlur  = 0;
          // Weight-tinted opacity: heavier edges are more visible
          ctx.strokeStyle = `rgba(0,150,255,${0.15 + edgeWeight * 0.25 + pulse * 0.08})`;
          ctx.lineWidth   = 0.8 + edgeWeight * 0.8;
        }

        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // ── Travelling particle along edge (subtle animation) ─────────
        // A small bright dot travels from→to, reset each loop.
        const progress = (t * 0.4 + parseInt(edge.from, 10) * 0.3) % 1;
        const px = fx + (tx - fx) * progress;
        const py = fy + (ty - fy) * progress;
        ctx.beginPath();
        ctx.arc(px, py, isHov ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isHov ? "rgba(0,200,255,0.9)" : "rgba(0,180,255,0.45)";
        ctx.fill();
      });

      // ── NODES ─────────────────────────────────────────────────────────
      nodes.forEach((node, i) => {
        const { px: x, py: y } = toPixel(node);
        if (!isFinite(x) || !isFinite(y)) return;

        const pulse     = Math.sin(t * 1.8 + i * 0.6) * 0.18 + 1;
        const isHov     = hoveredNode === node.id;
        // Zoom scales visual node size only, not position
        const baseSize  = (node.size > 0 ? node.size : 10) * pulse * zoom * (isHov ? 1.35 : 1);

        if (!isFinite(baseSize) || baseSize <= 0) return;

        const color = NODE_COLORS[node.type] ?? NODE_COLORS.link;

        // Outer ambient glow
        const g = ctx.createRadialGradient(x, y, 0, x, y, baseSize * 2.8);
        g.addColorStop(0,    color + (isHov ? "cc" : "66"));
        g.addColorStop(0.45, color + "33");
        g.addColorStop(1,    color + "00");
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

        // Inner white dot (gives the "glowing orb" look)
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();

        // Ring for hovered node
        if (isHov) {
          ctx.beginPath();
          ctx.arc(x, y, baseSize * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = color + "99";
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }

        // Label — always for core, hover for others
        if (isHov || node.type === "core") {
          ctx.font      = `${isHov ? "600 " : ""}11px 'GeistMono', monospace`;
          ctx.fillStyle = isHov ? "#fff" : "rgba(255,255,255,0.7)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, x, y - baseSize * 0.85);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [zoom, hoveredNode, nodes, edges]);

  // ── Hit testing ──────────────────────────────────────────────────────────────
  // LOGIC: Convert mouse event coords → canvas pixel space using the same
  // (node.x/100)*W formula as the draw loop. scaleX/Y handles cases where
  // CSS size ≠ canvas pixel size (e.g. devicePixelRatio or flex layout).
  const getHitNode = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect  = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top)  * scaleY;

      for (const node of nodes) {
        const nx = (node.x / 100) * canvas.width;
        const ny = (node.y / 100) * canvas.height;
        if (isFinite(nx) && isFinite(ny) && Math.hypot(mx - nx, my - ny) < (node.size || 10) * zoom * 1.6) {
          return node.id;
        }
      }
      return null;
    },
    [nodes, zoom]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const found = getHitNode(e);
    setHoveredNode(found);
    if (canvasRef.current) canvasRef.current.style.cursor = found ? "pointer" : "default";
  }, [getHitNode, setHoveredNode]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const id = getHitNode(e);
    if (id) {
      const node = nodes.find((n) => n.id === id);
      if (node) onNodeClick(node);
    }
  }, [getHitNode, nodes, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ background: "transparent" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredNode(null)}
      onClick={handleClick}
    />
  );
}

// ── Stat mini-card ─────────────────────────────────────────────────────────────
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

// ── Node detail panel ──────────────────────────────────────────────────────────
function NodeDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const color = NODE_COLORS[node.type] ?? NODE_COLORS.link;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="absolute top-4 right-4 w-56 glass-card p-4 z-10"
      style={{ border: `1px solid ${color}66`, boxShadow: `0 0 24px ${color}33` }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted hover:text-foreground text-xs"
      >
        ✕
      </button>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="font-sentient text-sm text-foreground">{node.label}</span>
      </div>
      <div className="space-y-2">
        {[
          ["Type",     node.type,                                   color],
          ["Links",    String(node.connections),                    undefined],
          ["Position", `${node.x.toFixed(0)}%, ${node.y.toFixed(0)}%`, undefined],
        ].map(([label, val, clr]) => (
          <div key={label as string} className="flex justify-between">
            <span className="font-mono text-xs text-muted">{label}</span>
            <span className="font-mono text-xs capitalize" style={{ color: (clr as string) ?? "inherit" }}>
              {val}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="font-mono text-xs text-muted">{node.detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── TigerGraph integration notes ───────────────────────────────────────────────
// WHAT api.getGraph() MUST RETURN for full graph rendering:
//
// {
//   nodes: [
//     {
//       id: "v1",                 ← string or number vertex id
//       v_id: "v1",               ← TigerGraph REST++ field (fallback)
//       label: "Patent Alpha",    ← display name
//       type: "patent",           ← maps to GraphNode["type"]
//       x: 45,                   ← optional: 0-100 or any range (normalised)
//       y: 30,                   ← optional: 0-100 or any range
//       connections: 3,           ← degree / link count
//       detail: "US Patent...",   ← tooltip description
//     },
//     ...
//   ],
//   edges: [
//     {
//       from: "v1",               ← must match a node id
//       to:   "v2",               ← must match a node id
//       from_id: "v1",            ← TigerGraph REST++ fallback
//       to_id:   "v2",            ← TigerGraph REST++ fallback
//       weight: 0.8,              ← optional 0-1 (affects line opacity/width)
//     },
//     ...
//   ]
// }
//
// If your GSQL query returns results in a different shape, update the
// field aliases in normaliseNodes() and the edge-normalisation block in
// handleTigerConnect() / the mount useEffect.
//
// Common TigerGraph REST++ shapes this code already handles:
//   • data.vertices  / data.results (node array fallbacks)
//   • n.v_id         (vertex id)
//   • n.v_type       (vertex type)
//   • n.attributes.x / n.attributes.label / n.attributes.description
//   • e.from_id / e.to_id / e.src / e.dst  (edge endpoint fallbacks)

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [zoom, setZoom]                 = useState(1);
  const [hoveredNode, setHoveredNode]   = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [tigStatus, setTigStatus]       = useState<"idle" | "connecting" | "live">("idle");
  const [nodes, setNodes]               = useState<GraphNode[]>(FALLBACK_NODES);
  const [edges, setEdges]               = useState<GraphEdge[]>(FALLBACK_EDGES);
  const [recentEvents, setRecentEvents] = useState<Array<{id: string; label: string; ts: number}>>([]);

  // ── Normalise raw API edges ──────────────────────────────────────────────────
  // LOGIC: TigerGraph edge responses use from_id/to_id (REST++) or
  // from/to (custom API). We accept all variants and strip invalid edges.
  const processEdges = (rawEdges: any[]): GraphEdge[] =>
    rawEdges
      .map((e: any) => ({
        from:   String(e.from   ?? e.from_id ?? e.src ?? ""),
        to:     String(e.to     ?? e.to_id   ?? e.dst ?? ""),
        weight: Number(e.weight ?? e.attributes?.weight ?? 0.5),
      }))
      .filter((e: GraphEdge) => e.from && e.to && e.from !== e.to);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.getGraph()
      .then((data: any) => {
        const rawNodes: any[] = data?.nodes ?? data?.vertices ?? data?.results ?? [];
        const rawEdges: any[] = data?.edges ?? data?.results?.edges ?? [];

        if (rawNodes.length > 0) {
          setNodes(normaliseNodes(rawNodes));
          setTigStatus("live");
        }
        if (rawEdges.length > 0) {
          setEdges(processEdges(rawEdges));
        }
      })
      .catch(() => {
        console.warn("Network graph: backend unreachable, using fallback data");
      });
  }, []);

  // ── Real-time SSE: listen for new nodes broadcast by backend ─────────────────
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const es = new EventSource(`${BASE}/api/network/events`);

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "node_added" && msg.payload) {
          const { node: rawNode, edge: rawEdge } = msg.payload;
          if (rawNode) {
            const newNode = normaliseNodes([rawNode])[0];
            if (newNode) {
              setNodes((prev) => {
                if (prev.find((n) => n.id === newNode.id)) return prev;
                return [...prev, newNode];
              });
            }
          }
          if (rawEdge) {
            const processed = {
              from: String(rawEdge.from ?? rawEdge.from_id ?? ""),
              to:   String(rawEdge.to   ?? rawEdge.to_id   ?? ""),
              weight: Number(rawEdge.weight ?? 0.5),
            };
            if (processed.from && processed.to) {
              setEdges((prev) => {
                if (prev.find((e) => e.from === processed.from && e.to === processed.to)) return prev;
                return [...prev, processed];
              });
            }
          }
          // Flash the node count green briefly to signal new data
          setTigStatus("live");
          if (rawNode?.label) {
            setRecentEvents((prev) => [
              { id: String(Date.now()), label: rawNode.label, ts: Date.now() },
              ...prev.slice(0, 4),
            ]);
          }
        }
      } catch (_) {}
    };

    return () => es.close();
  }, []);

  const handleZoomIn  = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset   = () => { setZoom(1); setSelectedNode(null); setHoveredNode(null); };

  const handleTigerConnect = () => {
    setTigStatus("connecting");
    api.getGraph()
      .then((data: any) => {
        const rawNodes: any[] = data?.nodes ?? data?.vertices ?? data?.results ?? [];
        const rawEdges: any[] = data?.edges ?? data?.results?.edges ?? [];

        if (rawNodes.length > 0) {
          setNodes(normaliseNodes(rawNodes));
          setTigStatus("live");
        } else {
          setTigStatus("idle");
        }
        if (rawEdges.length > 0) setEdges(processEdges(rawEdges));
      })
      .catch(() => setTigStatus("idle"));
  };

  const topNodes = [...nodes].sort((a, b) => b.connections - a.connections).slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto">
      <AppHeader title="Network" />

      {/* Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <MiniStat label="Total Nodes"   value={nodes.length.toLocaleString()} delay={0}   />
        <MiniStat label="Connections"   value={edges.length.toLocaleString()} delay={0.1} />
        <MiniStat
          label="Graph Density"
          value={nodes.length > 0 ? (edges.length / nodes.length).toFixed(2) : "0"}
          delay={0.2}
        />
      </div>

      {/* TigerGraph status banner */}
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
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              tigStatus === "live"       ? "bg-green-400" :
              tigStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
              "bg-white/30"
            }`}
            style={{ boxShadow: tigStatus === "live" ? "0 0 8px rgba(34,197,94,0.8)" : undefined }}
          />
          <div>
            <p className="font-mono text-xs text-foreground uppercase tracking-wider">
              TigerGraph Database
              {tigStatus === "live"       && <span className="text-green-400 ml-2">● Live</span>}
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
          <span className="font-mono text-xs text-green-400 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            {nodes.length} nodes loaded
          </span>
        )}
      </motion.div>

      {/* Graph card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-mono text-sm text-muted uppercase tracking-wider mb-0.5">
              TigerGraph Visualization
            </h3>
            <p className="font-mono text-xs text-muted">
              {tigStatus === "live"
                ? "Live TigerGraph data · Real-time IP asset relationship mapping"
                : "Static fallback · click Connect to load live data"}{" "}
              · click a node to inspect
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

        {/* Canvas container — explicit height required for ResizeObserver */}
        <div className="relative h-[480px] rounded-xl bg-black/60 border border-card-border overflow-hidden">
          <NetworkGraph
            zoom={zoom}
            onNodeClick={setSelectedNode}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            nodes={nodes}
            edges={edges}
          />

          <AnimatePresence>
            {selectedNode && (
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex gap-4 flex-wrap pointer-events-none">
            {(["core", "patent", "research", "algorithm", "data"] as const).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[type], boxShadow: `0 0 5px ${NODE_COLORS[type]}` }}
                />
                <span className="font-mono text-[10px] text-muted capitalize">
                  {type === "core" ? "Core IP" : type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </div>
            ))}
          </div>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredNode && !selectedNode && (() => {
              const n = nodes.find((x) => x.id === hoveredNode);
              return n ? (
                <motion.div
                  key={hoveredNode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-4 right-4 px-3 py-2 rounded-lg glass-card pointer-events-none"
                  style={{ border: `1px solid ${NODE_COLORS[n.type] ?? NODE_COLORS.link}55` }}
                >
                  <p className="font-mono text-xs text-foreground">{n.label}</p>
                  <p className="font-mono text-xs text-muted capitalize">{n.type} · {n.connections} connections</p>
                </motion.div>
              ) : null;
            })()}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Real-time event feed */}
      <AnimatePresence>
        {recentEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-4 mb-6"
            style={{ borderTop: "1px solid rgba(34,197,94,0.4)" }}
          >
            <p className="font-mono text-xs text-green-400 uppercase tracking-wider mb-3">⬤ Live — New Nodes Added</p>
            <div className="flex flex-col gap-2">
              {recentEvents.map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <span className="text-foreground">{ev.label}</span>
                  <span className="text-muted">{new Date(ev.ts).toLocaleTimeString()}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top connected nodes */}
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
          {topNodes.map((node, index) => {
            const color = NODE_COLORS[node.type] ?? NODE_COLORS.link;
            return (
              <motion.div
                key={node.id || index}
                whileHover={{ y: -5, boxShadow: `0 0 20px 3px ${color}29`, borderColor: `${color}59` }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelectedNode(node)}
                className="p-4 rounded-lg bg-white/[0.02] border border-card-border cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}99` }} />
                  <p className="font-mono text-sm text-foreground">{node.label}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted capitalize">{node.type}</span>
                  <span className="font-mono text-xs" style={{ color }}>{node.connections} links</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
