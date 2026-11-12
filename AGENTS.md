# Amaterasu X & Multi-Terminal MT5 Architectural Rules

## 1. Multi-Terminal MT5 VPS Specifications
- **Master 1 (#5100154135 - Cent USC)**:
  - Terminal Path: `C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe`
  - Bridge Launcher: `acc1.bat`
  - Working Directory: `C:\AmaterasuX`
  - Magic Number: `888999`
  - Default Lot: 0.20 USC
  - Server: `VersusTrade-Live1`
- **Master 2 (#5100207348 - Cent USC)**:
  - Terminal Path: `C:\VersusTrade_Acc2\terminal64.exe`
  - Bridge Launcher: `acc2.bat`
  - Working Directory: `C:\AmaterasuX_Acc2`
  - Magic Number: `888998`
  - Default Lot: 0.20 USC
  - Server: `VersusTrade-Live1`
- **Master 3 (#5100209626 - Standard USD $1,000)**:
  - Terminal Path: `C:\VersusTrade_Acc3\terminal64.exe`
  - Bridge Launcher: `acc3.bat`
  - Working Directory: `C:\AmaterasuX_Acc3`
  - Magic Number: `888997`
  - Default Lot: 0.02 USD (0.03 Forex / NY Gold)
  - Server: `VersusTrade-Live1`

## 2. Multi-Terminal Execution Invariants
- **Mandatory Portable Mode**: All MT5 terminal instances (Master 1, Master 2, and Master 3) MUST be launched with the `/portable` switch to isolate data directories and avoid shared `%APPDATA%\MetaQuotes\Terminal` collisions.
- **Direct Terminal Attach Fallback**: `amaterasu_mt5_bridge.py` MUST support direct attachment `mt5.initialize(path=...)` without credentials as a fallback when the terminal is already running on screen.
- **Allowed Trading Pairs**: Strictly whitelist `XAUUSD`, `USDCHF`, and `EURUSD`.

## 3. Order Execution & SMC Risk Rules
- **Strict 1-Setup Per Symbol (Max 3 Split Layers - Bulan Lepas Locked SOP)**: A symbol can only have ONE active trade setup at a time (split into Layer 1 -> TP1, Layer 2 -> TP2, Layer 3 -> TP3). NEVER stack duplicate setups. Maximum total open positions for that symbol is 3. New setups for that symbol are strictly blocked until the current trade resolves.
- **Strict Anti-Hedging**: NEVER open an opposing order on the same symbol if an opposite position is active in MT5 (e.g. forbid BUY if active SELL is open).
- **Auto Break-Even (Risk-Free Guardian)**: Lock SL to Entry (BE) as soon as TP1 is hit (+50 pips for Gold, +18 pips for Forex).
- **Institutional Breathing Room**:
  - Gold (XAUUSD): SL 100 - 135 pips ($10.00 - $13.50); TP1: 80 pips, TP2: 160 pips, TP3: 300 pips runner.
  - Forex (EURUSD, USDCHF): SL 35 - 48 pips; TP1: 35 pips, TP2: 70 pips, TP3: 110 pips runner.
- **Gold Macro Trend Following**: While Gold trades above macro support (4,025.00+), strictly execute BUY on Dip and forbid counter-trend SELL setups into the prevailing bull run.

## 4. Multi-Account Execution Parity & Cross-Account Invariants
- **Independent Terminal Verification**: Each running bridge instance (Acc1, Acc2, Acc3) must independently inspect its local terminal positions (`len(my_sym_pos) == 0`).
- **Zero MT5-ID Skipping for Followers**: Follower bridges must NEVER skip signals whose ID starts with `mt5-`. If the local terminal holds 0 positions for that symbol, it MUST execute immediately.
- **Lot Sizing Parity**:
  - Acc1 & Acc2 (Cent): 0.20 - 0.40 USC.
  - Acc3 (Standard USD $1,000): 0.02 - 0.05 USD.

## 5. Telemetry Isolation & Database Vault Mutex
- **Strict Account Routing**:
  - Login `5100154135` strictly routes to `db.copytrade` (Vault 1).
  - Login `5100207348` strictly routes to `db.copytrade2` (Vault 2).
  - Login `5100209626` strictly routes to `db.copytrade3` (Vault 3).
- **Zero Cross-Overwrite**: Telemetry from one account must never mutate the balance, equity, or status of another vault. The server endpoint handler MUST enforce `payload.accountInfo.login` matching before modifying any copytrade vault.

## 6. Institutional Dual SMC Strategy Engine
- **Symmetric Trend Scalp Execution**:
  - Downtrend: Trigger `SMC BREAKDOWN BOS` (below floor) or `SCALP PRO: SELL ON RALLY` (pullback). Hold fire only on exact support wick (`floorRef ± 0.5`).
  - Uptrend: Trigger `SMC BREAKOUT BOS` (above ceiling) or `SCALP PRO: BUY ON DIP` (pullback). Hold fire only on exact resistance wick (`ceilRef ± 0.5`).
- **Elimination of Dead Zones**: Prevent mathematical deadlocks where price is trapped in perpetual await state.

## 7. Windows Command Safety Invariant
- **No-Pipe Rule**: NEVER use or propose PowerShell pipeline `|` syntax in user-facing snippets or shell commands. Use native cmdlets or direct Python subprocesses to ensure 100% execution reliability on Windows without parser termination.

