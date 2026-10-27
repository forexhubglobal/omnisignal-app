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

CONFIG_FILE = "bridge_config.json"

DEFAULT_CONFIG = {
    "server_url": "https://amaterasux.onrender.com",
    "lot_size": 0.01,
    "execution_mode": "SPLIT_TP", # "SPLIT_TP", "SINGLE_TP1", "SINGLE_TP2"
    "auto_breakeven": True,
    "max_slippage_pips": 5,
    "magic_number": 888999,
    "mt5_terminal_path": "",
    "custom_symbol_map": {
        "WTI": "USOIL",
        "BTCUSD": "BTCUSD"
    }
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                cfg = json.load(f)
                merged = {**DEFAULT_CONFIG, **cfg}
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
        self.server_url = config.get("server_url", "https://amaterasux.onrender.com").rstrip("/")
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
        
    def banner(self):
        print(f"{Colors.RED}{Colors.BOLD}")
        print("  +===================================================================+")
        print("  |                   AMATERASU X - MT5 AI BRIDGE                     |")
        print("  |        High-Frequency Quantitative Signal Execution Terminal      |")
        print("  +===================================================================+")
        print(f"{Colors.RESET}")
        print(f" {Colors.CYAN}* Server Target   :{Colors.RESET} {self.server_url}")
        print(f" {Colors.CYAN}* Base Lot Size   :{Colors.RESET} {self.lot_size}")
        print(f" {Colors.CYAN}* Execution Mode  :{Colors.RESET} {self.execution_mode} (Split TP1/TP2)")
        print(f" {Colors.CYAN}* Auto Break-Even :{Colors.RESET} {'AKTIF (SOP Wajib)' if self.auto_be else 'TIDAK'}")
        print(f" {Colors.CYAN}* Magic Number    :{Colors.RESET} {self.magic_number}")
        print("  -------------------------------------------------------------------")

    def init_mt5(self):
        print(f"\n{Colors.YELLOW}[MT5] Menyambung ke terminal MetaTrader 5...{Colors.RESET}")
        path = self.config.get("mt5_terminal_path")
        
        init_ok = False
        if path and os.path.exists(path):
            print(f"[MT5] Menggunakan terminal path: {path}")
            init_ok = mt5.initialize(path=path)
        else:
            # Check standard known terminal paths if default init fails
            init_ok = mt5.initialize()
            if not init_ok:
                candidates = [
                    r"C:\Program Files\Pepperstone MetaTrader 5\terminal64.exe",
                    r"C:\Program Files\MetaTrader 5 EXNESS\terminal64.exe",
                    r"C:\Program Files\MetaTrader 5\terminal64.exe",
                    r"C:\Program Files\IC Markets Global MT5\terminal64.exe",
                    r"C:\Program Files\XM Global MT5\terminal64.exe",
                    r"C:\Program Files\CPT Markets MT5 Terminal\terminal64.exe",
                    r"C:\Program Files\Moneta Markets MT5 Terminal\terminal64.exe"
                ]
                for c in candidates:
                    if os.path.exists(c):
                        print(f"[MT5] Mencuba sambungan ke: {c}")
                        if mt5.initialize(path=c):
                            init_ok = True
                            self.config["mt5_terminal_path"] = c
                            save_config(self.config)
                            break

        if not init_ok:
            err = mt5.last_error()
            print(f"{Colors.RED}[RALAT MT5] Gagal menyambung ke MT5: {err}{Colors.RESET}")
            print(f"{Colors.YELLOW}[PANDUAN]: Sila buka terminal MT5 anda secara manual terlebih dahulu, dan pastikan butang 'Algo Trading' diaktifkan.{Colors.RESET}")
            return False

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
            variations = ['GOLD', 'XAUUSD.M', 'XAUUSD.A', 'XAUUSD.PRO', 'XAUUSDM', 'XAUUSD_M', 'GOLD.M']
        elif s_upper == 'WTI':
            variations = ['USOIL', 'USOUSD', 'CL', 'OIL', 'WTI.M', 'CRUDE', 'WTI_OIL', 'USOIL.M']
        elif s_upper == 'BTCUSD':
            variations = ['BTCUSD.M', 'BTCUSDT', 'BITCOIN', 'BTCUSD.PRO', 'BTCUSDM']
        else:
            variations = [f"{s_upper}.M", f"{s_upper}.A", f"{s_upper}.PRO", f"{s_upper}M", f"{s_upper}_M"]

        for v in variations:
            if v in self.broker_symbols:
                return self.broker_symbols[v]

        # 4. Partial substring match
        for b_name_upper, b_actual in self.broker_symbols.items():
            if s_upper in b_name_upper:
                return b_actual

        return raw_symbol

    def get_fill_type(self, symbol_info):
        """Tentukan filling mode yang disokong oleh broker (IOC, FOK, RETURN)"""
        modes = symbol_info.filling_mode
        if modes & mt5.ORDER_FILLING_IOC:
            return mt5.ORDER_FILLING_IOC
        elif modes & mt5.ORDER_FILLING_FOK:
            return mt5.ORDER_FILLING_FOK
        else:
            return mt5.ORDER_FILLING_RETURN

    def execute_order(self, signal, tp_target=1):
        symbol_raw = signal.get("symbol", "XAUUSD")
        symbol = self.resolve_symbol(symbol_raw)
        
        # Pastikan simbol aktif dalam MarketWatch
        if not mt5.symbol_select(symbol, True):
            print(f"{Colors.RED}[ORDER] Gagal aktifkan simbol {symbol} di MarketWatch MT5.{Colors.RESET}")
            return None

        sym_info = mt5.symbol_info(symbol)
        if not sym_info:
            print(f"{Colors.RED}[ORDER] Maklumat simbol {symbol} tidak ditemui.{Colors.RESET}")
            return None

        order_type_str = signal.get("type", "BUY").upper()
        is_buy = (order_type_str == "BUY")
        order_type = mt5.ORDER_TYPE_BUY if is_buy else mt5.ORDER_TYPE_SELL

        tick = mt5.symbol_info_tick(symbol)
        if not tick:
            print(f"{Colors.RED}[ORDER] Gagal membaca harga tick semasa bagi {symbol}.{Colors.RESET}")
            return None

        price = tick.ask if is_buy else tick.bid
        digits = sym_info.digits
        point = sym_info.point

        # Entry slippage check
        signal_entry = float(signal.get("entry", price))
        max_slip = self.max_slippage_pips * 10 * point
        diff = abs(price - signal_entry)
        if diff > max_slip:
            print(f"{Colors.YELLOW}[SLIPPAGE AMARAN] Harga pasaran semasa ({price:.{digits}f}) berbeza {diff/point/10:.1f} pips dari entry signal ({signal_entry:.{digits}f}). Melebihi had {self.max_slippage_pips} pips.{Colors.RESET}")

        sl = float(signal.get("sl", 0.0))
        tp = float(signal.get("tp2" if tp_target == 2 else "tp1", 0.0))

        # Deviation in points
        deviation = int(self.max_slippage_pips * 10)
        filling = self.get_fill_type(sym_info)

        comment = f"AmaterasuX-TP{tp_target}"

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": self.lot_size,
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

        print(f"\n{Colors.CYAN}⚡ [MENGHANTAR ORDER] {order_type_str} {self.lot_size} lot #{symbol} @ {price:.{digits}f}{Colors.RESET}")
        print(f"   SL: {sl:.{digits}f} | TP{tp_target}: {tp:.{digits}f} | Filling: {filling}")

        result = mt5.order_send(request)
        if not result or result.retcode != mt5.TRADE_RETCODE_DONE:
            err_code = result.retcode if result else mt5.last_error()
            err_comment = result.comment if result else ""
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

        status = sig.get("status", "ACTIVE")
        if status != "ACTIVE":
            return

        self.executed_signal_ids.add(sig_id)

        print(f"\n{Colors.BOLD}{Colors.GREEN}═════════════════════════════════════════════════════════════════════{Colors.RESET}")
        print(f" {Colors.GREEN}🚀 SIGNAL BARU DIKESAN DARI AMATERASU X!{Colors.RESET}")
        print(f" • Simbol    : #{sig.get('symbol')} ({sig.get('type')})")
        print(f" • Entry Ref : {sig.get('entry')}")
        print(f" • TP1 / TP2 : {sig.get('tp1')} / {sig.get('tp2')}")
        print(f" • Stop Loss : {sig.get('sl')}")
        print(f" • Confluence: {sig.get('notes', 'Amaterasu Institutional Flow')[:75]}...")
        print(f"{Colors.BOLD}{Colors.GREEN}═════════════════════════════════════════════════════════════════════{Colors.RESET}")

        order_records = []
        if self.execution_mode == "SPLIT_TP":
            # Buka 2 layer: Layer 1 untuk TP1, Layer 2 untuk TP2 Runner
            print(f"{Colors.CYAN}[AMATERASU SOP] Membuka 2 Layer (Layer 1 -> TP1, Layer 2 -> TP2 Runner)...{Colors.RESET}")
            ord1 = self.execute_order(sig, tp_target=1)
            if ord1:
                order_records.append(ord1)
            time.sleep(0.3)
            ord2 = self.execute_order(sig, tp_target=2)
            if ord2:
                order_records.append(ord2)
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

    def apply_breakeven_for_signal(self, sig_id, entry_price=None):
        """Alih Stop Loss ke Break-Even bagi semua posisi runner yang masih terbuka di bawah signal_id ini"""
        if sig_id not in self.active_positions:
            return

        orders = self.active_positions[sig_id]
        print(f"\n{Colors.YELLOW}🛡️ [AUTO-BREAKEVEN] Mengaktifkan perlindungan Break-Even bagi Signal {sig_id}...{Colors.RESET}")

        for rec in orders:
            ticket = rec["ticket"]
            # Semak sama ada posisi masih hidup di MT5
            pos = mt5.positions_get(ticket=ticket)
            if not pos:
                continue
            
            p = pos[0]
            open_price = entry_price or p.price_open
            sym_info = mt5.symbol_info(p.symbol)
            digits = sym_info.digits if sym_info else 2

            # Jika SL sudah berada pada atau melebihi open price, langkau
            is_buy = (p.type == mt5.POSITION_TYPE_BUY)
            if is_buy and p.sl >= open_price:
                continue
            if not is_buy and p.sl <= open_price and p.sl > 0:
                continue

            mod_request = {
                "action": mt5.TRADE_ACTION_SLTP,
                "position": ticket,
                "symbol": p.symbol,
                "sl": round(open_price, digits),
                "tp": round(p.tp, digits),
            }

            res = mt5.order_send(mod_request)
            if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                print(f"{Colors.GREEN}🛡️ [BE BERJAYA] Ticket #{ticket} ({p.symbol}) SL dialih ke Break-Even @ {open_price:.{digits}f}! Posisi kini bebas risiko.{Colors.RESET}")
            else:
                code = res.retcode if res else mt5.last_error()
                print(f"{Colors.YELLOW}[BE NOTA] Ticket #{ticket} modifikasi SL: {code}{Colors.RESET}")

    def handle_signal_resolution(self, resolved_data):
        item = resolved_data.get("item", {})
        sig_id = item.get("id")
        outcome = item.get("status")
        symbol = item.get("symbol")
        pips = item.get("pips")

        print(f"\n{Colors.CYAN}🏁 [TRADE RESOLVED] #{symbol} status: {outcome} ({pips:+} pips){Colors.RESET}")

        # Jika TP1 dicapai atau signal umumkan BE, segera kunci BE untuk layer seterusnya!
        if outcome in ["TP1", "BE"] or (item.get("tags") and "TP1" in item["tags"]):
            if self.auto_be:
                # Cari entry price
                entry = item.get("entry")
                self.apply_breakeven_for_signal(sig_id, entry)

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
                    # Ambil signal yang baru keluar (kurang dari 2 minit)
                    print(f"[SYNC] Mengesan running signal semasa permulaan: #{s.get('symbol')} {s.get('type')}")
                    # Jangan duplicate execute jika signal lama
                    self.executed_signal_ids.add(s.get("id"))

        elif event_name == "signal_fired":
            self.process_new_signal(payload)

        elif event_name == "signal_resolved":
            self.handle_signal_resolution(payload)

        elif event_name == "on_pips_update":
            # Payload adalah list db.activeSignals
            if isinstance(payload, list):
                for s in payload:
                    if s.get("status") == "ACTIVE" and s.get("id") not in self.executed_signal_ids:
                        self.process_new_signal(s)

    def polling_fallback_loop(self):
        """Fallback polling setiap 4 saat untuk memastikan tiada signal terlepas"""
        while self.running:
            try:
                time.sleep(4)
                url = f"{self.server_url}/api/signals/active"
                r = requests.get(url, timeout=5)
                if r.status_code == 200:
                    data = r.json()
                    # Semak activeSignal
                    act = data.get("activeSignal")
                    if act and act.get("status") == "ACTIVE":
                        if act.get("id") not in self.executed_signal_ids:
                            self.process_new_signal(act)
                            
                    # Semak activeSignals jika server return
                    acts = data.get("activeSignals", [])
                    for s in acts:
                        if s.get("status") == "ACTIVE" and s.get("id") not in self.executed_signal_ids:
                            self.process_new_signal(s)
            except Exception:
                pass

    def start(self):
        self.banner()
        if not self.init_mt5():
            print(f"\n{Colors.RED}Sila buka MT5 anda dan jalankan skrip ini semula.{Colors.RESET}")
            input("\nTekan Enter untuk keluar...")
            return

        # Start Fallback Polling thread
        poll_thread = threading.Thread(target=self.polling_fallback_loop, daemon=True)
        poll_thread.start()

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
