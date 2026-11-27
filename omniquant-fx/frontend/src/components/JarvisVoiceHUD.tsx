"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { DashboardPayload } from "@/types/quant";

interface Props {
  symbol: string;
  timeframe: string;
  data: DashboardPayload | null;
  onApplyUiAction: (act: { symbol?: string; timeframe?: string }) => void;
  onRefreshDashboard: () => Promise<void>;
  onSpeakingChange?: (speaking: boolean) => void;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const DIRECT_API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8005";

export default function JarvisVoiceHUD({
  symbol,
  timeframe,
  data,
  onApplyUiAction,
  onRefreshDashboard,
  onSpeakingChange,
}: Props) {
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [lastReply, setLastReply] = useState<string>(
    "Sistem suara OMNIQUANT AI sedia, Bos. Tekan butang mikrofon dan tanya apa sahaja soalan."
  );
  const [history, setHistory] = useState<ChatTurn[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const announcedSignalIdRef = useRef<string>("");
  const handsFreeRef = useRef<boolean>(false);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  const setSpeakingState = useCallback(
    (val: boolean) => {
      setSpeaking(val);
      onSpeakingChange?.(val);
    },
    [onSpeakingChange]
  );

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingState(false);
  }, [setSpeakingState]);

  const playJarvisAudio = useCallback(
    async (audioB64: string | null | undefined, fallbackText: string, afterSpeak?: () => void) => {
      stopAudio();

      if (audioB64) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${audioB64}`);
          audioRef.current = audio;
          setSpeakingState(true);
          audio.onended = () => {
            setSpeakingState(false);
            afterSpeak?.();
          };
          audio.onerror = () => {
            setSpeakingState(false);
            afterSpeak?.();
          };
          await audio.play();
          return;
        } catch {
          setSpeakingState(false);
        }
      }

      // Fallback to native browser speechSynthesis if autoplay/MP3 unavailable
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(fallbackText);
        utter.lang = "ms-MY";
        utter.rate = 1.04;
        utter.pitch = 0.92;
        setSpeakingState(true);
        utter.onend = () => {
          setSpeakingState(false);
          afterSpeak?.();
        };
        utter.onerror = () => {
          setSpeakingState(false);
          afterSpeak?.();
        };
        window.speechSynthesis.speak(utter);
      } else {
        afterSpeak?.();
      }
    },
    [stopAudio, setSpeakingState]
  );

  const startMicListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setLastReply(
        "Pelayar ini tidak menyokong mikrofon Web Speech. Sila guna Google Chrome / Edge, atau taip soalan di kotak sebelah."
      );
      return;
    }

    stopAudio();

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } catch {
      // ignore
    }

    const rec = new SpeechRec();
    recognitionRef.current = rec;
    rec.lang = "ms-MY";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalSpoken = "";

    rec.onstart = () => {
      setListening(true);
      setLiveTranscript("");
    };

    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const txt = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSpoken += txt + " ";
        } else {
          interim += txt;
        }
      }
      setLiveTranscript((finalSpoken + interim).trim());
    };

    rec.onerror = () => {
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      const cleanQ = finalSpoken.trim();
      if (cleanQ) {
        sendQuestionToJarvis(cleanQ);
      }
    };

    rec.start();
  }, [stopAudio]);

  const sendQuestionToJarvis = useCallback(
    async (questionText: string) => {
      const q = questionText.trim();
      if (!q) return;

      setThinking(true);
      setLiveTranscript(q);

      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const urls = isHttps
        ? [`/api/v1/ai/voice-chat`]
        : [`/api/v1/ai/voice-chat`, `${DIRECT_API}/api/v1/ai/voice-chat`];

      for (const u of urls) {
        try {
          const res = await fetch(u, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: q,
              symbol,
              timeframe,
              history: history.slice(-6),
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const reply: string = json.reply || "Baik Bos.";
            setLastReply(reply);
            setHistory((prev) => [
              ...prev.slice(-8),
              { role: "user", content: q },
              { role: "assistant", content: reply },
            ]);

            if (json.ui_action && (json.ui_action.symbol || json.ui_action.timeframe)) {
              onApplyUiAction(json.ui_action);
            }
            if (json.action_executed) {
              await onRefreshDashboard();
            }

            setThinking(false);
            await playJarvisAudio(json.audio_b64, reply, () => {
              if (handsFreeRef.current) {
                setTimeout(() => startMicListening(), 350);
              }
            });
            return;
          }
        } catch {
          // try fallback
        }
      }

      setThinking(false);
      setLastReply("Maaf Bos, sambungan ke enjin suara terganggu sebentar.");
    },
    [symbol, timeframe, history, onApplyUiAction, onRefreshDashboard, playJarvisAudio, startMicListening]
  );

  // Autonomous Voice Announcement when a new >=75% Auto-Scalp Signal fires!
  useEffect(() => {
    if (!autoVoice || !data?.auto_dispatch?.history?.length) return;
    const latestSig = data.auto_dispatch.history[0];
    if (!latestSig?.id) return;

    if (!announcedSignalIdRef.current) {
      // Seed initial historical signal ID on page load so we only announce NEW live signals
      announcedSignalIdRef.current = latestSig.id;
      return;
    }

    if (latestSig.id !== announcedSignalIdRef.current) {
      announcedSignalIdRef.current = latestSig.id;
      const msg = `Perhatian Bos. Signal Auto Scalp baharu dikesan pada ${latestSig.symbol}, arah ${
        latestSig.type
      } pada harga ${latestSig.entry}, dengan tahap keyakinan ${latestSig.confidence.toFixed(
        0
      )} peratus.`;
      setLastReply(msg);

      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const speakUrl = isHttps ? `/api/v1/ai/speak` : `${DIRECT_API}/api/v1/ai/speak`;
      fetch(speakUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg }),
      })
        .then((r) => r.json())
        .then((j) => {
          playJarvisAudio(j.audio_b64, msg);
        })
        .catch(() => {
          playJarvisAudio(null, msg);
        });
    }
  }, [data?.auto_dispatch?.history, autoVoice, playJarvisAudio]);

  return (
    <section className="hud-panel px-3 py-2.5 border border-cyan-400/35 bg-gradient-to-r from-[#040c18]/95 via-[#061324]/95 to-[#040c18]/95">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: JARVIS Identity + Animated Equalizer + Live Voice Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Equalizer Bars */}
          <div className="flex items-end gap-[2px] h-6 px-2 py-1 border border-cyan-500/30 bg-[#030811]">
            {[0, 1, 2, 3, 4].map((idx) => (
              <span
                key={idx}
                style={{
                  height:
                    speaking || listening
                      ? `${10 + ((idx * 7) % 12)}px`
                      : thinking
                      ? "8px"
                      : "4px",
                  animationDelay: `${idx * 110}ms`,
                }}
                className={`w-[3px] transition-all duration-150 ${
                  listening
                    ? "bg-[#ff3b5c] animate-bounce"
                    : speaking
                    ? "bg-[#00f59b] animate-pulse"
                    : "bg-cyan-400/60"
                }`}
              />
            ))}
            <span className="ml-1.5 text-[9.5px] font-bold tracking-wider text-cyan-200">
              JARVIS AI CORE
            </span>
          </div>

          {/* Primary Mic Button */}
          <button
            onClick={() => (listening ? recognitionRef.current?.stop() : startMicListening())}
            className={`px-3 py-1.5 text-[10.5px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              listening
                ? "border-[#ff3b5c] bg-[#ff3b5c]/25 text-white shadow-[0_0_14px_rgba(255,59,92,0.5)] animate-pulse"
                : "border-[#00f59b] bg-[#00f59b]/15 hover:bg-[#00f59b]/30 text-[#00f59b] shadow-[0_0_10px_rgba(0,245,155,0.2)]"
            }`}
          >
            {listening ? "🔴 MENDENGAR... (KLIK HENTI)" : "🎙️ TEKAN & CAKAP"}
          </button>

          {/* Instant Briefing Button */}
          <button
            onClick={() =>
              sendQuestionToJarvis(
                `Bagi laporan ringkas keadaan ${symbol} sekarang serta status Akaun 1 dan Akaun 5.`
              )
            }
            disabled={thinking}
            className="px-2.5 py-1.5 text-[10px] font-semibold border border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-200 transition cursor-pointer disabled:opacity-50"
          >
            🔊 TAKLIMAT PASARAN
          </button>

          {/* Hands-Free Loop Toggle */}
          <button
            onClick={() => setHandsFree((v) => !v)}
            title="Bila ON, mikrofon akan terbuka semula secara automatik selepas AI habis menjawab"
            className={`px-2 py-1.5 text-[9.5px] font-semibold border transition cursor-pointer ${
              handsFree
                ? "border-amber-400 bg-amber-500/20 text-amber-200"
                : "border-slate-700 bg-[#040912] text-slate-400 hover:text-slate-200"
            }`}
          >
            🔁 HANDS-FREE: {handsFree ? "ON" : "OFF"}
          </button>

          {/* Autonomous Signal Voice Alert Toggle */}
          <button
            onClick={() => {
              if (speaking) stopAudio();
              setAutoVoice((v) => !v);
            }}
            className={`px-2 py-1.5 text-[9.5px] font-semibold border transition cursor-pointer ${
              autoVoice
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 bg-[#040912] text-slate-500"
            }`}
          >
            {autoVoice ? "🔔 AUTO-UMUM SIGNAL: ON" : "🔕 AUTO-UMUM: OFF"}
          </button>

          {speaking && (
            <button
              onClick={stopAudio}
              className="px-2 py-1.5 text-[9.5px] font-bold border border-rose-500/50 bg-rose-500/15 text-rose-300 cursor-pointer"
            >
              ⏹ DIAM
            </button>
          )}
        </div>

        {/* Right: Quick Ask Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!textInput.trim()) return;
            const q = textInput;
            setTextInput("");
            sendQuestionToJarvis(q);
          }}
          className="flex items-center gap-1.5 w-full lg:w-[360px]"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Atau taip soalan kepada JARVIS di sini..."
            className="flex-1 bg-[#030811] border border-slate-700/80 focus:border-cyan-400 px-2.5 py-1 text-[10px] text-slate-100 outline-none"
          />
          <button
            type="submit"
            disabled={thinking || !textInput.trim()}
            className="px-2.5 py-1 border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 text-[10px] font-bold cursor-pointer disabled:opacity-40"
          >
            TANYA
          </button>
        </form>
      </div>

      {/* Live Voice Transcript & JARVIS Spoken Reply Display */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px]">
        <div className="flex-1">
          {liveTranscript && (
            <div className="text-[9.5px] text-amber-300/90 mb-0.5">
              🎙️ <strong>Suara Bos:</strong> &ldquo;{liveTranscript}&rdquo;
            </div>
          )}
          <div className="text-slate-100 leading-relaxed">
            <strong className="text-cyan-300 mr-1.5">
              {thinking ? "⚡ JARVIS SEDANG MENGIRA..." : "🤖 JARVIS:"}
            </strong>
            <span>{lastReply}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
