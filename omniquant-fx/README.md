# OMNIQUANT FX — Autonomous Forex Intelligence Terminal

Full-stack quantitative Forex analysis & signal visualization platform inspired by institutional sci-fi telemetry HUDs.

## 1. Architecture & Tech Stack
- **Frontend (`frontend/`)**: Next.js 15 (React 19, TypeScript, Tailwind CSS)
  - **3D Quantitative Topology Manifold**: Interactive 2,350-particle 3D Parametric Torus with radial microstructure filaments, drag-to-orbit camera, and dynamic SVG leader lines linked to 15 live factor/alpha callout cards.
  - **Core Visual Modules**:
    1. **Price Trend Analysis**: Candlestick + `EMA(20)` + `SMA(50)` + `SMA(200)` + Linear Regression Slope ($R^2$) & Hurst Persistence ($H$).
    2. **Tick Volume Observation**: Rolling 20-bar Tick Volume Z-Score, session volume averages (London / NY / Asia), and 14-bucket Bull/Bear Volume Profile.
    3. **Indicator Comparison**: Normalized `[-100, +100]` multi-oscillator confluence comparing `RSI(14)`, `MACD(12,26,9)`, and `MA Spread` alongside a 240-bar Gaussian Return Z-Score density curve.
    4. **Historical Pattern Matching & Monte Carlo Fan**: Z-normalized sliding-window Cosine/Euclidean similarity matching (Top-5 historical analogs) blended with 400 Monte Carlo paths (`p10/p25/p50/p75/p90` uncertainty fan).
    5. **Session Filter & Economic Calendar News Shield**: Real-time gating for **London (`08:00–17:00 UTC`)**, **New York (`13:00–22:00 UTC`)**, **LDN/NY Overlap (`13:00–17:00 UTC`)**, and `±30m` High-Impact macro news lockout (`USD`, `EUR`, `GBP`, `JPY`).
- **Backend (`backend/`)**: Python FastAPI + NumPy + SQLAlchemy + APScheduler
  - Modular price adapters for **TwelveData API**, **OANDA v20 API**, and an automatic **Hybrid Quant Simulator** fallback (works out-of-the-box without API keys).
  - Economic Calendar adapter supporting **FinancialModelingPrep** + built-in live-relative Institutional Macro Schedule.
- **Infrastructure (`docker-compose.yml` & `infra/sql/init_timescale.sql`)**:
  - **TimescaleDB (PostgreSQL 16)** hypertables (`ohlcv_candles`, `quant_signals`) for VPS production, with automatic local **SQLite** fallback when running without Docker.
  - Periodic **Cron Signal Scheduler** (APScheduler background job + standalone `cron_worker.py` for Linux `crontab` or dedicated Docker container).

---

## 2. Quick Start (Local Windows — No Docker Required)
Double-click `start_local.bat` or run manually:

```powershell
# Terminal 1: FastAPI Backend (Port 8005)
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8005

# Terminal 2: Next.js Frontend (Port 3005)
cd frontend
npm.cmd run dev
```

Open **http://localhost:3005**.

---

## 3. Production VPS Deployment (Docker + TimescaleDB + Cron Worker)
1. Copy `backend/.env.example` to `.env` in project root (optional: add `TWELVEDATA_API_KEY`, `OANDA_API_KEY`, `FMP_API_KEY`).
2. Launch stack:
```bash
docker compose up -d --build
```
3. Optional Linux `crontab` one-shot trigger:
```cron
* * * * * docker exec omniquant_backend python cron_worker.py --once >> /var/log/omniquant_cron.log 2>&1
```
