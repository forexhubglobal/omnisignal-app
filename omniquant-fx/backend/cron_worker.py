"""
Standalone CLI Cron Worker for VPS Deployment (crontab or Docker worker container).
Usage:
  python cron_worker.py --once          # Run once via Linux crontab (* * * * *)
  python cron_worker.py --daemon        # Run continuously every CRON_INTERVAL_SECONDS
"""
import argparse
import time
from app.config import get_settings
from app.database import init_db
from app.scheduler import sync_all_pairs_and_signals


def main() -> None:
    parser = argparse.ArgumentParser(description="OMNIQUANT FX Signal Update Worker")
    parser.add_argument("--once", action="store_true", help="Execute a single scan and exit")
    parser.add_argument("--timeframe", default="M15", help="Timeframe to scan (default M15)")
    args = parser.parse_args()

    db_label = init_db()
    print(f"[OMNIQUANT-CRON] Connected to {db_label}")

    if args.once:
        res = sync_all_pairs_and_signals(timeframe=args.timeframe)
        print(f"[OMNIQUANT-CRON] Completed scan #{res['sync_count']} at {res['last_sync_utc']}")
        return

    interval = get_settings().cron_interval_seconds
    print(f"[OMNIQUANT-CRON] Running continuous signal daemon every {interval}s...")
    while True:
        res = sync_all_pairs_and_signals(timeframe=args.timeframe)
        print(f"[OMNIQUANT-CRON] Sync #{res['sync_count']} OK @ {res['last_sync_utc']}")
        time.sleep(interval)


if __name__ == "__main__":
    main()
