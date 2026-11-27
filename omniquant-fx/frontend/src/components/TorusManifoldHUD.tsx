"use client";

import React, { memo, useEffect, useMemo, useRef } from "react";
import { ActivePairAnalysis, ManifoldNode } from "@/types/quant";

interface Props {
  active: ActivePairAnalysis;
  onSelectPair: (symbol: string) => void;
  onManualScan: () => void;
  scanning: boolean;
  jarvisSpeaking?: boolean;
}

interface TorusParticle {
  cosU: number;
  sinU: number;
  cosV: number;
  sinV: number;
  u: number;
  spike: number;
  size: number;
  zone: 0 | 1 | 2 | 3; // 0=CYAN, 1=TEAL, 2=GOLD, 3=CORAL
  phase: number;
}

const MiniSparkline = memo(function MiniSparkline({
  data,
  bias,
}: {
  data?: number[];
  bias: ManifoldNode["bias"];
}) {
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[22px] mt-1 overflow-visible">
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={stroke} fillOpacity={0.12} />
      <polyline fill="none" stroke={stroke} strokeWidth="1.25" points={pts} />
    </svg>
  );
});

const CompositeMiniCurve = memo(function CompositeMiniCurve({
  candles,
}: {
  candles: ActivePairAnalysis["candles"];
}) {
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
        <polygon points={`0,${h} ${pts} ${w},${h}`} fill="rgba(0, 212, 255, 0.10)" />
        <polyline fill="none" stroke="#e2e8f0" strokeWidth="1.4" points={pts} />
      </svg>
    </div>
  );
});

