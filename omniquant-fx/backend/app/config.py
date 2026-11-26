from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OMNIQUANT FX x AMATERASU X Core Engine"
    database_url: str = "sqlite:///./omniquant_fx.db"
    price_provider: str = "auto"  # auto | mt5 | twelvedata | oanda | simulator

    mt5_terminal_path: str = ""
    twelvedata_api_key: str = ""
    oanda_api_key: str = ""
    oanda_account_id: str = ""
    oanda_env: str = "practice"

    fmp_api_key: str = ""
    news_shield_minutes: int = 30
    cron_interval_seconds: int = 60

    # Aligned with Amaterasu X Elite Whitelist (XAUUSD, USDCHF, EURUSD) + GBPUSD, USDJPY
    tracked_pairs: List[str] = ["XAU/USD", "USD/CHF", "EUR/USD", "GBP/USD", "USD/JPY"]
    supported_timeframes: List[str] = ["M5", "M15", "H1", "H4"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
