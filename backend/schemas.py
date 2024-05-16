# schemas.py
from pydantic import BaseModel, validator, Field
from typing import Dict, Optional, Any
from datetime import datetime


#Delete
class DeleteDataRequest(BaseModel):
    data:  Dict[str, Any]
    start_time: Optional[str] = None
    end_time: Optional[str] = None



class EditReadDataRequest(BaseModel):
    data:  Dict[str, Any]
    start_time: Optional[str] = None
    end_time: Optional[str] = None



class EditDeleteDataRequest(BaseModel):
    measurement: str
    tag_filters: Dict[str, str] = Field(default_factory=dict)
    time: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "measurement": "coil_list",
                "tag_filters": {"unit": "1"},
                "time": "2023-01-01T01:00:00Z",  # Optional, use if specific time needs to be targeted
            }
        }
class EditUpdateDataRequest(BaseModel):
    measurement: str
    tag_filters: Dict[str, str] = Field(default_factory=dict)
    time: Optional[datetime] = None
    new_value: float

    class Config:
        json_schema_extra = {
            "example": {
                "measurement": "coil_list",
                "tag_filters": {"unit": "1"},
                "time": "2023-01-01T01:00:00Z",  # Optional, use if specific time needs to be targeted
                "new_value": 10,
            }
        }   

class ExportDataRequest(BaseModel):
    data:  Dict[str, Any]
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class AgregateDataRequest(BaseModel):
    data:  Dict[str, Any]
    start_time: Optional[str] = None
    end_time: Optional[str] = None    


class ReadDataRequest(BaseModel):
    measurement: str
    tags: Dict[str, str] = Field(default_factory=dict)
    minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    stop_time: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "measurement": "coil_list",
                "tags": {"unit": "1"},
                "minutes": 10,  # Optional, use if start_time and stop_time are not provided
                "start_time": "2023-01-01T00:00:00Z",  # Optional
                "stop_time": "2023-01-01T01:00:00Z",  # Optional
            }
        }


class DynamicReadData(BaseModel):
    data:  Dict[str, Any]
    start_time: Optional[str] = None
    end_time: Optional[str] = None





class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    full_name: str


class UserInDB(BaseModel):
    hashed_password: str


class UserInDB2(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    username: str
    role: str

class UserDisplay(BaseModel):
    id: int
    username: str
    role: str

class UserDisplay2(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str    


    class Config:
        from_attributes = True

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
        allowed_roles = ["admin", "noright", "read", "read+write"]
        if value not in allowed_roles:
            raise ValueError(f"Role must be one of {allowed_roles}")
        return value    