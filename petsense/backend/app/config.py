from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./petsense.db"

    # Security
    secret_key: str = "change_me_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # Models
    use_real_models: bool = False

    # Storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 20

    # CORS
    cors_origins: str = "*"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
