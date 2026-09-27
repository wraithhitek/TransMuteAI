from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

Base = declarative_base()

# Async Engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    # SQLite doesn't use pool_size, check if postgres
    **({} if "sqlite" in settings.DATABASE_URL else {"pool_size": 10, "max_overflow": 20})
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    """FastAPI dependency for async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initializes tables if needed."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
