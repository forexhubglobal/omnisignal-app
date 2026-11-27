import base64
from datetime import datetime, timedelta, timezone
import re
from typing import Callable, Dict, List, Optional, Tuple
import httpx

from app.config import get_settings

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    edge_tts = None
    EDGE_TTS_AVAILABLE = False


def _clean_text_for_speech(text: str) -> str:
    """Clean markdown symbols & expand trading abbreviations for smooth Malay speech."""
    s = re.sub(r"[*#`_~>|]", "", text)
    s = re.sub(r"\s+", " ", s).strip()
    replacements = [
        ("XAU/USD", "Gold X A U U S D"),
        ("XAUUSD", "Gold X A U U S D"),
        ("USD/CHF", "U S D C H F"),
        ("USDCHF", "U S D C H F"),
        ("EUR/USD", "Euro U S D"),
        ("EURUSD", "Euro U S D"),
        ("GBP/USD", "G B P U S D"),
        ("USD/JPY", "U S D J P Y"),
        ("TP1", "T P satu"),
        ("TP2", "T P dua"),
        ("TP3", "T P tiga"),
        ("SL", "Stop Loss"),
        ("PnL", "untung rugi"),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    return s


async def synthesize_jarvis_mp3_b64(text: str, voice: Optional[str] = None) -> Optional[str]:
    """Generates natural Malaysian Malay Male Corporate Neural Voice MP3 (base64)."""
    if not EDGE_TTS_AVAILABLE or edge_tts is None or not text.strip():
        return None
    settings = get_settings()
    target_voice = voice or settings.jarvis_voice or "ms-MY-OsmanNeural"
    clean_speech = _clean_text_for_speech(text)
    try:
        communicate = edge_tts.Communicate(
            text=clean_speech,
            voice=target_voice,
            rate="+6%",
            pitch="-2Hz",
        )
        audio_chunks = bytearray()
        async for chunk in communicate.stream():
            if chunk.get("type") == "audio" and chunk.get("data"):
                audio_chunks.extend(chunk["data"])
        if audio_chunks:
            return base64.b64encode(bytes(audio_chunks)).decode("ascii")
    except Exception:
        return None
    return None


def detect_voice_command_actions(
    transcript: str,
    toggle_account_fn: Callable[[int, bool], Dict],
    toggle_autotrade_fn: Callable[[bool], Dict],
) -> Tuple[Optional[str], Dict]:
    """
    Detects direct spoken commands (ON/OFF accounts, Auto-Trade, Chart Pair/Timeframe switching)
    and executes them immediately!
    """
    low = transcript.lower().strip()
    ui_action: Dict[str, str] = {}
    action_note: Optional[str] = None

    # 1. Account 1 (#5100221532) ON/OFF voice commands
    if any(k in low for k in ("akaun 1", "akaun satu", "account 1", "account one", "dragon")):
        if any(w in low for w in ("hidupkan", "buka", "aktifkan", "on kan", "onkan", "turn on", "start")):
            toggle_account_fn(5100221532, True)
            action_note = "TELAH DILAKSANAKAN: Dagangan Akaun 1 (#5100221532 Dragon Cent) kini diaktifkan kepada ON."
        elif any(w in low for w in ("matikan", "tutup", "hentikan", "off kan", "offkan", "pause", "turn off", "stop", "kunci")):
            toggle_account_fn(5100221532, False)
            action_note = "TELAH DILAKSANAKAN: Dagangan Akaun 1 (#5100221532 Dragon Cent) kini dikunci kepada OFF."

    # 2. Account 5 (#5100242908) ON/OFF voice commands
    if any(k in low for k in ("akaun 5", "akaun lima", "account 5", "account five", "farouk")):
        if any(w in low for w in ("hidupkan", "buka", "aktifkan", "on kan", "onkan", "turn on", "start")):
            toggle_account_fn(5100242908, True)
            action_note = "TELAH DILAKSANAKAN: Dagangan Akaun 5 (#5100242908 Wan Farouk) kini diaktifkan kepada ON."
        elif any(w in low for w in ("matikan", "tutup", "hentikan", "off kan", "offkan", "pause", "turn off", "stop", "kunci")):
            toggle_account_fn(5100242908, False)
            action_note = "TELAH DILAKSANAKAN: Dagangan Akaun 5 (#5100242908 Wan Farouk) kini dikunci kepada OFF."

    # 3. Master Auto-Trade ON/OFF voice commands
    if "auto trade" in low or "autotrade" in low or "auto scalp" in low:
        if any(w in low for w in ("matikan", "tutup", "off", "stop", "henti", "pause")):
            toggle_autotrade_fn(False)
            action_note = "TELAH DILAKSANAKAN: Suis utama Auto-Trade telah dimatikan."
        elif any(w in low for w in ("hidupkan", "buka", "on", "start", "aktif")):
            toggle_autotrade_fn(True)
            action_note = "TELAH DILAKSANAKAN: Suis utama Auto-Trade telah diaktifkan semula."

    # 4. Pair / Timeframe UI switching
    if any(w in low for w in ("tukar", "buka chart", "papar", "tunjuk", "switch")):
        if "emas" in low or "gold" in low or "xau" in low:
            ui_action["symbol"] = "XAU/USD"
        elif "chf" in low or "swiss" in low:
            ui_action["symbol"] = "USD/CHF"
        elif "euro" in low or "eur" in low:
            ui_action["symbol"] = "EUR/USD"
        elif "gbp" in low or "pound" in low or "gu" in low:
            ui_action["symbol"] = "GBP/USD"
        elif "jpy" in low or "yen" in low or "uj" in low:
            ui_action["symbol"] = "USD/JPY"

        for tf in ("m5", "m15", "h1", "h4"):
            if tf in low.split():
                ui_action["timeframe"] = tf.upper()

    return action_note, ui_action


def _build_system_prompt(live_context: Dict, action_note: Optional[str]) -> str:
    myt_now = (datetime.now(timezone.utc) + timedelta(hours=8)).strftime("%H:%M MYT (%d %b %Y)")
    active = live_context.get("active", {})
    quote = active.get("quote", {})
    sig = active.get("signal", {})
    ind = active.get("indicators_latest", {})
    pm = active.get("pattern_matching", {})
    perf = active.get("performance", {})

    matrix_lines = []
    for m in live_context.get("matrix", []):
        matrix_lines.append(
            f"- {m['symbol']}: Harga {m['price']}, Arah {m['direction']} (Keyakinan {m['confidence']}%), RSI {m['rsi14']}, Regime {m['regime']}, SL {m['stop_loss']}, TP {m['take_profit']}"
        )

    acc_lines = []
    for a in live_context.get("synced_accounts", []):
        status_str = "AKTIF SYNC" if a.get("connected") else "OFFLINE"
        trade_str = "TRADE ON" if a.get("trading_enabled", True) else "TRADE OFF (DIKUNCI BOS)"
        acc_lines.append(
            f"- {a['label']} (#{a['login']}): {status_str} | {trade_str} | Baki {a['balance']} {a['currency']} | Ekuiti {a['equity']} {a['currency']} | Floating PnL {a['floating_pnl']} {a['currency']} | Posisi Terbuka: {a['open_positions_count']}"
        )

    auto_d = live_context.get("auto_dispatch", {})
    action_str = f"\n[TINDAKAN BARU DILAKSANAKAN OLEH SISTEM]: {action_note}\n" if action_note else ""

    return f"""Anda ialah OMNIQUANT AI, pembantu kecerdasan buatan kuantitatif peribadi gaya JARVIS korporat untuk Bos (Tengku).
Jawab dalam Bahasa Melayu yang maskulin, korporat, tegas, jelas, dan ringkas (maksimum 2 hingga 4 ayat pendek supaya lancar bila disebut dengan suara).
JANGAN guna simbol markdown seperti bintang (*), pagar (#), atau jadual. Tulis ayat pertuturan terus.

DATA PASARAN & AKAUN MT5 SEBENAR SAAT INI ({myt_now}):
Pair Fokus Di Skrin: {active.get('symbol')} ({active.get('timeframe')}) @ Harga {quote.get('price')} (Spread {quote.get('spread_pips')} pips, ATR {quote.get('atr_pips')} pips)
Signal Semasa {active.get('symbol')}: {sig.get('direction')} dengan keyakinan {sig.get('confidence')}% | Regime: {sig.get('regime')} | Entry {sig.get('entry')}, SL {sig.get('stop_loss')}, TP {sig.get('take_profit')}
Indikator {active.get('symbol')}: RSI(14) = {ind.get('rsi14')}, MACD Hist = {ind.get('macd_hist')}, Tick Vol Z = {ind.get('vol_zscore')}, Hurst = {perf.get('hurst')}
Monte Carlo & Corak Sejarah {active.get('symbol')}: Persamaan Sejarah {pm.get('avg_similarity_pct')}%, Kebarangkalian Naik (Bullish) {pm.get('bullish_prob_pct')}% vs Turun (Bearish) {pm.get('bearish_prob_pct')}%
Status Auto-Trade (≥75%): {'AKTIF' if auto_d.get('enabled', True) else 'DIMATIKAN'}

SENARAI SEMUA PAIR LIVE:
{chr(10).join(matrix_lines)}

STATUS AKAUN MT5 BOS SEKARANG:
{chr(10).join(acc_lines)}
{action_str}
Jawab soalan Bos dengan tepat berdasarkan angka sebenar di atas. Jika Bos tanya soalan umum, strategi, risiko, atau apa sahaja topik lain, jawab dengan bijak dan profesional sebagai penasihat kuantitatif peribadi Bos."""


def _local_fallback_jarvis_reply(question: str, live_context: Dict, action_note: Optional[str]) -> str:
    """Instant <2ms deterministic Malaysian Malay JARVIS answer if external LLM is unreachable."""
    if action_note:
        return f"Baik Bos. {action_note.replace('TELAH DILAKSANAKAN: ', '')}"

    low = question.lower()
    active = live_context.get("active", {})
    matrix = {m["symbol"]: m for m in live_context.get("matrix", [])}
    accounts = live_context.get("synced_accounts", [])

    # Account questions
    if any(w in low for w in ("akaun", "baki", "ekuiti", "equity", "balance", "profit", "untung", "posisi")):
        parts = []
        for a in accounts[:2]:
            t_state = "aktif berdagang" if a.get("trading_enabled", True) else "dikunci off"
            parts.append(
                f"{a['label']} mempunyai ekuiti {a['equity']:,.2f} {a['currency']} dengan {a['open_positions_count']} posisi terbuka dan status {t_state}"
            )
        return "Laporan akaun semasa Bos: " + ". Manakala ".join(parts) + "."

    # Specific pair lookup
    target_sym = active.get("symbol", "XAU/USD")
    if "chf" in low or "swiss" in low:
        target_sym = "USD/CHF"
    elif "euro" in low or "eur" in low:
        target_sym = "EUR/USD"
    elif "gbp" in low or "pound" in low:
        target_sym = "GBP/USD"
    elif "jpy" in low or "yen" in low:
        target_sym = "USD/JPY"
    elif "emas" in low or "gold" in low or "xau" in low:
        target_sym = "XAU/USD"

    m = matrix.get(target_sym)
    if m and target_sym != active.get("symbol"):
        return (
            f"Bos, untuk {target_sym} sekarang harga berada pada {m['price']} dalam fasa {m['regime']}. "
            f"Isyarat semasa ialah {m['direction']} dengan keyakinan {m['confidence']} peratus dan bacaan R S I {m['rsi14']}."
        )

    q = active.get("quote", {})
    s = active.get("signal", {})
    pm = active.get("pattern_matching", {})
    ind = active.get("indicators_latest", {})
    return (
        f"Bos, {active.get('symbol')} pada rangka masa {active.get('timeframe')} kini didagangkan pada {q.get('price')}. "
        f"Bacaan kuantitatif menunjukkan status {s.get('direction')} dengan keyakinan {s.get('confidence')} peratus dalam fasa {s.get('regime')}. "
        f"R S I berada pada {ind.get('rsi14')} dan simulasi Monte Carlo memberi kebarangkalian naik {pm.get('bullish_prob_pct')} peratus."
    )


async def generate_jarvis_response(
    user_message: str,
    history: List[Dict[str, str]],
    live_context: Dict,
    action_note: Optional[str] = None,
) -> Tuple[str, Optional[str]]:
    """
    Generates conversational Malay JARVIS reply + base64 MP3 neural voice audio.
    """
    settings = get_settings()
    sys_prompt = _build_system_prompt(live_context, action_note)
    reply_text: Optional[str] = None

    trimmed_hist = [
        {"role": m.get("role", "user"), "content": str(m.get("content", ""))[:400]}
        for m in (history or [])[-6:]
        if m.get("content")
    ]

    # Tier 1: Official Gemini API if key configured
    if settings.gemini_api_key:
        try:
            async with httpx.AsyncClient(timeout=7.0) as client:
                r = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}",
                    json={
                        "systemInstruction": {"parts": [{"text": sys_prompt}]},
                        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
                    },
                )
                if r.status_code == 200:
                    cand = r.json().get("candidates", [{}])[0]
                    parts = cand.get("content", {}).get("parts", [{}])
                    txt = parts[0].get("text", "").strip()
                    if txt:
                        reply_text = txt
        except Exception:
            pass

    # Tier 2: Zero-key Free Cloud LLM (Pollinations root endpoint) -> answers ANY open-ended question!
    if not reply_text:
        messages = [{"role": "system", "content": sys_prompt}] + trimmed_hist + [
            {"role": "user", "content": user_message}
        ]
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                r = await client.post(
                    "https://text.pollinations.ai/",
                    json={
                        "messages": messages,
                        "model": "openai",
                        "private": True,
                    },
                )
                if r.status_code == 200:
                    raw_txt = r.text.strip()
                    if raw_txt.startswith("{"):
                        import json as _json
                        parsed = _json.loads(raw_txt)
                        raw_txt = (
                            parsed.get("choices", [{}])[0]
                            .get("message", {})
                            .get("content", "")
                            .strip()
                        )
                    if raw_txt and len(raw_txt) > 5 and "<html" not in raw_txt.lower():
                        reply_text = raw_txt
        except Exception:
            pass

    # Tier 3: Guaranteed instant local Quant Brain fallback
    if not reply_text:
        reply_text = _local_fallback_jarvis_reply(user_message, live_context, action_note)

    audio_b64 = await synthesize_jarvis_mp3_b64(reply_text)
    return reply_text, audio_b64
