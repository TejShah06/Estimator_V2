
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer

from app.db.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
import app.db.base  # important: registers all models
from app.api.routes import floorplan, dashboard, project, manual
from app.api.routes import auth, user as user_route
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging
import os
from dotenv import load_dotenv

load_dotenv()

# ── Configure logging for pipeline ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-35s | %(message)s",
    datefmt="%H:%M:%S",
)

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Smart Estimator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
#app.include_router(user_route.router)
app.include_router(manual.router)
app.include_router(floorplan.router)
app.include_router(dashboard.router)
app.include_router(project.router)

# create previews directory if not exists
preview_dir = Path("previews")
preview_dir.mkdir(exist_ok=True)

app.mount("/previews", StaticFiles(directory="previews"), name="previews")

# --------------------------------------------------
# OPTIONAL: Add Bearer Auth to Swagger
# --------------------------------------------------
security = HTTPBearer()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="AI Smart Estimator API",
        version="2.0.0",
        description="JWT Secured Construction Estimation API with AI Floor Plan Analysis",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    for path, path_item in openapi_schema["paths"].items():
        if not path.startswith("/auth"):
            for method in path_item.values():
                method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi