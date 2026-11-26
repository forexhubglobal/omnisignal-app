"use client";

import React, { useEffect, useRef } from "react";
import { ActivePairAnalysis, MatrixRow } from "@/types/quant";

interface Props {
  active: ActivePairAnalysis;
  matrix: MatrixRow[];
  onSelectPair: (symbol: string) => void;
}

function EquityCurveChart({
  filtered,
  unfiltered,
}: {
  filtered: number[];
  unfiltered: number[];
}) {
  if (filtered.length < 2) return null;
  const all = [...filtered, ...unfiltered];
  const min = Math.min(...all) * 0.998;
  const max = Math.max(...all) * 1.002;
  const span = Math.max(max - min, 1);
  const w = 260;
  const h = 112;

  const toPts = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * w;
        const y = h - 6 - ((v - min) / span) * (h - 12);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const filtPts = toPts(filtered);
  const unfiltPts = toPts(unfiltered);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[112px]">
      <defs>
        <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00f59b" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#00f59b" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((r) => (
        <line
          key={r}
          x1={0}
          y1={h * r}
          x2={w}
          y2={h * r}
          stroke="rgba(30,58,88,0.4)"
          strokeWidth="0.7"
        />
      ))}
      <polygon points={`0,${h} ${filtPts} ${w},${h}`} fill="url(#eqFill)" />
      <polyline
        fill="none"
        stroke="rgba(148,163,184,0.45)"
        strokeWidth="1.1"
        strokeDasharray="3 3"
        points={unfiltPts}
      />
      <polyline fill="none" stroke="#00f59b" strokeWidth="1.7" points={filtPts} />
    </svg>
  );
}

function PriceCandlestickCanvas({
  candles,
  digits,
}: {
  candles: ActivePairAnalysis["candles"];
  digits: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length < 5) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, rect.width);
    const h = Math.max(125, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const slice = candles.slice(-56);
    const padRight = 54;
    const padTop = 8;
    const padBot = 14;
    const plotW = w - padRight - 6;
    const plotH = h - padTop - padBot;

    let minP = Infinity;
    let maxP = -Infinity;
    for (const c of slice) {
      minP = Math.min(minP, c.low, c.ema20, c.sma50);
      maxP = Math.max(maxP, c.high, c.ema20, c.sma50);
    }
    const span = Math.max(maxP - minP, 1e-6);
    const yOf = (p: number) => padTop + (1 - (p - minP) / span) * plotH;
    const step = plotW / slice.length;

    // Horizontal gridlines + right price labels
    ctx.font = "9px JetBrains Mono, monospace";
    for (let g = 0; g <= 3; g++) {
      const ratio = g / 3;
      const gy = padTop + ratio * plotH;
      const gp = maxP - ratio * span;
      ctx.strokeStyle = "rgba(30, 58, 88, 0.35)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(4, gy);
      ctx.lineTo(plotW + 4, gy);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.fillText(gp.toFixed(digits), plotW + 8, gy + 3);
    }

    // Highlight London/NY Overlap background tint
    slice.forEach((c, idx) => {
      if (c.session.includes("OVERLAP")) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.045)";
        ctx.fillRect(4 + idx * step, padTop, step, plotH);
      } else if (c.session.includes("LONDON") || c.session.includes("NEW YORK")) {
        ctx.fillStyle = "rgba(0, 212, 255, 0.028)";
        ctx.fillRect(4 + idx * step, padTop, step, plotH);
      }
    });

    // Draw candles
    const bodyW = Math.max(2, step * 0.58);
    slice.forEach((c, idx) => {
      const cx = 4 + idx * step + step * 0.5;
      const bull = c.close >= c.open;
      const color = bull ? "#00f59b" : "#ff3b5c";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, yOf(c.high));
      ctx.lineTo(cx, yOf(c.low));
      ctx.stroke();

      const topY = yOf(Math.max(c.open, c.close));
      const botY = yOf(Math.min(c.open, c.close));
      ctx.fillStyle = color;
      ctx.fillRect(cx - bodyW / 2, topY, bodyW, Math.max(1.4, botY - topY));

      if (c.signal === "BUY" || c.signal === "SELL") {
        ctx.fillStyle = c.signal === "BUY" ? "#00f59b" : "#fbbf24";
        ctx.beginPath();
        if (c.signal === "BUY") {
          const sy = yOf(c.low) + 7;
          ctx.moveTo(cx, sy - 5);
          ctx.lineTo(cx - 3.5, sy);
          ctx.lineTo(cx + 3.5, sy);
        } else {
          const sy = yOf(c.high) - 7;
          ctx.moveTo(cx, sy + 5);
          ctx.lineTo(cx - 3.5, sy);
          ctx.lineTo(cx + 3.5, sy);
        }
        ctx.closePath();
        ctx.fill();
      }
    });

    // EMA20 (Cyan) & SMA50 (Amber)
    const drawLine = (key: "ema20" | "sma50", stroke: string) => {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      slice.forEach((c, idx) => {
        const cx = 4 + idx * step + step * 0.5;
        const cy = yOf(c[key]);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    };
    drawLine("ema20", "#00d4ff");
    drawLine("sma50", "#f59e0b");
  }, [candles, digits]);

  return <canvas ref={canvasRef} className="w-full h-[132px] block" />;
}

