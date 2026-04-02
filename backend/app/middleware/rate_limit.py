"""Rate limiting via slowapi"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = limiter = Limiter(key_func=get_remote_address)

def rate_limit_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse({"detail": "Rate limit exceeded. Try again later."}, status_code=429)