function TorusManifoldHUD({
  active,
  onSelectPair,
  onManualScan,
  scanning,
  jarvisSpeaking = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1200, h: 515 });
  const dragRef = useRef<{
    dragging: boolean;
    lastX: number;
    lastY: number;
    rotX: number;
    rotZ: number;
  }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    rotX: 1.04,
    rotZ: 0.35,
  });

  // Precompute trigonometric tables once -> 0 trig overhead per particle!
  const particles = useMemo<TorusParticle[]>(() => {
    const list: TorusParticle[] = [];
    const ringSteps = 60;
    const tubeSteps = 20;

    for (let i = 0; i < ringSteps; i++) {
      const u = (i / ringSteps) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      for (let j = 0; j < tubeSteps; j++) {
        const v = (j / tubeSteps) * Math.PI * 2;
        const cosV = Math.cos(v);
        const sinV = Math.sin(v);
        const hash = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const frac = hash - Math.floor(hash);

        const lobeA = Math.exp(-Math.pow(Math.sin((u - 0.55) * 1.5), 2) * 14);
        const lobeB = Math.exp(-Math.pow(Math.sin((u - 3.75) * 1.5), 2) * 14);
        const spike = cosV > 0.25 && frac > 0.74 ? lobeA * 40 + lobeB * 34 + frac * 12 : 0;

        let zone: 0 | 1 | 2 | 3 = 0;
        if (u > 5.1 || u < 1.35) {
          zone = spike > 12 ? 3 : 2;
        } else if (u > 3.35 && u < 4.35 && spike > 8) {
          zone = 2;
        } else if (sinV > 0.3) {
          zone = 1;
        }

        list.push({
          cosU,
          sinU,
          cosV,
          sinV,
          u,
          spike,
          size: spike > 10 ? 2.4 : 1.85 + frac * 0.65,
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
    const container = containerRef.current;
    if (!container) return;

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      sizeRef.current = {
        w: Math.max(320, Math.floor(rect.width)),
        h: Math.max(360, Math.floor(rect.height)),
      };
    };
    updateBounds();

    const ro = new ResizeObserver(updateBounds);
    ro.observe(container);

    let animId = 0;
    let lastFrameMs = 0;

    const projectAngle = (
      u: number,
      v: number,
      R: number,
      r: number,
      cosX: number,
      sinX: number,
      rotZ: number,
      cx: number,
      cy: number
    ) => {
      const uRot = u + rotZ;
      const rad = R + r * Math.cos(v);
      const x0 = rad * Math.cos(uRot);
      const y0 = rad * Math.sin(uRot);
      const z0 = r * Math.sin(v);
      const y1 = y0 * cosX - z0 * sinX;
      const z1 = y0 * sinX + z0 * cosX;
      const scale = 560 / (920 + y1);
      return { sx: cx + x0 * scale, sy: cy - z1 * scale };
    };

    const render = (timeMs: number) => {
      animId = requestAnimationFrame(render);

      if (document.hidden) return;
      // Smooth 30 FPS cap when idle (60 FPS while actively dragging) -> ultra-low CPU!
      const minDelta = dragRef.current.dragging ? 16 : 33;
      if (timeMs - lastFrameMs < minDelta) return;
      lastFrameMs = timeMs;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const { w, h } = sizeRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const targetW = Math.floor(w * dpr);
      const targetH = Math.floor(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (!dragRef.current.dragging) {
        dragRef.current.rotZ += 0.005 * energy * (jarvisSpeaking ? 2.4 : 1.0);
      }

      const t = timeMs * 0.0018;
      const cx = w * 0.49;
      const cy = h * 0.51;
      const majorR = Math.min(w * 0.215, 195);
      const minorR = Math.min(majorR * 0.44, 84);

      const rotX = dragRef.current.rotX;
      const rotZ = dragRef.current.rotZ;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);

      // Ambient glow
      const grad = ctx.createRadialGradient(cx, cy, 14, cx, cy, majorR * 1.45);
      grad.addColorStop(0, "rgba(0, 212, 255, 0.10)");
      grad.addColorStop(1, "rgba(3, 7, 12, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - majorR * 1.5, cy - majorR * 1.5, majorR * 3, majorR * 3);

      const tealRgb = bull_ratio >= 0.5 ? "0, 245, 165" : "20, 184, 166";
      const palettes = ["0, 224, 255", tealRgb, "245, 178, 35", "255, 92, 75"];

      // Fast direct particle rendering using rotation identity cos(u+rotZ) = cosU*cosZ - sinU*sinZ
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const wave = Math.sin(p.u * 4 + t + p.phase) * (3.2 + turbulence * 4.5);
        const spikePulse = p.spike > 0 ? p.spike * (0.72 + 0.28 * Math.sin(t * 1.7 + p.phase)) : 0;
        const rLocal = minorR + wave + spikePulse;

        const cosUR = p.cosU * cosZ - p.sinU * sinZ;
        const sinUR = p.sinU * cosZ + p.cosU * sinZ;
        const rad = majorR + rLocal * p.cosV;
        const x0 = rad * cosUR;
        const y0 = rad * sinUR;
        const z0 = rLocal * p.sinV;

        const y1 = y0 * cosX - z0 * sinX;
        const z1 = y0 * sinX + z0 * cosX;
        const scale = 560 / (920 + y1);
        const sx = cx + x0 * scale;
        const sy = cy - z1 * scale;

        const alpha = Math.max(0.16, Math.min(0.95, (scale - 0.5) * 2.1));
        const rgb = palettes[p.zone];

        if (spikePulse > 12) {
          const bRad = majorR + (minorR + wave * 0.4) * p.cosV;
          const bx0 = bRad * cosUR;
          const by0 = bRad * sinUR;
          const bz0 = (minorR + wave * 0.4) * p.sinV;
          const by1 = by0 * cosX - bz0 * sinX;
          const bz1 = by0 * sinX + bz0 * cosX;
          const bScale = 560 / (920 + by1);
          ctx.strokeStyle = `rgba(${rgb}, ${alpha * 0.32})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(cx + bx0 * bScale, cy - bz1 * bScale);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        const sz = p.size * scale;
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fillRect(sx - sz * 0.5, sy - sz * 0.5, sz, sz);
      }

      // Draw HUD Callout Leader Lines directly on Canvas (ZERO React re-renders!)
      if (w >= 1024) {
        ctx.lineWidth = 0.9;
        for (let i = 0; i < leftNodes.length; i++) {
          const node = leftNodes[i];
          const ang = ((node.anchor_angle || 150 + i * 16) * Math.PI) / 180;
          const pt = projectAngle(
            ang - rotZ * 0.82,
            -0.35 + i * 0.22,
            majorR * 0.96,
            minorR * 0.85,
            cosX,
            sinX,
            rotZ,
            cx,
            cy
          );
          const cardY = 36 + i * 66;
          ctx.strokeStyle =
            node.bias === "BULL"
              ? "rgba(0,245,155,0.58)"
              : node.bias === "BEAR"
              ? "rgba(255,59,92,0.58)"
              : "rgba(226,232,240,0.48)";
          ctx.beginPath();
          ctx.moveTo(196, cardY);
          ctx.lineTo(234, cardY);
          ctx.lineTo(pt.sx, pt.sy);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(pt.sx - 2, pt.sy - 2, 4, 4);
        }

        const endX = w - 210;
        const kneeX = endX - 36;
        for (let i = 0; i < rightNodes.length; i++) {
          const node = rightNodes[i];
          const ang = ((node.anchor_angle || 330 + i * 14) * Math.PI) / 180;
          const pt = projectAngle(
            ang - rotZ * 0.82,
            -0.4 + i * 0.2,
            majorR * 0.96,
            minorR * 0.85,
            cosX,
            sinX,
            rotZ,
            cx,
            cy
          );
          const cardY = 30 + i * 48;
          ctx.strokeStyle =
            node.bias === "BULL"
              ? "rgba(0,245,155,0.55)"
              : node.bias === "BEAR"
              ? "rgba(255,59,92,0.55)"
              : "rgba(0,212,255,0.48)";
          ctx.beginPath();
          ctx.moveTo(pt.sx, pt.sy);
          ctx.lineTo(kneeX, cardY);
          ctx.lineTo(endX, cardY);
          ctx.stroke();

          ctx.fillStyle = "#00d4ff";
          ctx.fillRect(pt.sx - 2, pt.sy - 2, 4, 4);
        }
      }
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [particles, leftNodes, rightNodes, energy, bull_ratio, turbulence, jarvisSpeaking]);

  const badgeColor = (bias: ManifoldNode["bias"]) => {
    if (bias === "BULL") return "text-[#00f59b] border-[#00f59b]/40 bg-[#00f59b]/10";
    if (bias === "BEAR") return "text-[#ff3b5c] border-[#ff3b5c]/40 bg-[#ff3b5c]/10";
    if (bias === "WARN") return "text-amber-400 border-amber-400/40 bg-amber-400/10";
    return "text-cyan-300 border-cyan-400/40 bg-cyan-400/10";
  };

  return (
    <section className="hud-panel w-full overflow-hidden">
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
            NODES <strong className="text-cyan-300">1,200 TURBO</strong>
          </span>
          <span className="text-slate-400">
            COHERENCE{" "}
            <strong className="text-[#00f59b]">
              {(active.manifold.params.coherence * 100).toFixed(1)}%
            </strong>
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
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Left 7 Factor & Indicator Micro-Cards */}
        <div className="relative lg:absolute lg:left-2.5 lg:top-2.5 lg:w-[190px] flex flex-col gap-1.5 p-2 lg:p-0 z-10">
          {leftNodes.map((node) => (
            <div
              key={node.id}
              className="border border-slate-700/60 bg-[#050c16]/90 px-2 py-1.5 hover:border-cyan-400/50 transition"
            >
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <span className="text-slate-400 truncate">{node.label}</span>
                <span className={`font-bold px-1 border text-[9px] ${badgeColor(node.bias)}`}>
                  {node.value}
                </span>
              </div>
              <MiniSparkline data={node.spark} bias={node.bias} />
              <div className="text-[8.5px] text-slate-500 truncate mt-0.5">{node.sub}</div>
            </div>
          ))}
        </div>

        {/* Center Floating Active Signal Pill */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-3 items-center gap-4 px-4 py-1.5 bg-[#040a13]/95 border border-cyan-500/30 text-[10px] z-10">
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
                className={`border px-2 py-1 bg-[#050c16]/90 transition ${
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

export default memo(TorusManifoldHUD);
