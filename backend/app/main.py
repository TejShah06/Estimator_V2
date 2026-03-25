from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from app.api.routes import calculator
from app.db.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
import app.db.base  # important: registers all models
#from app.api.routes import floorplan
from app.api.routes import auth, user as user_route

router = FastAPI()
Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Smart Estimator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(user_route.router)
app.include_router(calculator.router)
#app.include_router(floorplan.router)
# --------------------------------------------------
# OPTIONAL: Add Bearer Auth to Swagger (Better Way)
# --------------------------------------------------
security = HTTPBearer()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="AI Smart Estimator API",
        version="1.0.0",
        description="JWT Secured Construction Estimation API",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # ⚠️ Apply security only to protected routes
    for path, path_item in openapi_schema["paths"].items():
        if not path.startswith("/auth"):  # allow login/register public
            for method in path_item.values():
                method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi