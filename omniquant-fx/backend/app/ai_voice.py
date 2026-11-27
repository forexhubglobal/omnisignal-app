import base64
from datetime import datetime, timedelta, timezone
import random
import re
from typing import Callable, Dict, List, Optional, Tuple
import urllib.parse
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

    if any(k in low for k in ("akaun 1", "akaun satu", "account 1", "account one", "dragon")):
        if any(w in low for w in ("hidupkan", "buka", "aktifkan", "on kan", "onkan", "turn on", "start")):
            toggle_account_fn(5100221532, True)
            action_note = "Dagangan Akaun 1 (#5100221532 Dragon Cent) kini diaktifkan kepada ON."
        elif any(w in low for w in ("matikan", "tutup", "hentikan", "off kan", "offkan", "pause", "turn off", "stop", "kunci")):
            toggle_account_fn(5100221532, False)
            action_note = "Dagangan Akaun 1 (#5100221532 Dragon Cent) kini dikunci kepada OFF."

    if any(k in low for k in ("akaun 5", "akaun lima", "account 5", "account five", "farouk")):
        if any(w in low for w in ("hidupkan", "buka", "aktifkan", "on kan", "onkan", "turn on", "start")):
            toggle_account_fn(5100242908, True)
            action_note = "Dagangan Akaun 5 (#5100242908 Wan Farouk) kini diaktifkan kepada ON."
        elif any(w in low for w in ("matikan", "tutup", "hentikan", "off kan", "offkan", "pause", "turn off", "stop", "kunci")):
            toggle_account_fn(5100242908, False)
            action_note = "Dagangan Akaun 5 (#5100242908 Wan Farouk) kini dikunci kepada OFF."

    if "auto trade" in low or "autotrade" in low or "auto scalp" in low:
        if any(w in low for w in ("matikan", "tutup", "off", "stop", "henti", "pause")):
            toggle_autotrade_fn(False)
            action_note = "Suis utama Auto-Trade telah dimatikan."
        elif any(w in low for w in ("hidupkan", "buka", "on", "start", "aktif")):
            toggle_autotrade_fn(True)
            action_note = "Suis utama Auto-Trade telah diaktifkan semula."

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


def _is_trading_or_account_query(text: str) -> bool:
    low = text.lower()
    keywords = (
        "gold", "emas", "xau", "eur", "euro", "usd", "chf", "gbp", "jpy", "pair",
        "chart", "market", "pasaran", "harga", "price", "signal", "isyarat", "buy",
        "sell", "entry", "sl", "tp", "rsi", "macd", "trend", "scalp", "monte carlo",
        "akaun", "account", "baki", "balance", "ekuiti", "equity", "profit", "untung",
        "rugi", "lot", "layer", "posisi", "mt5", "auto trade", "autotrade", "taklimat",
        "laporan",
    )
    return any(k in low for k in keywords)


def _build_compact_system_prompt(live_context: Dict, include_market: bool, action_note: Optional[str]) -> str:
    myt_now = (datetime.now(timezone.utc) + timedelta(hours=8)).strftime("%H:%M MYT, %d %b %Y")

    base_persona = (
        f"Anda ialah JARVIS, pembantu AI peribadi pintar gaya korporat lelaki Melayu untuk Bos (masa sekarang {myt_now}). "
        "Anda boleh menjawab APA SAHAJA soalan Bos tentang apa jua topik di dunia (pengetahuan am, bisnes, sains, sejarah, teknologi, matematik, kehidupan harian, nasihat, lawak, mahupun kewangan). "
        "Jawab dalam Bahasa Melayu yang maskulin, korporat, jelas, dan ringkas (2 hingga 4 ayat lisan sahaja, TANPA simbol bintang/pagar markdown). "
    )

    if not include_market and not action_note:
        return (
            base_persona
            + "PENTING: Soalan Bos ini BUKAN tentang trading, jadi jawab terus soalan Bos dengan pintar dan JANGAN sebut pasal Gold, Forex, atau MT5."
        )

    active = live_context.get("active", {})
    quote = active.get("quote", {})
    sig = active.get("signal", {})
    ind = active.get("indicators_latest", {})
    pm = active.get("pattern_matching", {})

    pairs_short = ", ".join(
        f"{m['symbol']}={m['price']}({m['direction']} {m['confidence']}%)"
        for m in live_context.get("matrix", [])[:5]
    )
    accs_short = " | ".join(
        f"{a['label']}: Ekuiti {a['equity']} {a['currency']} ({'ON' if a.get('trading_enabled', True) else 'OFF'}, {a['open_positions_count']} pos)"
        for a in live_context.get("synced_accounts", [])[:2]
    )
    act_str = f" Tindakan baru selesai: {action_note}" if action_note else ""

    return (
        base_persona
        + f"Data Live MT5: Fokus {active.get('symbol')}({active.get('timeframe')})={quote.get('price')}, Signal={sig.get('direction')}({sig.get('confidence')}%), "
        f"Regime={sig.get('regime')}, RSI={ind.get('rsi14')}, MonteCarlo Naik={pm.get('bullish_prob_pct')}%, SL={sig.get('stop_loss')}, TP={sig.get('take_profit')}. "
        f"Semua Pair: {pairs_short}. Akaun: {accs_short}.{act_str}"
    )


