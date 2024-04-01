# schemas.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserInDB(BaseModel):

    hashed_password: str

class UserRoleUpdate(BaseModel):
    username: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    scopes: list[str] = []

class User(BaseModel):
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None