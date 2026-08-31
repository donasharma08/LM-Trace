from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import products, reports, scan

settings = get_settings()

app = FastAPI(
    title="Legal Metrology Compliance API",
    description="Automated screening of packaged-commodity labels against the "
                 "Legal Metrology (Packaged Commodities) Rules, 2011.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(products.router)
app.include_router(reports.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
