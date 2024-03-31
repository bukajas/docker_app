# schemas.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserInDB(BaseModel):
    username: str
    hashed_password: str

class UserRoleUpdate(BaseModel):
    username: str
    role: str
