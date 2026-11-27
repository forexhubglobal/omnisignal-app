"""
Unified Single-Process Production Server for OMNIQUANT FX on Windows VPS.
Binds ports 3005 & 8005 IMMEDIATELY (<0.5s) and runs initial scan asynchronously
so Cloudflare Tunnel & watchdog never encounter startup timeouts.
"""
import asyncio
import threading
import uvicorn
from app.adapters.mt5_live import init_mt5_on_main_thread
from app.database import init_db
from app.main import app
from app.scheduler import start_background_cron, stop_background_cron


async def serve_dual_ports() -> None:
    cfg_3005 = uvicorn.Config(app, host="127.0.0.1", port=3005, log_level="info", lifespan="off")
    cfg_8005 = uvicorn.Config(app, host="127.0.0.1", port=8005, log_level="warning", lifespan="off")
    srv_3005 = uvicorn.Server(cfg_3005)
    srv_8005 = uvicorn.Server(cfg_8005)
    await asyncio.gather(srv_3005.serve(), srv_8005.serve())


def main() -> None:
    print("=================================================================")
    print("  OMNIQUANT FX x AMATERASU X - UNIFIED VPS PRODUCTION ENGINE     ")
    print("  Web UI & Cloudflare Tunnel : http://127.0.0.1:3005             ")
    print("  Amaterasu Bot Gatekeeper   : http://127.0.0.1:8005             ")
    print("=================================================================")
    db_backend = init_db()
    mt5_ok = init_mt5_on_main_thread()
    print(f"[INIT] Database: {db_backend} | MT5 Live IPC: {mt5_ok}")

    # Start background cron in a non-blocking daemon thread so HTTP ports open immediately!
    threading.Thread(target=start_background_cron, args=(db_backend,), daemon=True).start()

    try:
        asyncio.run(serve_dual_ports())
    finally:
        stop_background_cron()


if __name__ == "__main__":
    main()
