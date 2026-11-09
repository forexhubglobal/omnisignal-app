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
