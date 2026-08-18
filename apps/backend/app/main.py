"""CARIBE SCIENCE — FastAPI application entrypoint."""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.services.storage import storage
from app.api.v1 import auth, catalog, content, integrations, manuscripts, people, search, system
from app.middleware import SecurityHeadersMiddleware, RateLimitMiddleware, InputValidationMiddleware

settings = get_settings()

app = FastAPI(
    title="CARIBE SCIENCE API",
    description="Advancing scientific knowledge from the Caribbean to the world.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Security middleware (order matters: first added = first executed)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)
app.add_middleware(InputValidationMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = settings.api_prefix

for router in (auth.router, catalog.router, people.router, content.router,
               manuscripts.router, search.router, integrations.router, system.router):
    app.include_router(router, prefix=API)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": str(exc.status_code), "message": exc.detail}})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if settings.debug:
        raise exc
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "Internal server error (details omitted in production)"}})


@app.get("/files/{kind}/{filename}", response_class=FileResponse)
def serve_file(kind: str, filename: str):
    """Sirve archivos subidos (solo lectura de carpeta de storage)."""
    import re

    if not re.fullmatch(r"[a-zA-Z0-9_\-]+\.(docx|doc|pdf|txt|md|png|jpg|jpeg|gif|webp|svg|csv|xlsx)", filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = storage._base() / kind  # noqa: SLF001
    if not (path / filename).exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path / filename)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/", include_in_schema=False)
def root():
    return {"app": settings.app_name, "docs": "/docs", "api": API}