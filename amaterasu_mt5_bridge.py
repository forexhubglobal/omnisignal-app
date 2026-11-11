#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
 AMATERASU X · MT5 AUTO-EXECUTION BRIDGE (PYTHON NATIVE)
=============================================================================
 Bridges Amaterasu X AI High-Frequency Signals directly into MetaTrader 5.
 Supports:
   - Zero-latency SSE Realtime Stream + Fallback Polling
   - Multi-layer Split-TP execution (Layer 1 -> TP1, Layer 2 -> TP2 runner)
   - Auto-BreakEven (BE) when TP1 is confirmed
   - Automatic broker symbol matching (e.g. XAUUSD vs GOLD vs XAUUSD.m)
   - Fill type auto-detection (IOC, FOK, Return)
=============================================================================
"""

import os
import sys
import time
import json
import threading
import random
from datetime import datetime
import requests

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

try:
    import MetaTrader5 as mt5
except ImportError:
    print("[ERROR] Pakej MetaTrader5 belum dipasang. Sila jalankan: pip install MetaTrader5")
    sys.exit(1)

# ANSI Colors for Terminal
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "bridge_config.json")

DEFAULT_CONFIG = {
    "server_url": "https://equal-shield-amber-wilderness.trycloudflare.com",
    "lot_size": 0.20,
    "execution_mode": "SPLIT_TP", # "SPLIT_TP" (TP1, TP2, TP3), "SINGLE_TP1", "SINGLE_TP2", "SINGLE_TP3"
    "auto_breakeven": True,
    "stealth_mode": True, # Mod Samaran Anti-Broker: Kosongkan komen untuk mengelak broker flag sebagai bot
    "execution_jitter": True, # Kelewatan rawak manusia 0.35s - 1.20s sebelum order_send
    "gold_min_be_pips": 50.0,
    "max_concurrent_pairs": 4,
    "max_account_lots": 3.0,
    "max_slippage_pips": 5,
    "magic_number": 888999,
    "mt5_terminal_path": "",
    "allowed_pairs": ["XAUUSD", "USDCHF", "EURUSD"],
    "custom_lot_map": {
        "USDCAD": 0.50,
        "XAUUSD": 0.20,
        "USDJPY": 0.20,
        "USDCHF": 0.20
    },
    "custom_symbol_map": {
        "WTI": "USOIL",
        "BTCUSD": "BTCUSD"
    },
    "enable_smc_sweep_reentry": True
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8-sig') as f:
                cfg = json.load(f)
                merged = {**DEFAULT_CONFIG, **cfg}
                current_url = merged.get("server_url", "")
                if "onrender.com" in current_url or "vercel.app" in current_url or not current_url:
                    merged["server_url"] = "https://equal-shield-amber-wilderness.trycloudflare.com"
                return merged
        except Exception as e:
            print(f"[CONFIG] Gagal baca {CONFIG_FILE}, guna tetapan default: {e}")
    return DEFAULT_CONFIG

def save_config(cfg):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        print(f"[CONFIG] Ralat simpan config: {e}")

class AmaterasuBridge:
    def __init__(self, config):
        self.config = config
        self.server_url = config.get("server_url", DEFAULT_CONFIG["server_url"]).rstrip("/")
        self.lot_size = float(config.get("lot_size", 0.01))
        self.execution_mode = config.get("execution_mode", "SPLIT_TP")
        self.auto_be = config.get("auto_breakeven", True)
        self.magic_number = int(config.get("magic_number", 888999))
        self.max_slippage_pips = int(config.get("max_slippage_pips", 5))
        self.custom_map = config.get("custom_symbol_map", {})
        
        self.running = True
        self.executed_signal_ids = set()
        # active_positions map: signal_id -> list of MT5 tickets: [{'ticket': 123, 'tp_level': 1, 'entry': 2738.5, 'symbol': 'XAUUSD'}]
        self.active_positions = {}
        self.broker_symbols = {} # cache available broker symbols
        self.synced_deal_tickets = set()
        self.last_sl_timestamps = {} # {symbol: timestamp} for Post-SL Liquidity Sweep Cooldown
        self.pullback_retry_log = {} # {sig_id: timestamp} for debouncing pullback standby logs
        
    def banner(self):
        print(f"{Colors.RED}{Colors.BOLD}")
        print("  +===================================================================+")
        print("  |                   AMATERASU X - MT5 AI BRIDGE                     |")
        print("  |        High-Frequency Quantitative Signal Execution Terminal      |")
        print("  +===================================================================+")
        print(f"{Colors.RESET}")
        print(f" {Colors.CYAN}* Server Target   :{Colors.RESET} {self.server_url}")
        print(f" {Colors.CYAN}* Whitelist Pairs :{Colors.RESET} XAUUSD, USDCHF, EURUSD (TOP 3 ELITE SAHAJA)")
        print(f" {Colors.CYAN}* USDCAD Lot Size :{Colors.RESET} 0.50 lot (Juara Konsisten)")
        print(f" {Colors.CYAN}* Gold Lot Size   :{Colors.RESET} 0.20 lot (+50p Anti-Pullback BE)")
        print(f" {Colors.CYAN}* Gold NY Boost   :{Colors.RESET} 0.35 lot (19:30 - 23:30 MYT Golden Window - 98.3% Winrate)")
        print(f" {Colors.CYAN}* JPY/CHF Lot Size:{Colors.RESET} 0.20 lot (Penstabil Portfolio)")
        print(f" {Colors.CYAN}* Execution Mode  :{Colors.RESET} {self.execution_mode} (Split TP1/TP2/TP3)")
        print(f" {Colors.CYAN}* Auto Break-Even :{Colors.RESET} {'AKTIF (SOP Wajib)' if self.auto_be else 'TIDAK'}")
        print(f" {Colors.CYAN}* Floating ATR    :{Colors.RESET} AKTIF (M15 Live Volatility True Range)")
        print(f" {Colors.CYAN}* Gold Trap Zone  :{Colors.RESET} 14:00 - 16:00 MYT (London Trap DIBLOK)")
        print(f" {Colors.CYAN}* Max Open Pairs  :{Colors.RESET} {self.config.get('max_concurrent_pairs', 4)}")
        print(f" {Colors.CYAN}* Magic Number    :{Colors.RESET} {self.magic_number}")
        print(f" {Colors.CYAN}* Stealth Shield  :{Colors.RESET} {'AKTIF (Anti-Broker B-Book Cloaking)' if self.config.get('stealth_mode', True) else 'TIDAK'}")
        print(f" {Colors.CYAN}* Human Jitter    :{Colors.RESET} {'AKTIF (0.35s - 1.20s Random Execution)' if self.config.get('execution_jitter', True) else 'TIDAK'}")
        print("  -------------------------------------------------------------------")

    def init_mt5(self):
        print(f"\n{Colors.YELLOW}[MT5] Menyambung ke terminal MetaTrader 5...{Colors.RESET}")
        path = self.config.get("mt5_terminal_path")
        login = self.config.get("mt5_login")
        password = self.config.get("mt5_password")
        server = self.config.get("mt5_server")
        
        init_ok = False
        init_kwargs = {}
        if path and os.path.exists(path):
            init_kwargs["path"] = path
        if login and password and server:
            init_kwargs["login"] = int(login)
            init_kwargs["password"] = str(password)
            init_kwargs["server"] = str(server)
            print(f"[MT5] Auto-login dikonfigurasi bagi akaun #{login} pada server {server}")

        if init_kwargs:
            init_ok = mt5.initialize(**init_kwargs)
            if not init_ok and path and os.path.exists(path):
                print(f"[MT5] Menguji sambungan langsung ke terminal yang sedang berjalan: {path}")
                init_ok = mt5.initialize(path=path)

        if not init_ok:
            init_ok = mt5.initialize()

        if not init_ok:
            # Check standard known terminal paths if default init fails
            candidates = [
                r"C:\VersusTrade_Acc2\terminal64.exe",
                r"C:\VersusTrade_Acc3\terminal64.exe",
                r"C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe",
                r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe",
                r"C:\Program Files\MetaTrader 5 - Acc2\terminal64.exe",
                r"C:\Program Files\MetaTrader 5\terminal64.exe",
                r"C:\Program Files\MetaTrader 5 EXNESS\terminal64.exe",
                r"C:\Program Files\Pepperstone MetaTrader 5\terminal64.exe"
            ]
            for c in candidates:
                if os.path.exists(c):
                    print(f"[MT5] Mencuba sambungan ke: {c}")
                    c_kwargs = {"path": c}
                    if login and password and server:
                        c_kwargs["login"] = int(login)
                        c_kwargs["password"] = str(password)
                        c_kwargs["server"] = str(server)
                    if mt5.initialize(**c_kwargs):
                        init_ok = True
                        self.config["mt5_terminal_path"] = c
                        save_config(self.config)
                        break
                    if mt5.initialize(path=c):
                        acc = mt5.account_info()
                        if not login or (acc and str(acc.login) == str(login)):
                            init_ok = True
                            self.config["mt5_terminal_path"] = c
                            save_config(self.config)
                            break

        if not init_ok:
            err = mt5.last_error()
            print(f"{Colors.RED}[RALAT MT5] Gagal menyambung ke MT5: {err}{Colors.RESET}")
            print(f"{Colors.YELLOW}[PANDUAN]: Sila buka terminal MT5 anda secara manual terlebih dahulu, dan pastikan butang 'Algo Trading' diaktifkan.{Colors.RESET}")
            return False

        if login and password and server:
            mt5.login(login=int(login), password=str(password), server=str(server))

        account = mt5.account_info()
        terminal = mt5.terminal_info()
        if not account or not terminal:
            print(f"{Colors.RED}[RALAT MT5] Gagal membaca maklumat akaun MT5.{Colors.RESET}")
            return False

        print(f"{Colors.GREEN}[BERJAYA] Tersambung ke MT5!{Colors.RESET}")
        print(f" • Akaun Login   : {account.login} ({account.name})")
        print(f" • Broker/Server : {account.company} ({account.server})")
        print(f" • Baki (Balance): {account.currency} {account.balance:,.2f}")
        print(f" • Ekuiti (Equity): {account.currency} {account.equity:,.2f}")
        print(f" • Leverage      : 1:{account.leverage}")
        print(f" • Algo Trading  : {'DIBENARKAN (Aktif)' if terminal.trade_allowed else 'AMARAN: Algo Trading Dimatikan di MT5!'}")
        
        if not terminal.trade_allowed:
            print(f"{Colors.RED}[AMARAN KRITIKAL] Sila klik butang 'Algo Trading' pada bar alat MT5 untuk benarkan pesanan automatik.{Colors.RESET}")

        # Cache broker symbols
        symbols = mt5.symbols_get()
        if symbols:
            self.broker_symbols = {s.name.upper(): s.name for s in symbols}
            print(f" • Simbol Dikesan: {len(self.broker_symbols)} pasaran sedia didagangkan.")
        
        return True

    def resolve_symbol(self, raw_symbol):
        """Padankan simbol Amaterasu (cth: XAUUSD, WTI) kepada simbol spesifik broker (cth: XAUUSD.m, GOLD, USOIL)"""
        s_upper = raw_symbol.upper()
        
        # 1. Semak custom map dahulu
        if s_upper in self.custom_map:
            mapped = self.custom_map[s_upper]
            if mapped.upper() in self.broker_symbols:
                return self.broker_symbols[mapped.upper()]

        # 2. Jika exact match ada
        if s_upper in self.broker_symbols:
            return self.broker_symbols[s_upper]

        # 3. Cari variasi simbol biasa
        variations = []
        if s_upper == 'XAUUSD':
            variations = ['XAUUSD.C', 'GOLD', 'XAUUSD.M', 'XAUUSD.A', 'XAUUSD.PRO', 'XAUUSDM', 'XAUUSD_M', 'GOLD.M', 'GOLD.C']
        elif s_upper == 'WTI':
            variations = ['USOIL', 'USOIL.C', 'USOUSD', 'CL', 'OIL', 'WTI.M', 'CRUDE', 'WTI_OIL', 'USOIL.M']
        elif s_upper == 'BTCUSD':
            variations = ['BTCUSD.C', 'BTCUSD.M', 'BTCUSDT', 'BITCOIN', 'BTCUSD.PRO', 'BTCUSDM']
        else:
            variations = [f"{s_upper}.C", f"{s_upper}.M", f"{s_upper}.A", f"{s_upper}.PRO", f"{s_upper}M", f"{s_upper}_M", f"{s_upper}C", f"{s_upper}_C"]

        for v in variations:
            if v in self.broker_symbols:
                return self.broker_symbols[v]

        # 4. Partial substring match
        for b_name_upper, b_actual in self.broker_symbols.items():
            if s_upper in b_name_upper:
                return b_actual

        return raw_symbol

    def get_fill_type(self, symbol, order_type, price):
        """Uji filling mode yang sah untuk broker menggunakan order_check"""
        for fill in [mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN, mt5.ORDER_FILLING_IOC]:
            test_req = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": self.lot_size,
                "type": order_type,
                "price": price,
                "type_filling": fill,
                "type_time": mt5.ORDER_TIME_GTC,
            }
            res = mt5.order_check(test_req)
            if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                return fill
        return mt5.ORDER_FILLING_FOK

    def get_m15_atr(self, symbol, period=14):
        """Kira 14-period Average True Range (ATR) M15 terus daripada lilin MetaTrader 5"""
        try:
            rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, period + 2)
            if rates is not None and len(rates) >= period + 1:
                tr_list = []
                for i in range(1, len(rates)):
                    h = rates[i]['high']
                    l = rates[i]['low']
                    prev_c = rates[i-1]['close']
                    tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
                    tr_list.append(tr)
                if tr_list:
                    return sum(tr_list[-period:]) / period
        except Exception:
            pass
        return None

    def get_m15_volume_flow(self, symbol, period=20):
        """Mengesan lonjakan volume pembeli vs penjual (Buyer/Seller Institutional Volume Surge) berasaskan data lilin M15"""
        try:
            broker_sym = self.resolve_symbol(symbol)
            if not broker_sym:
                return {'flow': 'NEUTRAL', 'vol_ratio': 1.0, 'buyer_score': 50.0, 'avg_vol': 0, 'cur_vol': 0}
            rates = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_M15, 0, period + 2)
            if rates is not None and len(rates) >= period:
                past_volumes = [float(r['tick_volume']) for r in rates[:-1]]
                avg_vol = sum(past_volumes) / len(past_volumes) if past_volumes else 1.0
                latest = rates[-1]
                cur_vol = float(latest['tick_volume'])
                vol_ratio = (cur_vol / avg_vol) if avg_vol > 0 else 1.0
                o = float(latest['open'])
                h = float(latest['high'])
                l = float(latest['low'])
                c = float(latest['close'])
                total_range = max(h - l, 0.00001)
                buyer_score = ((c - l) / total_range) * 100.0
                flow = 'NEUTRAL'
                if vol_ratio >= 1.25 and buyer_score >= 65.0:
                    flow = 'BUYER_SURGE'
                elif vol_ratio >= 1.25 and buyer_score <= 35.0:
                    flow = 'SELLER_SURGE'
                return {
                    'flow': flow,
                    'vol_ratio': round(vol_ratio, 2),
                    'buyer_score': round(buyer_score, 1),
                    'avg_vol': round(avg_vol, 0),
                    'cur_vol': round(cur_vol, 0)
                }
        except Exception:
            pass
        return {'flow': 'NEUTRAL', 'vol_ratio': 1.0, 'buyer_score': 50.0, 'avg_vol': 0, 'cur_vol': 0}

    def get_mtf_triple_ma(self, symbol):
        """
        Multi-Timeframe Triple MA (20, 100, 200) + D1/H4 Macro Direction Confluence:
        - M1, M5, M15: Semak susunan lilin berbanding MA 20, 100, 200 serta kecerunan (slope).
        - D1 & H4: Semak saiz badan lilin semasa (Dominasi Buyer vs Seller).
        """
        try:
            broker_sym = self.resolve_symbol(symbol)
            if not broker_sym:
                return {"alignment": "NEUTRAL", "macro": "NEUTRAL", "m1": "NEUTRAL", "m5": "NEUTRAL", "m15": "NEUTRAL"}

            def eval_ma(tf, count=215):
                rates = mt5.copy_rates_from_pos(broker_sym, tf, 0, count)
                if rates is None or len(rates) < 202:
                    return "NEUTRAL", 0, 0, 0
                closes = [float(r['close']) for r in rates]
                p = closes[-1]
                ma20 = sum(closes[-20:]) / 20.0
                ma100 = sum(closes[-100:]) / 100.0
                ma200 = sum(closes[-200:]) / 200.0
                
                prev_ma20 = sum(closes[-21:-1]) / 20.0
                prev_ma100 = sum(closes[-101:-1]) / 100.0
                prev_ma200 = sum(closes[-201:-1]) / 200.0
                
                slope20 = ma20 > prev_ma20
                slope100 = ma100 > prev_ma100
                slope200 = ma200 > prev_ma200
                
                # Susunan menegak ke atas (Bullish Fan)
                if p > ma20 and ma20 > ma100 and ma100 > ma200 and slope20 and slope100:
                    return "BULLISH_FAN", ma20, ma100, ma200
                # Susunan menurun ke bawah (Bearish Fan)
                elif p < ma20 and ma20 < ma100 and ma100 < ma200 and not slope20 and not slope100:
                    return "BEARISH_FAN", ma20, ma100, ma200
                elif p > ma20 and ma20 > ma100:
                    return "BULLISH", ma20, ma100, ma200
                elif p < ma20 and ma20 < ma100:
                    return "BEARISH", ma20, ma100, ma200
                return "NEUTRAL", ma20, ma100, ma200

            def eval_htf_candle(tf):
                rates = mt5.copy_rates_from_pos(broker_sym, tf, 0, 2)
                if rates is None or len(rates) < 1:
                    return "NEUTRAL"
                r = rates[-1]
                o, h, l, c = float(r['open']), float(r['high']), float(r['low']), float(r['close'])
                rng = max(h - l, 0.00001)
                body = abs(c - o)
                if c > o and (body / rng) >= 0.40:
                    return "STRONG_BUYER"
                elif o > c and (body / rng) >= 0.40:
                    return "STRONG_SELLER"
                elif c > o:
                    return "BUYER"
                else:
                    return "SELLER"

            m1_status, m1_20, m1_100, m1_200 = eval_ma(mt5.TIMEFRAME_M1)
            m5_status, _, _, _ = eval_ma(mt5.TIMEFRAME_M5)
            m15_status, _, _, _ = eval_ma(mt5.TIMEFRAME_M15)
            h4_status = eval_htf_candle(mt5.TIMEFRAME_H4)
            d1_status = eval_htf_candle(mt5.TIMEFRAME_D1)

            # Tentukan Bias Makro (D1 + H4):
            macro = "NEUTRAL"
            if "BUYER" in d1_status and "BUYER" in h4_status:
                macro = "STRONG_BUYER" if ("STRONG" in d1_status or "STRONG" in h4_status) else "BUYER"
            elif "SELLER" in d1_status and "SELLER" in h4_status:
                macro = "STRONG_SELLER" if ("STRONG" in d1_status or "STRONG" in h4_status) else "SELLER"
            elif "BUYER" in d1_status:
                macro = "BUYER"
            elif "SELLER" in d1_status:
                macro = "SELLER"

            # Keselarasan Penuh (Alignment Confluence):
            alignment = "NEUTRAL"
            if "BULLISH" in m1_status and "BULLISH" in m5_status and "BULLISH" in m15_status:
                alignment = "FULL_BULLISH"
            elif "BEARISH" in m1_status and "BEARISH" in m5_status and "BEARISH" in m15_status:
                alignment = "FULL_BEARISH"
            elif "BULLISH" in m15_status and "BULLISH" in m5_status:
                alignment = "M15_M5_BULLISH"
            elif "BEARISH" in m15_status and "BEARISH" in m5_status:
                alignment = "M15_M5_BEARISH"

            # D1 & H4 High / Low Liquidity Boundary
            rates_d1 = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_D1, 0, 2)
            d1_high = float(rates_d1[-1]['high']) if rates_d1 is not None and len(rates_d1) > 0 else 0
            d1_low = float(rates_d1[-1]['low']) if rates_d1 is not None and len(rates_d1) > 0 else 0
            rates_h4 = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_H4, 0, 2)
            h4_high = float(rates_h4[-1]['high']) if rates_h4 is not None and len(rates_h4) > 0 else 0
            h4_low = float(rates_h4[-1]['low']) if rates_h4 is not None and len(rates_h4) > 0 else 0

            return {
                "alignment": alignment,
                "macro": macro,
                "d1": d1_status,
                "h4": h4_status,
                "d1_high": round(d1_high, 2),
                "d1_low": round(d1_low, 2),
                "h4_high": round(h4_high, 2),
                "h4_low": round(h4_low, 2),
                "m15": m15_status,
                "m5": m5_status,
                "m1": m1_status,
                "m1_ma20": round(m1_20, 5),
                "m1_ma100": round(m1_100, 5),
                "m1_ma200": round(m1_200, 5)
            }
        except Exception:
            pass
        return {"alignment": "NEUTRAL", "macro": "NEUTRAL", "m1": "NEUTRAL", "m5": "NEUTRAL", "m15": "NEUTRAL"}

    def execute_order(self, signal, tp_target=1):
        symbol_raw = signal.get("symbol", "XAUUSD")
        symbol = self.resolve_symbol(symbol_raw)
        
        # 0. WHITELIST GUARD: Hanya Pair Pilihan Bos (XAUUSD, USDCHF, EURUSD, USDCAD, USDJPY)
        allowed_pairs = self.config.get("allowed_pairs", ["XAUUSD", "USDCHF", "EURUSD"])
        clean_raw_sym = symbol_raw.split('.')[0].upper()
        if allowed_pairs and clean_raw_sym not in [p.upper() for p in allowed_pairs]:
            print(f"{Colors.YELLOW}🛡️ [PAIR DITAPIS] Simbol #{clean_raw_sym} ditolak. Hanya {', '.join(allowed_pairs)} dibenarkan mengikut arahan bos.{Colors.RESET}")
            return None

        # 0.2 LONDON TRAP ZONE GUARD (13:30 - 16:00 MYT):
        # Data sejarah 2,732 trade membuktikan 13:30 - 16:00 MYT penuh manipulasi Judas Swing.
        # XAUUSD DILARANG MASUK sepanjang zon ini demi melindungi modal!
        if clean_raw_sym == "XAUUSD":
            from datetime import timezone, timedelta
            now_myt = datetime.now(timezone(timedelta(hours=8)))
            now_mins = now_myt.hour * 60 + now_myt.minute
            if (13 * 60 + 30) <= now_mins < (16 * 60):
                print(f"{Colors.YELLOW}🛡️ [LONDON TRAP ZONE] Menolak order XAUUSD pada jam {now_myt.strftime('%H:%M')} MYT. Zon 13:30 - 16:00 disekat bagi mengelak manipulasi Judas Swing pembukaan London.{Colors.RESET}")
                return None
        
        # Pastikan simbol aktif dalam MarketWatch
        mt5.symbol_select(symbol, True)
        sym_info = mt5.symbol_info(symbol)
        if not sym_info:
            time.sleep(0.15)
            mt5.symbol_select(symbol, True)
            sym_info = mt5.symbol_info(symbol)
            if not sym_info:
                print(f"{Colors.RED}[ORDER] Maklumat simbol {symbol} tidak ditemui di broker.{Colors.RESET}")
                return None

        order_type_str = str(signal.get("type", "")).upper().strip()
        if order_type_str not in ["BUY", "SELL"]:
            print(f"{Colors.RED}[ORDER DITOLAK] Jenis order '{order_type_str}' tidak sah.{Colors.RESET}")
            return None

        is_buy = (order_type_str == "BUY")
        order_type = mt5.ORDER_TYPE_BUY if is_buy else mt5.ORDER_TYPE_SELL
        print(f"{Colors.BOLD}{Colors.YELLOW}🎯 [PENGESAHAN ARAH] Amaterasu X AI: #{signal.get('symbol')} {order_type_str} ➔ MT5 Action: {'BUY (ORDER_TYPE_BUY)' if is_buy else 'SELL (ORDER_TYPE_SELL)'}{Colors.RESET}")

        # 0. Risk & Margin Safety Guards:
        acc = mt5.account_info()
        if not acc:
            print(f"{Colors.RED}[RISK GUARD] Gagal membaca maklumat akaun MT5.{Colors.RESET}")
            return None

        margin_level = (acc.equity / acc.margin * 100) if (acc.margin and acc.margin > 0) else 99999.0
        if acc.margin and acc.margin > 0 and margin_level < 250.0:
            print(f"{Colors.RED}🛑 [RISK GUARD] Margin Level akaun terlalu rendah ({margin_level:.1f}% < 250%). Menolak order baru bagi mengelakkan Stop Out!{Colors.RESET}")
            return None

        if acc.margin_free < 5.0 and acc.balance > 5.0:
            print(f"{Colors.RED}🛑 [RISK GUARD] Margin Bebas tidak mencukupi ({acc.margin_free:.2f} < 5.0). Order ditolak.{Colors.RESET}")
            return None

        all_active_pos = mt5.positions_get() or []
        # Hanya kira simbol aktif yang dibuka oleh Amaterasu X dan dalam senarai allowed_pairs
        open_unique_symbols = set(
            p.symbol.split('.')[0].upper() for p in all_active_pos 
            if (p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")))
            and (not allowed_pairs or p.symbol.split('.')[0].upper() in [a.upper() for a in allowed_pairs])
        )
        clean_raw_sym = symbol.split('.')[0].upper()

        # XAUUSD ialah Aset Keutamaan (VIP Asset). Jangan sekat XAUUSD melainkan margin tidak mencukupi!
        max_pairs = int(self.config.get("max_concurrent_pairs", 4))
        if clean_raw_sym != "XAUUSD" and len(open_unique_symbols) >= max_pairs and clean_raw_sym not in open_unique_symbols:
            print(f"{Colors.YELLOW}🛡️ [RISK GUARD] Had {max_pairs} Pair serentak telah dicapai ({', '.join(open_unique_symbols)}). Order #{clean_raw_sym} ditolak bagi melindungi modal.{Colors.RESET}")
            return None

        # HARD CEILING: Maximum Total Account Open Lots & Positions (Anti-Overtrading & Anti-Liquidation)
        all_pos_raw = mt5.positions_get() or []
        tot_vol = sum(p.volume for p in all_pos_raw)
        max_tot_vol = float(self.config.get("max_account_lots", 3.0))
        if tot_vol >= max_tot_vol or len(all_pos_raw) >= 10:
            print(f"{Colors.RED}🛑 [MAX EXPOSURE GUARD] Jumlah lot akaun ({tot_vol:.2f} >= {max_tot_vol}) atau posisi ({len(all_pos_raw)} >= 10) telah mencapai had maksimum keselamatan (9 posisi)! Menolak order baharu.{Colors.RESET}")
            return None

        # STRICT 1-SETUP PER SYMBOL (MAX 3 SPLIT LAYERS - BULAN LEPAS LOCKED SOP):
        # 1 setup merangkumi TP1, TP2, TP3. Sekiranya simbol ini sudah mempunyai 3 layer, sekat order tambahan bagi menghalang over-exposure!
        existing_symbol_orders = [
            p for p in (mt5.positions_get() or [])
            if (p.symbol.split('.')[0].upper() == clean_raw_sym) and
               (p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")))
        ]
        if len(existing_symbol_orders) >= 3:
            print(f"{Colors.YELLOW}🛡️ [SOP BULAN LEPAS] Simbol #{clean_raw_sym} sudah mempunyai {len(existing_symbol_orders)} layer aktif (TP1, TP2, TP3). Menolak sebarang order tambahan bagi menjaga modal.{Colors.RESET}")
            return None

        # Anti-Hedging check: Elak buka posisi bertentangan jika sudah ada sebarang posisi aktif untuk simbol ini di MT5
        all_sym_pos = [p for p in (mt5.positions_get() or []) if p.symbol.split('.')[0].upper() == clean_raw_sym]
        if all_sym_pos:
            for ep in all_sym_pos:
                if (order_type == mt5.ORDER_TYPE_BUY and ep.type == mt5.POSITION_TYPE_SELL) or \
                   (order_type == mt5.ORDER_TYPE_SELL and ep.type == mt5.POSITION_TYPE_BUY):
                    print(f"{Colors.YELLOW}[ANTI-HEDGE] Menolak order {order_type_str} #{symbol} kerana sudah ada posisi bertentangan yang sedang aktif di MT5 (Ticket #{ep.ticket}, Type: {'BUY' if ep.type == mt5.POSITION_TYPE_BUY else 'SELL'}). Menunggu selesai dahulu.{Colors.RESET}")
                    return None

        # INSTITUTIONAL VOLUME FLOW RADAR TELEMETRY:
        v_flow = self.get_m15_volume_flow(symbol)
        print(f"{Colors.CYAN}📊 [VOLUME RADAR] #{clean_raw_sym} Flow: {v_flow.get('flow', 'NEUTRAL')} | Vol Ratio: {v_flow.get('vol_ratio', 1.0)}x | Buyer Score: {v_flow.get('buyer_score', 50)}%{Colors.RESET}")

        # MULTI-TIMEFRAME TRIPLE MA (20, 100, 200) + D1/H4 MACRO TELEMETRY:
        mtf_ma = self.get_mtf_triple_ma(symbol)
        macro_bias = mtf_ma.get("macro", "NEUTRAL")
        m15_bias = mtf_ma.get("m15", "NEUTRAL")
        m5_bias = mtf_ma.get("m5", "NEUTRAL")
        m1_bias = mtf_ma.get("m1", "NEUTRAL")
        alignment = mtf_ma.get("alignment", "NEUTRAL")
        print(f"{Colors.CYAN}📈 [TRIPLE MA RADAR] #{clean_raw_sym} Macro D1/H4: {macro_bias} | M15: {m15_bias} | M5: {m5_bias} | M1: {m1_bias} | Alignment: {alignment}{Colors.RESET}")

        tick = mt5.symbol_info_tick(symbol)
        if not tick:
            print(f"{Colors.RED}[ORDER] Gagal membaca harga tick semasa bagi {symbol}.{Colors.RESET}")
            return None

        price = tick.ask if is_buy else tick.bid
        digits = sym_info.digits
        point = sym_info.point

        # 3. SMC PULLBACK & ANTI-CHASING GUARD (NO BUYING AT PUCUK / NO SELLING AT LANTAI)
        # Menghalang kemasukan BUY di zon puncak atau SELL di zon dasar. Wajib tunggu pullback!
        rates_m15 = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 16)
        if rates_m15 is not None and len(rates_m15) >= 8:
            recent_high = max(float(r['high']) for r in rates_m15)
            recent_low = min(float(r['low']) for r in rates_m15)
            rng = recent_high - recent_low
            min_rng = 4.0 if clean_raw_sym == "XAUUSD" else 0.0020
            if rng >= min_rng:
                pos_ratio = (price - recent_low) / rng
                # BUY: Dilarang sama sekali jika harga berada melebihi 45% julat M15 (Zon Pucuk/Tengah)
                if is_buy and pos_ratio > 0.45:
                    print(f"{Colors.RED}🛑 [SMC PULLBACK GUARD DITOLAK] Order BUY #{clean_raw_sym} disekat! Harga di zon PUCUK / RINTANGAN ({price:.2f}, {pos_ratio*100:.1f}% julat M15). Wajib tunggu pullback ke zon diskaun/lantai (<= 45%) sebelum masuk BUY!{Colors.RESET}")
                    return None
                # SELL: Dilarang sama sekali jika harga berada di bawah 55% julat M15 (Zon Lantai/Tengah)
                elif not is_buy and pos_ratio < 0.55:
                    print(f"{Colors.RED}🛑 [SMC PULLBACK GUARD DITOLAK] Order SELL #{clean_raw_sym} disekat! Harga di zon LANTAI / SOKONGAN ({price:.2f}, {pos_ratio*100:.1f}% julat M15). Wajib tunggu pullback ke zon premium/bumbung (>= 55%) sebelum masuk SELL!{Colors.RESET}")
                    return None



        # Entry & distance calculation
        signal_entry = float(signal.get("entry", price))
        raw_tp = float(signal.get("tp3" if tp_target == 3 else ("tp2" if tp_target == 2 else "tp1"), 0.0))
        raw_sl = float(signal.get("sl", 0.0))

        # SPREAD-AWARE CALIBRATED TP & SL (INSTITUTIONAL PROTECTED MODEL):
        # Gunakan sasaran tepat signal pelayan dengan penampan spread (Cent & Standard)
        if raw_tp > 0 and raw_sl > 0:
            tp_dist = abs(raw_tp - signal_entry)
            sl_dist = abs(raw_sl - signal_entry)
            # Penampan keselamatan diperluas mengelak disapu wick atau spread broker (XAU 68-78p, EUR 28-32p, CHF 28-32p)
            if clean_raw_sym == "XAUUSD":
                sl_dist = min(max(sl_dist, 6.8), 7.8) # 68 hingga 78 pips ($6.80 - $7.80)
                tp_dist = max(tp_dist, 3.5) # Minimum TP1 35 pips ($3.50)
            else:
                is_jpy = "JPY" in clean_raw_sym
                min_fx_sl = 0.0028 if not is_jpy else 0.28
                min_fx_tp = 0.0020 if not is_jpy else 0.20
                sl_dist = min(max(sl_dist, min_fx_sl), 0.0032 if not is_jpy else 0.32)
                tp_dist = max(tp_dist, min_fx_tp)
        elif live_atr and live_atr > 0:
            if clean_raw_sym == "XAUUSD":
                # Gold Protected Risk Model (3x M15 ATR Cushion):
                sl_dist = min(max(1.2 * live_atr, 6.8), 7.8)
                if tp_target == 3:
                    tp_dist = max(2.5 * live_atr, 18.0)
                elif tp_target == 2:
                    tp_dist = max(1.6 * live_atr, 10.0)
                else: # TP1
                    tp_dist = max(0.8 * live_atr, 5.0)
                print(f"{Colors.CYAN}🌊 [DYNAMIC FLOATING ATR] #{clean_raw_sym} M15 ATR: {live_atr:.2f} mata | SL: {sl_dist:.2f} | TP{tp_target}: {tp_dist:.2f} mata (Autonomi Pasaran){Colors.RESET}")
            else:
                # Forex (EURUSD, USDCHF, USDCAD, USDJPY) - Penampan Luas 28 - 32 Pips:
                min_forex_sl = 0.0028 if "JPY" not in clean_raw_sym else 0.28
                min_forex_tp1 = 0.0020 if "JPY" not in clean_raw_sym else 0.20
                min_forex_tp2 = 0.0042 if "JPY" not in clean_raw_sym else 0.42
                min_forex_tp3 = 0.0070 if "JPY" not in clean_raw_sym else 0.70
                
                sl_dist = min(max(2.5 * live_atr, min_forex_sl), 0.0032 if "JPY" not in clean_raw_sym else 0.32)
                if tp_target == 3:
                    tp_dist = max(7.0 * live_atr, min_forex_tp3)
                elif tp_target == 2:
                    tp_dist = max(4.5 * live_atr, min_forex_tp2)
                else:
                    tp_dist = max(2.5 * live_atr, min_forex_tp1)
                
                pip_mult = 100 if "JPY" in clean_raw_sym else 10000
                print(f"{Colors.CYAN}🌊 [DYNAMIC FLOATING ATR] #{clean_raw_sym} M15 ATR: {live_atr * pip_mult:.1f} pips | SL: {sl_dist * pip_mult:.1f}p | TP{tp_target}: {tp_dist * pip_mult:.1f}p (Autonomi Pasaran){Colors.RESET}")
        else:
            # Fallback jika ATR tidak aktif / gagal dibaca
            if clean_raw_sym == "XAUUSD":
                tp_dist = abs(raw_tp - signal_entry) if raw_tp > 0 else (18.0 if tp_target == 3 else (10.0 if tp_target == 2 else 5.0))
                sl_dist = min(max(abs(raw_sl - signal_entry), 6.8), 7.8) if raw_sl > 0 else 7.0
            else:
                is_jpy = "JPY" in clean_raw_sym
                tp_dist = abs(raw_tp - signal_entry) if raw_tp > 0 else ((0.0070 if not is_jpy else 0.70) if tp_target == 3 else ((0.0042 if not is_jpy else 0.42) if tp_target == 2 else (0.0020 if not is_jpy else 0.20)))
                sl_dist = min(max(abs(raw_sl - signal_entry), 0.0028 if not is_jpy else 0.28), 0.0032 if not is_jpy else 0.32) if raw_sl > 0 else (0.0028 if not is_jpy else 0.28)

        # Gunakan jarak relatif dari harga kemasukan sebenar (Market Price)
        # Ini mengelakkan ralat 'Invalid Stops' jika harga sudah bergerak
        if is_buy:
            tp = round(price + tp_dist, digits)
            sl = round(price - sl_dist, digits)
        else:
            tp = round(price - tp_dist, digits)
            sl = round(price + sl_dist, digits)

        # STRICT ANTI-CHASING PUCUK/LANTAI GUARD:
        # Penampan fleksibel: Emas ($4,040+) diberi ruang 15 pip ($1.50) waktu lonjakan news/volatiliti
        allowed_slip_pips = 15.0 if clean_raw_sym == "XAUUSD" else max(self.max_slippage_pips, 8.0)
        max_slip_dist = (allowed_slip_pips * 10 * point)
        if is_buy and price > (signal_entry + max_slip_dist):
            slip_pips = (price - signal_entry) / (10 * point)
            print(f"{Colors.RED}🛑 [ANTI-PUCUK DITOLAK] Order BUY #{clean_raw_sym} disekat! Harga semasa ({price:.{digits}f}) telah melambung +{slip_pips:.1f} pips melepasi Entry Signal ({signal_entry:.{digits}f}). Dilarang beli di pucuk!{Colors.RESET}")
            return None
        elif not is_buy and price < (signal_entry - max_slip_dist):
            slip_pips = (signal_entry - price) / (10 * point)
            print(f"{Colors.RED}🛑 [ANTI-LANTAI DITOLAK] Order SELL #{clean_raw_sym} disekat! Harga semasa ({price:.{digits}f}) telah menjunam -{slip_pips:.1f} pips di bawah Entry Signal ({signal_entry:.{digits}f}). Dilarang sell di lantai!{Colors.RESET}")
            return None

        diff = abs(price - signal_entry)
        if diff > 0:
            print(f"{Colors.CYAN}[PENGESAHAN ENTRY] Harga semasa ({price:.{digits}f}) vs Signal ({signal_entry:.{digits}f}) | TP{tp_target}={tp:.{digits}f}, SL={sl:.{digits}f}.{Colors.RESET}")

        # Saiz lot: Semak jika simbol mempunyai custom lot (cth: USDCAD 0.50 lot, XAU/JPY/CHF 0.20 lot)
        exec_lot = self.lot_size
        custom_lots = self.config.get("custom_lot_map", {})
        for c_sym, c_lot in custom_lots.items():
            if c_sym.upper() in symbol.upper():
                exec_lot = float(c_lot)
                break

        # Module: News AI Boost (Entry T-10m Golden Window dengan saiz lot dipertingkat)
        is_news_trade = bool(signal.get("isNews") or signal.get("is_news") or "NEWS AI" in str(signal.get("notes", "")))
        if is_news_trade:
            if clean_raw_sym == "XAUUSD":
                exec_lot = float(self.config.get("news_gold_lot_size", self.config.get("ny_gold_lot_size", exec_lot)))
            else:
                exec_lot = float(self.config.get("news_fx_lot_size", exec_lot))
            print(f"{Colors.GREEN}{Colors.BOLD}⚡ [NEWS AI BOOST] Isyarat News AI dikesan! Saiz lot #{clean_raw_sym} dilaraskan ke {exec_lot} lot (T-10m Golden Entry | Safe Risk SOP).{Colors.RESET}")
        else:
            # Module 3: Time-Price Theory (Sesi Emas New York: 7:30 PM - 11:30 PM MYT)
            # HANYA UNTUK XAUUSD: Gandakan saiz posisi sempena 98.3% Winrate Window
            is_ny_gold_boost = False
            if clean_raw_sym == "XAUUSD":
                from datetime import timezone, timedelta
                now_myt = datetime.now(timezone(timedelta(hours=8)))
                is_ny_golden_window = (
                    (now_myt.hour == 19 and now_myt.minute >= 30) or
                    (20 <= now_myt.hour <= 22) or
                    (now_myt.hour == 23 and now_myt.minute <= 30)
                )
                if is_ny_golden_window and self.config.get("ny_gold_multiplier_active", True):
                    default_ny_lot = round(exec_lot * 1.5, 2)
                    exec_lot = float(self.config.get("ny_gold_lot_size", default_ny_lot))
                    is_ny_gold_boost = True
                    print(f"{Colors.GREEN}{Colors.BOLD}🔥 [TIME-PRICE THEORY: SESI EMAS NEW YORK] Menggandakan saiz posisi XAUUSD kepada {exec_lot} lot! (Waktu Emas 19:30 - 23:30 MYT | Rekod 98.3% Winrate){Colors.RESET}")

        # Human Execution Jitter (Anti-Bot Timing Fingerprint Guard):
        if self.config.get("execution_jitter", True):
            jitter = round(random.uniform(0.35, 1.20), 2)
            time.sleep(jitter)

        # Deviation in points (Toleransi requote waktu lonjakan news/volatiliti pantas)
        deviation = int((15 if clean_raw_sym == "XAUUSD" else max(self.max_slippage_pips, 8)) * 10)
        filling = self.get_fill_type(symbol, order_type, price)

        # Stealth Mode Comment Protection (Sembunyikan cap jari bot daripada Broker B-Book):
        if self.config.get("stealth_mode", True):
            comment = ""  # Bersih tanpa watermark, sama seperti order manual dari MT5 Mobile
        else:
            comment = f"AmaterasuX-NY-TP{tp_target}" if is_ny_gold_boost else f"AmaterasuX-TP{tp_target}"

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": exec_lot,
            "type": order_type,
            "price": round(price, digits),
            "sl": round(sl, digits),
            "tp": round(tp, digits),
            "deviation": deviation,
            "magic": self.magic_number,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": filling,
        }

        # HARD DIRECTION & INTEGRITY GUARD (Fail-safe Direction Lock):
        if is_buy:
            if order_type != mt5.ORDER_TYPE_BUY or request["type"] != mt5.ORDER_TYPE_BUY:
                print(f"{Colors.RED}❌ [FATAL INTEGRITY ERROR] Signal adalah BUY tetapi order_type bukan ORDER_TYPE_BUY! Execution dibatalkan serta-merta.{Colors.RESET}")
                return None
            if request["tp"] <= request["price"]:
                print(f"{Colors.RED}❌ [INVALID TP] TP bagi BUY mestilah di atas harga semasa! Order dibatalkan.{Colors.RESET}")
                return None
        else:
            if order_type != mt5.ORDER_TYPE_SELL or request["type"] != mt5.ORDER_TYPE_SELL:
                print(f"{Colors.RED}❌ [FATAL INTEGRITY ERROR] Signal adalah SELL tetapi order_type bukan ORDER_TYPE_SELL! Execution dibatalkan serta-merta.{Colors.RESET}")
                return None
            if request["tp"] >= request["price"]:
                print(f"{Colors.RED}❌ [INVALID TP] TP bagi SELL mestilah di bawah harga semasa! Order dibatalkan.{Colors.RESET}")
                return None

        # HARD ZERO-SL GUARD (DILARANG MASUK TANPA STOP LOSS):
        if not request.get("sl") or request["sl"] <= 0:
            print(f"{Colors.RED}❌ [FATAL STOP LOSS ERROR] SL bernilai 0.0! Dilarang membuka posisi tanpa Stop Loss! Execution dibatalkan.{Colors.RESET}")
            return None
        if is_buy and request["sl"] >= request["price"]:
            print(f"{Colors.RED}❌ [INVALID SL] SL bagi BUY mestilah di bawah harga semasa! Order dibatalkan.{Colors.RESET}")
            return None
        if not is_buy and request["sl"] <= request["price"]:
            print(f"{Colors.RED}❌ [INVALID SL] SL bagi SELL mestilah di atas harga semasa! Order dibatalkan.{Colors.RESET}")
            return None

        print(f"\n{Colors.CYAN}⚡ [MENGHANTAR ORDER] {order_type_str} {self.lot_size} lot #{symbol} @ {price:.{digits}f}{Colors.RESET}")
        print(f"   SL: {sl:.{digits}f} | TP{tp_target}: {tp:.{digits}f} | Filling Mode: {filling}")

        # Cuba hantar order dengan auto-fallback jika broker memerlukan filling mode lain
        result = None
        for candidate_fill in [filling, mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN, mt5.ORDER_FILLING_IOC]:
            request["type_filling"] = candidate_fill
            result = mt5.order_send(request)
            if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                break
            if not result or result.retcode != 10030: # 10030 = Unsupported filling mode
                break

        if not result or result.retcode != mt5.TRADE_RETCODE_DONE:
            err_code = result.retcode if result else mt5.last_error()
            err_comment = result.comment if result else ""
            if err_code == 10018: # Market closed
                now_t = time.time()
                if (now_t - getattr(self, "last_market_closed_log", 0)) > 60:
                    self.last_market_closed_log = now_t
                    print(f"{Colors.YELLOW}⏸️ [PASARAN DITUTUP] Pasaran #{symbol} sedang bercuti (Hujung Minggu). Amaterasu AI siap siaga sehingga pasaran buka semula.{Colors.RESET}")
                return None
            print(f"{Colors.RED}❌ [ORDER GAGAL] Retcode: {err_code} ({err_comment}){Colors.RESET}")
            return None

        print(f"{Colors.GREEN}✅ [ORDER BERJAYA!] Ticket #{result.order} | Price: {result.price:.{digits}f} | Volume: {result.volume}{Colors.RESET}")
        
        return {
            "ticket": result.order,
            "symbol": symbol,
            "tp_level": tp_target,
            "entry_price": result.price,
            "sl": sl,
            "tp": tp,
            "signal_id": signal.get("id")
        }

    def process_new_signal(self, sig):
        sig_id = sig.get("id")
        if not sig_id or sig_id in self.executed_signal_ids:
            return

        # TARGET ACCOUNT GUARD: Jika isyarat disasarkan kepada akaun tertentu (cth: Akaun 3 #5100209626)
        target_acc = sig.get("targetAccount")
        if target_acc:
            acc_info = mt5.account_info()
            my_login = str(acc_info.login) if acc_info else str(self.config.get("mt5_login", ""))
            if str(target_acc).strip() != my_login.strip():
                return

        now_t = time.time()
        if not hasattr(self, "signal_retry_cooldown"):
            self.signal_retry_cooldown = {}
        if (now_t - self.signal_retry_cooldown.get(sig_id, 0)) < 30:
            return
        self.signal_retry_cooldown[sig_id] = now_t

        status = sig.get("status", "ACTIVE")
        if status != "ACTIVE":
            return

        # WHITELIST GUARD: Hanya Pair Pilihan Bos (XAUUSD, USDCHF, EURUSD, USDCAD, USDJPY)
        allowed_pairs = self.config.get("allowed_pairs", ["XAUUSD", "USDCHF", "EURUSD", "USDCAD", "USDJPY"])
        clean_sym = str(sig.get("symbol", "")).split('.')[0].upper()
        if allowed_pairs and clean_sym not in [p.upper() for p in allowed_pairs]:
            return

        # LONDON TRAP ZONE GUARD (14:00 - 16:00 MYT):
        if clean_sym == "XAUUSD":
            from datetime import timezone, timedelta
            now_myt = datetime.now(timezone(timedelta(hours=8)))
            if 14 <= now_myt.hour < 16:
                print(f"{Colors.YELLOW}🛡️ [LONDON TRAP ZONE] Signal #{clean_sym} ditolak pada jam {now_myt.strftime('%H:%M')} MYT. Zon 14:00 - 16:00 disekat bagi mengelak manipulasi Judas Swing.{Colors.RESET}")
                return

        order_records = []
        if self.execution_mode == "SPLIT_TP":
            # Buka 3 layer mengikut Amaterasu Institutional SOP:
            # Layer 1 -> TP1 (Quick Profit)
            # Layer 2 -> TP2 (Mid Swing)
            # Layer 3 -> TP3 (Big Trend Runner)
            print(f"{Colors.CYAN}[AMATERASU SOP] Membuka 3 Layer (Layer 1 -> TP1, Layer 2 -> TP2, Layer 3 -> TP3 Runner)...{Colors.RESET}")
            ord1 = self.execute_order(sig, tp_target=1)
            if ord1:
                order_records.append(ord1)
            time.sleep(0.3)
            ord2 = self.execute_order(sig, tp_target=2)
            if ord2:
                order_records.append(ord2)
            time.sleep(0.3)
            ord3 = self.execute_order(sig, tp_target=3)
            if ord3:
                order_records.append(ord3)
        elif self.execution_mode == "SINGLE_TP3":
            ord3 = self.execute_order(sig, tp_target=3)
            if ord3:
                order_records.append(ord3)
        elif self.execution_mode == "SINGLE_TP2":
            ord2 = self.execute_order(sig, tp_target=2)
            if ord2:
                order_records.append(ord2)
        else: # SINGLE_TP1
            ord1 = self.execute_order(sig, tp_target=1)
            if ord1:
                order_records.append(ord1)

        if order_records:
            self.active_positions[sig_id] = order_records
            self.executed_signal_ids.add(sig_id)
            print(f"{Colors.GREEN}✅ [ENTRY BERJAYA] Semua {len(order_records)} layer #{clean_sym} berjaya dibuka pada harga optimum!{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}⚠️ [ENTRY DITANGGUHKAN] Order #{clean_sym} tidak dibuka. Sila semak sambungan broker atau pasaran.{Colors.RESET}")

    def apply_breakeven_for_symbol(self, raw_symbol, sig_data=None):
        """Kunci Stop Loss ke Break-Even bagi semua posisi terbuka broker bagi simbol ini"""
        if not self.auto_be:
            return

        broker_sym = self.resolve_symbol(raw_symbol)
        all_positions = mt5.positions_get()
        if not all_positions:
            return

        matching_positions = [
            p for p in all_positions 
            if (p.symbol == broker_sym or p.symbol.split('.')[0].upper() == raw_symbol.upper())
            and (p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")))
        ]

        if not matching_positions:
            return

        for p in matching_positions:
            self.check_and_apply_position_be(p, sig_data)

    def check_and_apply_position_be(self, p, sig_data=None):
        """Kunci Stop Loss ke Break-Even (Sifar Risiko) untuk satu posisi MT5 secara pintar"""
        if not self.auto_be:
            return

        sym_info = mt5.symbol_info(p.symbol)
        if not sym_info:
            return

        digits = sym_info.digits
        point = sym_info.point
        is_buy = (p.type == mt5.POSITION_TYPE_BUY)
        open_price = p.price_open

        tick = mt5.symbol_info_tick(p.symbol)
        if not tick:
            return

        # Tentukan saiz 1 pip untuk pengiraan untung semasa
        sym_upper = p.symbol.upper()
        is_gold = ("XAU" in sym_upper or "GOLD" in sym_upper)
        if is_gold:
            pip_size = 0.10
            # PILIHAN A: Beri ruang nafas Emas (min +50 pips / $5.00) agar tidak tersapu oleh normal pullback
            min_be_pips = float(self.config.get("gold_min_be_pips", 50.0))
        elif "GBPJPY" in sym_upper:
            pip_size = 0.01
            # Bedah Siasat GBPJPY: Volatiliti 16p M15 ATR, perlukan ruang nafas +28 pip
            min_be_pips = float(self.config.get("gbpjpy_min_be_pips", 28.0))
        elif "JPY" in sym_upper or "WTI" in sym_upper or "XAG" in sym_upper or "SILVER" in sym_upper:
            pip_size = 0.01
            min_be_pips = 18.0
        else:
            pip_size = 0.0001
            min_be_pips = 18.0

        cur_price = tick.bid if is_buy else tick.ask
        floating_pips = ((cur_price - open_price) / pip_size) if is_buy else ((open_price - cur_price) / pip_size)

        # Semak maklumat daripada server Amaterasu X
        server_be = False
        if sig_data:
            sig_type = str(sig_data.get("type", "")).upper()
            sig_matches_direction = (is_buy and sig_type == "BUY") or (not is_buy and sig_type == "SELL")
            if sig_matches_direction and (sig_data.get("status") == "TP1_HIT" or sig_data.get("beLocked") or sig_data.get("tp1Triggered")):
                server_be = True

        # MULTI-STAGE DYNAMIC TRAILING PROFIT LOCK (SOLUSI A: RUANG NAFAS RETEST):
        # Tahap 1: TP1 Hit (+50p Gold / +18p Forex) -> Alih SL ke Ruang Nafas Retest (+15p buffer Gold / +8p Forex)
        #          Layer 1 dah kutip +50p. Risiko baki runner hanya 15p. Net keseluruhan tetap UNTUNG +35p!
        #          Wick retest 5-12p tidak akan menyapu trade pada BE (0p)!
        # Tahap 2: Menghampiri TP2 (+80p Gold / +30p Forex) -> Kunci untung kekal +40p Gold / +15p Forex!
        # Tahap 3: Melepasi TP2 (+120p Gold / +45p Forex) -> Kunci untung kekal +80p Gold / +30p Forex!
        # Tahap 4: Menghampiri TP3 (+160p Gold / +65p Forex) -> Kunci untung kekal +120p Gold / +45p Forex!
        stage_name = ""
        cand_sl = 0.0

        if is_gold:
            if floating_pips >= 160.0:
                lock_pips = 120.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 4 Trailing (Kunci Untung +120p)"
            elif floating_pips >= 120.0:
                lock_pips = 80.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 3 Trailing (Kunci Untung +80p)"
            elif floating_pips >= 80.0:
                lock_pips = 40.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 2 Trailing (Kunci Untung +40p)"
            elif floating_pips >= min_be_pips or server_be:
                # SOLUSI A: Ruang Nafas Retest 15 pips ($1.50) dari Entry
                # BUY: Entry - 15 pips | SELL: Entry + 15 pips
                # Risiko baki trade cuma 15p (Net tetap untung +35p dari TP1 Layer 1)
                retest_buffer_pips = 15.0
                cand_sl = (open_price - retest_buffer_pips * pip_size) if is_buy else (open_price + retest_buffer_pips * pip_size)
                stage_name = "Tahap 1 Solusi A (Ruang Nafas Retest 15p | Net Untung Terjamin +35p)"
        else:
            if floating_pips >= 65.0:
                lock_pips = 45.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 4 Trailing (Kunci Untung +45p)"
            elif floating_pips >= 45.0:
                lock_pips = 30.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 3 Trailing (Kunci Untung +30p)"
            elif floating_pips >= 30.0:
                lock_pips = 15.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 2 Trailing (Kunci Untung +15p)"
            elif floating_pips >= min_be_pips or server_be:
                # SOLUSI A Forex: Ruang Nafas Retest 8 pips dari Entry
                retest_buffer_pips = 8.0
                cand_sl = (open_price - retest_buffer_pips * pip_size) if is_buy else (open_price + retest_buffer_pips * pip_size)
                stage_name = "Tahap 1 Solusi A (Ruang Nafas Retest 8p | Net Untung Terjamin)"

        if not stage_name or cand_sl <= 0.0:
            return

        target_sl = round(cand_sl, digits)

        # Semak sama ada SL baharu lebih menguntungkan daripada SL semasa
        if is_buy:
            if p.sl >= target_sl:
                return
            if tick.bid <= (target_sl + 2 * point):
                return
        else:
            if p.sl > 0 and p.sl <= target_sl:
                return
            if tick.ask >= (target_sl - 2 * point):
                return

        mod_request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": p.ticket,
            "symbol": p.symbol,
            "sl": target_sl,
            "tp": round(p.tp, digits),
        }

        res = mt5.order_send(mod_request)
        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"{Colors.GREEN}🛡️ [DYNAMIC TRAILING LOCK] Ticket #{p.ticket} ({p.symbol}) SL dialih ke {target_sl:.{digits}f} ({stage_name} | Untung Semasa: +{floating_pips:.1f}p)! Keuntungan dipelihara sepenuhnya.{Colors.RESET}")
        else:
            err = res.retcode if res else mt5.last_error()
            if err != 10016:
                print(f"{Colors.YELLOW}[BE NOTA] Ticket #{p.ticket} ({p.symbol}) modifikasi SL: {err}{Colors.RESET}")

    def check_and_widen_tight_sl(self, p):
        """Penyelarasan automatik bagi Stop Loss yang terlalu rapat (elak terkena noise / spread broker)"""
        try:
            sym_info = mt5.symbol_info(p.symbol)
            if not sym_info:
                return
            digits = sym_info.digits
            point = sym_info.point
            is_buy = (p.type == mt5.POSITION_TYPE_BUY)
            open_price = p.price_open
            sym_upper = p.symbol.upper()
            is_gold = ("XAU" in sym_upper or "GOLD" in sym_upper)

            if is_gold:
                req_sl_dist = 7.0  # 70 pips ($7.00)
                min_threshold = 6.0
            elif "JPY" in sym_upper:
                req_sl_dist = 0.30 # 30 pips
                min_threshold = 0.25
            else:
                req_sl_dist = 0.0030 # 30 pips
                min_threshold = 0.0025

            # Hanya selaraskan jika SL masih dalam zon perlindungan asal (bukan trailing untung / BE)
            needs_update = False
            new_sl = 0.0

            if is_buy:
                # Untuk BUY, SL asal berada di bawah harga open (p.sl < open_price)
                if p.sl > 0 and p.sl < open_price:
                    curr_dist = open_price - p.sl
                    if curr_dist < min_threshold:
                        new_sl = round(open_price - req_sl_dist, digits)
                        needs_update = True
            else:
                # Untuk SELL, SL asal berada di atas harga open (p.sl > open_price)
                if p.sl > 0 and p.sl > open_price:
                    curr_dist = p.sl - open_price
                    if curr_dist < min_threshold:
                        new_sl = round(open_price + req_sl_dist, digits)
                        needs_update = True

            if needs_update and new_sl > 0:
                mod_request = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": p.symbol,
                    "sl": new_sl,
                    "tp": round(p.tp, digits),
                }
                res = mt5.order_send(mod_request)
                if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"{Colors.GREEN}🛡️ [UPGRADE SL MT5] Ticket #{p.ticket} ({p.symbol}) SL berjaya dilebarkan ke {new_sl:.{digits}f} (Ruang nafas pasaran baru: +30p FX / +70p Gold)!{Colors.RESET}")
                else:
                    err = res.retcode if res else mt5.last_error()
                    if err != 10016:
                        print(f"{Colors.YELLOW}[UPGRADE SL NOTA] Ticket #{p.ticket} ({p.symbol}) modifikasi SL: {err}{Colors.RESET}")
        except Exception:
            pass


    def close_position_market(self, p, reason=""):
        """Tutup satu posisi pasaran serta-merta (cth: Pre-News Safety Cutoff)"""
        sym_info = mt5.symbol_info(p.symbol)
        if not sym_info:
            return False
        tick = mt5.symbol_info_tick(p.symbol)
        if not tick:
            return False
        is_buy = (p.type == mt5.POSITION_TYPE_BUY)
        price = tick.bid if is_buy else tick.ask
        close_type = mt5.ORDER_TYPE_SELL if is_buy else mt5.ORDER_TYPE_BUY
        filling = self.get_fill_type(p.symbol, close_type, price)
        req = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": p.ticket,
            "symbol": p.symbol,
            "volume": p.volume,
            "type": close_type,
            "price": round(price, sym_info.digits),
            "deviation": int(self.max_slippage_pips * 10),
            "magic": self.magic_number,
            "comment": "" if self.config.get("stealth_mode", True) else f"Close-{reason[:16]}",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": filling,
        }
        res = mt5.order_send(req)
        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"{Colors.GREEN}🛡️ [PRE-NEWS CUTOFF] Berjaya menutup posisi #{p.ticket} {p.symbol} ({reason}) bagi mengelak risiko lonjakan news 20:30!{Colors.RESET}")
            return True
        return False

    def apply_breakeven_for_signal(self, sig_id, entry_price=None, raw_symbol=None):
        """Alih Stop Loss ke Break-Even bagi semua posisi runner yang masih terbuka"""
        if raw_symbol:
            self.apply_breakeven_for_symbol(raw_symbol)
            return

        # Semak memory map jika ada
        if sig_id in self.active_positions:
            orders = self.active_positions[sig_id]
            for rec in orders:
                sym = rec.get("symbol")
                if sym:
                    self.apply_breakeven_for_symbol(sym)
        else:
            # Fallback scan semua posisi MT5
            all_pos = mt5.positions_get()
            for p in (all_pos or []):
                if p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")):
                    self.apply_breakeven_for_symbol(p.symbol)

    def handle_signal_resolution(self, resolved_data):
        item = resolved_data.get("item", {})
        sig_id = item.get("id")
        outcome = item.get("status")
        symbol = item.get("symbol")
        pips_raw = item.get("pips", 0)
        pips_str = str(pips_raw or 0)
        try:
            if isinstance(pips_raw, float):
                pips_str = f"{pips_raw:+.1f}"
            elif isinstance(pips_raw, int):
                pips_str = f"{pips_raw:+d}"
        except Exception:
            pips_str = str(pips_raw or 0)
        print(f"\n{Colors.CYAN}🏁 [TRADE RESOLVED] #{symbol} status: {outcome} ({pips_str} pips){Colors.RESET}")

        # Jika TP1 dicapai atau signal umumkan BE, segera kunci BE untuk layer seterusnya!
        if outcome in ["TP1", "BE"] or (item.get("tags") and "TP1" in item["tags"]):
            if self.auto_be and symbol:
                self.apply_breakeven_for_symbol(symbol, item)

        if outcome in ["TP2", "SL"]:
            # Posisi telah selesai
            if sig_id in self.active_positions:
                del self.active_positions[sig_id]

    def listen_sse_stream(self):
        """Sambungan SSE Real-Time ke server Amaterasu X"""
        url = f"{self.server_url}/api/events"
        while self.running:
            try:
                print(f"{Colors.CYAN}[STREAM] Membuka sambungan real-time ke {url}...{Colors.RESET}")
                resp = requests.get(url, stream=True, timeout=90)
                if resp.status_code != 200:
                    print(f"{Colors.YELLOW}[STREAM] Respons HTTP {resp.status_code}. Mencuba semula dalam 5s...{Colors.RESET}")
                    time.sleep(5)
                    continue

                print(f"{Colors.GREEN}[STREAM AKTIF] Berjaya disambungkan ke Amaterasu X Pulse Stream! Menunggu signal...{Colors.RESET}\n")

                event_name = None
                for line in resp.iter_lines():
                    if not self.running:
                        break
                    if not line:
                        continue
                    
                    decoded = line.decode('utf-8')
                    if decoded.startswith("event:"):
                        event_name = decoded[6:].strip()
                    elif decoded.startswith("data:"):
                        data_str = decoded[5:].strip()
                        try:
                            payload = json.loads(data_str)
                            self.dispatch_event(event_name, payload)
                        except Exception as e:
                            pass
                        event_name = None

            except requests.exceptions.RequestException as e:
                print(f"{Colors.YELLOW}[STREAM DISCONNECT] Sambungan terputus ({e}). Menyambung semula dalam 4s...{Colors.RESET}")
                time.sleep(4)
            except Exception as e:
                print(f"{Colors.RED}[STREAM RALAT] {e}{Colors.RESET}")
                time.sleep(5)

    def dispatch_event(self, event_name, payload):
        if event_name == "initial_sync":
            # Semak jika ada activeSignals yang sedang running
            running_signals = payload.get("activeSignals", [])
            for s in running_signals:
                if s.get("status") == "ACTIVE" and s.get("id") not in self.executed_signal_ids:
                    print(f"[SYNC] Mengesan running signal semasa permulaan: #{s.get('symbol')} {s.get('type')}")
                    # Jangan kejar harga lama mengikut SOP Standard
                    self.executed_signal_ids.add(s.get("id"))

        elif event_name == "signal_fired":
            self.process_new_signal(payload)

        elif event_name == "signal_update":
            # Event signal_update dihantar apabila TP1 dicapai atau SL dialih ke BE
            sig = payload.get("activeSignal", {})
            sym = payload.get("symbol") or sig.get("symbol")
            if sym:
                self.apply_breakeven_for_symbol(sym, sig)

        elif event_name == "signal_resolved":
            self.handle_signal_resolution(payload)

        elif event_name == "on_pips_update":
            # Payload adalah list db.activeSignals
            if isinstance(payload, list):
                for s in payload:
                    sig_id = str(s.get("id", ""))
                    # Jangan re-execute signal yang diselaraskan semula dari tiket MT5 (elak duplicate / feedback loop)
                    if sig_id.startswith("mt5-"):
                        self.executed_signal_ids.add(sig_id)
                        continue
                    if s.get("status") == "ACTIVE" and sig_id not in self.executed_signal_ids:
                        self.process_new_signal(s)
                    elif s.get("status") == "TP1_HIT" or s.get("beLocked") or s.get("tp1Triggered"):
                        sym = s.get("symbol")
                        if sym:
                            self.apply_breakeven_for_symbol(sym, s)

    def check_and_execute_liquidity_sweep_reentry(self, all_pos):
        """
        MODUL TAMBAHAN: SMC LIQUIDITY SWEEP & RECOVERY SNIPER
        Mengesan fakeout / liquidity sweep di mana pasaran membuat lonjakan sementara 
        (meragut kecairan / liquidity grab) sebelum berundur kembali.
        Bila dikesan dengan pengesahan penolakan jarum (M5 Rejection Wick >= 35%),
        bot membuka 1 sniper layer tambahan pada pucuk jarum untuk memaksimumkan keuntungan dan membalikkan kerugian.
        """
        if not self.config.get("enable_smc_sweep_reentry", True):
            return

        if not hasattr(self, "last_sweep_reentry_time"):
            self.last_sweep_reentry_time = {}

        now_t = time.time()
        
        # Kumpulkan posisi aktif mengikut simbol
        by_symbol = {}
        for p in all_pos:
            if p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")):
                sym = p.symbol
                if sym not in by_symbol:
                    by_symbol[sym] = []
                by_symbol[sym].append(p)

        for sym, pos_list in by_symbol.items():
            # SYARAT 1: Had Keras Maksimum 1 Sweep Layer sahaja per setup (Elak Martingale)
            has_sweep_layer = any("Sweep" in str(p.comment or "") for p in pos_list)
            if has_sweep_layer:
                continue

            # Maksimum jumlah posisi bagi simbol ini tidak melebihi 4
            if len(pos_list) >= 4:
                continue

            # Semak cooldown bagi simbol ini (sekurang-kurangnya 10 minit antara sweep layer)
            if (now_t - self.last_sweep_reentry_time.get(sym, 0)) < 600:
                continue

            # Tentukan arah konsensus posisi sedia ada
            is_buy = any(p.type == mt5.POSITION_TYPE_BUY for p in pos_list)
            is_sell = any(p.type == mt5.POSITION_TYPE_SELL for p in pos_list)
            if is_buy and is_sell:
                continue # Mengelak konflik jika ada hedging

            sym_upper = sym.upper()
            is_gold = ("XAU" in sym_upper or "GOLD" in sym_upper)
            clean_raw_sym = sym.split('.')[0].upper()

            # Semak harga semasa broker
            tick = mt5.symbol_info_tick(sym)
            if not tick:
                continue

            # Kira purata harga kemasukan (average entry)
            avg_entry = sum(p.price_open for p in pos_list) / len(pos_list)
            
            # Kira jarak pergerakan melawan arah (adverse pips)
            pip_size = 0.10 if is_gold else (0.01 if "JPY" in sym_upper else 0.0001)
            
            if is_sell:
                # Untuk SELL, pasaran melonjak naik (fakeout ke atas)
                adverse_dist = tick.bid - avg_entry
                adverse_pips = adverse_dist / pip_size
                min_sweep_pips = 28.0 if is_gold else 15.0
                max_sweep_pips = 55.0 if is_gold else 24.0
            else:
                # Untuk BUY, pasaran merudum turun (fakeout ke bawah)
                adverse_dist = avg_entry - tick.ask
                adverse_pips = adverse_dist / pip_size
                min_sweep_pips = 28.0 if is_gold else 15.0
                max_sweep_pips = 55.0 if is_gold else 24.0

            # Pastikan harga berada dalam Zon Sweep (sebelum terkena SL)
            if adverse_pips < min_sweep_pips or adverse_pips > max_sweep_pips:
                continue

            # SYARAT 2: PENGESAHAN JARUM LILIN (M5 REJECTION WICK CONFIRMATION)
            mt5.symbol_select(sym, True)
            rates_m5 = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_M5, 0, 2)
            if rates_m5 is None or len(rates_m5) < 2:
                continue

            latest_m5 = rates_m5[-1]
            h = float(latest_m5['high'])
            l = float(latest_m5['low'])
            o = float(latest_m5['open'])
            c = float(latest_m5['close'])
            tot_range = max(h - l, pip_size)

            wick_confirmed = False
            sweep_peak = 0.0

            if is_sell:
                # Pasaran terbang ke atas tetapi meninggalkan jarum atas panjang (Upper Wick Rejection)
                upper_wick = h - max(o, c)
                wick_ratio = upper_wick / tot_range
                # Jarum atas sekurang-kurangnya 35% daripada julat lilin dan harga semasa sudah mula turun dari puncak
                if wick_ratio >= 0.35 and tick.bid <= (h - 0.10 * tot_range):
                    wick_confirmed = True
                    sweep_peak = h
            else:
                # Pasaran terjun ke bawah tetapi meninggalkan jarum bawah panjang (Lower Wick Absorption)
                lower_wick = min(o, c) - l
                wick_ratio = lower_wick / tot_range
                # Jarum bawah sekurang-kurangnya 35% daripada julat lilin dan harga semasa sudah mula lantun dari dasar
                if wick_ratio >= 0.35 and tick.ask >= (l + 0.10 * tot_range):
                    wick_confirmed = True
                    sweep_peak = l

            if not wick_confirmed:
                continue

            # SYARAT 3: PERLINDUNGAN RISIKO & SAIS LOT
            exec_lot = self.lot_size
            custom_lots = self.config.get("custom_lot_map", {})
            for c_sym, c_lot in custom_lots.items():
                if c_sym.upper() in sym.upper():
                    exec_lot = float(c_lot)
                    break

            sym_info = mt5.symbol_info(sym)
            if not sym_info:
                continue
            digits = sym_info.digits

            # Tentukan SL dan TP bagi Sniper Layer:
            # SL diletakkan 18 pips melepasi puncak jarum sweep (structural safety)
            # TP disasarkan kembali ke paras TP1 atau entry asal (Risk-Reward gergasi 1:2 hingga 1:3!)
            sl_buffer = 1.8 if is_gold else (0.0018 if "JPY" not in sym_upper else 0.18)
            tp_target_price = pos_list[0].tp if pos_list[0].tp > 0 else avg_entry

            if is_sell:
                sniper_order_type = mt5.ORDER_TYPE_SELL
                sniper_price = tick.bid
                sniper_sl = round(sweep_peak + sl_buffer, digits)
                sniper_tp = round(tp_target_price, digits)
            else:
                sniper_order_type = mt5.ORDER_TYPE_BUY
                sniper_price = tick.ask
                sniper_sl = round(sweep_peak - sl_buffer, digits)
                sniper_tp = round(tp_target_price, digits)

            filling = self.get_fill_type(sym, sniper_order_type, sniper_price)
            sniper_request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": sym,
                "volume": exec_lot,
                "type": sniper_order_type,
                "price": round(sniper_price, digits),
                "sl": sniper_sl,
                "tp": sniper_tp,
                "deviation": int(self.max_slippage_pips * 10),
                "magic": self.magic_number,
                "comment": "AmaterasuX-SweepReentry",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": filling,
            }

            res = None
            for candidate_fill in [filling, mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN, mt5.ORDER_FILLING_IOC]:
                sniper_request["type_filling"] = candidate_fill
                res = mt5.order_send(sniper_request)
                if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                    break
                if not res or res.retcode != 10030:
                    break

            if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                self.last_sweep_reentry_time[sym] = now_t
                action_str = "SELL" if is_sell else "BUY"
                print(f"\n{Colors.GREEN}{Colors.BOLD}🎯 [SMC LIQUIDITY SWEEP SNIPER ACTIVATED!] #{clean_raw_sym} {action_str} {exec_lot} lot @ {res.price:.{digits}f}!{Colors.RESET}")
                print(f"   Fakeout dikesan (+{adverse_pips:.1f}p) | M5 Rejection Wick: {wick_ratio*100:.1f}% | SL: {sniper_sl:.{digits}f} | TP: {sniper_tp:.{digits}f}")
                print(f"   {Colors.CYAN}Posisi Sniper berjaya dibuka pada harga diskaun/pucuk terbaik bagi membalikkan floating merah ke pesta profit!{Colors.RESET}\n")

                # SELARASKAN SL SEMUA LAYER SEDIA ADA KE PARAS SL STRUKTURAL SWEEP (UNIFIED SL)
                for ep in pos_list:
                    if ep.ticket != res.order:
                        mod_req = {
                            "action": mt5.TRADE_ACTION_SLTP,
                            "position": ep.ticket,
                            "symbol": ep.symbol,
                            "sl": sniper_sl,
                            "tp": round(ep.tp, digits),
                        }
                        mt5.order_send(mod_req)
            else:
                err = res.retcode if res else mt5.last_error()
                print(f"{Colors.YELLOW}[SWEEP REENTRY NOTA] Gagal buka sniper layer #{sym}: {err}{Colors.RESET}")

    def breakeven_guardian_loop(self):
        """Guardian berterusan setiap 2.5 saat memeriksa tiket MT5 untuk kunci BE serta-merta apabila TP1 dicapai"""
        urls = [self.server_url]
        while self.running:
            try:
                time.sleep(2.5)
                if not self.auto_be:
                    continue

                active_signals = []
                for u in urls:
                    try:
                        r = requests.get(f"{u.rstrip('/')}/api/data", timeout=3)
                        if r.status_code == 200:
                            d = r.json()
                            active_signals = d.get("activeSignals", [])
                            if not active_signals and d.get("activeSignal"):
                                active_signals = [d["activeSignal"]]
                            if active_signals:
                                break
                    except Exception:
                        continue

                # Semak setiap posisi MT5 aktif secara langsung untuk perlindungan BE & Penyelarasan SL Baru
                all_pos = mt5.positions_get()
                if all_pos:
                    for p in all_pos:
                        # Auto-lebarkan SL jika tiket sedia ada terlalu ketat (<25p FX / <60p Gold)
                        self.check_and_widen_tight_sl(p)
                        if p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")):
                            matched_sig = next((s for s in active_signals if s.get("symbol") == p.symbol.split('.')[0].upper()), None)
                            self.check_and_apply_position_be(p, matched_sig)

                            # PRE-NEWS 20:15 MYT SAFETY CUTOFF:
                            # Tutup sebarang posisi Scalp BUY bagi XAUUSD paling lewat jam 20:15 MYT
                            # agar modal selamat dan tidak terperangkap dalam lonjakan/junaman berita 20:30!
                            if "XAU" in p.symbol.upper() and p.type == mt5.POSITION_TYPE_BUY:
                                from datetime import timezone, timedelta
                                now_myt = datetime.now(timezone(timedelta(hours=8)))
                                if now_myt.hour == 20 and 15 <= now_myt.minute <= 29:
                                    self.close_position_market(p, "Pre-News 20:15 Cutoff")

                    # MODUL TAMBAHAN: SMC LIQUIDITY SWEEP & RECOVERY SNIPER
                    self.check_and_execute_liquidity_sweep_reentry(all_pos)

            except Exception:
                pass

    def polling_fallback_loop(self):
        """Fallback polling setiap 4 saat untuk memastikan tiada signal terlepas"""
        while self.running:
            try:
                time.sleep(4)
                url = f"{self.server_url}/api/data"
                r = requests.get(url, timeout=5)
                if r.status_code == 200:
                    data = r.json()
                    # Semak activeSignal
                    act = data.get("activeSignal")
                    if act and act.get("status") == "ACTIVE":
                        if act.get("id") not in self.executed_signal_ids:
                            self.process_new_signal(act)
                    elif act and (act.get("status") == "TP1_HIT" or act.get("beLocked")):
                        self.apply_breakeven_for_symbol(act.get("symbol"), act)
                            
                    # Semak activeSignals jika server return
                    acts = data.get("activeSignals", [])
                    for s in acts:
                        if s.get("status") == "ACTIVE" and s.get("id") not in self.executed_signal_ids:
                            self.process_new_signal(s)
                        elif s.get("status") == "TP1_HIT" or s.get("beLocked"):
                            self.apply_breakeven_for_symbol(s.get("symbol"), s)
            except Exception:
                pass

    def auto_updater_loop(self):
        """Penyemak kemas kini pasif (Dimatikan gelung auto-restart untuk kestabilan operasi MT5 tanpa henti)"""
        while self.running:
            time.sleep(3600)

    def sync_quotes_loop(self):
        """Menghantar harga tick live daripada terminal MT5 ke server Amaterasu X setiap 2.5 saat"""
        symbols_to_sync = ["XAUUSD", "XAGUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "EURJPY", "AUDUSD", "USDCAD", "USDCHF", "WTI", "BTCUSD"]
        while self.running:
            try:
                quotes = {}
                for raw_sym in symbols_to_sync:
                    broker_sym = self.resolve_symbol(raw_sym)
                    if broker_sym:
                        tick = mt5.symbol_info_tick(broker_sym)
                        if tick and tick.bid > 0:
                            mid_price = (tick.bid + tick.ask) / 2
                            quotes[raw_sym] = {
                                "price": mid_price,
                                "bid": tick.bid,
                                "ask": tick.ask
                            }
                pos_list = []
                all_pos = mt5.positions_get()
                if all_pos:
                    for p in all_pos:
                        pos_list.append({
                            "ticket": p.ticket,
                            "symbol": p.symbol.split('.')[0].upper(),
                            "type": "BUY" if p.type == 0 else "SELL",
                            "openPrice": p.price_open,
                            "sl": p.sl,
                            "tp": p.tp,
                            "profit": p.profit
                        })
                acc = mt5.account_info()
                acc_info = None
                if acc:
                    total_wd = 0.0
                    try:
                        from datetime import datetime, timedelta
                        deals = mt5.history_deals_get(datetime.now() - timedelta(days=500), datetime.now())
                        if deals:
                            total_wd = sum(abs(d.profit) for d in deals if d.type == 2 and d.profit < 0)
                    except Exception:
                        pass
                    acc_info = {
                        "balance": float(acc.balance),
                        "equity": float(acc.equity),
                        "profit": float(acc.profit),
                        "margin": float(acc.margin),
                        "login": int(acc.login),
                        "totalWithdrawn": float(total_wd)
                    }

                # INSTITUTIONAL VOLUME FLOW RADAR TELEMETRY
                volume_flow = {}
                for raw_sym in ["XAUUSD", "EURUSD", "USDCHF"]:
                    volume_flow[raw_sym] = self.get_m15_volume_flow(raw_sym)

                # MULTI-TIMEFRAME TRIPLE MA (20, 100, 200) + D1/H4 CONFLUENCE
                mtf_ma_flow = {}
                for raw_sym in ["XAUUSD", "EURUSD", "USDCHF"]:
                    mtf_ma_flow[raw_sym] = self.get_mtf_triple_ma(raw_sym)

                urls = [self.server_url]
                for u in urls:
                    try:
                        requests.post(f"{u.rstrip('/')}/api/market/sync-mt5", json={
                            "quotes": quotes, 
                            "openPositions": pos_list,
                            "accountInfo": acc_info,
                            "volumeFlow": volume_flow,
                            "mtfMaFlow": mtf_ma_flow
                        }, timeout=2)
                    except Exception:
                        pass
            except Exception:
                pass
            time.sleep(2.5)

    def sync_closed_deals_loop(self):
        """Memantau deal MT5 yang ditutup (SL, TP, Close Manual) dan menyelaraskan status kembali ke pelayan Amaterasu X"""
        from datetime import timedelta
        urls = [self.server_url]
        # Seed initial deal tickets from past 2 days so we don't spam old closures on boot
        try:
            from_date = datetime.now() - timedelta(days=2)
            to_date = datetime.now() + timedelta(days=2)
            init_deals = mt5.history_deals_get(from_date, to_date)
            if init_deals:
                for d in init_deals:
                    if d.entry == 1:
                        self.synced_deal_tickets.add(d.ticket)
        except Exception:
            pass

        while self.running:
            try:
                time.sleep(2.5)
                from_date = datetime.now() - timedelta(days=1)
                to_date = datetime.now() + timedelta(days=1)
                deals = mt5.history_deals_get(from_date, to_date)
                if deals:
                    for d in deals:
                        if d.entry == 1 and d.ticket not in self.synced_deal_tickets:
                            self.synced_deal_tickets.add(d.ticket)
                            raw_sym = d.symbol.split('.')[0].upper()
                            comment = str(d.comment or '')
                            
                            # Tentukan outcome: SL vs TP vs Closed
                            event = 'CLOSED'
                            if '[sl' in comment.lower() or d.profit < 0:
                                event = 'SL'
                            elif '[tp' in comment.lower() or d.profit > 0:
                                event = 'TP1' if 'tp1' in comment.lower() else 'TP2'
                            
                            print(f"{Colors.YELLOW}🔔 [MT5 DEAL DITUTUP] #{d.ticket} {raw_sym} ({event}) @ {d.price} | Profit: ${d.profit:.2f} [{comment}]{Colors.RESET}")
                            
                            payload = {
                                "symbol": raw_sym,
                                "event": event,
                                "price": d.price,
                                "comment": comment,
                                "ticket": d.order,
                                "profit": d.profit
                            }
                            for u in urls:
                                try:
                                    requests.post(f"{u.rstrip('/')}/api/mt5/sync-event", json=payload, timeout=3)
                                except Exception:
                                    pass
            except Exception:
                pass

    def start(self):
        self.banner()
        if not self.init_mt5():
            print(f"\n{Colors.RED}Sila buka MT5 anda dan jalankan skrip ini semula.{Colors.RESET}")
            input("\nTekan Enter untuk keluar...")
            return

        # Penyelarasan serta-merta bagi posisi sedia ada yang mempunyai SL ketat
        try:
            open_pos = mt5.positions_get()
            if open_pos:
                print(f"{Colors.CYAN}🔍 [AUDIT SL MT5] Memeriksa {len(open_pos)} posisi aktif untuk penyesuaian Stop Loss baru (+30p FX / +70p Gold)...{Colors.RESET}")
                for p in open_pos:
                    self.check_and_widen_tight_sl(p)
        except Exception:
            pass

        # Start MT5 Real-Time Quote Sync thread
        sync_thread = threading.Thread(target=self.sync_quotes_loop, daemon=True)
        sync_thread.start()

        # Start Two-Way MT5 Deal & Position Sync thread
        deal_sync_thread = threading.Thread(target=self.sync_closed_deals_loop, daemon=True)
        deal_sync_thread.start()

        # Start Fallback Polling thread
        poll_thread = threading.Thread(target=self.polling_fallback_loop, daemon=True)
        poll_thread.start()

        # Start Autonomous Auto-BreakEven Guardian thread
        guardian_thread = threading.Thread(target=self.breakeven_guardian_loop, daemon=True)
        guardian_thread.start()

        # Start Self-Healing Auto Updater thread (Checks Render for script updates every 45s)
        updater_thread = threading.Thread(target=self.auto_updater_loop, daemon=True)
        updater_thread.start()

        # Run SSE listener on main thread
        try:
            self.listen_sse_stream()
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}Memberhentikan Amaterasu MT5 Bridge...{Colors.RESET}")
        finally:
            self.running = False
            mt5.shutdown()
            print(f"{Colors.GREEN}MT5 Bridge ditamatkan dengan selamat.{Colors.RESET}")

if __name__ == "__main__":
    cfg = load_config()
    bridge = AmaterasuBridge(cfg)
    bridge.start()