def _local_fallback_jarvis_reply(question: str, live_context: Dict, action_note: Optional[str]) -> str:
    if action_note:
        return f"Baik Bos. {action_note}"

    if not _is_trading_or_account_query(question):
        return (
            "Maaf Bos, talian ke pelayan pengetahuan am sedang perlahan seketika. "
            "Cuba tanya sekali lagi sebentar lagi, Bos."
        )

    active = live_context.get("active", {})
    q = active.get("quote", {})
    s = active.get("signal", {})
    pm = active.get("pattern_matching", {})
    ind = active.get("indicators_latest", {})
    return (
        f"Bos, {active.get('symbol')} pada rangka masa {active.get('timeframe')} kini berada pada {q.get('price')}. "
        f"Isyarat semasa ialah {s.get('direction')} dengan keyakinan {s.get('confidence')} peratus dalam fasa {s.get('regime')}, "
        f"R S I {ind.get('rsi14')}, dan kebarangkalian naik {pm.get('bullish_prob_pct')} peratus."
    )


async def generate_jarvis_response(
    user_message: str,
    history: List[Dict[str, str]],
    live_context: Dict,
    action_note: Optional[str] = None,
) -> Tuple[str, Optional[str]]:
    """
    Generates open-domain conversational Malay JARVIS reply + base64 MP3 neural voice audio.
    """
    settings = get_settings()
    is_market = _is_trading_or_account_query(user_message) or bool(action_note)
    sys_prompt = _build_compact_system_prompt(live_context, is_market, action_note)
    reply_text: Optional[str] = None

    # Build recent conversational context snippet for multi-turn continuity
    recent_turns = []
    for m in (history or [])[-4:]:
        role_lbl = "Bos" if m.get("role") == "user" else "JARVIS"
        content_str = str(m.get("content", "")).strip()[:180]
        if content_str:
            recent_turns.append(f"{role_lbl}: {content_str}")

    full_user_prompt = (
        ("\n".join(recent_turns) + f"\nBos: {user_message}\nJARVIS:")
        if recent_turns
        else user_message
    )

    # Tier 1: Official Gemini API if configured in .env
    if settings.gemini_api_key:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}",
                    json={
                        "systemInstruction": {"parts": [{"text": sys_prompt}]},
                        "contents": [{"role": "user", "parts": [{"text": full_user_prompt}]}],
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

    # Tier 2: Working Free Generative LLM GET endpoint (answers ANY general or market question!)
    if not reply_text:
        encoded_q = urllib.parse.quote(full_user_prompt)
        encoded_sys = urllib.parse.quote(sys_prompt)
        seed = random.randint(1000, 999999)
        url = f"https://text.pollinations.ai/{encoded_q}?model=openai&system={encoded_sys}&seed={seed}"
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                if r.status_code == 200:
                    txt = r.text.strip()
                    if txt and len(txt) > 2 and "<html" not in txt.lower():
                        # Strip accidental leading "JARVIS:" prefix if model echoed it
                        txt = re.sub(r"^JARVIS\s*:\s*", "", txt, flags=re.IGNORECASE).strip()
                        reply_text = txt
        except Exception:
            pass

    # Tier 3: Local fallback
    if not reply_text:
        reply_text = _local_fallback_jarvis_reply(user_message, live_context, action_note)

    audio_b64 = await synthesize_jarvis_mp3_b64(reply_text)
    return reply_text, audio_b64
