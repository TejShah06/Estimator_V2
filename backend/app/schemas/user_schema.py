from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str = Field(..., min_length=6, max_length=72)
    role:str = "engineer"


class UserLogin(BaseModel):
    identifier: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordSchema(BaseModel):
    email: str


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str