function DistributionChart({
  bins,
  empirical,
  gaussian,
}: ActivePairAnalysis["distribution"]) {
  if (!bins.length) return null;
  const maxY = Math.max(...empirical, ...gaussian, 0.45);
  const w = 310;
  const h = 68;

  const gaussPts = gaussian
    .map((g, i) => {
      const x = (i / (gaussian.length - 1)) * w;
      const y = h - 4 - (g / maxY) * (h - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const barW = w / empirical.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[68px]">
      <defs>
        <linearGradient id="gaussGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {empirical.map((v, i) => {
        const bh = (v / maxY) * (h - 10);
        return (
          <rect
            key={i}
            x={i * barW + 0.8}
            y={h - 4 - bh}
            width={Math.max(1.5, barW - 1.6)}
            height={bh}
            fill="rgba(56, 189, 248, 0.22)"
          />
        );
      })}
      <polygon points={`0,${h - 4} ${gaussPts} ${w},${h - 4}`} fill="url(#gaussGrad)" />
      <polyline fill="none" stroke="#38bdf8" strokeWidth="1.6" points={gaussPts} />
      <line x1={w / 2} y1={2} x2={w / 2} y2={h - 2} stroke="rgba(255,255,255,0.28)" strokeDasharray="2 2" />
    </svg>
  );
}

