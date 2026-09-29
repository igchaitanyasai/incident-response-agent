import os

class Settings:
    APP_NAME: str = "Intelligent Incident Response Agent"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database configuration (defaults to SQLite for instant local dev, PostgreSQL for docker)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./incident_agent.db")
    
    # AI Config
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
