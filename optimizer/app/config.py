from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    osrm_url: str = "http://localhost:5000"
    osrm_timeout_seconds: float = 30.0
    solver_time_limit_seconds: int = 10
    max_locations: int = 100


settings = Settings()