function IndicatorComparisonCanvas({
  candles,
}: {
  candles: ActivePairAnalysis["candles"];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length < 6) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, rect.width);
    const h = Math.max(125, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const slice = candles.slice(-52);
    const padTop = 8;
    const volZoneH = 26;
    const oscH = h - padTop - volZoneH - 6;
    const step = (w - 10) / slice.length;

    const yOsc = (val: number) => {
      const clamped = Math.max(-100, Math.min(100, val));
      return padTop + ((100 - clamped) / 200) * oscH;
    };

    // Zero equilibrium line & ±50 bands
    [-50, 0, 50].forEach((lvl) => {
      ctx.strokeStyle = lvl === 0 ? "rgba(148,163,184,0.35)" : "rgba(30,58,88,0.35)";
      ctx.lineWidth = 0.75;
      ctx.setLineDash(lvl === 0 ? [3, 3] : []);
      ctx.beginPath();
      ctx.moveTo(4, yOsc(lvl));
      ctx.lineTo(w - 4, yOsc(lvl));
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Uncertainty / Confluence Ribbon around Composite score
    ctx.fillStyle = "rgba(56, 189, 248, 0.11)";
    ctx.beginPath();
    slice.forEach((c, i) => {
      const x = 5 + i * step + step * 0.5;
      const hi = Math.max(c.rsi_norm, c.macd_norm, c.ma_norm);
      if (i === 0) ctx.moveTo(x, yOsc(hi));
      else ctx.lineTo(x, yOsc(hi));
    });
    for (let i = slice.length - 1; i >= 0; i--) {
      const x = 5 + i * step + step * 0.5;
      const lo = Math.min(slice[i].rsi_norm, slice[i].macd_norm, slice[i].ma_norm);
      ctx.lineTo(x, yOsc(lo));
    }
    ctx.closePath();
    ctx.fill();

    const plotSeries = (
      getter: (c: ActivePairAnalysis["candles"][0]) => number,
      color: string,
      width: number,
      dots = false
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      slice.forEach((c, i) => {
        const x = 5 + i * step + step * 0.5;
        const y = yOsc(getter(c));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      if (dots) {
        ctx.fillStyle = color;
        slice.forEach((c, i) => {
          if (i % 2 === 0) {
            const x = 5 + i * step + step * 0.5;
            const y = yOsc(getter(c));
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    };

    plotSeries((c) => c.ma_norm, "#00d4ff", 1.15, false);
    plotSeries((c) => c.rsi_norm, "#00f59b", 1.15, false);
    plotSeries((c) => c.macd_norm, "#f59e0b", 1.1, false);
    plotSeries((c) => c.composite, "#f8fafc", 1.5, true);

    // Tick Volume Observation Bars along bottom
    const maxVol = Math.max(...slice.map((c) => c.tick_volume), 1);
    const baseLine = h - 3;
    slice.forEach((c, i) => {
      const x = 5 + i * step + 1;
      const bw = Math.max(2, step - 2);
      const bh = (c.tick_volume / maxVol) * (volZoneH - 2);
      let barColor = "rgba(56, 189, 248, 0.55)";
      if (c.vol_zscore > 1.4) barColor = "#ff3b5c";
      else if (c.vol_zscore > 0.55) barColor = "#f59e0b";
      ctx.fillStyle = barColor;
      ctx.fillRect(x, baseLine - bh, bw, bh);
    });
  }, [candles]);

  return <canvas ref={canvasRef} className="w-full h-[132px] block" />;
}

export default function TopTelemetryRow({ active, matrix, onSelectPair }: Props) {
  const perf = active.performance;
  const ind = active.indicators_latest;
  const pnlPositive = perf.net_pnl_usd >= 0;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-2">
      {/* LEFT PANEL: Strategy Alpha & Equity Curve */}
      <div className="hud-panel lg:col-span-3 p-2.5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div
                className={`text-2xl xl:text-[28px] font-bold tracking-tight leading-none ${
                  pnlPositive ? "text-[#00f59b] glow-green" : "text-[#ff3b5c] glow-red"
                }`}
              >
                {pnlPositive ? "+" : "-"}${Math.abs(perf.net_pnl_usd).toLocaleString()}
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1">
                CUMULATIVE QUANT ALPHA ·{" "}
                <span className="text-cyan-300 font-semibold">
                  {perf.total_pips >= 0 ? "+" : ""}
                  {perf.total_pips.toFixed(1)} PIPS
                </span>
              </div>
            </div>
            <span className="text-[8.5px] px-1.5 py-0.5 border border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
              {active.timeframe} MODEL
            </span>
          </div>

          {/* 3 Primary Quant Ratios */}
          <div className="grid grid-cols-3 gap-2 mt-2.5 py-1.5 border-y border-slate-800/90 text-[10px]">
            <div>
              <div className="text-[8.5px] text-slate-500">SHARPE RATIO</div>
              <div className="text-sm font-bold text-slate-100">{perf.sharpe.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[8.5px] text-slate-500">WIN RATE</div>
              <div className="text-sm font-bold text-[#00f59b]">{perf.win_rate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[8.5px] text-slate-500">PROFIT FACTOR</div>
              <div className="text-sm font-bold text-cyan-300">+{perf.profit_factor.toFixed(2)}x</div>
            </div>
          </div>
        </div>

        {/* Equity Curve + Side Stats */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
            <span>• EQUITY CURVE · QUANT SCALP ALPHA</span>
            <span className="text-[#00f59b]">ACTIVE</span>
          </div>
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-8">
              <EquityCurveChart
                filtered={perf.equity_filtered}
                unfiltered={perf.equity_unfiltered}
              />
            </div>
            <div className="col-span-4 flex flex-col gap-1 text-[9px] border-l border-slate-800 pl-2">
              <div>
                <div className="text-slate-500 text-[8px]">PEAK EQUITY</div>
                <div className="text-slate-200 font-semibold">
                  ${Math.max(...perf.equity_filtered).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[8px]">HURST EXP</div>
                <div className="text-cyan-300 font-semibold">{perf.hurst.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[8px]">TREND R²</div>
                <div className="text-[#00f59b] font-semibold">{(perf.r_squared * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-500 text-[8px]">MAX DRAWDOWN</div>
                <div className="text-[#ff3b5c] font-semibold">{perf.max_drawdown_pct.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Price Trend Candlestick + Multi-Pair Orderflow Matrix */}
      <div className="hud-panel lg:col-span-4 p-2.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[9.5px] mb-1">
            <div className="flex items-center gap-2">
              <span className="text-cyan-200 font-semibold">
                • PRICE TREND · {active.symbol}
              </span>
              <span className="text-[8.5px] text-cyan-400">EMA20</span>
              <span className="text-[8.5px] text-amber-400">SMA50</span>
            </div>
            <div className="text-slate-300 font-bold">
              {active.quote.price.toFixed(active.quote.digits)}{" "}
              <span
                className={
                  active.quote.change_pct >= 0 ? "text-[#00f59b]" : "text-[#ff3b5c]"
                }
              >
                ({active.quote.change_pct >= 0 ? "+" : ""}
                {active.quote.change_pct}%)
              </span>
            </div>
          </div>

          <PriceCandlestickCanvas
            candles={active.candles}
            digits={active.quote.digits}
          />
        </div>

        {/* Multi-Pair Spread & Signal Matrix */}
        <div className="mt-1.5 border-t border-slate-800 pt-1.5">
          <div className="grid grid-cols-12 text-[8.5px] text-slate-500 pb-1 px-1">
            <span className="col-span-3">INSTRUMENT</span>
            <span className="col-span-2 text-right">BID</span>
            <span className="col-span-2 text-right">ASK</span>
            <span className="col-span-2 text-right">RSI / VOL</span>
            <span className="col-span-3 text-right">QUANT BIAS</span>
          </div>
          <div className="flex flex-col gap-1">
            {matrix.map((row) => {
              const selected = row.symbol === active.symbol;
              return (
                <div
                  key={row.symbol}
                  onClick={() => onSelectPair(row.symbol)}
                  className={`grid grid-cols-12 items-center px-1.5 py-1 text-[9.5px] cursor-pointer border transition ${
                    selected
                      ? "border-cyan-400/60 bg-cyan-950/30"
                      : "border-transparent bg-[#040a12]/70 hover:border-slate-700"
                  }`}
                >
                  <span className="col-span-3 font-bold text-slate-100 flex items-center gap-1">
                    {selected && <span className="w-1 h-2.5 bg-cyan-400 inline-block" />}
                    {row.symbol}
                  </span>
                  <span className="col-span-2 text-right text-[#00f59b]">
                    {row.bid.toFixed(row.digits)}
                  </span>
                  <span className="col-span-2 text-right text-[#ff3b5c]">
                    {row.ask.toFixed(row.digits)}
                  </span>
                  <span className="col-span-2 text-right text-slate-300">
                    {row.rsi14.toFixed(0)} / {row.vol_zscore >= 0 ? "+" : ""}
                    {row.vol_zscore.toFixed(1)}σ
                  </span>
                  <span className="col-span-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 text-[8.5px] font-bold border ${
                        row.direction === "BUY"
                          ? "border-[#00f59b]/50 bg-[#00f59b]/15 text-[#00f59b]"
                          : row.direction === "SELL"
                          ? "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-[#ff3b5c]"
                          : "border-amber-400/50 bg-amber-400/15 text-amber-300"
                      }`}
                    >
                      {row.direction} {row.confidence.toFixed(0)}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Z-Score Distribution + Indicator Comparison (RSI, MACD, MA) & Tick Volume */}
      <div className="hud-panel lg:col-span-5 p-2.5 flex flex-col justify-between">
        {/* Upper Sub-Panel: Return Bell Distribution */}
        <div className="grid grid-cols-12 gap-2 items-center pb-2 border-b border-slate-800/90">
          <div className="col-span-9">
            <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
              <span>• RETURN Z-SCORE DENSITY & GAUSSIAN FIT</span>
              <span className="text-cyan-300">240-BAR EMPIRICAL</span>
            </div>
            <DistributionChart {...active.distribution} />
          </div>
          <div className="col-span-3 border-l border-slate-800 pl-2.5 flex flex-col gap-1.5 text-[9.5px]">
            <div>
              <div className="text-[8px] text-slate-500">CONFIDENCE</div>
              <div className="text-base font-bold text-cyan-300">
                {active.signal.confidence.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">PATTERN SIM</div>
              <div className="text-sm font-bold text-amber-400">
                {active.pattern_matching.avg_similarity_pct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Lower Sub-Panel: Indicator Comparison + Tick Volume Observation */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between text-[9px] mb-1 gap-2">
            <span className="text-slate-200 font-semibold">
              • INDICATOR COMPARISON & TICK VOLUME OBSERVATION
            </span>
            <div className="flex items-center gap-2.5 text-[8.5px]">
              <span className="text-slate-100">● ALPHA</span>
              <span className="text-[#00f59b]">─ RSI(14)</span>
              <span className="text-amber-400">─ MACD</span>
              <span className="text-cyan-300">─ MA SPREAD</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-9">
              <IndicatorComparisonCanvas candles={active.candles} />
            </div>
            <div className="col-span-3 border-l border-slate-800 pl-2.5 flex flex-col gap-1 text-[9px]">
              <div>
                <div className="text-slate-500 text-[8px]">RSI (14)</div>
                <div className="text-[#00f59b] font-bold">{ind.rsi14.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[8px]">MACD HIST</div>
                <div
                  className={`font-bold ${
                    ind.macd_hist >= 0 ? "text-cyan-300" : "text-[#ff3b5c]"
                  }`}
                >
                  {ind.macd_hist >= 0 ? "+" : ""}
                  {ind.macd_hist}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[8px]">TICK VOL (Z)</div>
                <div className="text-amber-300 font-bold">
                  {ind.vol_current.toLocaleString()} ({ind.vol_zscore >= 0 ? "+" : ""}
                  {ind.vol_zscore}σ)
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[8px]">LDN / NY AVG</div>
                <div className="text-slate-300 font-semibold">
                  {ind.ldn_avg_vol} / {ind.ny_avg_vol}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
