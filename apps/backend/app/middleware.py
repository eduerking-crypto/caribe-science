"""Security middleware for CARIBE SCIENCE — headers, rate limiting, input validation."""
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' https://images.unsplash.com data:; "
            "font-src 'self'; "
            "connect-src 'self' http://localhost:8000; "
            "frame-ancestors 'none'"
        )
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting: 100 requests per minute per IP."""

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean old requests
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] 
            if now - t < self.window_seconds
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded. Try again later."}
            )
        
        # Add current request
        self.requests[client_ip].append(now)
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.max_requests - len(self.requests[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(now + self.window_seconds))
        
        return response


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Validate input size and content type."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Limit request body size (10MB)
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > 10 * 1024 * 1024:
                return JSONResponse(
                    status_code=413,
                    content={"error": "Request body too large. Maximum size is 10MB."}
                )
        
        response = await call_next(request)
        return response
