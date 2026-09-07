from app.routers.auth import router as auth
from app.routers.pets import router as pets
from app.routers.analyze import router as analyze
from app.routers.scans import router as scans

__all__ = ["auth", "pets", "analyze", "scans"]
