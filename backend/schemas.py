# schemas.py
from pydantic import BaseModel, validator, Field
from typing import Dict, Optional
from datetime import datetime


#Delete
class DeleteDataRequest(BaseModel):
    measurement: str
    tags: Dict[str, str] = Field(default_factory=dict)
    minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    stop_time: Optional[datetime] = None

    class Config:
        schema_extra = {
            "example": {
                "measurement": "coil_list",
                "tags": {"unit": "1"},
                "minutes": 10,  # Optional, use if start_time and stop_time are not provided
                "start_time": "2023-01-01T00:00:00Z",  # Optional
                "stop_time": "2023-01-01T01:00:00Z",  # Optional
            }
        }

    

class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    full_name: str

class UserInDB(BaseModel):
    hashed_password: str

class UserRoleUpdate(BaseModel):
    username: str
    role: str

class UserDisplay(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        orm_mode = True

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

class RoleUpdate(BaseModel):
    new_role: str

    @validator('new_role')
    def validate_new_role(cls, value):
        allowed_roles = ["basic", "employee", "admin"]
        if value not in allowed_roles:
            raise ValueError(f"Role must be one of {allowed_roles}")
        return value    