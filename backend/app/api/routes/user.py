from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/dashboard")
def dashboard(current_user = Depends(get_current_user)):
    return {
        "message": f"Welcome {current_user.username}",
        "role": current_user.role
    }