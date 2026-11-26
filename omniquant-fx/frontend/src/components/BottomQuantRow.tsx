"use client";

import React, { useEffect, useRef } from "react";
import { ActivePairAnalysis, DashboardPayload } from "@/types/quant";

interface Props {
  active: ActivePairAnalysis;
  calendar: DashboardPayload["economic_calendar"];
  timeline: DashboardPayload["timeline"];
}

function PatternMonteCarloCanvas({ active }: { active: ActivePairAnalysis }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fan = active.pattern_matching.fan;
    if (!canvas || !fan.history_prices?.length) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, rect.width);
    const h = Math.max(175, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const hist = fan.history_prices;
    const horizon = fan.p50.length;
    const totalSteps = hist.length + horizon - 1;

    const allVals = [
      ...hist,
      ...fan.p10,
      ...fan.p90,
      ...active.pattern_matching.analogs.flatMap((a) => a.projected_prices),
    ];
    const minP = Math.min(...allVals) * 0.9995;
    const maxP = Math.max(...allVals) * 1.0005;
    const span = Math.max(maxP - minP, 1e-6);

    const padL = 8;
    const padR = 10;
    const padT = 10;
    const padB = 16;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const xOf = (idx: number) => padL + (idx / Math.max(totalSteps - 1, 1)) * plotW;
    const yOf = (p: number) => padT + (1 - (p - minP) / span) * plotH;

    // Subtle atmospheric matrix grid
    for (let g = 0; g <= 4; g++) {
      const gy = padT + (g / 4) * plotH;
      ctx.strokeStyle = "rgba(30, 58, 88, 0.32)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(w - padR, gy);
      ctx.stroke();
    }

    const pivotIdx = hist.length - 1;
    const pivotX = xOf(pivotIdx);

    // Vertical NOW divider
    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pivotX, padT);
    ctx.lineTo(pivotX, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    // p10-p90 Outer Uncertainty Fan
    const fillFan = (upper: number[], lower: number[], rgba: string) => {
      ctx.fillStyle = rgba;
      ctx.beginPath();
      upper.forEach((v, j) => {
        const x = xOf(pivotIdx + j);
        const y = yOf(v);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      for (let j = lower.length - 1; j >= 0; j--) {
        ctx.lineTo(xOf(pivotIdx + j), yOf(lower[j]));
      }
      ctx.closePath();
      ctx.fill();
    };

    fillFan(fan.p90, fan.p10, "rgba(14, 165, 233, 0.14)");
    fillFan(fan.p75, fan.p25, "rgba(0, 212, 255, 0.24)");

    // Top-5 Historical Pattern Analog Trajectories
    active.pattern_matching.analogs.forEach((analog, idx) => {
      ctx.strokeStyle =
        analog.outcome === "BULLISH"
          ? `rgba(0, 245, 155, ${0.42 - idx * 0.05})`
          : `rgba(255, 59, 92, ${0.42 - idx * 0.05})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      analog.projected_prices.forEach((p, j) => {
        const x = xOf(pivotIdx + j);
        const y = yOf(p);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Median p50 Projected Path
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    fan.p50.forEach((p, j) => {
      const x = xOf(pivotIdx + j);
      const y = yOf(p);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Historical Realized Price Line (crisp white like screenshot)
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 1.85;
    ctx.beginPath();
    hist.forEach((p, i) => {
      const x = xOf(i);
      const y = yOf(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Glowing Current Anchor Node
    const curY = yOf(hist[hist.length - 1]);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(pivotX, curY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "9px JetBrains Mono, monospace";
    ctx.fillText(
      `NOW ${hist[hist.length - 1].toFixed(active.quote.digits)}`,
      Math.min(pivotX + 6, w - 95),
      Math.max(curY - 6, 14)
    );
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-[182px] block" />;
}

export default function BottomQuantRow({ active, calendar, timeline }: Props) {
  const pm = active.pattern_matching;
  const spanStyle = (kind: string) => {
    switch (kind) {
      case "SESSION_LONDON":
        return "bg-cyan-500/25 border-cyan-400/60 text-cyan-200";
      case "SESSION_OVERLAP":
        return "bg-amber-500/30 border-amber-400/80 text-amber-200";
      case "SESSION_NY":
        return "bg-emerald-500/25 border-emerald-400/60 text-emerald-200";
      case "SESSION_ASIA":
        return "bg-slate-600/30 border-slate-500/50 text-slate-300";
      case "NEWS_HIGH":
        return "bg-[#ff3b5c]/35 border-[#ff3b5c] text-rose-100";
      case "NEWS_MED":
        return "bg-amber-500/25 border-amber-400/70 text-amber-100";
      case "SIG_BUY":
        return "bg-[#00f59b]/30 border-[#00f59b] text-[#00f59b]";
      case "SIG_SELL":
        return "bg-[#ff3b5c]/30 border-[#ff3b5c] text-[#ff3b5c]";
      default:
        return "bg-cyan-500/20 border-cyan-400/40 text-cyan-200";
    }
  };

  const laserPct = Math.min(100, Math.max(0, (timeline.current_utc_hour / 24) * 100));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-2">
      {/* BOTTOM-LEFT: Historical Pattern Matching + Monte Carlo Fan + Volume Profile */}
      <div className="hud-panel lg:col-span-5 p-2.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[9.5px] mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-cyan-100 font-semibold">
              • HISTORICAL PATTERN MATCHING · MONTE CARLO FAN
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px]">
            <span className="text-[#00f59b]">BULL {pm.bullish_prob_pct}%</span>
            <span className="text-slate-600">|</span>
            <span className="text-[#ff3b5c]">BEAR {pm.bearish_prob_pct}%</span>
          </div>
        </div>

        {/* Chart + Right Volume Profile */}
        <div className="grid grid-cols-12 gap-1.5 items-stretch">
          <div className="col-span-9 border border-slate-800/80 bg-[#040911]">
            <PatternMonteCarloCanvas active={active} />
          </div>

          {/* Horizontal Tick Volume Profile (Matching green/red right bars in screenshot) */}
          <div className="col-span-3 flex flex-col justify-between py-1 pl-1 border-l border-slate-800/80">
            {[...active.volume_profile].reverse().map((bucket, idx) => (
              <div key={idx} className="flex items-center gap-1 h-[11px]">
                <div className="flex-1 bg-slate-900/90 h-[8px] overflow-hidden">
                  <div
                    style={{ width: `${Math.max(8, bucket.pct)}%` }}
                    className={`h-full ${
                      bucket.dominant === "BULL" ? "bg-[#00f59b]/85" : "bg-[#ff3b5c]/85"
                    }`}
                  />
                </div>
                <span className="text-[7.5px] text-slate-500 w-[42px] text-right">
                  {bucket.price.toFixed(Math.min(active.quote.digits, 2))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Historical Analog Matches Footer */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-1.5 text-[8.5px]">
          <span className="text-slate-400">TOP ANALOGS (DTW/COSINE):</span>
          <div className="flex flex-wrap gap-1.5">
            {pm.analogs.slice(0, 4).map((a) => (
              <span
                key={a.rank}
                className={`px-1.5 py-0.5 border ${
                  a.outcome === "BULLISH"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                }`}
              >
                #{a.rank} {a.similarity_pct}% ({a.forward_pips >= 0 ? "+" : ""}
                {a.forward_pips}p)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: 24H Session Filter (London / NY) & Economic Calendar News Shield Timeline */}
      <div className="hud-panel lg:col-span-7 p-2.5 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between text-[9.5px] mb-1.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-cyan-100 font-semibold">
              • 24H SESSION KILLZONE & HIGH-FREQ SIGNALS TIMELINE (UTC)
            </span>
            <span className="px-1.5 py-0.5 text-[8.5px] border border-[#00f59b]/40 bg-[#00f59b]/10 text-[#00f59b]">
              UNRESTRICTED 24H SCALP ACTIVE
            </span>
          </div>
          <span className="text-amber-300 font-bold">{timeline.utc_clock}</span>
        </div>

        {/* 24H Gantt Timeline Grid */}
        <div className="relative border border-slate-800/90 bg-[#040912] p-2">
          {/* Hour Ruler */}
          <div className="grid grid-cols-12 text-[8px] text-slate-500 mb-1 pl-[118px]">
            {["00:00", "04:00", "08:00 LDN", "12:00", "16:00 NY", "20:00"].map((h, i) => (
              <span key={i} className="col-span-2">
                {h}
              </span>
            ))}
          </div>

          <div className="relative flex flex-col gap-1.5">
            {timeline.tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-2 h-[20px]">
                <div className="w-[110px] shrink-0 text-[8.5px] text-slate-400 truncate">
                  {track.label}
                </div>
                <div className="relative flex-1 h-[15px] bg-slate-900/75 border border-slate-800/70 overflow-hidden">
                  {/* Subtle 4h vertical ticks */}
                  {[16.66, 33.33, 50, 66.66, 83.33].map((pct) => (
                    <div
                      key={pct}
                      style={{ left: `${pct}%` }}
                      className="absolute top-0 bottom-0 w-px bg-slate-800/70"
                    />
                  ))}

                  {track.spans.map((sp, idx) => {
                    const left = (sp.start / 24) * 100;
                    const width = Math.max(1.4, ((sp.end - sp.start) / 24) * 100);
                    return (
                      <div
                        key={idx}
                        title={sp.text}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        className={`absolute top-[1px] bottom-[1px] border px-1.5 flex items-center text-[7.5px] font-semibold truncate rounded-[1px] ${spanStyle(
                          sp.kind
                        )}`}
                      >
                        {width > 9 ? sp.text : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Live UTC Laser Line across tracks */}
            <div
              style={{ left: `calc(118px + (100% - 118px) * ${laserPct / 100})` }}
              className="pointer-events-none absolute top-0 bottom-0 w-[1.5px] bg-amber-400 shadow-[0_0_8px_#fbbf24]"
            />
          </div>
        </div>

        {/* Upcoming / Active Economic Calendar Macro Strip */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-1.5">
          {calendar.events.slice(2, 6).map((ev) => (
            <div
              key={ev.id}
              className="border border-slate-800 bg-[#050c16]/85 px-2 py-1 text-[8.5px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  {ev.currency} · {Math.floor(ev.utc_hour).toString().padStart(2, "0")}:
                  {Math.round((ev.utc_hour % 1) * 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  UTC
                </span>
                <span
                  className={`px-1 text-[7.5px] font-bold ${
                    ev.impact === "HIGH"
                      ? "bg-[#ff3b5c]/20 text-[#ff3b5c] border border-[#ff3b5c]/40"
                      : "bg-amber-400/15 text-amber-300 border border-amber-400/40"
                  }`}
                >
                  {ev.impact}
                </span>
              </div>
              <div className="text-slate-400 truncate mt-0.5" title={ev.title}>
                {ev.title}
              </div>
              <div className="text-slate-500 flex justify-between mt-0.5">
                <span>Fcst: {ev.forecast}</span>
                <span>Prev: {ev.previous}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
