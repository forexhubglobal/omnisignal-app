"use client";

import React, { useCallback, useEffect, useState } from "react";
import TopTelemetryRow from "@/components/TopTelemetryRow";
import TorusManifoldHUD from "@/components/TorusManifoldHUD";
import BottomQuantRow from "@/components/BottomQuantRow";
import { DashboardPayload, GatekeeperAuditItem } from "@/types/quant";

const PAIRS = [
  { id: "XAU/USD", label: "XAU/USD ★" },
  { id: "USD/CHF", label: "USD/CHF ★" },
  { id: "EUR/USD", label: "EUR/USD ★" },
  { id: "GBP/USD", label: "GBP/USD" },
  { id: "USD/JPY", label: "USD/JPY" },
];
const TIMEFRAMES = ["M5", "M15", "H1", "H4"];
const SESSION_FILTERS = [
  { id: "ALL", label: "24H ALL" },
  { id: "LONDON", label: "LONDON (08-17)" },
  { id: "NEW_YORK", label: "NEW YORK (13-22)" },
  { id: "OVERLAP", label: "LDN/NY OVERLAP" },
];

const DIRECT_API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8005";

export default function OmniQuantTerminalPage() {
  const [symbol, setSymbol] = useState<string>("XAU/USD");
  const [timeframe, setTimeframe] = useState<string>("M15");
  const [sessionFilter, setSessionFilter] = useState<string>("ALL");
  const [newsShield, setNewsShield] = useState<boolean>(true);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [connectingMt5, setConnectingMt5] = useState<boolean>(false);
  const [testingAction, setTestingAction] = useState<"BUY" | "SELL" | null>(null);
  const [latestVerdict, setLatestVerdict] = useState<GatekeeperAuditItem | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const qs = new URLSearchParams({
      symbol,
      timeframe,
      session_filter: sessionFilter,
      news_shield: String(newsShield),
    }).toString();

    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const endpoints = isHttps
      ? [`/api/v1/dashboard?${qs}`]
      : [`/api/v1/dashboard?${qs}`, `${DIRECT_API}/api/v1/dashboard?${qs}`];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const json: DashboardPayload = await res.json();
          setData(json);
          setErrorMsg(null);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to alternate origin
      }
    }
    setErrorMsg("Menyambung ke FastAPI Quant Engine (:8005)...");
    setLoading(false);
  }, [symbol, timeframe, sessionFilter, newsShield]);

  useEffect(() => {
    fetchDashboard();
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchDashboard();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchDashboard]);

  const handleManualScan = async () => {
    setScanning(true);
    for (const url of [
      `/api/v1/signals/refresh?timeframe=${timeframe}`,
      `${DIRECT_API}/api/v1/signals/refresh?timeframe=${timeframe}`,
    ]) {
      try {
        const res = await fetch(url, { method: "POST" });
        if (res.ok) {
          setStatusNotice(`Imbasan Cron Manual (${timeframe}) selesai & disimpan ke pangkalan data.`);
          break;
        }
      } catch {
        // ignore
      }
    }
    await fetchDashboard();
    setScanning(false);
  };

  const handleConnectMt5 = async () => {
    setConnectingMt5(true);
    setStatusNotice("Menghubungi terminal MetaTrader 5...");
    for (const url of [`/api/v1/mt5/connect`, `${DIRECT_API}/api/v1/mt5/connect`]) {
      try {
        const res = await fetch(url, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          setStatusNotice(json.message || "Semakan MT5 selesai.");
          break;
        }
      } catch {
        // ignore
      }
    }
    await fetchDashboard();
    setConnectingMt5(false);
  };

  const handleTestGatekeeper = async (action: "BUY" | "SELL") => {
    setTestingAction(action);
    const cleanSym = symbol.replace("/", "");
    const qs = new URLSearchParams({
      symbol: cleanSym,
      action,
      timeframe,
      enforce_news_shield: String(newsShield),
    }).toString();

    for (const url of [`/api/v1/gatekeeper?${qs}`, `${DIRECT_API}/api/v1/gatekeeper?${qs}`]) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const verdictJson: GatekeeperAuditItem = await res.json();
          setLatestVerdict(verdictJson);
          break;
        }
      } catch {
        // ignore
      }
    }
    await fetchDashboard();
    setTestingAction(null);
  };

  const mt5 = data?.mt5_bridge;

  return (
    <main className="min-h-screen w-full max-w-[1680px] mx-auto px-2.5 py-2 flex flex-col gap-2">
      {/* TOP INSTITUTIONAL HUD HEADER */}
      <header className="hud-panel px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-9 bg-cyan-400 shadow-[0_0_12px_#00d4ff]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-[0.16em] text-slate-100">
                OMNIQUANT FX
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 border border-amber-400/50 bg-amber-500/10 text-amber-300 font-semibold">
                × AMATERASU X BRIDGE
              </span>
            </div>
            <p className="text-[9px] tracking-[0.2em] text-slate-400 uppercase">
              LIVE MT5 FEED · QUANT GATEKEEPER · NEWS & SESSION SHIELD
            </p>
          </div>
        </div>

        {/* Interactive Pair, Timeframe, Session, News Shield & MT5 Connect Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <div className="flex items-center border border-slate-800 bg-[#040911] p-0.5">
            {PAIRS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSymbol(p.id)}
                className={`px-2 py-1 font-semibold transition cursor-pointer ${
                  symbol === p.id
                    ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center border border-slate-800 bg-[#040911] p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 font-semibold transition cursor-pointer ${
                  timeframe === tf
                    ? "bg-emerald-500/20 text-[#00f59b] border border-emerald-400/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center border border-slate-800 bg-[#040911] p-0.5">
            {SESSION_FILTERS.map((sf) => (
              <button
                key={sf.id}
                onClick={() => setSessionFilter(sf.id)}
                className={`px-2 py-1 text-[9.5px] font-semibold transition cursor-pointer ${
                  sessionFilter === sf.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setNewsShield((v) => !v)}
            className={`px-2.5 py-1 border font-semibold transition cursor-pointer ${
              newsShield
                ? "border-[#00f59b]/50 bg-[#00f59b]/10 text-[#00f59b]"
                : "border-rose-500/50 bg-rose-500/10 text-rose-300"
            }`}
          >
            NEWS SHIELD: {newsShield ? "ON (±30m)" : "OFF"}
          </button>

          <button
            onClick={handleConnectMt5}
            disabled={connectingMt5}
            className={`px-2.5 py-1 border font-semibold transition cursor-pointer disabled:opacity-50 ${
              mt5?.connected
                ? "border-[#00f59b] bg-[#00f59b]/15 text-[#00f59b]"
                : "border-cyan-400/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/25"
            }`}
          >
            {connectingMt5
              ? "CONNECTING MT5..."
              : mt5?.connected
              ? `🟢 MT5 LIVE #${mt5.account_login}`
              : "⚡ CONNECT MT5 LIVE"}
          </button>
        </div>

        {/* Right System Status */}
        <div className="text-right hidden 2xl:block text-[9.5px]">
          <div className="text-cyan-300 font-semibold tracking-wider">
            {mt5?.connected
              ? `${mt5.broker_server} · EQ ${mt5.equity.toLocaleString()} ${mt5.currency}`
              : `QUANT CORE / ${data?.cron.status || "ACTIVE"}`}
          </div>
          <div className="text-slate-400">
            {data?.active.data_source || "HYBRID ADAPTER"}
          </div>
        </div>
      </header>

      {/* STATUS NOTICE TOAST (MT5 / CRON) */}
      {statusNotice && (
        <div className="hud-panel px-3 py-1.5 flex items-center justify-between text-[10px] border-cyan-400/50 bg-cyan-950/30 text-cyan-100">
          <span>⚡ {statusNotice}</span>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-slate-400 hover:text-white px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* LOADING / CONNECTION STATE */}
      {loading && !data ? (
        <div className="hud-panel p-12 text-center text-cyan-300 text-xs tracking-widest animate-pulse">
          INITIALIZING OMNIQUANT FX × AMATERASU X MANIFOLD...
        </div>
      ) : errorMsg && !data ? (
        <div className="hud-panel p-8 text-center text-amber-300 text-xs">
          {errorMsg}
        </div>
      ) : data ? (
        <>
          {/* DUAL / MULTI-ACCOUNT LIVE SYNC STRIP (AKAUN 1 #5100221532 & AKAUN 5 #5100242908) */}
          {data.synced_accounts && data.synced_accounts.length > 0 && (
            <section
              className={`grid grid-cols-1 ${
                data.synced_accounts.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
              } gap-2`}
            >
              {data.synced_accounts.slice(0, 3).map((acc) => {
                const pnlPos = acc.floating_pnl >= 0;
                return (
                  <div
                    key={acc.login}
                    className={`hud-panel px-3 py-2 flex flex-col gap-1.5 border ${
                      acc.connected ? "border-[#00f59b]/35" : "border-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            acc.connected
                              ? "bg-[#00f59b] shadow-[0_0_8px_#00f59b] animate-pulse"
                              : "bg-slate-600"
                          }`}
                        />
                        <span className="font-bold text-slate-100 tracking-wide">
                          {acc.label}
                        </span>
                        <span className="text-cyan-300 font-semibold">#{acc.login}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[9.5px]">
                        <span className="text-slate-400">
                          BAL:{" "}
                          <strong className="text-slate-200">
                            {acc.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {acc.currency}
                          </strong>
                        </span>
                        <span className="text-slate-400">
                          EQ:{" "}
                          <strong className="text-cyan-200">
                            {acc.equity.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {acc.currency}
                          </strong>
                        </span>
                        <span
                          className={`px-1.5 py-0.5 border font-bold ${
                            !acc.connected
                              ? "border-slate-700 bg-slate-900 text-slate-400"
                              : pnlPos
                              ? "border-[#00f59b]/50 bg-[#00f59b]/15 text-[#00f59b]"
                              : "border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-[#ff3b5c]"
                          }`}
                        >
                          {acc.connected
                            ? `PnL ${pnlPos ? "+" : ""}${acc.floating_pnl.toFixed(2)} ${acc.currency}`
                            : "WAITING VPS SYNC"}
                        </span>
                      </div>
                    </div>

                    {/* Open Positions Pills for This Account */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[8.5px] pt-1 border-t border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-500">
                          OPEN ({acc.open_positions_count}):
                        </span>
                        {acc.positions.length > 0 ? (
                          acc.positions.slice(0, 4).map((pos) => (
                            <span
                              key={pos.ticket}
                              className={`px-1.5 py-0.5 border ${
                                pos.profit >= 0
                                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                                  : "border-rose-500/40 bg-rose-950/30 text-rose-200"
                              }`}
                            >
                              #{pos.ticket} <strong>{pos.symbol}</strong> {pos.type}{" "}
                              {pos.volume}L ({pos.profit >= 0 ? "+" : ""}
                              {pos.profit})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">
                            {acc.connected
                              ? "Tiada posisi terbuka semasa — sedia menunggu signal"
                              : "Jalankan pull.bat / on.bat di VPS untuk mula sync 2.5s"}
                          </span>
                        )}
                      </div>

                      {acc.win_rate > 0 && (
                        <span className="text-amber-300 font-semibold">
                          WIN RATE {acc.win_rate}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ROW 1 */}
          <TopTelemetryRow
            active={data.active}
            matrix={data.matrix}
            onSelectPair={setSymbol}
          />

          {/* ROW 2 */}
          <TorusManifoldHUD
            active={data.active}
            onSelectPair={setSymbol}
            onManualScan={handleManualScan}
            scanning={scanning}
          />

          {/* ROW 3 */}
          <BottomQuantRow
            active={data.active}
            calendar={data.economic_calendar}
            timeline={data.timeline}
          />

          {/* LIVE POPUP CARD WHEN USER CLICKS SIMULATE BOT BUY / SELL */}
          {latestVerdict && (
            <div
              className={`hud-panel p-3 border-2 transition-all ${
                latestVerdict.verdict === "BLOCK"
                  ? "border-[#ff3b5c] bg-rose-950/30"
                  : latestVerdict.verdict === "BOOST"
                  ? "border-amber-400 bg-amber-950/25"
                  : "border-[#00f59b] bg-emerald-950/25"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`px-2 py-0.5 border ${
                      latestVerdict.verdict === "BLOCK"
                        ? "border-[#ff3b5c] bg-[#ff3b5c]/25 text-[#ff3b5c]"
                        : latestVerdict.verdict === "BOOST"
                        ? "border-amber-400 bg-amber-400/20 text-amber-300"
                        : "border-[#00f59b] bg-[#00f59b]/20 text-[#00f59b]"
                    }`}
                  >
                    {latestVerdict.verdict === "BLOCK"
                      ? "🛑 ORDER DISEKAT (BLOCKED)"
                      : latestVerdict.verdict === "BOOST"
                      ? "🚀 LULUS GRED A+ (BOOST)"
                      : "🟢 ORDER DILULUSKAN (APPROVED)"}
                  </span>
                  <span className="text-slate-100">
                    SIMULASI AMATERASU X BOT →{" "}
                    <strong className="text-cyan-300">
                      {latestVerdict.proposed_action} {latestVerdict.symbol} ({timeframe})
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setLatestVerdict(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5 border border-slate-700 cursor-pointer"
                >
                  TUTUP ✕
                </button>
              </div>

              <div className="text-[11px] text-slate-200 mb-2">
                <strong>Keputusan Gatekeeper:</strong> {latestVerdict.reason}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] bg-[#030811]/85 p-2 border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[8.5px]">TINDAKAN BRIDGE MT5</span>
                  <strong
                    className={
                      latestVerdict.approved ? "text-[#00f59b]" : "text-[#ff3b5c]"
                    }
                  >
                    {latestVerdict.approved
                      ? "Buka Split 3-Layer (TP1/TP2/TP3)"
                      : "Batal & Tahan Order"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8.5px]">QUANT CONFIDENCE</span>
                  <strong className="text-cyan-300">{latestVerdict.confidence.toFixed(1)}%</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8.5px]">PATTERN SIMILARITY</span>
                  <strong className="text-amber-300">
                    {latestVerdict.pattern_similarity.toFixed(1)}%
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8.5px]">
                    KEBARANGKALIAN {latestVerdict.proposed_action}
                  </span>
                  <strong className="text-slate-100">
                    {latestVerdict.matching_prob_pct.toFixed(1)}%
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8.5px]">SUMBER DATA</span>
                  <strong className="text-slate-300 truncate block">
                    {latestVerdict.data_source}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* AMATERASU X GATEKEEPER LIVE AUDIT & MT5 POSITIONS STRIP */}
          <footer className="hud-panel px-3 py-2 flex flex-col gap-1.5 text-[9.5px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f59b] animate-pulse" />
                <span className="tracking-wider text-slate-100 font-semibold">
                  AMATERASU X QUANT GATEKEEPER (`/api/v1/gatekeeper`)
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  — Tekan butang di kanan untuk uji semakan pra-order bot:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestGatekeeper("BUY")}
                  disabled={testingAction !== null}
                  className="px-3 py-1 border border-[#00f59b] bg-[#00f59b]/15 hover:bg-[#00f59b]/30 active:scale-95 text-[#00f59b] font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {testingAction === "BUY"
                    ? "MENYEMAK BUY..."
                    : `🛡 SIMULATE BOT BUY (${symbol})`}
                </button>
                <button
                  onClick={() => handleTestGatekeeper("SELL")}
                  disabled={testingAction !== null}
                  className="px-3 py-1 border border-[#ff3b5c] bg-[#ff3b5c]/15 hover:bg-[#ff3b5c]/30 active:scale-95 text-[#ff3b5c] font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {testingAction === "SELL"
                    ? "MENYEMAK SELL..."
                    : `🛡 SIMULATE BOT SELL (${symbol})`}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[9px] text-slate-400">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500">SEJARAH SEMAKAN GATEKEEPER:</span>
                {data.gatekeeper_logs && data.gatekeeper_logs.length > 0 ? (
                  data.gatekeeper_logs.slice(0, 5).map((gk, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLatestVerdict(gk)}
                      title="Klik untuk buka perincian keputusan"
                      className={`px-1.5 py-0.5 border cursor-pointer ${
                        gk.verdict === "BLOCK"
                          ? "border-[#ff3b5c]/60 bg-[#ff3b5c]/15 text-[#ff3b5c]"
                          : gk.verdict === "BOOST"
                          ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                          : "border-[#00f59b]/50 bg-[#00f59b]/10 text-[#00f59b]"
                      }`}
                    >
                      {gk.symbol} {gk.proposed_action} → <strong>{gk.verdict}</strong> (
                      {gk.confidence.toFixed(0)}%)
                    </button>
                  ))
                ) : (
                  <span className="text-slate-500">
                    Tiada rekod lagi — tekan SIMULATE BOT BUY / SELL di atas
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {mt5?.connected && mt5.positions.length > 0 ? (
                  mt5.positions.slice(0, 3).map((pos) => (
                    <span
                      key={pos.ticket}
                      className="px-1.5 py-0.5 border border-cyan-500/40 bg-cyan-950/30 text-cyan-200"
                    >
                      🟢 #{pos.ticket} {pos.symbol} {pos.type} {pos.volume}L (
                      {pos.profit >= 0 ? "+" : ""}
                      {pos.profit})
                    </span>
                  ))
                ) : (
                  <span className="tracking-widest text-[#00f59b] font-semibold">
                    CRON SYNC #{data.cron.sync_count} · SYSTEM ACTIVE 24/7
                  </span>
                )}
              </div>
            </div>
          </footer>
        </>
      ) : null}
    </main>
  );
}
