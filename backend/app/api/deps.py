from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()

    # User not found
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    #  Block deleted users
    if user.is_deleted:
        raise HTTPException(
            status_code=401,
            detail="This account has been deleted."
        )

    #  Block deactivated users
    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="This account has been deactivated. Contact support."
        )

    return user



def get_admin_user(
    current_user: User = Depends(get_current_user)
):
    """
    Admin Guard - Only allows admin users
    Raises 403 if user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )

    # This check is now redundant since get_current_user
    # already blocks inactive users, but kept for explicit clarity
    if not current_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Admin account is deactivated."
        )

    return current_user