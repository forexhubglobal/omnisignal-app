"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivePairAnalysis, ManifoldNode } from "@/types/quant";

interface Props {
  active: ActivePairAnalysis;
  onSelectPair: (symbol: string) => void;
  onManualScan: () => void;
  scanning: boolean;
}

interface TorusParticle {
  u: number;
  v: number;
  spike: number;
  size: number;
  zone: "CYAN" | "TEAL" | "GOLD" | "CORAL";
  phase: number;
}

function MiniSparkline({ data, bias }: { data?: number[]; bias: ManifoldNode["bias"] }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 1e-6);
  const w = 136;
  const h = 22;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke =
    bias === "BULL"
      ? "#00f59b"
      : bias === "BEAR"
      ? "#ff3b5c"
      : bias === "WARN"
      ? "#f59e0b"
      : "#00d4ff";

  const areaPts = `0,${h} ${pts} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[22px] mt-1 overflow-visible">
      <polygon points={areaPts} fill={stroke} fillOpacity={0.12} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        points={pts}
      />
    </svg>
  );
}

function CompositeMiniCurve({ candles }: { candles: ActivePairAnalysis["candles"] }) {
  const slice = candles.slice(-48);
  if (slice.length < 2) return null;
  const vals = slice.map((c) => c.composite);
  const min = Math.min(...vals, -40);
  const max = Math.max(...vals, 40);
  const span = Math.max(max - min, 1);
  const w = 185;
  const h = 66;

  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - 5 - ((v - min) / span) * (h - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const zeroY = h - 5 - ((0 - min) / span) * (h - 10);

  return (
    <div className="border border-cyan-500/20 bg-[#040a12]/90 p-2">
      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
        <span>ALPHA CONFLUENCE DRIFT</span>
        <span className="text-cyan-300">{vals[vals.length - 1]?.toFixed(1)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[64px]">
        <line
          x1={0}
          y1={zeroY}
          x2={w}
          y2={zeroY}
          stroke="rgba(148,163,184,0.22)"
          strokeDasharray="2 2"
        />
        <polygon
          points={`0,${h} ${pts} ${w},${h}`}
          fill="rgba(0, 212, 255, 0.10)"
        />
        <polyline fill="none" stroke="#e2e8f0" strokeWidth="1.4" points={pts} />
      </svg>
    </div>
  );
}

export default function TorusManifoldHUD({
  active,
  onSelectPair,
  onManualScan,
  scanning,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ dragging: boolean; lastX: number; lastY: number; rotX: number; rotZ: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    rotX: 1.04,
    rotZ: 0.35,
  });

  const [anchors, setAnchors] = useState<{
    left: { x: number; y: number }[];
    right: { x: number; y: number }[];
    size: { w: number; h: number };
  }>({ left: [], right: [], size: { w: 1200, h: 470 } });

  // Deterministic 2,500-particle 3D torus + radial filament spikes matching reference image
  const particles = useMemo<TorusParticle[]>(() => {
    const list: TorusParticle[] = [];
    const ringSteps = 84;
    const tubeSteps = 28;

    for (let i = 0; i < ringSteps; i++) {
      const u = (i / ringSteps) * Math.PI * 2;
      for (let j = 0; j < tubeSteps; j++) {
        const v = (j / tubeSteps) * Math.PI * 2;
        const hash = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const frac = hash - Math.floor(hash);

        // Create organic radial burst filaments in 4 cluster lobes like the screenshot
        const lobeA = Math.exp(-Math.pow(Math.sin((u - 0.55) * 1.5), 2) * 14);
        const lobeB = Math.exp(-Math.pow(Math.sin((u - 3.75) * 1.5), 2) * 14);
        const isOuter = Math.cos(v) > 0.25;
        const spike = isOuter && frac > 0.76 ? (lobeA * 42 + lobeB * 36 + frac * 14) : 0;

        let zone: TorusParticle["zone"] = "CYAN";
        if (u > 5.1 || u < 1.35) {
          zone = spike > 12 ? "CORAL" : "GOLD";
        } else if (u > 3.35 && u < 4.35 && spike > 8) {
          zone = "GOLD";
        } else if (Math.sin(v) > 0.3) {
          zone = "TEAL";
        }

        list.push({
          u,
          v,
          spike,
          size: spike > 10 ? 1.75 : 1.35 + frac * 0.65,
          zone,
          phase: frac * Math.PI * 2,
        });
      }
    }
    return list;
  }, []);

  const leftNodes = active.manifold.left_nodes;
  const rightNodes = active.manifold.right_nodes;
  const { energy, bull_ratio, turbulence } = active.manifold.params;

  useEffect(() => {
    let animId = 0;
    let frameCount = 0;

    const projectPoint = (
      u: number,
      v: number,
      R: number,
      r: number,
      rotX: number,
      rotZ: number,
      cx: number,
      cy: number
    ) => {
      const uRot = u + rotZ;
      const x0 = (R + r * Math.cos(v)) * Math.cos(uRot);
      const y0 = (R + r * Math.cos(v)) * Math.sin(uRot);
      const z0 = r * Math.sin(v);

      // Tilt torus in 3D space
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y1 = y0 * cosX - z0 * sinX;
      const z1 = y0 * sinX + z0 * cosX;

      const fov = 560;
      const scale = fov / (fov + y1 + 360);
      return {
        sx: cx + x0 * scale,
        sy: cy - z1 * scale,
        depth: y1,
        scale,
      };
    };

    const render = (timeMs: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(360, Math.floor(rect.height));

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (!dragRef.current.dragging) {
        dragRef.current.rotZ += 0.0026 * energy;
      }

      const t = timeMs * 0.0018;
      const cx = w * 0.49;
      const cy = h * 0.51;
      const majorR = Math.min(w * 0.215, 195);
      const minorR = Math.min(majorR * 0.44, 84);

      // Ambient radial core glow
      const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, majorR * 1.55);
      grad.addColorStop(0, "rgba(0, 212, 255, 0.11)");
      grad.addColorStop(0.55, "rgba(16, 185, 129, 0.04)");
      grad.addColorStop(1, "rgba(3, 7, 12, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const rotX = dragRef.current.rotX;
      const rotZ = dragRef.current.rotZ;

      const projected = particles.map((p) => {
        const wave = Math.sin(p.u * 4 + t + p.phase) * (3.5 + turbulence * 5.0);
        const spikePulse = p.spike > 0 ? p.spike * (0.72 + 0.28 * Math.sin(t * 1.7 + p.phase)) : 0;
        const rLocal = minorR + wave + spikePulse;
        const pt = projectPoint(p.u, p.v, majorR, rLocal, rotX, rotZ, cx, cy);

        // If particle has a high radial spike, also project its base to draw filament hairlines
        let basePt: { sx: number; sy: number } | null = null;
        if (spikePulse > 11) {
          const b = projectPoint(p.u, p.v, majorR, minorR + wave * 0.4, rotX, rotZ, cx, cy);
          basePt = { sx: b.sx, sy: b.sy };
        }
        return { ...pt, p, basePt };
      });

      projected.sort((a, b) => b.depth - a.depth);

      for (const item of projected) {
        const alpha = Math.max(0.14, Math.min(0.96, (item.scale - 0.52) * 1.95));
        let rgb = "0, 224, 255";
        if (item.p.zone === "TEAL") {
          rgb = bull_ratio >= 0.5 ? "0, 245, 165" : "20, 184, 166";
        } else if (item.p.zone === "GOLD") {
          rgb = "245, 178, 35";
        } else if (item.p.zone === "CORAL") {
          rgb = "255, 92, 75";
        }

        if (item.basePt) {
          ctx.strokeStyle = `rgba(${rgb}, ${alpha * 0.34})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(item.basePt.sx, item.basePt.sy);
          ctx.lineTo(item.sx, item.sy);
          ctx.stroke();
        }

        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        const radius = item.p.size * item.scale * 1.15;
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update SVG leader line anchor coordinates every 3 frames for smooth 20fps React overlay without CPU waste
      frameCount++;
      if (frameCount % 3 === 0) {
        const leftPts = leftNodes.map((n, idx) => {
          const rad = ((n.anchor_angle || 150 + idx * 16) * Math.PI) / 180;
          const vAng = -0.35 + idx * 0.22;
          const pt = projectPoint(rad - rotZ * 0.82, vAng, majorR * 0.96, minorR * 0.85, rotX, rotZ, cx, cy);
          return { x: pt.sx, y: pt.sy };
        });

        const rightPts = rightNodes.map((n, idx) => {
          const rad = ((n.anchor_angle || 330 + idx * 14) * Math.PI) / 180;
          const vAng = -0.4 + idx * 0.2;
          const pt = projectPoint(rad - rotZ * 0.82, vAng, majorR * 0.96, minorR * 0.85, rotX, rotZ, cx, cy);
          return { x: pt.sx, y: pt.sy };
        });

        setAnchors({ left: leftPts, right: rightPts, size: { w, h } });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [particles, leftNodes, rightNodes, energy, bull_ratio, turbulence]);

  const badgeColor = (bias: ManifoldNode["bias"]) => {
    if (bias === "BULL") return "text-[#00f59b] border-[#00f59b]/40 bg-[#00f59b]/10";
    if (bias === "BEAR") return "text-[#ff3b5c] border-[#ff3b5c]/40 bg-[#ff3b5c]/10";
    if (bias === "WARN") return "text-amber-400 border-amber-400/40 bg-amber-400/10";
    return "text-cyan-300 border-cyan-400/40 bg-cyan-400/10";
  };

  return (
    <section className="hud-panel w-full overflow-hidden">
      {/* Top Manifold Strip */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-cyan-500/15 bg-[#040a13]/90 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider text-cyan-100">
            SIGNAL NODES · 3D QUANTITATIVE TOPOLOGY MANIFOLD
          </span>
          <span className="text-slate-500 hidden sm:inline">
            [DRAG 3D MANIFOLD TO ORBIT · CLICK PAIR ALPHA TO SWITCH]
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-slate-400">
            NODES <strong className="text-cyan-300">2,352</strong>
          </span>
          <span className="text-slate-400">
            COHERENCE <strong className="text-[#00f59b]">{(active.manifold.params.coherence * 100).toFixed(1)}%</strong>
          </span>
          <button
            onClick={onManualScan}
            disabled={scanning}
            className="px-2 py-0.5 border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-200 transition cursor-pointer disabled:opacity-50"
          >
            {scanning ? "SCANNING..." : "↻ FORCE CRON SYNC"}
          </button>
        </div>
      </div>

      {/* Main 3D Manifold Stage */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          dragRef.current.dragging = true;
          dragRef.current.lastX = e.clientX;
          dragRef.current.lastY = e.clientY;
        }}
        onMouseMove={(e) => {
          if (!dragRef.current.dragging) return;
          const dx = e.clientX - dragRef.current.lastX;
          const dy = e.clientY - dragRef.current.lastY;
          dragRef.current.rotZ += dx * 0.008;
          dragRef.current.rotX = Math.max(0.35, Math.min(1.45, dragRef.current.rotX + dy * 0.006));
          dragRef.current.lastX = e.clientX;
          dragRef.current.lastY = e.clientY;
        }}
        onMouseUp={() => {
          dragRef.current.dragging = false;
        }}
        onMouseLeave={() => {
          dragRef.current.dragging = false;
        }}
        className="relative w-full min-h-[500px] lg:h-[515px] select-none cursor-grab active:cursor-grabbing"
      >
        {/* 3D Particle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Dynamic SVG HUD Callout Leader Lines (Desktop) */}
        <svg
          viewBox={`0 0 ${anchors.size.w} ${anchors.size.h}`}
          className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
        >
          {leftNodes.map((node, i) => {
            const target = anchors.left[i];
            if (!target) return null;
            const cardY = 36 + i * 66;
            const startX = 196;
            const kneeX = startX + 38;
            const stroke =
              node.bias === "BULL"
                ? "rgba(0,245,155,0.62)"
                : node.bias === "BEAR"
                ? "rgba(255,59,92,0.62)"
                : "rgba(226,232,240,0.52)";
            return (
              <g key={node.id}>
                <polyline
                  fill="none"
                  stroke={stroke}
                  strokeWidth="0.9"
                  points={`${startX},${cardY} ${kneeX},${cardY} ${target.x.toFixed(1)},${target.y.toFixed(1)}`}
                />
                <circle cx={target.x} cy={target.y} r="2.3" fill="#ffffff" />
              </g>
            );
          })}

          {rightNodes.map((node, i) => {
            const target = anchors.right[i];
            if (!target) return null;
            const cardY = 30 + i * 48;
            const endX = anchors.size.w - 210;
            const kneeX = endX - 36;
            const stroke =
              node.bias === "BULL"
                ? "rgba(0,245,155,0.58)"
                : node.bias === "BEAR"
                ? "rgba(255,59,92,0.58)"
                : "rgba(0,212,255,0.52)";
            return (
              <g key={node.id}>
                <polyline
                  fill="none"
                  stroke={stroke}
                  strokeWidth="0.9"
                  points={`${target.x.toFixed(1)},${target.y.toFixed(1)} ${kneeX},${cardY} ${endX},${cardY}`}
                />
                <circle cx={target.x} cy={target.y} r="2.3" fill="#00d4ff" />
              </g>
            );
          })}
        </svg>

        {/* Left 7 Factor & Indicator Micro-Cards */}
        <div className="relative lg:absolute lg:left-2.5 lg:top-2.5 lg:w-[190px] flex flex-col gap-1.5 p-2 lg:p-0 z-10">
          {leftNodes.map((node) => (
            <div
              key={node.id}
              className="border border-slate-700/60 bg-[#050c16]/90 px-2 py-1.5 backdrop-blur-sm hover:border-cyan-400/50 transition"
            >
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <span className="text-slate-400 truncate">{node.label}</span>
                <span
                  className={`font-bold px-1 border text-[9px] ${badgeColor(node.bias)}`}
                >
                  {node.value}
                </span>
              </div>
              <MiniSparkline data={node.spark} bias={node.bias} />
              <div className="text-[8.5px] text-slate-500 truncate mt-0.5">{node.sub}</div>
            </div>
          ))}
        </div>

        {/* Center Floating Active Signal Pill */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-3 items-center gap-4 px-4 py-1.5 bg-[#040a13]/90 border border-cyan-500/30 text-[10px] z-10">
          <div>
            <span className="text-slate-400 mr-1.5">ACTIVE PAIR:</span>
            <strong className="text-cyan-200">{active.symbol}</strong>
            <span className="text-slate-500 ml-1">({active.timeframe})</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div>
            <span className="text-slate-400 mr-1.5">QUANT SIGNAL:</span>
            <strong
              className={
                active.signal.direction === "BUY"
                  ? "text-[#00f59b]"
                  : active.signal.direction === "SELL"
                  ? "text-[#ff3b5c]"
                  : "text-amber-400"
              }
            >
              {active.signal.direction} ({active.signal.confidence}%)
            </strong>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="text-slate-300">
            SL <span className="text-[#ff3b5c]">{active.signal.stop_loss}</span> · TP{" "}
            <span className="text-[#00f59b]">{active.signal.take_profit}</span>
          </div>
        </div>

        {/* Right 8 Alpha / Session / News Micro-Cards + Bottom Curve */}
        <div className="relative lg:absolute lg:right-2.5 lg:top-2.5 lg:w-[205px] flex flex-col gap-1.5 p-2 lg:p-0 z-10">
          {rightNodes.map((node) => {
            const isPairCard = node.id.startsWith("pair_");
            const pairSym = isPairCard ? node.id.replace("pair_", "") : "";
            return (
              <div
                key={node.id}
                onClick={() => isPairCard && onSelectPair(pairSym)}
                className={`border px-2 py-1 bg-[#050c16]/90 backdrop-blur-sm transition ${
                  isPairCard
                    ? "cursor-pointer hover:border-cyan-400/70"
                    : "border-slate-700/60"
                } ${
                  pairSym === active.symbol
                    ? "border-cyan-400/75 bg-cyan-950/25"
                    : "border-slate-700/60"
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[9px]">
                  <span className="text-slate-300 font-medium truncate">{node.label}</span>
                  <span className={`px-1 border text-[8.5px] font-bold ${badgeColor(node.bias)}`}>
                    {node.value}
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-400 truncate mt-0.5">{node.sub}</div>
              </div>
            );
          })}

          <CompositeMiniCurve candles={active.candles} />
        </div>
      </div>
    </section>
  );
}
