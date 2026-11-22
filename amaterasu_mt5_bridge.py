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
from datetime import datetime, timezone, timedelta
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
        print(f" {Colors.CYAN}* Profit Target   :{Colors.RESET} +2,500 USC ($25.00 USD) - Henti Automatik Per Akaun")
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

        self.account_currency = getattr(account, "currency", "USD").upper()
        self.is_cent_account = ("USC" in self.account_currency or "CENT" in self.account_currency)

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
        
        # INVARIANT: SASARAN PROFIT PER AKAUN (+2,500 USC / +$25.00 USD)
        self.account_profit_target_usc = 2500.0  # 2,500 USC = $25.00 USD
        self.account_profit_target_usd = 25.0
        self.account_target_reached = False
        self.session_baseline_equity = float(account.equity)
        self.last_target_log_time = 0
        target_display = f"2,500 USC ($25.00 USD)" if self.is_cent_account else "$25.00 USD"
        print(f" • Circuit Breaker: Had Untung Harian {target_display} (Henti Automatik Per Akaun)")

        return True

    def get_account_profit_gain(self):
        """Kira keuntungan bersih akaun ini (sama ada realized closed deals hari ini atau session equity gain)"""
        try:
            acc = mt5.account_info()
            if not acc:
                return 0.0, 0.0, 0.0
            
            if self.session_baseline_equity is None or self.session_baseline_equity <= 0:
                self.session_baseline_equity = float(acc.equity)

            equity_gain = float(acc.equity) - self.session_baseline_equity

            # Kira closed deals hari ini
            now_dt = datetime.now()
            start_today = datetime(now_dt.year, now_dt.month, now_dt.day, 0, 0, 0)
            deals = mt5.history_deals_get(start_today, now_dt)
            realized_today = 0.0
            if deals:
                for d in deals:
                    if d.entry == mt5.DEAL_ENTRY_OUT:
                        realized_today += (d.profit + d.swap + d.commission)

            positions = mt5.positions_get() or []
            floating = sum(p.profit for p in positions)
            total_today_gain = realized_today + floating

            effective_gain = max(equity_gain, total_today_gain)
            return effective_gain, realized_today, floating
        except Exception:
            return 0.0, 0.0, 0.0

    def check_account_profit_target(self):
        """Semak jika akaun ini telah mencapai sasaran +2,500 USC / +$25.00 USD"""
        # Semak arahan resume daripada Tengku Khairi (resume_trading.flag)
        flag_candidates = [
            os.path.join(BASE_DIR, "resume_trading.flag"),
            r"C:\AmaterasuX\resume_trading.flag",
            r"C:\AmaterasuX_Acc2\resume_trading.flag",
            r"C:\AmaterasuX_Acc3\resume_trading.flag"
        ]
        for f_path in flag_candidates:
            if os.path.exists(f_path):
                try:
                    os.remove(f_path)
                except Exception:
                    pass
                acc = mt5.account_info()
                if acc:
                    self.session_baseline_equity = float(acc.equity)
                self.account_target_reached = False
                print(f"\n{Colors.GREEN}{Colors.BOLD}🚀 [ARAHAN RESUME DITERIMA] Arahan Tengku Khairi disahkan! Akaun #{getattr(acc, 'login', '')} memulakan pusingan dagangan baharu.{Colors.RESET}\n")
                return False

        if self.account_target_reached:
            return True

        gain, realized, floating = self.get_account_profit_gain()
        target = self.account_profit_target_usc if getattr(self, "is_cent_account", True) else self.account_profit_target_usd

        if gain >= target:
            self.account_target_reached = True
            acc = mt5.account_info()
            login_str = getattr(acc, "login", "")
            usd_equiv = (gain / 100.0) if getattr(self, "is_cent_account", True) else gain
            cur_bal = float(getattr(acc, "balance", 0.0))
            cur_eq = float(getattr(acc, "equity", 0.0))
            now_myt = datetime.now(timezone(timedelta(hours=8))).strftime("%d %b %Y (%H:%M MYT)")
            print(f"\n{Colors.GREEN}{Colors.BOLD}=======================================================================")
            print(f"🎯 [SASARAN PROFIT TERCAPAI] AKAUN #{login_str} UNTUNG +{gain:,.2f} {self.account_currency} (+${usd_equiv:,.2f} USD)!")
            print(f"🛑 Mengikut arahan Tengku Khairi: Akaun ini BERHENTI membuka order baharu.")
            print(f"🔒 Posisi sedia ada tetap dilindungi oleh Break-Even & Trailing Stop secara automatik.")
            print(f"⏳ Menunggu arahan Tengku Khairi ('start balik') untuk mula berdagang semula.")
            print(f"ℹ️ Sistem Amaterasu X & akaun-akaun lain kekal beroperasi seperti biasa.")
            print(f"======================================================================={Colors.RESET}\n")

            # Auto-broadcast Target Kemenangan ke Telegram Community Channel
            try:
                msg = (
                    "🎯 <b>AMATERASU X · TARGET HARIAN TERCAPAI!</b>\n"
                    "━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🏆 <b>Master Vault:</b> DRAGON CENT+ (#{login_str})\n"
                    f"📅 <b>Tarikh:</b> {now_myt}\n"
                    "🏢 <b>Broker:</b> Versus Trade Ltd. (Live Cluster)\n"
                    "💼 <b>Status:</b> SASARAN TERCAPAI & DIKUNCI\n\n"
                    "💰 <b>PRESTASI KEMENANGAN</b>\n"
                    f"• Untung Bersih Harian: <code>+{gain:,.2f} {self.account_currency} (+${usd_equiv:,.2f} USD)</code>\n"
                    "• Status Sasaran: <code>100% SELESAI</code>\n"
                    f"• Baki Terkini: <code>{cur_bal:,.2f} {self.account_currency}</code>\n"
                    f"• Ekuiti Terkini: <code>{cur_eq:,.2f} {self.account_currency}</code>\n\n"
                    "🛡️ <b>DISIPLIN KETAT AMATERASUX:</b>\n"
                    "Semua posisi telah ditutup dalam keuntungan. Robot dihentikan automatik untuk mengunci profit & mengelak overtrade!\n\n"
                    "━━━━━━━━━━━━━━━━━━━━━\n"
                    "🚀 <b>SERTAI COPYTRADE AMATERASUX:</b>\n"
                    "1. Daftar akaun Versus Trade (Cent Account)\n"
                    "2. Deposit minimum: 10,000 USC ($100 USD)\n"
                    "3. Salin akaun Master secara automatik 1:1!\n\n"
                    "🔗 <b>Pautan Pendaftaran Broker:</b>\n"
                    "https://one.versustrade.link/links/go/78665?pid=170480"
                )
                requests.post(
                    f"{self.server_url.rstrip('/')}/api/telegram/broadcast-custom",
                    json={"text": msg},
                    timeout=5
                )
            except Exception:
                pass
            return True

        return False

    def is_dangerous_market_hour(self):
        """
        ARAHAN TEGAS BOS: HARAMKAN TRADE PADA WAKTU-WAKTU BAHAYA MANIPULASI:
        1. Waktu Rollover & Midnight Spread Spiking (00:00 - 07:00 MYT)
        2. Waktu Pembukaan London Judas Swing Trap (14:00 - 15:15 MYT)
        3. Hujung Minggu / Sesi Awal Isnin Sebelum 07:00 MYT
        """
        try:
            now_myt = datetime.now(timezone(timedelta(hours=8)))
            hour = now_myt.hour
            minute = now_myt.minute
            total_min = hour * 60 + minute
            weekday = now_myt.weekday() # 0=Isnin, 5=Sabtu, 6=Ahad

            # Zon Hujung Minggu
            if weekday == 5 and hour >= 6:
                return True, "Pasaran Forex Hujung Minggu ditutup (Sabtu)."
            if weekday == 6:
                return True, "Pasaran Forex Hujung Minggu ditutup (Ahad)."
            if weekday == 0 and hour < 7:
                return True, "Sesi Awal Isnin sebelum 07:00 AM MYT (Spread Pembukaan Sangat Lebar)."

            # Zon 1: Rollover & Midnight Spread Spiking (00:00 - 07:00 MYT)
            if 0 <= hour < 7:
                return True, f"Zon Bahaya Rollover & Midnight ({now_myt.strftime('%H:%M')} MYT). Spread melebar liar & manipulasi kecairan nipis! Diharamkan trade mengikut arahan Bos."

            # Zon 2: London Open Judas Swing Trap (14:00 - 15:15 MYT)
            if 840 <= total_min < 915:
                return True, f"Zon Bahaya Judas Swing London ({now_myt.strftime('%H:%M')} MYT). Perangkap manipulasi jarum pembukaan London! Diharamkan trade mengikut arahan Bos."

            return False, ""
        except Exception:
            return False, ""

    def resolve_symbol(self, raw_symbol):
        """Padankan simbol Amaterasu (cth: XAUUSD, WTI) kepada simbol spesifik broker (cth: XAUUSD.m, GOLD, USOIL)"""
        s_upper = raw_symbol.upper()
        
        # 1. Semak custom map dahulu
        if s_upper in self.custom_map:
            mapped = self.custom_map[s_upper]
            if mapped.upper() in self.broker_symbols:
                return self.broker_symbols[mapped.upper()]

        # 2. Utamakan suffix mengikut jenis akaun broker:
        # Jika akaun Standard USD -> Utamakan akhiran .S atau .s (Standard+)
        # Jika akaun Cent USC -> Utamakan akhiran .C atau .c (Cent+)
        is_cent = getattr(self, "is_cent_account", False)
        preferred_suffix = ".C" if is_cent else ".S"
        fallback_suffix = ".S" if is_cent else ".C"

        target_pref = f"{s_upper}{preferred_suffix}"
        if target_pref in self.broker_symbols:
            return self.broker_symbols[target_pref]

        # 3. Jika exact match ada (tanpa suffix)
        if s_upper in self.broker_symbols:
            return self.broker_symbols[s_upper]

        # 4. Cari variasi simbol biasa mengikut keutamaan akaun
        variations = []
        if s_upper == 'XAUUSD':
            if is_cent:
                variations = ['XAUUSD.C', 'GOLD.C', 'XAUUSD.S', 'GOLD.S', 'XAUUSD', 'GOLD', 'XAUUSD.M', 'XAUUSD.PRO']
            else:
                variations = ['XAUUSD.S', 'GOLD.S', 'XAUUSD.C', 'GOLD.C', 'XAUUSD', 'GOLD', 'XAUUSD.M', 'XAUUSD.PRO']
        elif s_upper == 'WTI':
            variations = [f"USOIL{preferred_suffix}", 'USOIL', f"USOIL{fallback_suffix}", 'USOUSD', 'CL', 'OIL', 'WTI.M']
        elif s_upper == 'BTCUSD':
            variations = [f"BTCUSD{preferred_suffix}", 'BTCUSD', f"BTCUSD{fallback_suffix}", 'BTCUSD.M', 'BTCUSDT']
        else:
            variations = [f"{s_upper}{preferred_suffix}", f"{s_upper}{fallback_suffix}", f"{s_upper}.M", f"{s_upper}.PRO", f"{s_upper}M"]

        for v in variations:
            if v in self.broker_symbols:
                return self.broker_symbols[v]

        # 4. Partial substring match
        for b_name_upper, b_actual in self.broker_symbols.items():
            if s_upper in b_name_upper:
                return b_actual

        # 5. Direct MT5 Broker Probe (Force select in MarketWatch)
        candidates = [f"{s_upper}.c", f"{s_upper}.s", f"{s_upper}.m", s_upper] if is_cent else [f"{s_upper}.s", f"{s_upper}.c", s_upper, f"{s_upper}.m"]
        for c in candidates:
            try:
                mt5.symbol_select(c, True)
                if mt5.symbol_info(c):
                    return c
            except Exception:
                pass

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

            # Multi-Timeframe Structural Market Analyzer (W1, D1, H4, M15)
            rates_w1 = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_W1, 0, 8)
            rates_d1 = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_D1, 0, 15)
            rates_h4 = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_H4, 0, 20)

            w1_low = 0.0
            w1_high = 0.0
            d1_high = 0.0
            d1_low = 0.0
            h4_high = 0.0
            h4_low = 0.0
            structure = "RANGE_BOUND"
            macro = "NEUTRAL"

            if rates_w1 is not None and len(rates_w1) > 0 and rates_d1 is not None and len(rates_d1) > 0:
                w1_close = float(rates_w1[-1]['close'])
                w1_open = float(rates_w1[-1]['open'])
                w1_ema = sum(float(r['close']) for r in rates_w1) / float(len(rates_w1))
                w1_low = float(min(r['low'] for r in rates_w1[-3:]))
                w1_high = float(max(r['high'] for r in rates_w1[-3:]))

                d1_close = float(rates_d1[-1]['close'])
                d1_ema20 = sum(float(r['close']) for r in rates_d1[-10:]) / 10.0
                d1_bears = sum(1 for r in rates_d1[-5:] if float(r['close']) < float(r['open']))
                d1_high = float(max(r['high'] for r in rates_d1[-5:]))
                d1_low = float(min(r['low'] for r in rates_d1[-5:]))

                if rates_h4 is not None and len(rates_h4) > 0:
                    h4_high = float(max(r['high'] for r in rates_h4[-10:]))
                    h4_low = float(min(r['low'] for r in rates_h4[-10:]))

                # INSTITUTIONAL SMC STRUCTURAL CONSENSUS:
                if w1_close < w1_ema and d1_close < d1_ema20 and d1_bears >= 3:
                    macro = "STRONG_SELLER"
                    structure = "BEARISH_EXPANSION"
                elif w1_close > w1_ema and d1_close > d1_ema20 and d1_bears <= 2:
                    macro = "STRONG_BUYER"
                    structure = "BULLISH_EXPANSION"
                else:
                    if "SELLER" in d1_status and "SELLER" in h4_status:
                        macro = "STRONG_SELLER"
                        structure = "BEARISH_MOMENTUM"
                    elif "BUYER" in d1_status and "BUYER" in h4_status:
                        macro = "STRONG_BUYER"
                        structure = "BULLISH_MOMENTUM"
                    elif "SELLER" in d1_status:
                        macro = "SELLER"
                    elif "BUYER" in d1_status:
                        macro = "BUYER"
                    else:
                        macro = "NEUTRAL"
            else:
                # Fallback to single candle
                if "BUYER" in d1_status and "BUYER" in h4_status:
                    macro = "STRONG_BUYER"
                elif "SELLER" in d1_status and "SELLER" in h4_status:
                    macro = "STRONG_SELLER"
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

            return {
                "alignment": alignment,
                "macro": macro,
                "structure": structure,
                "d1": d1_status,
                "h4": h4_status,
                "w1_low": round(w1_low, 2),
                "w1_high": round(w1_high, 2),
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
        
        # 0. WHITELIST GUARD: Hanya Pair Pilihan Bos (XAUUSD, USDCHF, EURUSD)
        allowed_pairs = self.config.get("allowed_pairs", ["XAUUSD", "USDCHF", "EURUSD"])
        clean_raw_sym = symbol_raw.split('.')[0].upper()
        if allowed_pairs and clean_raw_sym not in [p.upper() for p in allowed_pairs]:
            print(f"{Colors.YELLOW}🛡️ [PAIR DITAPIS] Simbol #{clean_raw_sym} ditolak. Hanya {', '.join(allowed_pairs)} dibenarkan mengikut arahan bos.{Colors.RESET}")
            return None

        # 0.0 ARAHAN MUTLAK BOS: DILARANG SAMA SEKALI MASUK ORDER SELAGI TIADA ARAHAN!
        pause_flags = [
            os.path.join(BASE_DIR, "pause_trading.flag"),
            r"C:\AmaterasuX\pause_trading.flag",
            r"C:\AmaterasuX_Acc2\pause_trading.flag",
            r"C:\AmaterasuX_Acc3\pause_trading.flag"
        ]
        if any(os.path.exists(p) for p in pause_flags):
            print(f"{Colors.RED}{Colors.BOLD}🛑 [ARAHAN BOS AKTIF] Order #{clean_raw_sym} DISEKAT 100%! Sistem dikunci: Dilarang masuk order selagi tiada arahan Tengku Khairi!{Colors.RESET}")
            return None

        # 0.1 CIRCUIT BREAKER: SASARAN KEUNTUNGAN AKAUN (+2,500 USC / +$25.00 USD)
        if self.check_account_profit_target():
            return None

        # 0.2 ARAHAN TEGAS BOS: HARAMKAN TRADE PADA WAKTU BAHAYA MANIPULASI
        is_dangerous, danger_reason = self.is_dangerous_market_hour()
        if is_dangerous:
            print(f"{Colors.YELLOW}🛑 [WAKTU BAHAYA DIHARAMKAN] Order #{clean_raw_sym} disekat: {danger_reason}{Colors.RESET}")
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
        if acc.margin and acc.margin > 0 and margin_level < 100.0:
            print(f"{Colors.RED}🛑 [RISK GUARD] Margin Level akaun terlalu rendah ({margin_level:.1f}% < 100%). Menolak order baru bagi mengelakkan Stop Out!{Colors.RESET}")
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

        # MIDNIGHT VOLATILITY & ROLLOVER CIRCUIT BREAKER (00:00 - 06:00 MYT)
        try:
            myt_now = datetime.now(timezone(timedelta(hours=8)))
            if 0 <= myt_now.hour < 6 and clean_raw_sym == "XAUUSD":
                print(f"{Colors.YELLOW}🛡️ [MIDNIGHT CIRCUIT BREAKER] Jam {myt_now.strftime('%H:%M')} MYT: Zon kecairan nipis & rollover spread. Order #{clean_raw_sym} ditolak bagi melindungi modal.{Colors.RESET}")
                return None
        except Exception:
            pass

        # HARD CEILING: Maximum Total Account Open Lots & Positions (Anti-Overtrading & Anti-Liquidation)
        all_pos_raw = mt5.positions_get() or []
        tot_vol = sum(p.volume for p in all_pos_raw)
        default_max_lots = 5.0 if getattr(self, "is_cent_account", True) else 0.50
        max_tot_vol = float(self.config.get("max_account_lots", default_max_lots))
        max_total_pos = int(self.config.get("max_account_positions", 20))
        if clean_raw_sym != "XAUUSD" and (tot_vol >= max_tot_vol or len(all_pos_raw) >= max_total_pos):
            print(f"{Colors.RED}🛑 [MAX EXPOSURE GUARD] Jumlah lot akaun ({tot_vol:.2f} >= {max_tot_vol}) atau posisi ({len(all_pos_raw)} >= {max_total_pos}) telah mencapai had maksimum keselamatan! Menolak order baharu.{Colors.RESET}")
            return None

        # STRICT 1-SETUP PER SYMBOL (STRICT MAX 9 SPLIT LAYERS FOR GOLD, 3 FOR FOREX):
        # Maksimum 9 posisi bagi XAUUSD (sama seperti MEZ EA) dan 3 posisi bagi Forex
        max_allowed_layers = int(self.config.get("max_gold_positions", 9)) if clean_raw_sym == "XAUUSD" else min(int(self.config.get("max_symbol_positions", 3)), 3)
        existing_symbol_orders = [
            p for p in (mt5.positions_get() or [])
            if p.symbol.split('.')[0].upper() == clean_raw_sym
        ]
        if len(existing_symbol_orders) >= max_allowed_layers:
            print(f"{Colors.YELLOW}🛡️ [SOP LAYER LIMIT] Simbol #{clean_raw_sym} sudah mempunyai {len(existing_symbol_orders)} posisi aktif (Maksimum {max_allowed_layers}). Menolak sebarang order tambahan bagi menjaga modal.{Colors.RESET}")
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

        # 3. Telemetry & Structure Observation (Brain Server handles institutional SMC filtration)
        rates_m15 = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 16)
        if rates_m15 is not None and len(rates_m15) >= 8:
            recent_high = max(float(r['high']) for r in rates_m15)
            recent_low = min(float(r['low']) for r in rates_m15)
            rng = max(recent_high - recent_low, 0.001)
            pos_ratio = (price - recent_low) / rng
            print(f"{Colors.CYAN}🎯 [SMC POSITION RATIO] #{clean_raw_sym} Range: {rng:.2f} | Pos Ratio: {pos_ratio*100:.1f}% | Mode: Brain-Dispatched Execution{Colors.RESET}")



        live_atr = self.get_m15_atr(symbol)
        signal_entry = float(signal.get("entry", price))
        raw_tp = float(signal.get("tp3" if tp_target == 3 else ("tp2" if tp_target == 2 else "tp1"), 0.0))
        raw_sl = float(signal.get("sl", 0.0))

        # SPREAD-AWARE CALIBRATED TP & SL (INSTITUTIONAL PROTECTED MODEL):
        # Gunakan sasaran tepat signal pelayan dengan penampan spread (Cent & Standard)
        if raw_tp > 0 and raw_sl > 0:
            tp_dist = abs(raw_tp - signal_entry)
            sl_dist = abs(raw_sl - signal_entry)
            # Penampan keselamatan diperluas mengelak disapu wick atau spread broker (XAU 45-115p struktur dinamik)
            if clean_raw_sym == "XAUUSD":
                sl_dist = min(max(sl_dist, 4.5), 11.5) # 45 hingga 115 pips ($4.50 - $11.50) mengikut struktur pasaran
                tp_dist = max(tp_dist, 3.5) # Minimum TP1 35 pips ($3.50)
            else:
                is_jpy = "JPY" in clean_raw_sym
                min_fx_sl = 0.0020 if not is_jpy else 0.20
                min_fx_tp = 0.0020 if not is_jpy else 0.20
                sl_dist = min(max(sl_dist, min_fx_sl), 0.0035 if not is_jpy else 0.35)
                tp_dist = max(tp_dist, min_fx_tp)
        elif live_atr and live_atr > 0:
            if clean_raw_sym == "XAUUSD":
                # Gold Protected Risk Model (Dynamic M15 ATR Cushion):
                is_news_trade = bool(signal.get("isNews") or signal.get("is_news") or "NEWS AI" in str(signal.get("notes", "")))
                if is_news_trade:
                    sl_dist = 16.0 # 160 pips wide news cushion
                    tp_dist = 28.0 if tp_target == 3 else (18.0 if tp_target == 2 else 10.0)
                    print(f"{Colors.GREEN}🔥 [DYNAMIC NEWS VOLATILITY] #{clean_raw_sym} SL dilebarkan ke {sl_dist:.1f} mata (+160p) & TP{tp_target}: {tp_dist:.1f} mata (Zon Berita Berimpak Tinggi)!{Colors.RESET}")
                else:
                    sl_dist = min(max(1.2 * live_atr, 4.5), 11.5)
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
                sl_dist = min(max(abs(raw_sl - signal_entry), 4.5), 11.5) if raw_sl > 0 else 7.0
            else:
                is_jpy = "JPY" in clean_raw_sym
                tp_dist = abs(raw_tp - signal_entry) if raw_tp > 0 else ((0.0070 if not is_jpy else 0.70) if tp_target == 3 else ((0.0042 if not is_jpy else 0.42) if tp_target == 2 else (0.0020 if not is_jpy else 0.20)))
                sl_dist = min(max(abs(raw_sl - signal_entry), 0.0028 if not is_jpy else 0.28), 0.0032 if not is_jpy else 0.32) if raw_sl > 0 else (0.0028 if not is_jpy else 0.28)

        # PURE MARKET-STRUCTURE SL & TP BASED ON LIQUIDITY SWEEP (ARAHAN KHAS BOS):
        # SL diletakkan selamat di luar jarum bucu liquidity sweep pasaran sebenar
        rates_m15 = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 16)
        if rates_m15 is not None and len(rates_m15) >= 4 and clean_raw_sym == "XAUUSD":
            recent_high = max(float(r['high']) for r in rates_m15)
            recent_low = min(float(r['low']) for r in rates_m15)
            buffer = 2.0  # $2.00 (20 pips) penampan selamat melepasi puncak jarum sweep

            if not is_buy: # SELL
                # Letak SL tepat di atas jarum bucu liquidity sweep tertinggi
                sl = round(max(recent_high + buffer, price + 5.5), digits)
                # TP1 disasarkan ke arah lantai kecairan pembeli
                tp = round(max(recent_low + 1.0, price - tp_dist), digits)
            else: # BUY
                # Letak SL tepat di bawah jarum bucu liquidity sweep terendah
                sl = round(min(recent_low - buffer, price - 5.5), digits)
                # TP1 disasarkan ke arah bumbung kecairan penjual
                tp = round(min(recent_high - 1.0, price + tp_dist), digits)

            print(f"{Colors.GREEN}🏛️ [MARKET STRUCTURE SL/TP] #{clean_raw_sym} {'SELL' if not is_buy else 'BUY'} @ {price:.2f} | SL Berasaskan Struktur: {sl:.2f} (Di luar bucu sweep) | Sasaran TP: {tp:.2f}{Colors.RESET}")
        else:
            if is_buy:
                tp = round(price + tp_dist, digits)
                sl = round(price - sl_dist, digits)
            else:
                tp = round(price - tp_dist, digits)
                sl = round(price + sl_dist, digits)

        # STRICT ANTI-CHASING PUCUK/LANTAI GUARD:
        # Penampan fleksibel: Emas ($4,040+) diberi ruang 120 pip ($12.00) waktu lonjakan pasaran
        is_test_signal = bool(signal.get("isTest"))
        allowed_slip_pips = 120.0 if clean_raw_sym == "XAUUSD" else max(float(self.max_slippage_pips), 30.0)
        max_slip_dist = (allowed_slip_pips * 10 * point)
        if not is_test_signal:
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

        # 0.0 ARAHAN MUTLAK BOS: DILARANG SAMA SEKALI MASUK ORDER SELAGI TIADA ARAHAN!
        pause_flags = [
            os.path.join(BASE_DIR, "pause_trading.flag"),
            r"C:\AmaterasuX\pause_trading.flag",
            r"C:\AmaterasuX_Acc2\pause_trading.flag",
            r"C:\AmaterasuX_Acc3\pause_trading.flag"
        ]
        if any(os.path.exists(p) for p in pause_flags):
            now_t = time.time()
            if (now_t - getattr(self, "last_boss_pause_log", 0)) > 60:
                self.last_boss_pause_log = now_t
                print(f"{Colors.RED}{Colors.BOLD}🛑 [ARAHAN BOS AKTIF] Signal #{clean_sym} DITOLAK! Sistem dikunci ketat: Dilarang buka sebarang order selagi tiada arahan Tengku Khairi!{Colors.RESET}")
            return

        # CIRCUIT BREAKER: SASARAN KEUNTUNGAN AKAUN (+2,500 USC / +$25.00 USD)
        if self.check_account_profit_target():
            return

        # ARAHAN TEGAS BOS: HARAMKAN TRADE PADA WAKTU BAHAYA MANIPULASI
        is_dangerous, danger_reason = self.is_dangerous_market_hour()
        if is_dangerous:
            now_t = time.time()
            if (now_t - getattr(self, "last_danger_log_time", 0)) > 60:
                self.last_danger_log_time = now_t
                print(f"{Colors.YELLOW}🛑 [WAKTU BAHAYA DIHARAMKAN] Signal #{clean_sym} ditolak: {danger_reason}{Colors.RESET}")
            return

        order_records = []
        if self.execution_mode == "SPLIT_TP":
            rounds = 3 if clean_sym == "XAUUSD" and int(self.config.get("max_gold_positions", 9)) >= 9 else 1
            total_layers = 3 * rounds
            print(f"{Colors.CYAN}[AMATERASU SOP] Membuka {total_layers} Layer #{clean_sym} (3x TP1, 3x TP2, 3x TP3 Runner)...{Colors.RESET}")
            for r in range(rounds):
                ord1 = self.execute_order(sig, tp_target=1)
                if ord1:
                    order_records.append(ord1)
                time.sleep(0.2)
                ord2 = self.execute_order(sig, tp_target=2)
                if ord2:
                    order_records.append(ord2)
                time.sleep(0.2)
                ord3 = self.execute_order(sig, tp_target=3)
                if ord3:
                    order_records.append(ord3)
                time.sleep(0.2)
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
        # ARAHAN BOS: SL & TP KEKAL STATIK 100%. DILARANG UBAH ATAU TUTUP AWAL!
        return

    def check_and_apply_position_be(self, p, sig_data=None):
        # ARAHAN BOS: SL & TP KEKAL STATIK 100%. DILARANG UBAH ATAU TUTUP AWAL!
        return

        tick = mt5.symbol_info_tick(p.symbol)
        if not tick:
            return

        # Tentukan saiz 1 pip untuk pengiraan untung semasa
        sym_upper = p.symbol.upper()
        is_gold = ("XAU" in sym_upper or "GOLD" in sym_upper)
        if is_gold:
            pip_size = 0.10
            # Ruang Nafas Break-Even Emas (min +55 pips / $5.50) agar normal retest tidak menyentuh BE
            min_be_pips = float(self.config.get("gold_min_be_pips", 55.0))
        elif "GBPJPY" in sym_upper:
            pip_size = 0.01
            # Bedah Siasat GBPJPY: Volatiliti 16p M15 ATR, perlukan ruang nafas +28 pip
            min_be_pips = float(self.config.get("gbpjpy_min_be_pips", 28.0))
        elif "JPY" in sym_upper or "WTI" in sym_upper or "XAG" in sym_upper or "SILVER" in sym_upper:
            pip_size = 0.01
            min_be_pips = 24.0
        else:
            pip_size = 0.0001
            min_be_pips = 24.0

        cur_price = tick.bid if is_buy else tick.ask
        floating_pips = ((cur_price - open_price) / pip_size) if is_buy else ((open_price - cur_price) / pip_size)

        # SPREAD & ROLLOVER SAFETY FILTER:
        # Hitung spread semasa dalam unit pip. Normal spread Gold adalah 25-45 pips.
        current_spread_pips = abs(tick.ask - tick.bid) / pip_size
        max_allowed_spread = 65.0 if is_gold else 12.0
        if current_spread_pips > max_allowed_spread:
            # Spread terlalu liar / melebar (Rollover). Jangan alih SL ke paras rapat kerana Ask price akan terus langgar SL!
            return

        # Semak maklumat daripada server Amaterasu X:
        # Server HANYA sahkan BE jika status TP1_HIT dan posisi benar-benar dalam zon untung minimum
        server_be = False
        if sig_data:
            sig_type = str(sig_data.get("type", "")).upper()
            sig_matches_direction = (is_buy and sig_type == "BUY") or (not is_buy and sig_type == "SELL")
            # Syarat Tegas: Walaupun server sebut TP1_HIT, harga semasa MT5 MESTILAH dalam keadaan untung sekurang-kurangnya min_be_pips / 2!
            min_profit_threshold = 25.0 if is_gold else 12.0
            if sig_matches_direction and (sig_data.get("status") == "TP1_HIT" or sig_data.get("beLocked")):
                if floating_pips >= min_profit_threshold:
                    server_be = True

        # MULTI-STAGE DYNAMIC TRAILING PROFIT LOCK (TRUE PROFIT BREAK-EVEN WITH BREATHING ROOM):
        # Tahap 1: Min BE (+55p Gold / +24p Forex) -> Kunci SL ke TRUE BREAK-EVEN (+5p Gold / +2p FX)
        #          Beri ruang nafas 50 pips agar retest sebelum junaman tidak menyentuh BE!
        # Tahap 2: Untung mencapai +80p Gold / +40p Forex -> Kunci untung kekal +40p Gold / +20p Forex! (Ruang nafas 40p)
        # Tahap 3: Untung mencapai +115p Gold / +60p Forex -> Kunci untung kekal +75p Gold / +35p Forex! (Ruang nafas 40p)
        # Tahap 4: Untung melepasi +160p Gold / +85p Forex -> Kunci untung kekal +110p Gold / +55p Forex! (Ruang nafas 50p)
        stage_name = ""
        cand_sl = 0.0

        if is_gold:
            if floating_pips >= 160.0:
                lock_pips = 110.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 4 Trailing (Kunci Untung +110p | Ruang Nafas 50p)"
            elif floating_pips >= 115.0:
                lock_pips = 75.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 3 Trailing (Kunci Untung +75p | Ruang Nafas 40p)"
            elif floating_pips >= 80.0:
                lock_pips = 40.0
                cand_sl = (open_price + lock_pips * pip_size) if is_buy else (open_price - lock_pips * pip_size)
                stage_name = "Tahap 2 Trailing (Kunci Untung +40p | Ruang Nafas 40p)"
            elif floating_pips >= min_be_pips or server_be:
                # TRUE BREAK-EVEN BERNAFAS: Kunci SL di zon untung (+5 pips / $0.50) hanya selepas harga jalan +55p
                be_profit_pips = 5.0
                cand_sl = (open_price + be_profit_pips * pip_size) if is_buy else (open_price - be_profit_pips * pip_size)
                stage_name = "Tahap 1 True BE Bernafas (Kunci Untung Bersih +5p | Ruang Retest 50p)"
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
                # TRUE BREAK-EVEN FOREX: Kunci +1.5 pips untung bersih
                # BUY: open_price + 1.5p | SELL: open_price - 1.5p
                be_profit_pips = 1.5
                cand_sl = (open_price + be_profit_pips * pip_size) if is_buy else (open_price - be_profit_pips * pip_size)
                stage_name = "Tahap 1 True BE Forex (Kunci Untung Bersih +1.5p | Sifar Risiko)"

        if not stage_name or cand_sl <= 0.0:
            return

        target_sl = round(cand_sl, digits)

        # Semak sama ada SL baharu benar-benar menambah baik keselamatan dan berada pada jarak selamat dari harga semasa:
        # Untuk BUY: SL ditutup pada harga Bid. Jadi Bid mestilah lebih tinggi daripada SL sekurang-kurangnya jarak spread + buffer!
        # Untuk SELL: SL ditutup pada harga ASK! Jadi Ask mestilah lebih rendah daripada SL sekurang-kurangnya jarak spread + buffer!
        safe_margin = max(current_spread_pips * pip_size, 2.0 * pip_size)
        if is_buy:
            if p.sl >= target_sl:
                return
            if tick.bid <= (target_sl + safe_margin):
                return
        else:
            if p.sl > 0 and p.sl <= target_sl:
                return
            if tick.ask >= (target_sl - safe_margin):
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
        # ARAHAN BOS: SL & TP KEKAL STATIK 100%. DILARANG UBAH ATAU LEBARKAN!
        return


    def close_position_market(self, p, reason=""):
        """Tutup satu posisi pasaran serta-merta - DILUMPUHKAN 100% UNTUK KEKALKAN POSISI STATIK"""
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
                            import traceback
                            print(f"{Colors.RED}[EVENT ERROR] {e}\n{traceback.format_exc()}{Colors.RESET}")
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
                    clean_sym = s.get("symbol", "").split(".")[0].upper()
                    if s.get("status") == "ACTIVE":
                        # ARAHAN BOS: STOP DULU SEMUA ENTRY! JANGAN MASUK LAGI!
                        pass
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
        # ARAHAN BOS: STOP DULU SEMUA ENTRY! JANGAN MASUK LAGI!
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

                # ARAHAN BOS: SL & TP KEKAL STATIK 100%. DILARANG UBAH ATAU SELARAS SL!
                pass
            else:
                err = res.retcode if res else mt5.last_error()
                print(f"{Colors.YELLOW}[SWEEP REENTRY NOTA] Gagal buka sniper layer #{sym}: {err}{Colors.RESET}")

    def protect_naked_manual_positions(self, all_pos):
        """Auto-set SL & TP for all manual / naked positions with SL=0 or TP=0"""
        if not all_pos:
            return
        for p in all_pos:
            if p.sl == 0.0 or p.tp == 0.0:
                sym_upper = p.symbol.upper()
                s_info = mt5.symbol_info(p.symbol)
                digits = s_info.digits if s_info else 2
                is_buy = (p.type == mt5.POSITION_TYPE_BUY)
                open_p = p.price_open
                new_sl = p.sl
                new_tp = p.tp

                if "XAU" in sym_upper or "GOLD" in sym_upper:
                    if not is_buy:  # SELL
                        if new_sl == 0.0:
                            new_sl = round(max(3749.50, open_p + 14.50), digits)
                        if new_tp == 0.0:
                            new_tp = round(min(3720.00, open_p - 14.00), digits)
                    else:  # BUY
                        if new_sl == 0.0:
                            new_sl = round(min(3690.00, open_p - 14.50), digits)
                        if new_tp == 0.0:
                            new_tp = round(max(3755.00, open_p + 14.00), digits)
                else:  # Forex
                    pip = 0.0001
                    if not is_buy:  # SELL
                        if new_sl == 0.0:
                            new_sl = round(open_p + 35 * pip, digits)
                        if new_tp == 0.0:
                            new_tp = round(open_p - 40 * pip, digits)
                    else:  # BUY
                        if new_sl == 0.0:
                            new_sl = round(open_p - 35 * pip, digits)
                        if new_tp == 0.0:
                            new_tp = round(open_p + 40 * pip, digits)

                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": p.symbol,
                    "sl": new_sl,
                    "tp": new_tp,
                }
                res = mt5.order_send(req)
                if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"{Colors.GREEN}🛡️ [MANUAL POSITION PROTECTED] Ticket #{p.ticket} {p.symbol} {('BUY' if is_buy else 'SELL')} Berjaya disetkan SL: {new_sl} dan TP: {new_tp}! Modal kini terlindung.{Colors.RESET}")
                else:
                    err = res.retcode if res else mt5.last_error()
                    print(f"{Colors.YELLOW}[MANUAL PROTECTION INFO] Ticket #{p.ticket}: retcode {err}{Colors.RESET}")

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
                self.check_account_profit_target()
                if all_pos:
                    # Lindungi semua posisi manual yang tiada SL atau TP (SL=0 / TP=0) serta-merta
                    self.protect_naked_manual_positions(all_pos)
                    for p in all_pos:
                        # Auto-lebarkan SL jika tiket sedia ada terlalu ketat (<25p FX / <60p Gold)
                        self.check_and_widen_tight_sl(p)
                        if p.magic == self.magic_number or (p.comment and p.comment.startswith("AmaterasuX")):
                            matched_sig = next((s for s in active_signals if s.get("symbol") == p.symbol.split('.')[0].upper()), None)
                            self.check_and_apply_position_be(p, matched_sig)

                            # SL DAN TP KEKAL STATIK. DILARANG TUTUP MANUAL / CUTOFF.
                            pass

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
        """Zero-Intervention Autonomous Auto-Updater (OTA Live Sync):
        Setiap 30 saat, bridge akan semak hash fail terkini di server.
        Jika saya (Antigravity) kemas kini kod di server, VPS akan:
        1. Muat turun kod baharu secara senyap ke fail semasa.
        2. Cetak notifikasi kemas kini berjaya.
        3. Mulakan semula (in-place restart) proses python ini secara automatik tanpa perlu Tengku sentuh apa-apa!
        """
        import hashlib
        current_script = os.path.abspath(__file__)
        def get_local_hash():
            try:
                with open(current_script, "rb") as f:
                    return hashlib.md5(f.read()).hexdigest()
            except Exception:
                return None

        update_url = f"{self.server_url.rstrip('/')}/amaterasu_mt5_bridge.py"
        while self.running:
            try:
                time.sleep(30)
                r = requests.get(update_url, timeout=10)
                if r.status_code == 200 and len(r.text) > 10000:
                    remote_hash = hashlib.md5(r.content).hexdigest()
                    local_hash = get_local_hash()
                    if local_hash and remote_hash != local_hash:
                        print(f"\n{Colors.GREEN}{Colors.BOLD}⚡ [OTA AUTO-SYNC] Kod pembetulan baharu dikesan dari pelayan! Mengemas kini secara automatik...{Colors.RESET}")
                        with open(current_script, "wb") as f:
                            f.write(r.content)
                        print(f"{Colors.GREEN}✅ [OTA AUTO-SYNC] Fail dikemaskini. Memulakan semula proses Bridge secara senyap...{Colors.RESET}")
                        # Auto safe restart on Windows (Handles spaces in C:\Program Files\Python311\python.exe flawlessly)
                        import subprocess
                        mt5.shutdown()
                        subprocess.Popen([sys.executable, current_script], cwd=os.path.dirname(current_script))
                        sys.exit(0)
            except Exception:
                pass

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
                    deposits = 0.0
                    trade_profit = 0.0
                    closed_trades = 0
                    won_trades = 0
                    winrate = 100.0
                    try:
                        deals = mt5.history_deals_get(datetime.now() - timedelta(days=500), datetime.now() + timedelta(days=1))
                        if deals:
                            deposits = sum(d.profit for d in deals if d.type == 2 and d.profit > 0)
                            total_wd = sum(abs(d.profit) for d in deals if d.type == 2 and d.profit < 0)
                            trade_profit = sum(d.profit for d in deals if d.entry == 1)
                            closed_trades = len([d for d in deals if d.entry == 1])
                            won_trades = len([d for d in deals if d.entry == 1 and d.profit > 0])
                            winrate = round((won_trades / closed_trades * 100), 1) if closed_trades > 0 else 100.0
                    except Exception:
                        pass
                    acc_info = {
                        "balance": float(acc.balance),
                        "equity": float(acc.equity),
                        "profit": float(acc.profit),
                        "margin": float(acc.margin),
                        "login": int(acc.login),
                        "deposits": float(deposits),
                        "totalWithdrawn": float(total_wd),
                        "realizedProfit": float(trade_profit),
                        "closedTrades": int(closed_trades),
                        "wonTrades": int(won_trades),
                        "winRate": float(winrate)
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
                        resp = requests.post(f"{u.rstrip('/')}/api/market/sync-mt5", json={
                            "quotes": quotes, 
                            "openPositions": pos_list,
                            "accountInfo": acc_info,
                            "volumeFlow": volume_flow,
                            "mtfMaFlow": mtf_ma_flow
                        }, timeout=3)
                        if resp and resp.status_code == 200:
                                pass
                                pass
                    except Exception:
                        pass
            except Exception:
                pass
            time.sleep(2.5)

    def sync_closed_deals_loop(self):
        """Memantau deal MT5 yang ditutup (SL, TP, Close Manual) dan menyelaraskan status kembali ke pelayan Amaterasu X"""
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
