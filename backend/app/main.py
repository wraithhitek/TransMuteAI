import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api.routes import router as api_router
from app.core.security import limiter
from app.core.database import init_db

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("transmuteai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing TransmuteAI services...")
    settings.setup_dirs()
    try:
        await init_db()
        logger.info("Database schemas initialized.")
    except Exception as e:
        logger.warning(f"Database init warning (non-critical in direct/sqlite mode): {e}")
    yield
    logger.info("Shutting down TransmuteAI services...")

app = FastAPI(
    title="TransmuteAI API",
    description="Automated Content Transformation Platform with Cryptographic Provenance Ledger",
    version="1.0.0",
    lifespan=lifespan
)

# Attach SlowAPI rate limiter
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please wait before submitting additional requests."}
    )

# CORS Configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to TransmuteAI API",
        "docs": "/docs",
        "status": "/api/status",
        "provider": settings.LLM_PROVIDER,
        "mode": settings.EXECUTION_MODE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
