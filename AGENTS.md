# Amaterasu X & Multi-Terminal MT5 Architectural Rules

## 1. Multi-Terminal MT5 VPS Specifications
- **Master 1 (#5100221532 - Cent USC)**:
  - Terminal Path: `C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe`
  - Bridge Launcher: `acc1.bat`
  - Working Directory: `C:\AmaterasuX`
  - Magic Number: `888999`
  - Default Lot: 0.20 USC
  - Server: `VersusTrade-Live1`
- **Master 2 (#5100221533 - Cent USC)**:
  - Terminal Path: `C:\VersusTrade_Acc2\terminal64.exe`
  - Bridge Launcher: `acc2.bat`
  - Working Directory: `C:\AmaterasuX_Acc2`
  - Magic Number: `888998`
  - Default Lot: 0.20 USC
  - Server: `VersusTrade-Live1`
- **Master 3 (#5100221534 - Standard USD $1,000)**:
  - Terminal Path: `C:\VersusTrade_Acc3\terminal64.exe`
  - Bridge Launcher: `acc3.bat`
  - Working Directory: `C:\AmaterasuX_Acc3`
  - Magic Number: `888997`
  - Default Lot: 0.02 USD (0.03 Forex / NY Gold)
  - Server: `VersusTrade-Live1`
- **Master 4 (#5100227599 - Cent USC)**:
  - Terminal Path: `C:\VersusTrade_Acc4\terminal64.exe`
  - Bridge Launcher: `acc4.bat`
  - Working Directory: `C:\AmaterasuX_Acc4`
  - Magic Number: `888994`
  - Default Lot: 0.20 USC
  - Server: `VersusTrade-Live1`

## 2. Multi-Terminal Execution Invariants
- **Mandatory Portable Mode**: All MT5 terminal instances (Master 1, Master 2, and Master 3) MUST be launched with the `/portable` switch to isolate data directories and avoid shared `%APPDATA%\MetaQuotes\Terminal` collisions.
- **Direct Terminal Attach Fallback**: `amaterasu_mt5_bridge.py` MUST support direct attachment `mt5.initialize(path=...)` without credentials as a fallback when the terminal is already running on screen.
- **Allowed Trading Pairs**: Strictly whitelist `XAUUSD`, `USDCHF`, and `EURUSD`.

## 3. Order Execution & SMC Risk Rules
- **Strict 1-Setup Per Symbol (Max 3 Split Layers - Bulan Lepas Locked SOP)**: A symbol can only have ONE active trade setup at a time (split into Layer 1 -> TP1, Layer 2 -> TP2, Layer 3 -> TP3). NEVER stack duplicate setups. Maximum total open positions for that symbol is 3. New setups for that symbol are strictly blocked until the current trade resolves.
- **Ironclad Profit Locking & Zero-Loss Break-Even Invariant (NO WINNER TURNS TO LOSER)**: Once a trade is in solid profit (>= +30 pips for Gold, >= +15 pips for Forex), the system MUST immediately move Stop Loss to Break-Even (+5 pips for Gold / +2 pips for Forex) to guarantee that a winning trade NEVER reverses into a negative loss. As profit expands (+50p, +75p, +110p), dynamic trailing lock locks in +25p, +45p, and +80p respectively. Posisi yang sudah untung HARAM dibiarkan berbalik menjadi kerugian!
- **Gold Position Capacity (9 Layers Parity)**: XAUUSD allows up to 9 open positions across all accounts (Dragon, Mantis, Tiger, MEZ EA), executed as 3 rounds of SPLIT_TP (3x TP1, 3x TP2, 3x TP3 runner), matching MEZ account capacity while respecting equity margin.
- **Institutional Breathing Room**:
  - Gold (XAUUSD): SL 100 - 135 pips ($10.00 - $13.50); TP1: 80 pips, TP2: 160 pips, TP3: 300 pips runner.
  - Forex (EURUSD, USDCHF): SL 35 - 48 pips; TP1: 35 pips, TP2: 70 pips, TP3: 110 pips runner.
- **Dynamic 2-Way Trading Mandate (BUY & SELL)**: The system MUST trade both directions dynamically and flexibly. There is NO rigid one-way bias. When structure shifts Bullish (CHoCH/MSS) and price tests Demand/Discount on pullback, execute BUY. When structure shifts Bearish and price tests Supply/Premium on pullback, execute SELL. Markets are 2-way, and the system must fluidly capture both expansions and corrections.

## 4. Multi-Account Execution Parity & Cross-Account Invariants
- **Independent Terminal Verification**: Each running bridge instance (Acc1, Acc2, Acc3) must independently inspect its local terminal positions (`len(my_sym_pos) == 0`).
- **Zero MT5-ID Skipping for Followers**: Follower bridges must NEVER skip signals whose ID starts with `mt5-`. If the local terminal holds 0 positions for that symbol, it MUST execute immediately.
- **Lot Sizing Parity**:
  - Acc1 & Acc2 (Cent): Strictly 0.20 USC (Max 3 layers = 0.60 lot total).
  - Acc3 (Standard USD $1,000): Strictly 0.02 USD (Max 3 layers = 0.06 lot total).

## 5. Telemetry Isolation & Database Vault Mutex
- **Strict Account Routing**:
  - Login `5100221532` strictly routes to `db.copytrade` (Vault 1).
  - Login `5100221533` strictly routes to `db.copytrade2` (Vault 2).
  - Login `5100221534` strictly routes to `db.copytrade3` (Vault 3).
- **Zero Cross-Overwrite**: Telemetry from one account must never mutate the balance, equity, or status of another vault. The server endpoint handler MUST enforce `payload.accountInfo.login` matching before modifying any copytrade vault.

## 6. Institutional Dual SMC Strategy Engine (Strict Pullback Invariant)
- **MANDATORY USER INVARIANT: ZERO FLOOR SELLING & ZERO ROOF BUYING**:
  - **Downtrend (Bearish)**: STRICTLY FORBIDDEN to SELL at or below the support floor (`liveP <= floorRef` or breakdown chasing). SELL entries are ONLY permitted after a verified **PULLBACK (Rally)** into the Premium / Supply zone (at least 40% rebound from floor or `waveProgress >= 0.65`).
  - **Uptrend (Bullish)**: STRICTLY FORBIDDEN to BUY at or above the resistance ceiling (`liveP >= roofRef` or breakout chasing). BUY entries are ONLY permitted after a verified **PULLBACK (Dip)** into the Discount / Demand zone (at least 40% retracement from roof or `waveProgress <= 0.35`).
  - **Equilibrium Neutral Zone (35% - 65%)**: STRICT NO-TRADE ZONE. All signals are rejected until price pulls back to the extreme liquidity edges.
- **Elimination of Dead Zones**: Once price cleanly reaches the Pullback extreme, execution fires decisively with strict institutional SL buffers above swing structure.

## 7. Windows Command Safety Invariant
- NEVER use PowerShell pipeline syntax `|` inside command calls. Always use single-action direct statements or separate command invocations to ensure flawless Windows execution.

## 8. Full Autonomous Market Commander Mandate (User Authorized 2026-11-19)
- **Executive Mandate**: User Tengku has fully and unconditionally delegated 100% market surveillance, directional determination, and order execution authority to the AI Commander. The AI is mandated to continuously monitor markets every second and autonomously execute orders across all 4 VPS accounts without requiring manual user intervention or step-by-step prompts.
- **Strict Execution Invariants**:
  1. **100% Alignment with Full-Spectrum SMC Analysis**: Every execution MUST adhere strictly to the established multi-timeframe analysis (MN1 to M1). NEVER enter trades in gray/neutral zones. Only enter at verified structural extremes (BUY on Dip at Discount with wick rejection, SELL on Rally at Premium with wick rejection).
  2. **Zero Micromanagement Requirement**: The AI operates fully autonomously 24/7 on the VPS, removing all cognitive load and micromanagement burdens from the user.
  3. **Mandatory Static SL & TP Discipline**: Once an order is executed, initial SL and TP are 100% FIXED and STATIC. Zero moving to BE, zero trailing, and zero pre-news manual cutoffs.
  4. **Post-TP 30-Minute Cooldown**: Immediate mandatory 30-minute trading freeze on any asset that hits Take Profit to protect accumulated profits.
  5. **Scale-in Cap**: Respect maximum 9 split layers for Gold (XAUUSD) and 3 layers for Forex across all 4 VPS accounts.
- **No-Pipe Rule**: NEVER use or propose PowerShell pipeline syntax in user-facing snippets or shell commands. Use native cmdlets or direct Python subprocesses to ensure 100% execution reliability on Windows without parser termination.

## 9. Comprehensive Full-Spectrum Multi-Timeframe Invariant (1 Minute to 1 Month)
- **Mandatory 8-Tier Structure Hierarchy (Top-Down SMC Analysis)**:
  1. **MN1 (Monthly)**: Macro economic cycle and multi-year institutional accumulation/distribution direction. Determines whether the broad market is in macro expansion or multi-month retracement.
  2. **W1 (Weekly)**: Primary weekly trend, major liquidity highs/lows, and structural order blocks.
  3. **D1 (Daily)**: Daily bias, daily RSI exhaustion thresholds (e.g. oversold <30 triggers mean-reversion rebound, overbought >70 triggers rejection pullback), and daily Discount/Premium boundaries.
  4. **H4 (4 Hours)**: Intermediate trend validation, Break of Structure (BOS), and institutional supply/demand zones.
  5. **H1 (1 Hour)**: Session range cycles (Asia, London, New York) and Fair Value Gap (FVG) retest targets.
  6. **M15 (15 Minutes)**: Triple MA (20, 100, 200) alignment, dynamic wave progress, and volume flow confirmation.
  7. **M5 (5 Minutes)**: Micro wave structure shift (CHoCH) and pullback validation.
  8. **M1 (1 Minute)**: Precision sniper execution trigger (wick rejection >= 35%) at confirmed extreme boundary.
- **Hierarchical Confluence Principle**: Lower timeframes (M1-M15) must ALWAYS align with intermediate (H1-H4) and macro (D1-MN1) structural momentum. Counter-trend trades into opposing higher-timeframe boundaries are strictly forbidden.
- **Continuous Structure Re-scanning**: Telemetry streams market structure every 2.5 seconds. If structure conflicts across timeframes, the system MUST stand aside in cash to protect capital until high-probability confluence aligns.

## 10. 100% Standalone 24/7 VPS Infrastructure Invariant (Zero-Host PC Dependency)
- **Sole Execution Environment**: All production processes (Node.js server.js, Cloudflare Tunnel amaterasux.com, 4 MT5 Terminals, and 4 Python Bridges) MUST run exclusively on the dedicated VPS (223.26.18.101:41688).
- **Zero Local Footprint**: Zero MT5 terminals and zero python bridge scripts may execute on the local host PC. Local Windows Startup shortcuts (START_AMATERASU_24_7.bat) are strictly forbidden.
- **Local Loopback Parity**: All 4 MT5 bridge configurations on the VPS must point to server_url: "http://127.0.0.1:3000" to guarantee 0ms latency and total immunity from external internet or local PC shutdowns.
- **24/7 Autonomous Operation**: The user's home computer may be powered off, put to sleep, or disconnected at any time without impacting trading operations or website availability.

## 11. Ironclad Profit Locking & Zero-Loss Break-Even Invariant
- **Strict Prohibition Against Winning Trades Turning into Losses**: Posisi yang sudah membuat keuntungan elok-elok HARAM dibiarkan berbalik arah sehingga terkena Stop Loss penuh dan merugikan akaun!
- **Mandatory Multi-Tier Profit Guard**:
  1. **Tier 1 (True Break-Even)**: Bila Gold capai +30 pips (Forex +15 pips), alihkan SL ke Break-Even +5 pips (Gold) / +2 pips (Forex) bagi menampung kos komisen dan spread broker.
  2. **Tier 2 (Lock Profit)**: Bila Gold untung +50 pips (Forex +25 pips), kunci keuntungan tetap +25 pips (Forex +12 pips).
  3. **Tier 3 (Lock Profit)**: Bila Gold untung +75 pips (Forex +40 pips), kunci keuntungan tetap +45 pips (Forex +25 pips).
  4. **Tier 4 (Runner Trailing)**: Bila Gold untung +110 pips (Forex +60 pips), kunci keuntungan tetap +80 pips (Forex +40 pips).
- **Hard Exposure Ceiling**: Maksimum 9 posisi bagi Gold merentasi simbol, menolak sebarang pertambahan order baharu jika had sudah dicapai.
- **Dynamic Breathing Room**: Stop Loss awal diletakkan berasaskan struktur selamat (Dynamic ATR + Invalidation Zone), mengelakkan SL terlalu sempit yang mudah disapu liquidity wicks sebelum junaman berlaku.

## 12. Post-TP 30-Minute Cooldown Buffer Invariant
- **Mandatory Cooldown**: Immediately after any position resolves with profit (hitting TP1, TP2, or TP3), a strict 30-minute cooldown buffer is enforced for that symbol across all 4 accounts.
- **Anti-Overtrading Protection**: During this 30-minute quiet period, the autonomous engine and bridges are hard-blocked from opening any new entries on that asset to allow market exhaustion and volatility to settle.

## 13. Gold Position Capacity Invariant (9 Layers Parity)
- **Scale-in Ceiling**: XAUUSD allows up to 9 open positions across all accounts (Dragon, Mantis, Tiger, MEZ EA), executed as 3 rounds of SPLIT_TP (3x TP1, 3x TP2, 3x TP3 runner), matching MEZ account capacity while respecting equity margin.

## 14. Private VIP Invitation & Strict 1-Device Hardware Lock
- **Closed Ecosystem**: Public access requires a valid VIP Invitation Code generated from the Master CRM (/crm). Uninvited access attempts are strictly rejected.
- **Hardware Binding**: The first device logged in is permanently bound via unique device fingerprint (boundDeviceId). Access from any secondary device is immediately blocked with "1 Account = 1 Device Only" until reset by the Master Admin in CRM.

## 15. Proactive Opportunity Seizure Invariant (Always Enter on Valid Setup)
- **Zero Hesitation Mandate**: When an asset is clear of active trades and clear of post-TP cooldown, the engine MUST proactively and swiftly seize valid SMC setups without unnecessary idle waiting or hesitation.
- **Ultra-Rapid 45-Second Opportunity Scan**: The autonomous engine continuously sweeps market conditions every 45 seconds across all whitelisted pairs (XAUUSD, EURUSD, USDCHF).
- **Decisive Execution Trigger**: As soon as multi-timeframe structure aligns (Discount for BUY / Premium for SELL) with confirmed wick rejection (>=35%), the system MUST immediately dispatch orders concurrently across all 4 VPS accounts.



