from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.schemas.user_schema import UserCreate, UserLogin, ForgotPasswordSchema as ForgotPassword, ResetPasswordSchema as ResetPassword
from app.models.user import User
from app.api.deps import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_reset_token,
    verify_reset_token
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="engineer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(
        (User.email == user.identifier) |
        (User.username == user.identifier)
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        data={"sub": db_user.username}
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        return {"message": "If email exists, reset link sent"}

    token = create_reset_token(data.email)

    reset_link = f"http://localhost:5173/reset-password/{token}"

    print("Reset Link:", reset_link)

    return {"message": f"Password reset link generated: {reset_link}"}

@router.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):

    email = verify_reset_token(data.token)

    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)

    db.commit()

    return {"message": "Password reset successful"}